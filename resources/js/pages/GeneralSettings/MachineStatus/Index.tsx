import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { ReassignAndDeleteStatusModal } from '../ReassingAndDeleteModal';
import { StatusFormModal } from './MachineStatusFormModal';
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
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [statusToEdit, setStatusToEdit] = React.useState<Partial<MachineStatus> | null>(null);
  const [statusToDelete, setStatusToDelete] = React.useState<MachineStatus | null>(null);

  // --- ACTION 1: The Index page now manages the form state for the modal ---
  const { data, setData, post, put, errors, reset, processing } = useForm({
    name: '',
    description: '',
    bg_color: '#dcfce7',
    text_color: '#166534',
  });

  const can = {
    create: useCan('machines.edit'),
    edit: useCan('machines.edit'),
    delete: useCan('machines.edit'),
  };

  // --- ACTION 2: Update handlers to reset the form state ---
  const handleCreate = () => {
    reset();
    setStatusToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (status: MachineStatus) => {
    reset();
    setData({
      name: status.name,
      description: status.description || '',
      bg_color: status.bg_color,
      text_color: status.text_color,
    });
    setStatusToEdit(status);
    setIsFormModalOpen(true);
  };

  const handleDelete = (status: MachineStatus) => {
    setStatusToDelete(status);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = (newStatusId: number) => {
    if (!statusToDelete) return;
    router.delete(route('settings.machine-status.destroy', statusToDelete.id), {
      data: { new_status_id: newStatusId },
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  // --- ACTION 3: The submit handler now uses the form state from this page ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const onSuccess = () => setIsFormModalOpen(false);
    if (statusToEdit && 'id' in statusToEdit) {
      put(route('settings.machine-status.update', statusToEdit.id!), { ...data, onSuccess });
    } else {
      post(route('settings.machine-status.store'), { ...data, onSuccess });
    }
  };

  const columns = React.useMemo(
    // --- ACTION 3: Pass the correct handleDelete function signature ---
    () => getColumns(handleEdit, handleDelete),
    [],
  );

  const otherStatuses = statusToDelete ? statuses.filter((s) => s.id !== statusToDelete.id) : [];

  const toolbarAction = can.create ? (
    <Button onClick={handleCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Status
    </Button>
  ) : null;

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

          {/* --- ACTION: Reinstated the DataTable with all props --- */}
          <DataTable
            columns={columns}
            data={statuses}
            filterColumnId="name"
            filterPlaceholder="Filter by status name..."
            toolbarAction={toolbarAction}
          />
        </div>
        {/* --- ACTION 4: Pass the form state and handlers down to the modal --- */}
        <StatusFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          onSubmit={handleSubmit}
          status={statusToEdit}
          data={data}
          setData={setData}
          errors={errors}
          processing={processing}
        />
        <ReassignAndDeleteStatusModal
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          statusToDelete={statusToDelete}
          otherStatuses={otherStatuses}
        />
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
