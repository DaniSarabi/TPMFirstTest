import { CameraModal } from '@/components/CameraModal';
import InputError from '@/components/input-error';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { PageProps } from '@/types';
import { MaintenanceTemplateSection, MaintenanceTemplateTask, ScheduledMaintenance } from '@/types/maintenance';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, Save, Send } from 'lucide-react';
import * as React from 'react';
import { TaskItemRenderer } from './TaskItemRenderer';

interface MaintenanceChecklistProps extends PageProps {
  scheduledMaintenance: ScheduledMaintenance;
}

export function MaintenanceChecklist({ scheduledMaintenance }: MaintenanceChecklistProps) {
  const { template } = scheduledMaintenance;

  // Flatten ALL tasks (root + section tasks) for form state
  const flatAllTasks = React.useMemo(() => {
    const rootTasks = template.tasks || [];
    const sectionTasks = (template.sections || []).flatMap((section) => section.tasks);
    return [...rootTasks, ...sectionTasks];
  }, [template]);

  // Combine sections and root tasks, then sort by order
  const renderableItems = React.useMemo(() => {
    const sections = template.sections || [];
    const rootTasks = template.tasks || [];
    return [...sections, ...rootTasks].sort((a, b) => a.order - b.order);
  }, [template]);

  const { data, setData, post, processing, errors } = useForm({
    notes: scheduledMaintenance.report?.notes || '',
    results: flatAllTasks.map((task) => {
      const existingResult = scheduledMaintenance.report?.results.find((r) => r.task_label === task.label);
      return {
        task_label: task.label,
        result: existingResult?.result ?? null,
        comment: existingResult?.comment || '',
        photos: [] as File[],
      };
    }),
  });

  const [isCameraModalOpen, setCameraModalOpen] = React.useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = React.useState<number | null>(null);

  const handlePhotoCapturedOrSelected = (file: File) => {
    if (activeTaskIndex === null) return;
    const newResults = [...data.results];
    newResults[activeTaskIndex].photos.push(file);
    setData('results', newResults);
    setActiveTaskIndex(null);
  };

  // 2. Lógica para el Input de Archivo Oculto
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || activeTaskIndex === null) return;
    const file = event.target.files[0];
    handlePhotoCapturedOrSelected(file); // Reutilizamos la misma lógica
    event.target.value = '';
  };

  // --- Handlers que pasaremos como props ---
  const handleTakePhoto = (taskIndex: number) => {
    setActiveTaskIndex(taskIndex);
    setCameraModalOpen(true);
  };

  const handleUploadPhoto = (taskIndex: number) => {
    setActiveTaskIndex(taskIndex);
    fileInputRef.current?.click();
  };

  const handlePhotoCaptured = (file: File) => {
    if (activeTaskIndex === null) {
      console.error('Cannot capture photo, activeTaskIndex is not set.');
      return;
    }

    // This is the same immutable update logic as before
    const newResults = [...data.results];
    const currentPhotos = newResults[activeTaskIndex].photos || [];
    newResults[activeTaskIndex].photos = [...currentPhotos, file];

    setData('results', newResults);

    // Reset for the next capture
    setActiveTaskIndex(null);
  };
  const progressData = React.useMemo(() => {
    // Filter out content blocks (header, paragraph, bullet_list)
    const interactiveTasks = flatAllTasks.filter((task) => !['header', 'paragraph', 'bullet_list'].includes(task.task_type));

    const completedTasks = data.results.filter((result, index) => {
      const task = flatAllTasks[index];
      // Skip content blocks
      if (['header', 'paragraph', 'bullet_list'].includes(task.task_type)) {
        return false;
      }
      // Check if task has a result
      return result.result !== null && result.result !== '';
    });

    const total = interactiveTasks.length;
    const completed = completedTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }, [data.results, flatAllTasks]);
  const [action, setAction] = React.useState<'save' | 'submit' | null>(null);

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    setAction('save');
    post(route('maintenance.perform.save', scheduledMaintenance.id), {
      preserveScroll: true,
      onSuccess: () => {
        const clearedResults = data.results.map((result) => ({
          ...result,
          photos: [], // Reset the photos array to be empty
        }));
        setData('results', clearedResults);
      },
    });
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setAction('submit');
    post(route('maintenance.perform.submit', scheduledMaintenance.id), {
      // THE FIX: Also clear the photos on a final submission.
      onSuccess: () => {
        const clearedResults = data.results.map((result) => ({
          ...result,
          photos: [],
        }));
        setData('results', clearedResults);
      },
    });
  };

  const handleRemoveExistingPhoto = (photoId: number) => {
    router.delete(route('maintenance-photos.destroy', photoId), {
      preserveScroll: true,
    });
  };

  // Helper to get the correct index in the flattened tasks array
  const getTaskIndexInFlatArray = (task: MaintenanceTemplateTask): number => {
    return flatAllTasks.findIndex((t) => t.id === task.id);
  };

  const isOverdue = ['overdue', 'in_progress_overdue'].includes(scheduledMaintenance.status);

  return (
    <div className="space-y-6">
      {isOverdue && (
        <div className="flex items-center gap-4 rounded-md bg-yellow-100 p-4 text-yellow-600">
          <AlertTriangle className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-semibold">Maintenance Overdue</h1>
            <p className="text-yellow-800">
              This task is past its due date. Please complete it as soon as possible and add a note explaining the reason for the delay.
            </p>
          </div>
        </div>
      )}

      <Card className="border bg-background shadow-sm drop-shadow-sm">
        <CardHeader>
          <CardTitle>Maintenance Checklist</CardTitle>
          <CardDescription>{scheduledMaintenance.template.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="sticky top-0 z-10 space-y-2 py-3 backdrop-blur-sm">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Progress</span>
                <span className="font-semibold text-primary">{progressData.percentage}%</span>
              </div>
              <span>
                {progressData.completed} / {progressData.total} completed
              </span>
            </div>
            <Progress value={progressData.percentage} />
          </div>

          {renderableItems.map((item) => {
            // Check if item is a section (has 'tasks' property)
            //console.log('item:', item);

            if ('tasks' in item) {
              //console.log('entering the if:', item);
              const section = item as MaintenanceTemplateSection;
              return (
                <Accordion key={`section-${section.id}`} type="single" collapsible className="w-full">
                  <AccordionItem value={`section-${section.id}`} className="borde-0 rounded-lg">
                    <AccordionTrigger className="rounded-md bg-card px-4 text-lg font-medium drop-shadow-sm hover:bg-primary hover:text-primary-foreground hover:no-underline data-[state=open]:bg-primary data-[state=open]:text-primary-foreground">
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        {section.tasks
                          .sort((a, b) => a.order - b.order)
                          .map((task) => {
                            const taskIndex = getTaskIndexInFlatArray(task);
                            const existingResult = scheduledMaintenance.report?.results.find((r) => r.task_label === task.label);
                            const existingPhotos = existingResult?.photos || [];

                            return (
                              <TaskItemRenderer
                                key={task.id}
                                task={task}
                                index={taskIndex}
                                data={data}
                                setData={setData as any}
                                errors={errors}
                                onTakePhoto={() => handleTakePhoto(taskIndex)}
                                onUploadPhoto={() => handleUploadPhoto(taskIndex)}
                                onRemovePhoto={(taskIdx, photoIdx) => {
                                  const newResults = [...data.results];
                                  newResults[taskIdx].photos.splice(photoIdx, 1);
                                  setData('results', newResults);
                                }}
                                onRemoveExistingPhoto={handleRemoveExistingPhoto}
                                existingPhotos={existingPhotos}
                              />
                            );
                          })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            } else {
              // It's a root task
              const task = item as MaintenanceTemplateTask;
              const taskIndex = getTaskIndexInFlatArray(task);
              const existingResult = scheduledMaintenance.report?.results.find((r) => r.task_label === task.label);
              const existingPhotos = existingResult?.photos || [];

              return (
                <TaskItemRenderer
                  key={task.id}
                  task={task}
                  index={taskIndex}
                  data={data}
                  setData={setData as any}
                  errors={errors}
                  onTakePhoto={() => handleTakePhoto(taskIndex)}
                  onUploadPhoto={() => handleUploadPhoto(taskIndex)}
                  onRemovePhoto={(taskIdx, photoIdx) => {
                    const newResults = [...data.results];
                    newResults[taskIdx].photos.splice(photoIdx, 1);
                    setData('results', newResults);
                  }}
                  onRemoveExistingPhoto={handleRemoveExistingPhoto}
                  existingPhotos={existingPhotos}
                />
              );
            }
          })}
        </CardContent>
      </Card>

      <Card className="border bg-background shadow-sm drop-shadow-sm">
        <CardHeader>
          <CardTitle>Final Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="border-primary"
            placeholder="Add any final notes about this maintenance task..."
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
            rows={4}
          />
          <InputError message={errors.notes} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="secondary" disabled={processing} onClick={handleSaveProgress}>
          <Save className="mr-2 h-4 w-4" />
          {processing && action === 'save' ? 'Saving...' : 'Save Progress'}
        </Button>
        <Button type="button" disabled={processing} onClick={handleSubmitReport}>
          <Send className="mr-2 h-4 w-4" />
          {processing && action === 'submit' ? 'Submitting...' : 'Submit Final Report'}
        </Button>
      </div>
      <CameraModal isOpen={isCameraModalOpen} onOpenChange={setCameraModalOpen} onCapture={handlePhotoCaptured} />
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} accept="image/*" />
    </div>
  );
}
