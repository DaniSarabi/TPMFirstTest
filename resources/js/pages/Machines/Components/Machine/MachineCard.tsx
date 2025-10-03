import DynamicLucideIcon from '@/components/dynamicIconHelper';
import { Badge } from '@/components/ui/badge';
import { getContrastColor, getStatusBadgeClass } from '@/lib/tpm-helpers';
import { Machine } from '@/types/machine';
import { Link } from '@inertiajs/react';
import { Calendar, Clock, History, ListChecks, Ticket, Wrench } from 'lucide-react';
import React from 'react';

export interface MachineWithStats extends Machine {
  open_tickets_count: number;
  pending_maintenances_count: number;
  current_uptime: string;
  last_inspection_date: string | null; // ACTION: Añadir la nueva propiedad
}
// Define the props for the card component
interface MachineCardProps {
  machine: MachineWithStats;
}
const StatCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
  <div className="flex items-center gap-3">
    {React.createElement(icon, { className: 'h-8 w-8 text-primary' })}
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-lg font-bold">{value ?? 'N/A'}</p>
    </div>
  </div>
);

export function MachineCard({ machine }: MachineCardProps) {
  const totalInspectionPoints =
    machine.subsystems?.reduce((acc, sub) => {
      return acc + (sub.inspection_points?.length ?? 0);
    }, 0) ?? 0;

  return (
    <div className="relative mx-auto w-full">
      <Link
        href={route('machines.show', machine.id)}
        className="relative inline-block w-full transform transition-transform duration-300 ease-in-out hover:-translate-y-3"
      >
        <div className="rounded-lg bg-card p-4 shadow-md drop-shadow-lg hover:bg-accent hover:shadow-lg">
          {/* Image and Status Badge Section */}
          <div className="relative h-52 w-full justify-center overflow-hidden rounded-lg shadow-sm shadow-primary drop-shadow-lg">
            <div className="relative h-52 w-full overflow-hidden rounded-lg">
              <img
                src={machine.image_url || 'https://placehold.co/600x400?text=no+image'}
                alt={`Image of ${machine.name}`}
                className="h-full w-full object-cover"
              />
            </div>

            <Badge className={`absolute top-0 left-0 z-10 mt-3 ml-3 text-sm capitalize select-none ${getStatusBadgeClass(machine.status)}`}>
              {machine.status.replace(/_/g, ' ')}
            </Badge>

            {machine.tags && machine.tags.length > 0 && (
              <div className="absolute top-8 left-0 z-10 mt-3 ml-3 flex flex-wrap gap-2 select-none">
                {machine.tags.map((tag) => (
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
            {/* Stats Overlay Section */}
            <div className="absolute bottom-0 mb-3 flex w-full justify-center">
              <div className="flex space-x-5 overflow-hidden rounded-lg bg-primary/60 px-4 py-1 text-white shadow backdrop-blur-sm">
                <p className="flex items-center font-medium">
                  <Wrench className="mr-2 h-5 w-5" />
                  {machine.subsystems?.length ?? 0}
                </p>
              <p className="flex items-center font-medium">
                  <ListChecks className="mr-2 h-5 w-5" />
                  {totalInspectionPoints}
                </p>
              </div>
            </div>
          </div>

          {/* Name, Description */}
          <div className="mt-4 mb-2">
            <h2 className="line-clamp-1 text-base font-medium text-foreground md:text-lg" title={machine.name}>
              {machine.name}
            </h2>
            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{machine.description || 'No description provided.'}</p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-6 border-t-3 border-primary/60 pt-3">
            <StatCard icon={Clock} label="Current Uptime" value={machine.current_uptime} />
            <StatCard icon={Ticket} label="Open Tickets" value={machine.open_tickets_count} />
            <StatCard icon={Calendar} label="Pending Maintenances" value={machine.pending_maintenances_count} />
            <StatCard icon={History} label="Last Inspected" value={machine.last_inspection_date} />
          </div>
        </div>
      </Link>
    </div>
  );
}
