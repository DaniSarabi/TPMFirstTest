import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MaintenanceTemplateTask, ScheduledMaintenance } from '@/types/maintenance';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, Save, Send } from 'lucide-react';
import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TaskItemRenderer } from './TaskItemRenderer'; // ACTION: Now correctly imports your existing component.
import InputError from '@/components/input-error';
import { PageProps } from '@/types';

// Define the shape of the props this component expects
interface MaintenanceChecklistProps extends PageProps {
    scheduledMaintenance: ScheduledMaintenance;
}

export function MaintenanceChecklist({ scheduledMaintenance }: MaintenanceChecklistProps) {
    // ACTION: The form data is now simpler and only contains what needs to be sent to the server.
    // 'existingPhotos' and other complex objects have been removed to prevent serialization errors.
    const { data, setData, post, processing, errors } = useForm({
        notes: scheduledMaintenance.report?.notes || '',
        results: scheduledMaintenance.template.tasks.map(task => {
            const existingResult = scheduledMaintenance.report?.results.find(r => r.task_label === task.label);
            return {
                task_label: task.label,
                result: existingResult?.result ?? null,
                comment: existingResult?.comment || '',
                // This will hold only the NEWLY uploaded photos.
                photos: [] as File[],
            };
        }),
    });
    
    const [action, setAction] = React.useState<'save' | 'submit' | null>(null);

    // ACTION: These handlers now correctly call Inertia's post method.
    const handleSaveProgress = (e: React.FormEvent) => {
        e.preventDefault();
        setAction('save');
        post(route('maintenance.perform.save', scheduledMaintenance.id), {
            preserveScroll: true,
        });
    };

    const handleSubmitReport = (e: React.FormEvent) => {
        e.preventDefault();
        setAction('submit');
        post(route('maintenance.perform.submit', scheduledMaintenance.id));
    };

    const handleRemoveExistingPhoto = (photoId: number) => {
        router.delete(route('maintenance-photos.destroy', photoId), {
            preserveScroll: true,
        });
    };

    const isOverdue = ['overdue', 'in_progress_overdue'].includes(scheduledMaintenance.status);

    return (
        <form className="space-y-6">
            {isOverdue && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Maintenance Overdue</AlertTitle>
                    <AlertDescription>
                        This task is past its due date. Please complete it as soon as possible and add a note explaining the reason for the delay.
                    </AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Checklist</CardTitle>
                    <CardDescription>{scheduledMaintenance.template.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ACTION: Now correctly maps and renders your existing TaskItemRenderer component */}
                    {scheduledMaintenance.template.tasks.map((task: MaintenanceTemplateTask, index: number) => {
                        const existingResult = scheduledMaintenance.report?.results.find(r => r.task_label === task.label);
                        const existingPhotos = existingResult?.photos || [];

                        return (
                            <TaskItemRenderer 
                                key={task.id}
                                task={task}
                                index={index}
                                data={data}
                                setData={setData as any} // Cast as 'any' to satisfy the generic setData from useForm
                                errors={errors}
                                onPhotoClick={() => {/* Logic to open camera modal would go here */}}
                                onRemovePhoto={(taskIndex, photoIndex) => {
                                    const newResults = [...data.results];
                                    newResults[taskIndex].photos.splice(photoIndex, 1);
                                    setData('results', newResults);
                                }}
                                onRemoveExistingPhoto={handleRemoveExistingPhoto}
                                existingPhotos={existingPhotos}
                            />
                        );
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Final Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="Add any final notes about this maintenance task..."
                        value={data.notes}
                        onChange={e => setData('notes', e.target.value)}
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
        </form>
    );
};

