import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectionStatus  } from '../Perform';
import { InspectionPointRow, InspectionResult } from './InspectionPointRow';
import { Check, ListTodo } from 'lucide-react';
import { InspectionPoint, Machine } from '@/types/machine';

interface ChecklistCardProps {
  machine: Machine;
  inspectionStatuses: InspectionStatus[];
  inspectionResults: Record<number, InspectionResult>;
  onResultChange: (pointId: number, newResult: InspectionResult) => void;
  onStatusChange: (pointId: number, statusId: number) => void;
      onTakePhoto: (point: InspectionPoint) => void; // The handler now accepts the point
}

export function ChecklistCard({ machine, inspectionStatuses, inspectionResults, onResultChange, onStatusChange, onTakePhoto }: ChecklistCardProps) {
  return (
    <Card className="border-0 drop-shadow-lg shadow-lg shadow-primary">
      <CardHeader>
        <div className=' flex items-center gap-2'>
            <ListTodo className='h-10 w-10 text-primary'/>
          <div>
            <CardTitle className='text-primary'>Inspection Checklist</CardTitle>
            <CardDescription>Please review each point and select the appropriate status.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {machine.subsystems.map((subsystem) => (
            <AccordionItem key={subsystem.id} value={`subsystem-${subsystem.id}`}>
              <AccordionTrigger className="rounded-md bg-muted/50 px-4 text-lg font-medium drop-shadow-sm hover:bg-primary hover:text-primary-foreground hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
                {subsystem.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 rounded-b-md p-2">
                  {subsystem.inspection_points.map((point) => (
                    <InspectionPointRow
                      key={point.id}
                      point={point}
                      statuses={inspectionStatuses}
                      result={inspectionResults[point.id] || {}}
                      onResultChange={(newResult) => onResultChange(point.id, newResult)}
                      onStatusChange={onStatusChange}
                      onTakePhoto={() => onTakePhoto(point)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
