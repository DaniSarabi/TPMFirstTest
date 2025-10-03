import { Badge } from '@/components/ui/badge';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Report } from '@/types/report';
import { Link } from '@inertiajs/react';
import { CheckCircle, CircleAlert, CircleX, Clock, Clock3, User } from 'lucide-react';

interface InspectionCardProps {
  report: Report;
}

export function InspectionCard({ report }: InspectionCardProps) {
  const { badge_text, start_date, user_name, machine_name, is_machine_deleted, machine_image_url, stats } = report;

  const totalPoints = stats.ok_count + stats.warning_count + stats.critical_count;

  const statusColor = (() => {
    if (stats.critical_count > 0) {
      return 'bg-orange-600/70'; // Red if there are any critical issues
    }
    if (stats.warning_count > 0) {
      return 'bg-yellow-500/70'; // Yellow if there are warnings (and no criticals)
    }
    return 'bg-green-600/70'; // Green if all points are OK
  })();

  return (
    <Link
      href={route('inspections.show', report.id)}
      className="relative block transform transition-transform duration-300 ease-in-out hover:-translate-y-3"
    >
      <div className="flex h-full flex-col rounded-lg bg-card p-4 shadow-md drop-shadow-lg hover:bg-accent hover:shadow-lg">
        {/* ACTION: Se adopta la estructura de la imagen de MachineCard */}
        <div className="relative h-52 w-full justify-center overflow-hidden rounded-lg shadow-sm shadow-primary drop-shadow-lg">
          <div className="relative h-52 w-full overflow-hidden rounded-lg">
            <img
              src={machine_image_url || 'https://placehold.co/600x400?text=no+image'}
              alt={machine_name || 'Deleted Machine'}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Badges en la esquina superior izquierda */}
          <div className="absolute top-2 left-2 z-10 flex flex-row items-start gap-1">
            <Badge variant="default">Report #{report.id}</Badge>
            {is_machine_deleted && <Badge variant="destructive">Deleted</Badge>}
          </div>

          {/* ACTION: Se reemplaza la barra de estado por el "Stats Overlay" */}
          <div className="absolute bottom-0 mb-3 flex w-full justify-center">
            <div className={`flex items-center space-x-2 overflow-hidden rounded-lg ${statusColor} px-4 py-1 text-white shadow backdrop-blur-sm`}>
              <Clock className="h-5 w-5" />
              <span className="font-medium">{badge_text}</span>
            </div>
          </div>
        </div>

        {/* Contenido de la tarjeta (se mantiene la lógica) */}
        <div className="flex flex-grow flex-col pt-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="line-clamp-1 text-xl" title={machine_name || 'Deleted Machine'}>
              {machine_name || 'Deleted Machine'}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-grow space-y-1 p-0 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>{user_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5" />
              <span>{start_date}</span>
            </div>
            <Separator className="my-2 border-primary border-1" />
            <p className="pt-1 text-sm font-medium text-foreground">
              Total Points: <span className="font-semibold">{totalPoints}</span>
            </p>
            <div className="flex justify-between pt-2 text-base font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn('flex items-center gap-2', stats.ok_count > 0 ? 'text-green-600' : 'text-muted-foreground')}>
                      <CheckCircle className="h-6 w-6" />
                      {stats.ok_count}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>OK Points</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn('flex items-center gap-2', stats.warning_count > 0 ? 'text-yellow-500' : 'text-muted-foreground')}>
                      <CircleAlert className="h-6 w-6" />
                      {stats.warning_count}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Warnings</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn('flex items-center gap-2', stats.critical_count > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                      <CircleX className="h-6 w-6" />
                      {stats.critical_count}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Criticals</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </div>
      </div>
    </Link>
  );
}
