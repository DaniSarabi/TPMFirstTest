import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckSquare, CircleSlash, Hash, Pilcrow } from 'lucide-react';
import { DraggableTaskItem } from './DraggableTaskItem';

// Define the types of tasks available in our system
const taskTypes = [
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { id: 'pass_fail', label: 'Pass / Fail', icon: CircleSlash },
  { id: 'numeric_input', label: 'Numeric Input', icon: Hash },
  { id: 'text_observation', label: 'Text Observation', icon: Pilcrow },
];

export function TaskToolbox() {
  return (
    <div className="overflow-hidden  rounded-sm shadow-lg drop-shadow-lg bg-primary text-primary-foreground">
      <CardContent className="">
        <TooltipProvider delayDuration={100}>
          <div className="flex items-center justify-around">
            {taskTypes.map((task) => (
              <Tooltip key={task.id}>
                <TooltipTrigger asChild>
                  {/* The DraggableTaskItem will now just be an icon button */}
                  <div>
                    <DraggableTaskItem task={task} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </div>
  );
}
