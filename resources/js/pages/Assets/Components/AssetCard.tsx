import { Link } from '@inertiajs/react';
import { Calendar, PlusCircle } from 'lucide-react';
import * as React from 'react';
import DynamicLucideIcon from '../../../components/dynamicIconHelper';
import { Badge } from '../../../components/ui/badge';
import { getContrastColor, getStatusBadgeClass } from '../../../lib/tpm-helpers';
import { Asset } from '../../../types/asset';
import { Tag } from '@/types/machine';

// Define el tipo de dato que espera la tarjeta, incluyendo el contador
export interface AssetWithStats extends Asset {
  pending_maintenances_count: number;
}

// Define los props del componente. Se eliminan onEdit y onDelete.
interface AssetCardProps {
  asset: AssetWithStats;
}

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

export function AssetCard({ asset }: AssetCardProps) {
  // Formateamos la fecha de creación para mostrarla en la tarjeta
  const dateAdded = new Date(asset.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative mx-auto w-full">
      {/* ACTION: Se envuelve toda la tarjeta en un componente Link de Inertia */}
      <Link
        href={route('assets.show', asset.id)}
        className="relative inline-block w-full transform transition-transform duration-300 ease-in-out hover:-translate-y-2"
      >
        <div className="rounded-lg bg-card p-4 shadow-md drop-shadow-lg hover:bg-accent hover:shadow-lg">
          {/* --- SECCIÓN DE IMAGEN Y OVERLAYS (Estilo MachineCard) --- */}
          <div className="relative h-52 w-full justify-center overflow-hidden rounded-lg shadow-sm shadow-primary drop-shadow-lg">
            <div className="relative h-52 w-full overflow-hidden rounded-lg">
              <img
                src={asset.image_url || 'https://placehold.co/600x400?text=no+image'}
                alt={`Image of ${asset.name}`}
                className="h-full w-full object-cover"
              />
            </div>

            {/* ACTION: Se elimina el menú de acciones (DropdownMenu) */}

            {/* Badge de Status */}
            <Badge className={`absolute top-0 left-0 z-10 mt-3 ml-3 text-sm capitalize select-none ${getStatusBadgeClass(asset.status)}`}>
              {asset.status.replace(/_/g, ' ')}
            </Badge>

            {/* Badges de Tags */}
            {asset.tags && Array.isArray(asset.tags) && asset.tags.length > 0 && (
              <div className="absolute top-8 left-0 z-10 mt-3 ml-3 flex flex-wrap gap-2 select-none">
                {asset.tags.map((tag: Tag) => (
                  <Badge
                    key={tag.id}
                    className="text-xs"
                    style={{
                      backgroundColor: tag.color,
                      color: getContrastColor(tag.color),
                    }}
                  >
                    <DynamicLucideIcon name={tag.icon} className="mr-1 stroke-3" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* --- SECCIÓN DE INFORMACIÓN (Estilo MachineCard) --- */}
          <div className="mt-4 mb-2">
            <h2 className="line-clamp-1 text-base font-medium text-foreground md:text-lg" title={asset.name}>
              {asset.name}
            </h2>
            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{asset.asset_group?.name || 'No group assigned'}</p>
          </div>

          {/* --- SECCIÓN DE ESTADÍSTICAS (Estilo MachineCard) --- */}
          <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-6 border-t-3 border-primary/60 pt-3">
            <StatCard icon={Calendar} label="Pending Maintenances" value={asset.pending_maintenances_count} />
            <StatCard icon={PlusCircle} label="Date Added" value={dateAdded} />
          </div>
        </div>
      </Link>
    </div>
  );
}
