import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InspectionStatus } from '@/types/inspection';
import { InspectionPoint, Machine } from '@/types/machine';
import { ListTodo } from 'lucide-react';
import { InspectionPointRow, InspectionResult } from './InspectionPointRow';

interface ChecklistCardProps {
  machine: Machine;
  inspectionStatuses: InspectionStatus[];
  inspectionResults: Record<number, InspectionResult>;
  errors: Record<string, string>;
  onResultChange: (pointId: number, newResult: InspectionResult) => void;
  onStatusChange: (pointId: number, statusId: number) => void;
  onTakePhoto: (point: InspectionPoint) => void;
  pointsStatus: Map<number, boolean>;
  completedPoints: number;
  totalPoints: number;
  progressPercentage: number;
}

export function ChecklistCard({
  machine,
  inspectionStatuses,
  inspectionResults,
  errors,
  pointsStatus,
  completedPoints,
  totalPoints,
  progressPercentage,
  onResultChange,
  onStatusChange,
  onTakePhoto,
}: ChecklistCardProps) {
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
          {machine.subsystems.map((subsystem) => {
            const totalInSubsystem = subsystem.inspection_points.length;
            const completedInSubsystem = subsystem.inspection_points.filter((p) => pointsStatus.get(p.id) === true).length;
            return (
              <AccordionItem key={subsystem.id} value={`subsystem-${subsystem.id}`}>
                <AccordionTrigger className="rounded-md bg-muted/50 px-4 text-lg font-medium drop-shadow-sm hover:bg-primary hover:text-primary-foreground hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
                  <div className="flex w-full justify-between pr-4">
                    <span>{subsystem.name}</span>
                    <span className={ completedInSubsystem === totalInSubsystem ? 'text-green-500' : 'text-muted-foreground'}>
                      {completedInSubsystem} / {totalInSubsystem}
                    </span>
                  </div>
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
                          isComplete={pointsStatus.get(point.id) || false}
                        />
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
