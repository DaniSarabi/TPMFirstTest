import { LucideIcon } from 'lucide-react';

interface TaskType {
  label: string;
  icon: LucideIcon;
}

interface Props {
  task: TaskType;
}

// This component renders a clean preview for the drag overlay.
export function ToolboxDragOverlayItem({ task }: Props) {
  return (
    // By removing `h-full`, the container's height will be determined by its content.
    <>
      <div className="flex w-fit items-center gap-2 bg-primary text-secondary-foreground rounded-2xl p-2 opacity-80">
        <task.icon className="mr-3 h-5 w-5 shrink-0" />
        <h4 className="font-semibold">{task.label}</h4>
      </div>
    </>
  );
}
