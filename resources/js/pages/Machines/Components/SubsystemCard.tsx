import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Subsystem } from '@/types/machine';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface Props {
  subsystem: Subsystem;
  onDelete: (id: number) => void;
  onEdit: (subsystem: Subsystem) => void;
  onManagePoints: (subsystem: Subsystem) => void;
  can: { edit: boolean; delete: boolean };
}

export function SubsystemCard({ subsystem, onDelete, onEdit, onManagePoints, can }: Props) {
  return (
    <Card className="transition-500 flex flex-col overflow-y-auto border-1 border-border shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-1">
      <CardHeader>
        <CardTitle>{subsystem.name}</CardTitle>
        <CardDescription>{subsystem.inspection_points.length} inspection points</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">{/* We can add more details here in the future if needed */}</CardContent>
      <CardFooter className="flex justify-end gap-2">
        {can.edit && (
          <Button variant="outline" size="sm" onClick={() => onManagePoints(subsystem)}>
            <Eye className="mr-2 h-4 w-4" /> Manage Points
          </Button>
        )}
        {can.edit && (
          <Button variant="secondary" size="sm" onClick={() => onEdit(subsystem)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {can.delete && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(subsystem.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
