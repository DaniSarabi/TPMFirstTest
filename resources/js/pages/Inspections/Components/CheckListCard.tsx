import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectionStatus } from '@/types/inspection';
import { InspectionPoint, Machine } from '@/types/machine';
import { ListTodo } from 'lucide-react';
import { InspectionPointRow, InspectionResult } from './InspectionPointRow';
import * as React from 'react';
import { Progress } from '@/components/ui/progress';

interface ChecklistCardProps {
  machine: Machine;
  inspectionStatuses: InspectionStatus[];
  inspectionResults: Record<number, InspectionResult>;
  errors: Record<string, string>;
  onResultChange: (pointId: number, newResult: InspectionResult) => void;
  onStatusChange: (pointId: number, statusId: number) => void;
  onTakePhoto: (point: InspectionPoint) => void;
}

export function ChecklistCard({
  machine,
  inspectionStatuses,
  inspectionResults,
  errors,
  onResultChange,
  onStatusChange,
  onTakePhoto,
}: ChecklistCardProps) {
  const { totalPoints, completedPoints, progressPercentage } = React.useMemo(() => {
    const allPoints = machine.subsystems.flatMap((s) => s.inspection_points);
    const total = allPoints.length;
    const completed = allPoints.filter((point) => inspectionResults[point.id]?.status_id).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { totalPoints: total, completedPoints: completed, progressPercentage: percentage };
  }, [machine.subsystems, inspectionResults]);

  return (
    <Card className="border-0 shadow-lg shadow-primary drop-shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTodo className="h-10 w-10 text-primary" />
          <div>
            <CardTitle className="text-primary">Inspection Checklist</CardTitle>
            <CardDescription>Please review each point and select the appropriate status.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="sticky top-0 z-10 space-y-2 bg-card/80 py-3 backdrop-blur-sm">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>Progress</span>
            <span>
              {completedPoints} / {totalPoints} completed
            </span>
          </div>
          <Progress value={progressPercentage} />
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {machine.subsystems.map((subsystem) => (
            <AccordionItem key={subsystem.id} value={`subsystem-${subsystem.id}`}>
              <AccordionTrigger className="rounded-md bg-muted/50 px-4 text-lg font-medium drop-shadow-sm hover:bg-primary hover:text-primary-foreground hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
                {subsystem.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 rounded-b-md p-2">
                  {subsystem.inspection_points.map((point) => {
                    const pointErrors = {
                      comment: errors[`results.${point.id}.comment`],
                      image: errors[`results.${point.id}.image`],
                    };
                    return (
                      <InspectionPointRow
                        key={point.id}
                        point={point}
                        statuses={inspectionStatuses}
                        result={inspectionResults[point.id] || {}}
                        errors={pointErrors}
                        onResultChange={(newResult) => onResultChange(point.id, newResult)}
                        onStatusChange={onStatusChange}
                        onTakePhoto={() => onTakePhoto(point)}
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
