import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import AppLayout from '@/layouts/app-layout';
import { Paginated, type BreadcrumbItem } from '@/types';
import { Asset, AssetGroup } from '@/types/asset';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Head, router } from '@inertiajs/react';
import { Edit, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { MaintenanceList } from './Components/MaintenanceList';
import { CreateEditAssetModal } from './Components/Modals/CreateEditAssetModal';

// Define los props que la página recibirá del controlador
interface ShowPageProps {
  asset: Asset;
  maintenances: Paginated<ScheduledMaintenance>;
  assetGroups: AssetGroup[];
}

export default function Show({ asset, maintenances, assetGroups }: ShowPageProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Breadcrumbs dinámicos para la navegación
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Equipment', href: route('assets.index') },
    { title: asset.name, href: route('assets.show', asset.id) },
  ];

  const handleDelete = () => {
    router.delete(route('assets.destroy', asset.id), {
      onSuccess: () => toast.success('Equipment deleted successfully!'),
      onError: () => toast.error('Failed to delete equipment.'),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={asset.name} />

      <div className="space-y-6 p-6">
        {/* --- HEADER CON TÍTULO Y ACCIONES --- */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{asset.name}</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* --- GRID PRINCIPAL CON DETALLES Y MANTENIMIENTOS --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna Izquierda: Imagen y Detalles */}
          <div className="col-span-1 space-y-6">
            <Card className='bg-primary text-primary-foreground'>
              <CardHeader>
                <img
                  src={asset.image_url || 'https://placehold.co/600x400?text=no+image'}
                  alt={`Image of ${asset.name}`}
                  className="aspect-video w-full rounded-lg object-cover"
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="mb-4">Details</CardTitle>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="">Status</span>
                    <span className="font-medium capitalize">{asset.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Group</span>
                    <span className="font-medium">{asset.asset_group?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="">Date Added</span>
                    <span className="font-medium">{new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Lista de Mantenimientos */}
          <div className="col-span-1 lg:col-span-2">
            <MaintenanceList maintenances={maintenances} />
          </div>
        </div>
      </div>

      {/* --- MODALES --- */}
      <CreateEditAssetModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        asset={asset}
        assetGroups={assetGroups}
        onFinish={() => router.reload({ only: ['asset'] })}
      />
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Equipment"
        description="This action cannot be undone. Are you sure you want to permanently delete this equipment?"
      />
    </AppLayout>
  );
}
