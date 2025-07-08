import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ChartNoAxesGantt, Trash2 } from 'lucide-react';
import { Machine, Subsystem } from './Columns';

// Define the props for this component
interface SubsystemAccordionProps {
  machine: Machine;
  onDelete: (id: number) => void;
  onEdit: (subsystem: Subsystem) => void;
  onManagePoints: (subsystem: Subsystem) => void;
  can: { edit: boolean; delete: boolean };
}

export function SubsystemAccordion({ machine, onDelete, onEdit, onManagePoints, can }: SubsystemAccordionProps) {
  if (!machine.subsystems || machine.subsystems.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">This machine does not have any subsystems yet.</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {machine.subsystems.map((subsystem) => (
        <AccordionItem key={subsystem.id} value={`item-${subsystem.id}`}>
          {/* The Trigger now only contains the subsystem name and count */}
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="text-left">
              <p className="font-semibold">{subsystem.name}</p>
              <p className="text-sm text-muted-foreground">{subsystem.inspection_points.length} inspection points</p>
            </div>
          </AccordionTrigger>
          {/* The content area now holds both the points and the action buttons */}
          <AccordionContent className="ml-4 border-l-2 p-4 pl-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="mb-2 font-semibold">Inspection Points:</h4>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {subsystem.inspection_points.length > 0 ? (
                    subsystem.inspection_points.map((point) => <li key={point.id}>{point.name}</li>)
                  ) : (
                    <li>No inspection points for this subsystem.</li>
                  )}
                </ul>
              </div>
              {/* --- ACTION: The buttons are now here, inside the content --- */}
              <div className="flex items-center gap-2">
                {can.edit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManagePoints(subsystem);
                    }}
                  >
                    <ChartNoAxesGantt className="mr-2 h-4 w-4" />
                    Manage Points
                  </Button>
                )}
                {can.delete && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(subsystem.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
