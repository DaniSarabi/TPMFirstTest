import { Button } from '@/components/ui/button';
import { ChartNoAxesGantt, MoreVertical, Plus } from 'lucide-react';
import { Machine } from './Columns'; // Import the Machine type from your columns file
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Define the props for this component, it needs the specific machine object
interface SubsystemListProps {
  machine: Machine;
}

export function SubsystemList({ machine }: SubsystemListProps) {
  // --- ACTION 1: Add a defensive check for subsystems ---
  // If machine.subsystems is undefined for any reason, treat it as an empty array.
  const subsystems = machine.subsystems || [];

  return (
    // This div provides some padding and a slightly different background
    <div className="bg-muted/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subsystems for: {machine.name}</h3>
        <Button variant="ghost" size="sm" className="bg-black text-white flex items-center gap-2 ">
          <Plus className="h-4 w-4" />
          Add New Subsystem
        </Button>
      </div>
      <div className="space-y-2">
        {subsystems.length > 0 ? (
          // Map over the safe 'subsystems' array
          subsystems.map((subsystem) => {
            // --- ACTION 2: Safely get the count of inspection points ---
            // The `?.` (optional chaining) prevents an error if inspectionPoints is undefined.
            // The `?? 0` (nullish coalescing) provides a default value of 0.
            const inspectionPointsCount = subsystem.inspection_points?.length ?? 0;

            return (
              <div key={subsystem.id} className="bg-background flex items-center justify-between rounded-md p-3 shadow-sm">
                <div>
                  <p className="font-medium">{subsystem.name}</p>
                  <p className="text-muted-foreground text-sm">{inspectionPointsCount} inspection points</p>
                </div>


                <div className="flex items-center space-x-2">
                                    {/* This main action button remains visible */}
                                    <Button variant="default" size="sm" className=" hidden h-9 md:flex items-center gap-2">
                                      <ChartNoAxesGantt className="h-4 w-4" />
                                        Manage Inspection Points
                                    </Button>

                                    {/* The secondary actions are now in a dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>Edit Subsystem</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Delete Subsystem</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
              </div>
            );
          })
        ) : (
          // Display a message if there are no subsystems
          <p className="text-muted-foreground py-4 text-center text-sm">No subsystems have been added to this machine yet.</p>
        )}
      </div>
    </div>
  );
}
