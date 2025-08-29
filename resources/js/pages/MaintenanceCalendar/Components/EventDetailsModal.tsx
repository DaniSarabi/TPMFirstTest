import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScheduledMaintenanceEvent } from '@/types/maintenance';
import { router, useForm } from '@inertiajs/react';
import { Eye, Pencil, Play, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DeleteEventDialog } from './DeleteEventDialog';
import { EventEditDetails } from './EventEditDetails';
import { EventHeader } from './EventHeader';
import { EventViewDetails } from './EventViewDetails';

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event: ScheduledMaintenanceEvent | null;
}

export function EventDetailsModal({ isOpen, onOpenChange, event }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, setData, put, processing, reset } = useForm({
    title: '',
    scheduled_date: new Date(),
    color: '',
    update_scope: 'single',
  });

  useEffect(() => {
    if (event) {
      reset();
      setData({
        title: event.title,
        scheduled_date: new Date(event.start + 'T00:00:00'),
        color: event.backgroundColor,
        update_scope: 'single',
      });
    }
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [event, isOpen]);

  if (!event) return null;

  const { extendedProps } = event;
  const isCompleted = extendedProps.status === 'completed' || extendedProps.status === 'completed_overdue';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('scheduled-maintenances.update', event.id), {
      onSuccess: () => {
        setIsEditing(false);
        onOpenChange(false);
      },
    });
  };

  const handleConfirmDelete = (deleteScope: 'single' | 'future') => {
    router.delete(route('scheduled-maintenances.destroy', event.id), {
      data: { delete_scope: deleteScope },
      onSuccess: () => onOpenChange(false),
    });
  };
  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handlePerform = () => {
    router.get(route('maintenance.perform.show', event.id));
  };

  const handleViewReport = () => {
    if (extendedProps.report_id) {
      router.get(route('maintenance-reports.show', extendedProps.report_id));
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center pb-2 text-xl">
                <div className="mr-3 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: isEditing ? data.color : event.backgroundColor }} />
                {isEditing ? <Input className="ring ring-ring" value={data.title} onChange={(e) => setData('title', e.target.value)} /> : event.title}
              </DialogTitle>
            </DialogHeader>

            {/* Always show the header */}
            <EventHeader event={event} />

            {/* Conditionally show view or edit details */}
            {isEditing ? <EventEditDetails data={data} setData={setData} event={event} /> : <EventViewDetails event={event} />}

            <DialogFooter>
              {isEditing ? (
                <>
                  <Button type="button" variant="ghost" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    <Save className="mr-2 h-4 w-4" /> {processing ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <TooltipProvider delayDuration={100}>
                  {isCompleted ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" onClick={handleViewReport}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Report</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" size="icon" onClick={handlePerform}>
                          <Play className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Perform Maintenance</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* FIX: Disable the button if the event is completed */}
                      <Button type="button" variant="secondary" size="icon" onClick={() => setIsEditing(true)} disabled={isCompleted}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Schedule</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* FIX: Disable the button if the event is completed */}
                      <Button type="button" variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)} disabled={isCompleted}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Event</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DeleteEventDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} event={event} />
    </>
  );
}
