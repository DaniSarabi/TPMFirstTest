import { CameraModal } from '@/components/CameraModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TaskItemRenderer } from './Components/TaskItemRenderer';

interface Props extends PageProps {
  scheduledMaintenance: ScheduledMaintenance;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Calendar', href: route('maintenance-calendar.index') },
  { title: 'Perform Maintenance', href: '#', isCurrent: true },
];

export default function PerformMaintenanceIndex({ scheduledMaintenance }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    results: scheduledMaintenance.template.tasks.map((task) => {
      const existingResult = scheduledMaintenance.report.results.find((res) => res.task_label === task.label);
      return {
        task_label: task.label,
        result: existingResult?.result || null,
        comment: existingResult?.comment || '',
        photos: [] as File[],
      };
    }),
    notes: scheduledMaintenance.report.notes || '',
  });

  // Re-sync form state when props change after a save
  useEffect(() => {
    setData({
      results: scheduledMaintenance.template.tasks.map((task) => {
        const existingResult = scheduledMaintenance.report.results.find((res) => res.task_label === task.label);
        return {
          task_label: task.label,
          result: existingResult?.result || null,
          comment: existingResult?.comment || '',
          photos: [],
        };
      }),
      notes: scheduledMaintenance.report.notes || '',
    });
  }, [scheduledMaintenance.id]); // The fix is here

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);
  const [action, setAction] = useState<'save' | 'submit' | null>(null);
  const isOverdue = ['overdue', 'in_progress_overdue'].includes(scheduledMaintenance.status);

  const handlePhotoClick = (index: number) => {
    setActiveTaskIndex(index);
    setIsCameraOpen(true);
  };

  const handleCapture = (file: File) => {
    if (activeTaskIndex !== null) {
      const newResults = [...data.results];
      newResults[activeTaskIndex].photos.push(file);
      setData('results', newResults);
    }
  };

  const handleRemovePhoto = (taskIndex: number, photoIndex: number) => {
    const newResults = [...data.results];
    newResults[taskIndex].photos.splice(photoIndex, 1);
    setData('results', newResults);
  };
  // --- New handler for deleting saved photos ---
  const handleRemoveExistingPhoto = (photoId: number) => {
    router.delete(route('maintenance-photos.destroy', photoId), {
      preserveScroll: true, // Keep the user's scroll position
    });
  };

  // --- FIX: Separate handlers for each action ---
  const handleSaveProgress = () => {
    setAction('save');
    post(route('maintenance.perform.save', scheduledMaintenance.id));
  };

  const handleSubmitReport = () => {
    setAction('submit');
    post(route('maintenance.perform.submit', scheduledMaintenance.id));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Perform Maintenance: ${scheduledMaintenance.title}`} />
      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{scheduledMaintenance.title}</h1>
              <p className="text-muted-foreground">
                Target: {scheduledMaintenance.schedulable.name} ({scheduledMaintenance.schedulable_type.split('\\').pop()})
              </p>
            </div>
            {/* --- New Overdue Warning Alert --- */}
            {isOverdue && (
              <Alert variant="default" className="text-yellow-600 border-0 bg-yellow-100">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Maintenance Overdue</AlertTitle>
                <AlertDescription className="text-yellow-600">
                  This task is past its due date. Please complete it as soon as possible and add a note explaining the reason for the delay.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6 rounded-lg border-0 bg-background p-0 text-card-foreground shadow-sm">
              {scheduledMaintenance.template.tasks.map((task, index) => (
                <TaskItemRenderer
                  key={task.id}
                  task={task}
                  index={index}
                  data={data}
                  setData={setData}
                  errors={errors}
                  onPhotoClick={() => handlePhotoClick(index)}
                  onRemovePhoto={handleRemovePhoto}
                  onRemoveExistingPhoto={handleRemoveExistingPhoto} // Pass the new handler
                  existingPhotos={scheduledMaintenance.report.results.find((res) => res.task_label === task.label)?.photos || []}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                General Notes
              </Label>
              <Textarea
                className="shadow-lg ring ring-ring drop-shadow-lg"
                id="notes"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                placeholder="Add any overall comments or observations here..."
              />
              {errors.notes && <p className="mt-2 text-sm text-destructive">{errors.notes}</p>}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" disabled={processing} onClick={handleSaveProgress}>
                <Save />
                {processing && action === 'save' ? 'Saving...' : 'Save Progress'}
              </Button>
              <Button type="button" disabled={processing} onClick={handleSubmitReport}>
                <Send />
                {processing && action === 'submit' ? 'Submitting...' : 'Submit Final Report'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <CameraModal isOpen={isCameraOpen} onOpenChange={setIsCameraOpen} onCapture={handleCapture} />
    </AppLayout>
  );
}
