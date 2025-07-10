import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { StatusFormModal } from '../StatusFormModal';
import { getColumns, MachineStatus } from './Columns';

// Define the props for the page
interface IndexPageProps {
  statuses: MachineStatus[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'General Settings',
    href: route('settings.machine-status.index'),
  },
  {
    title: 'Machine Statuses',
    href: route('settings.machine-status.index'),
    isCurrent: true,
  },
];

export default function Index({ statuses }: IndexPageProps) {
  // --- State to manage all modals ---
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [statusToEdit, setStatusToEdit] = React.useState<Partial<MachineStatus> | null>(null);
  const [statusToDelete, setStatusToDelete] = React.useState<number | null>(null);

  // Inertia form helper for create/update actions
  const { post, put, setData, errors, reset, processing } = useForm();

  const can = {
    create: useCan('machines.edit'), // Using 'machines.edit' as a proxy for settings management
    edit: useCan('machines.edit'),
    delete: useCan('machines.edit'),
  };

  // --- Handlers for all CRUD actions ---
  const handleCreate = () => {
    setStatusToEdit(null); // Ensure we are in "create" mode
    setIsFormModalOpen(true);
  };

  const handleEdit = (status: MachineStatus) => {
    setStatusToEdit(status);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setStatusToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!statusToDelete) return;
    router.delete(route('settings.machine-status.destroy', statusToDelete), {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const handleSubmit = (formData: Omit<MachineStatus, 'id'>) => {
    const onSuccess = () => setIsFormModalOpen(false);
    if (statusToEdit && 'id' in statusToEdit) {
      put(route('settings.machine-status.update', statusToEdit.id!), { ...formData, onSuccess });
    } else {
      post(route('settings.machine-status.store'), { ...formData, onSuccess });
    }
  };

  const toolbarAction = can.create ? (
    <Button onClick={handleCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Status
    </Button>
  ) : null;

  const columns = React.useMemo(() => getColumns(handleEdit, handleDelete), []);
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <GeneralSettingsLayout>
        <Head title="Machine Statuses" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Machine Statuses</h1>
              <p className="text-muted-foreground">Manage the statuses that can be assigned to machines.</p>
            </div>
          </div>

          <DataTable columns={columns} data={statuses} filterColumnId="name" filterPlaceholder="Filter by name..." toolbarAction={toolbarAction} />
        </div>

        <StatusFormModal isOpen={isFormModalOpen} onOpenChange={setIsFormModalOpen} onSubmit={handleSubmit} status={statusToEdit} />
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
