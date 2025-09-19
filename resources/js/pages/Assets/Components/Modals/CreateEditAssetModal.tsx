import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Asset, AssetGroup } from '@/types/asset';
import { router, useForm } from '@inertiajs/react'; // ACTION: Importamos `router`
import * as React from 'react';
import { toast } from 'sonner';

// Definimos los props que recibirá el modal
interface CreateEditAssetModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  asset?: Asset;
  assetGroups: AssetGroup[];
  onFinish: () => void;
}

export function CreateEditAssetModal({ isOpen, onOpenChange, asset, assetGroups, onFinish }: CreateEditAssetModalProps) {
  const isEditMode = asset !== undefined;

  // El hook useForm sigue siendo útil para manejar el estado del formulario
  const { data, setData, processing, errors, reset } = useForm({
    name: '',
    asset_group_id: '',
    image: null as File | null,
  });

  // Usamos useEffect para poblar el formulario cuando el modal se abre
  React.useEffect(() => {
    if (isOpen) {
      setData({
        name: asset?.name || '',
        asset_group_id: asset?.asset_group_id?.toString() || 'null',
        image: null,
      });
    }
  }, [isOpen, asset]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Preparamos los datos para el envío.
    const submitData = {
      ...data,
      asset_group_id: data.asset_group_id === 'null' ? null : data.asset_group_id,
    };

    const options = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Equipment updated!' : 'Equipment created!');
        onOpenChange(false);
        onFinish();
        reset();
      },
      onError: () => {
        // El backend nos devuelve los errores, `useForm` los mapea a `errors`
        toast.error('An error occurred. Please check the form.');
      },
      preserveScroll: true,
    };

    // FIX: Para evitar errores de argumentos y manejar correctamente la subida
    // de archivos en modo 'edit', usamos `router.post` directamente.
    // Este método acepta explícitamente un objeto de datos como segundo argumento.
    if (isEditMode) {
      router.post(
        route('assets.update', asset.id),
        {
          ...submitData,
          _method: 'PUT', // Así es como Inertia maneja las peticiones PUT con archivos
        },
        options,
      );
    } else {
      // Usamos router.post también aquí para mantener la consistencia.
      router.post(route('assets.store'), submitData, options);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Equipment' : 'Create New Equipment'}</DialogTitle>
          <DialogDescription>Fill in the details below. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="col-span-3" required />
              {errors.name && <p className="col-span-4 text-right text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="asset_group_id" className="text-right">
                Group
              </Label>
              <Select value={data.asset_group_id} onValueChange={(value) => setData('asset_group_id', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">No Group</SelectItem>
                  {assetGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.asset_group_id && <p className="col-span-4 text-right text-sm text-red-500">{errors.asset_group_id}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <Input id="image" type="file" onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)} className="col-span-3" />
              {errors.image && <p className="col-span-4 text-right text-sm text-red-500">{errors.image}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
