import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Ticket } from '@/types/ticket';
import { Camera, FileText, Package, Wrench } from 'lucide-react';
import * as React from 'react';

// Props que el componente espera recibir
interface ResolutionCardProps {
  ticket: Ticket;
}

// Un pequeño componente de ayuda para mostrar la información de forma consistente
const InfoRow = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        {React.createElement(icon, { className: 'h-6 w-6 text-primary' })}
        
        <span>{label}</span>
      
      </div>
      {/* Usamos whitespace-pre-wrap para respetar saltos de línea en la descripción */}
      <p className="pl-9 text-sm whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
};

export function ResolutionCard({ ticket }: ResolutionCardProps) {
  // Lógica "inteligente" para encontrar la actualización de cierre.
  const closingUpdate = React.useMemo(() => {
    return ticket.updates.find((update) => update.action_taken);
  }, [ticket.updates]);

  if (!closingUpdate) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-0 text-accent-foreground shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="text-2xl">Details of the Resolution</CardTitle>
        <CardDescription>
          Resuelto por {closingUpdate.user.name} el{' '}
          {new Date(closingUpdate.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ACTION: Se agrupan los detalles en una cuadrícula para mejor layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoRow icon={FileText} label="Category" value={closingUpdate.category} />
          <InfoRow icon={Package} label="Parts used" value={closingUpdate.parts_used} />
        </div>
        {/* La "Acción Tomada" ocupa todo el ancho para textos largos */}
        <InfoRow icon={Wrench} label="Action Taken" value={closingUpdate.action_taken} />

        {/* Sección de la galería de fotos */}
        {closingUpdate.photos && closingUpdate.photos.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Camera className="h-4 w-4" />
                <span>Fotos de la Solución</span>
              </div>
              <div className="flex flex-wrap gap-4 pl-6">
                {closingUpdate.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <img
                      src={photo.photo_url}
                      alt="Foto de la solución"
                      className="h-28 w-28 rounded-md object-cover transition-transform hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
