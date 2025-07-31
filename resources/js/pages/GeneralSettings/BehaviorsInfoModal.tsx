import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain } from 'lucide-react';

// Define the shape of a behavior object
interface Behavior {
  id: number;
  name: string;
  title: string;
  description: string;
}

// Define the props for the modal
interface BehaviorsInfoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  behaviors: Behavior[];
}

export function BehaviorsInfoModal({ isOpen, onOpenChange, behaviors }: BehaviorsInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Status Behaviors</DialogTitle>
          <DialogDescription>Behaviors are special rules that you can assign to a status to trigger automated actions.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 space-y-3 overflow-y-auto py-4 pr-2">
          {behaviors.map((behavior) => (
            <div
              key={behavior.id}
              className="rounded-md border-l-4 border-primary bg-muted/50 p-3 transition-transform ease-in-out hover:-translate-y-1"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <p className="font-semibold text-primary">{behavior.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{behavior.description}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
