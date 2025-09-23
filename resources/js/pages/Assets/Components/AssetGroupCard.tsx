import { Badge } from '@/components/ui/badge';
import { getContrastColor, getStatusBadgeClass } from '@/lib/tpm-helpers';
// ACTION: Importamos el tipo 'Tag' para usarlo en el componente.
import DynamicLucideIcon from '@/components/dynamicIconHelper';
import { Asset, AssetGroup } from '@/types/asset';
import { Machine, Tag } from '@/types/machine';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion'; // ACTION: Se importa framer-motion
import { Calendar, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import * as React from 'react';

// Componente pequeño y reutilizable para las estadísticas
const StatCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
  <div className="flex items-center gap-3">
    {React.createElement(icon, { className: 'h-8 w-8 text-primary' })}
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-lg font-bold">{value ?? 'N/A'}</p>
    </div>
  </div>
);

interface AssetGroupCardProps {
  group: AssetGroup & {
    assets: (Asset & { pending_maintenances_count: number; tags: Tag[] })[];
    machines: Machine[];
  };
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.8,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.8,
  }),
};

export function AssetGroupCard({ group }: AssetGroupCardProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const members = [...group.assets, ...group.machines];

  const [direction, setDirection] = React.useState(0);

  const totalPendingMaintenances = React.useMemo(() => {
    return group.assets.reduce((sum, asset) => sum + (asset.pending_maintenances_count || 0), 0);
    // Nota: Aquí podríamos sumar también los de las 'machines' si fuera necesario en el futuro.
  }, [group.assets]);

  const dateAdded = new Date(group.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  // ACTION: Se añade el efecto de carrusel automático con un intervalo.
  React.useEffect(() => {
    // Solo activamos el carrusel si hay más de un miembro.
    if (members.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % members.length);
    }, 5000); // Cambia de miembro cada 5 segundos

    // Limpiamos el intervalo cuando el componente se desmonta o el índice cambia.
    return () => clearInterval(timer);
  }, [currentIndex, members.length]);

  //Se maneja el caso donde un grupo no tiene miembros para evitar el crash.
  if (members.length === 0) {
    return (
      <div className="relative mx-auto w-full">
        <div className="relative inline-block w-full">
          <div className="rounded-lg bg-card/60 p-4 shadow-md drop-shadow-lg">
            <div className="relative flex h-52 w-full items-center justify-center rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">No members in this group</p>
            </div>
            <div className="mt-4 mb-2">
              <h2 className="line-clamp-1 text-base font-medium text-foreground md:text-lg" title={group.name}>
                {group.name} (0 Members)
              </h2>
              <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">Add equipment to see details.</p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-6 border-t-3 border-primary/20 pt-3">
              <StatCard icon={Calendar} label="Pending Maintenances" value={0} />
              <StatCard icon={PlusCircle} label="Date Added" value={dateAdded} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentMember = members[currentIndex];
  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(-1); // Se va hacia atrás
    const isFirst = currentIndex === 0;
    const newIndex = isFirst ? members.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(1); // Se va hacia adelante
    const isLast = currentIndex === members.length - 1;
    const newIndex = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative mx-auto w-full">
      {/* El Link ahora apunta a la página de detalles del GRUPO */}
      <Link
        href={'#'} // TODO: Cambiar por la ruta de detalles del grupo cuando exista
        className="relative inline-block w-full transform transition-transform duration-300 ease-in-out hover:-translate-y-2"
      >
        <div className="rounded-lg bg-card p-4 shadow-md drop-shadow-lg hover:bg-accent hover:shadow-lg">
          {/* --- SECCIÓN DE IMAGEN Y OVERLAYS --- */}
          <div className="relative h-52 w-full justify-center overflow-hidden rounded-lg shadow-sm shadow-primary drop-shadow-lg">
            <div className="relative h-52 w-full overflow-hidden rounded-lg">
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={currentIndex} // La key es crucial para que AnimatePresence detecte el cambio
                  src={currentMember.image_url || 'https://placehold.co/600x400?text=no+image'}
                  alt={`Image of ${currentMember.name}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 },
                  }}
                  className="absolute h-full w-full object-cover"
                />
              </AnimatePresence>
            </div>

            {/* Badges de Status y Tags del miembro actual */}
            <Badge className={`absolute top-0 left-0 z-10 mt-3 ml-3 text-sm capitalize select-none ${getStatusBadgeClass(currentMember.status)}`}>
              {currentMember.status.replace(/_/g, ' ')}
            </Badge>
            {currentMember.tags && Array.isArray(currentMember.tags) && currentMember.tags.length > 0 && (
              <div className="absolute top-8 left-0 z-10 mt-3 ml-3 flex flex-wrap gap-2 select-none">
                {currentMember.tags.map((tag: Tag) => (
                  <Badge key={tag.id} className="text-xs" style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}>
                    <DynamicLucideIcon name={tag.icon} className="mr-1 stroke-3" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* --- SECCIÓN DE INFORMACIÓN --- */}
          <div className="mt-4 mb-2">
            <h2 className="line-clamp-1 text-base font-medium text-foreground md:text-lg" title={group.name}>
              {group.name} ({currentIndex + 1}/{members.length})
            </h2>
            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">Viewing: {currentMember.name}</p>
          </div>

          {/* ACTION: Se añade la sección de estadísticas, idéntica a la de AssetCard */}
          <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-6 border-t-3 border-primary/60 pt-3">
            <StatCard icon={Calendar} label="Pending Maintenances" value={totalPendingMaintenances} />
            <StatCard icon={PlusCircle} label="Date Added" value={dateAdded} />
          </div>
        </div>
      </Link>

      {/* Navegación (se mantiene fuera del Link para que no interfiera) */}
      {members.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="blu absolute top-1/2 left-5 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60 p-1 text-primary-foreground shadow-lg backdrop-blur-lg transition hover:bg-primary"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-5 z-20 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60 p-1 text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}
