import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetGroup } from '@/types/asset';
import { useForm } from '@inertiajs/react';
import { CircleX, Pencil, Save, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

// Definimos los props que recibirá el modal
interface ManageGroupsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  assetGroups: AssetGroup[];
  onFinish?: () => void; // Se añade onFinish para notificar al padre
}

export function ManageGroupsModal({ isOpen, onOpenChange, assetGroups, onFinish }: ManageGroupsModalProps) {
  const [editingGroup, setEditingGroup] = React.useState<AssetGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const [groupToDelete, setGroupToDelete] = React.useState<number | null>(null);

  // FIX: Se obtiene el método `delete` de useForm, se le da el alias `destroy`
  const {
    data,
    setData,
    post,
    put,
    delete: destroy,
    processing,
    errors,
    reset,
  } = useForm({
    name: '',
    maintenance_type: 'individual',
  });

  // Reseteamos el formulario al cerrar el modal o cambiar de modo
  React.useEffect(() => {
    if (editingGroup) {
      setData({
        name: editingGroup.name,
        maintenance_type: editingGroup.maintenance_type,
      });
    } else {
      reset();
    }
  }, [editingGroup, isOpen]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = editingGroup ? route('asset-groups.update', editingGroup.id) : route('asset-groups.store');
    const method = editingGroup ? put : post;

    method(url, {
      onSuccess: () => {
        toast.success(editingGroup ? 'Group updated!' : 'Group created!');
        setEditingGroup(null);
        reset();
        onFinish?.(); // Se llama a onFinish en caso de éxito
      },
      onError: () => toast.error('Please check the form for errors.'),
      preserveScroll: true,
    });
  };

  const handleDelete = (groupId: number) => {
    setGroupToDelete(groupId);
    setIsDeleteDialogOpen(true);
  };
  const confirmGroupDelete = () => {
    if (!groupToDelete) return;
    // FIX: Se usa el método `destroy` (delete) de useForm, que es el correcto para esta operación.
    destroy(route('asset-groups.destroy', groupToDelete), {
      onSuccess: () => {
        toast.success('Group deleted!');
        onFinish?.(); // Se llama a onFinish en caso de éxito
      },
      preserveScroll: true,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange} >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Equipment Groups</DialogTitle>
            <DialogDescription>Create, edit, or delete equipment groups from here.</DialogDescription>
          </DialogHeader>

          {/* Lista de Grupos Existentes */}
          <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
            {assetGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{group.maintenance_type} Maintenance</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingGroup(group)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario para Crear/Editar */}
          <form onSubmit={handleFormSubmit} className="mt-2 space-y-4 border-t border-primary pt-4" autoComplete="false">
            <h3 className="font-medium">{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                className="border-0 shadow-md ring-1 ring-ring drop-shadow-lg hover:bg-muted"
                id="group-name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="maintenance-type">Maintenance Type</Label>
              <Select value={data.maintenance_type} onValueChange={(value) => setData('maintenance_type', value)}>
                <SelectTrigger className="border-0 shadow-md ring-1 ring-ring drop-shadow-lg hover:bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="hover:bg-accent" value="individual">
                    Individual (per equipment)
                  </SelectItem>
                  <SelectItem className="hover:bg-accent" value="group">
                    Group (one job for all)
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.maintenance_type && <p className="mt-1 text-sm text-red-500">{errors.maintenance_type}</p>}
            </div>
            <div className="flex justify-end gap-2">
              {editingGroup && (
                <Button
                  className="hover:bg-destructive/20 hover:text-destructive"
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingGroup(null)}
                >
                  <CircleX className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={processing}>
                <Save />
                {processing ? 'Saving...' : editingGroup ? 'Save Changes' : 'Create Group'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmGroupDelete}
        title="Delete Asset Group"
        description="This action cannot be undone. Are you sure you want to permanently delete this AssetGroup?"
      />
    </>
  );
}
