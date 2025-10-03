import { CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckSquare, CircleSlash, Hash, Heading2, LayoutTemplate, List, Pilcrow, Text } from 'lucide-react';
import { DraggableTaskItem } from './DraggableTaskItem';

const inputTaskTypes = [
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { id: 'pass_fail', label: 'Pass / Fail', icon: CircleSlash },
  { id: 'numeric_input', label: 'Numeric Input', icon: Hash },
  { id: 'text_observation', label: 'Text Observation', icon: Pilcrow },
];

const contentTaskTypes = [
  { id: 'header', label: 'Header', icon: Heading2 },
  { id: 'paragraph', label: 'Paragraph', icon: Text },
  { id: 'bullet_list', label: 'Bulleted List', icon: List },
];

const layoutTaskTypes = [{ id: 'section', label: 'Section', icon: LayoutTemplate }];

export function TaskToolbox() {
  return (
    <div className="overflow-hidden rounded-sm bg-primary text-primary-foreground shadow-lg drop-shadow-lg">
      <CardContent className="p-1">
        <TooltipProvider delayDuration={100}>
          <div className="flex items-center justify-center gap-5">
            {/* --- Input Fields --- */}
            {inputTaskTypes.map((task) => (
              <Tooltip key={task.id}>
                <TooltipTrigger asChild>
                  <div>
                    <DraggableTaskItem task={task} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            <Separator orientation="vertical" className="mx-0 h-1 rounded-2xl border-3 border-white bg-primary-foreground text-white" />

            {/* --- Content Fields --- */}
            {contentTaskTypes.map((task) => (
              <Tooltip key={task.id}>
                <TooltipTrigger asChild>
                  <div>
                    <DraggableTaskItem task={task} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <Separator orientation="vertical" className="mx-0 h-1 rounded-2xl border-3 border-white bg-primary-foreground text-white" />
            {/* --- Layout Fields --- */}
            {layoutTaskTypes.map((task) => (
              <Tooltip key={task.id}>
                <TooltipTrigger asChild>
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
