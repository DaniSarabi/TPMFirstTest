import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Save, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { Subsystem } from './Columns';

// Define the shape of an inspection point
interface InspectionPoint {
  id: number;
  name: string;
}

// Define the props for the modal
interface ManageInspectionPointsModalProps {
  subsystem: Subsystem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  can: { create: boolean; edit: boolean; delete: boolean };
}

export function ManageInspectionPointsModal({ subsystem, isOpen, onOpenChange, can }: ManageInspectionPointsModalProps) {
  // State to manage the list of points displayed in the modal
  const [points, setPoints] = React.useState<InspectionPoint[]>([]);
  // State to manage which point is currently being edited
  const [editingPointId, setEditingPointId] = React.useState<number | null>(null);
  //  State to manage the delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [pointToDelete, setPointToDelete] = React.useState<number | null>(null);
  // Form for adding a new inspection point
  const {
    data: newData,
    setData: setNewData,
    post: postNew,
    processing: processingNew,
    errors: newErrors,
    reset: resetNew,
  } = useForm({
    name: '',
    subsystem_id: null as number | null,
  });

  // Form for editing an existing inspection point
  const {
    data: editData,
    setData: setEditData,
    post: postEdit,
    processing: processingEdit,
    errors: editErrors,
    reset: resetEdit,
  } = useForm({
    name: '',
    _method: 'PUT',
  });

  // This useEffect hook updates the local list of points whenever the modal is opened with a new subsystem
  React.useEffect(() => {
    if (subsystem) {
      setPoints(subsystem.inspection_points);
      setNewData('subsystem_id', subsystem.id);
    }
  }, [subsystem]);

  // --- Action Handlers ---

  const handleAddNewPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subsystem) return;
    postNew(route('inspection-points.add', subsystem.id), {
      preserveScroll: true,
      onSuccess: (page) => {
        // Update the local state with the new point ---
        const flash = page.props.flash as { newPoint?: InspectionPoint };
        if (flash && flash.newPoint) {
          setPoints((currentPoints) => [...currentPoints, flash.newPoint!]);
        }
        resetNew('name');
      },
    });
  };

  const handleStartEdit = (point: InspectionPoint) => {
    setEditingPointId(point.id);
    setEditData('name', point.name);
  };

  const handleCancelEdit = () => {
    setEditingPointId(null);
    resetEdit();
  };

  const handleSaveEdit = (pointId: number) => {
    postEdit(route('inspection-points.update', pointId), {
      preserveScroll: true,
      onSuccess: () => {
        setPoints((currentPoints) => currentPoints.map((p) => (p.id === pointId ? { ...p, name: editData.name } : p)));
        setEditingPointId(null);
      },
    });
  };

  // This function now opens the confirmation dialog
  const handleDeletePoint = (pointId: number) => {
    setPointToDelete(pointId);
    setIsDeleteDialogOpen(true);
  };

  // This function is called when the user confirms the deletion
  const confirmPointDelete = () => {
    if (!pointToDelete) return;
    router.delete(route('inspection-points.destroy', pointToDelete), {
      preserveScroll: true,
      onSuccess: () => {
        setPoints((currentPoints) => currentPoints.filter((p) => p.id !== pointToDelete));
        setIsDeleteDialogOpen(false);
        setPointToDelete(null);
      },
    });
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Inspection Points</DialogTitle>
            <DialogDescription>Add, edit, or delete inspection points for the "{subsystem?.name}" subsystem.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* List of existing inspection points */}
            <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
              {points.map((point) => (
                <div key={point.id} className="flex items-center gap-2 rounded-md border p-2">
                  {editingPointId === point.id ? (
                    // --- Edit View ---
                    <div className="flex flex-1 items-center gap-2">
                      <Input value={editData.name} onChange={(e) => setEditData('name', e.target.value)} className="h-8" />
                      <Button size="icon" className="h-8 w-8" onClick={() => handleSaveEdit(point.id)} disabled={processingEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // --- Default View ---
                    <>
                      <span className="flex-1">{point.name}</span>
                      {can.edit && (
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(point)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {can.delete && (
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeletePoint(point.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {can.create && (
              <div className="border-t pt-4">
                <Label>Add New Inspection Point</Label>
                <form onSubmit={handleAddNewPoint} className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <Input value={newData.name} onChange={(e) => setNewData('name', e.target.value)} placeholder="e.g., Check oil level" />
                    <InputError message={newErrors.name} className="mt-1" />
                  </div>
                  <Button type="submit" disabled={processingNew}>
                    {processingNew ? 'Adding...' : 'Add Point'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmPointDelete}
        title="Delete Inspection Point"
        description="This action cannot be undone. Are you sure you want to permanently delete this inspection point?"
      />
    </>
  );
}
