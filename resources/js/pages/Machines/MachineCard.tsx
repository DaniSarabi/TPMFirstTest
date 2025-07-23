import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Calendar, Clock, ListChecks, RotateCw, Wrench } from 'lucide-react';
import { Machine } from './Columns';

// Define the props for the card component
interface MachineCardProps {
  machine: Machine;
}
export function MachineCard({ machine }: MachineCardProps) {
  // Format the dates for display
  const dateAdded = new Date(machine.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  const lastUpdated = new Date(machine.updated_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  // ---  Safely calculate the total inspection points ---
  const totalInspectionPoints =
    machine.subsystems?.reduce((acc, sub) => {
      // Use optional chaining (?.) and nullish coalescing (??) to prevent errors
      return acc + (sub.inspection_points?.length ?? 0);
    }, 0) ?? 0;

  return (
    <div className="relative mx-auto w-full">
      <Link
        href={route('machines.show', machine.id)}
        className="relative inline-block w-full transform transition-transform duration-300 ease-in-out hover:-translate-y-3"
      >
        <div className="rounded-lg bg-card p-4  hover:shadow-lg hover:bg-accent shadow-md drop-shadow-lg">
          {/* Image and Status Badge Section */}
          <div className="relative h-52 w-full justify-center overflow-hidden rounded-lg">
            <div className="relative h-52 w-full overflow-hidden rounded-lg">
              <img
                src={machine.image_url || 'https://placehold.co/600x400?text=no+image'}
                alt={`Image of ${machine.name}`}
                className="h-full w-full object-cover"
              />
            </div>
            <Badge
              className="absolute top-0 left-0 z-10 mt-3 ml-3 select-none"
              style={{
                backgroundColor: machine.machine_status.bg_color,
                color: machine.machine_status.text_color,
              }}
            >
              {machine.machine_status.name}
            </Badge>
            {/* Stats Overlay Section */}
            <div className="absolute bottom-0 mb-3 flex w-full justify-center">
              <div className="flex space-x-5 overflow-hidden rounded-lg bg-card/80 px-4 py-1 shadow backdrop-blur-sm">
                <p className="flex items-center font-medium text-card-foreground">
                  <Wrench className="mr-2 h-5 w-5" />
                  {machine.subsystems?.length ?? 0}
                </p>
                <p className="flex items-center font-medium text-card-foreground">
                  <ListChecks className="mr-2 h-5 w-5" />
                  {totalInspectionPoints}
                </p>
              </div>
            </div>
          </div>

          {/* Name and Description Section */}
          <div className="mt-4">
            <h2 className="line-clamp-1 text-base font-medium text-foreground md:text-lg" title={machine.name}>
              {machine.name}
            </h2>
            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground" title={machine.description}>
              {machine.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 grid-rows-1 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Added</p>
                <p className="font-semibold">{dateAdded}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground">Last Update</p>
                <p className="font-semibold">{lastUpdated}</p>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-7">
            <div className="flex w-full items-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="ml-2 line-clamp-1 text-sm text-muted-foreground">Last Inspected: N/A</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
