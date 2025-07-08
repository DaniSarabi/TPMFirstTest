import { Machine } from './Columns';
import { MachineCard } from './MachineCard'; // Import the new card component

// Define the props for the grid component
interface MachineGridProps {
    machines: Machine[];
}

export function MachineGrid({ machines }: MachineGridProps) {
    // Display a message if no machines are found after filtering
    if (machines.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <p>No machines found.</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
        );
    }

    // Render the grid with the new machine cards
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {machines.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
            ))}
        </div>
    );
}
