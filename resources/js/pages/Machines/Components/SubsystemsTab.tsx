import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Machine, Subsystem } from '@/types/machine';
import { PlusCircle } from 'lucide-react';
import { SubsystemCard } from './SubsystemCard'; // Import the new card component

interface Props {
  machine: Machine;
  onDeleteSubsystem: (id: number) => void;
  onEditSubsystem: (subsystem: Subsystem) => void;
  onManagePoints: (subsystem: Subsystem) => void;
  onAddSubsystem: () => void;
  can: { create: boolean; edit: boolean; delete: boolean };
}

export function SubsystemsTab({ machine, onDeleteSubsystem, onEditSubsystem, onManagePoints, onAddSubsystem, can }: Props) {
  return (
    <Card className="shadow-lg drop-shadow-lg border-1 bg-background border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subsystems for {machine.name}</CardTitle>
          {can.create && (
            <Button variant="default" size="sm" className="flex items-center gap-2" onClick={onAddSubsystem}>
              <PlusCircle className="h-4 w-4" />
              Add Subsystem
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {machine.subsystems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {machine.subsystems.map((subsystem) => (
              <SubsystemCard
                key={subsystem.id}
                subsystem={subsystem}
                onDelete={onDeleteSubsystem}
                onEdit={onEditSubsystem}
                onManagePoints={onManagePoints}
                can={can}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No subsystems have been added to this machine yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
