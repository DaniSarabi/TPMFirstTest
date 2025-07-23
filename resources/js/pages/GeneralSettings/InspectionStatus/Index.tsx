import { DataTable } from '@/components/data-table';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import useCan from '@/lib/useCan';
import { Filter, Paginated, type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { MachineStatus } from '../MachineStatus/Columns';
import { getColumns, InspectionStatus } from './Columns';
import { InspectionStatusFormModal } from './InspectionStatusFormModal';
import { ReassignAndDeleteStatusModal } from './ReassignAndDeleteInspectionStatusModal';

// Define the props for the page, which it receives from the controller
interface IndexPageProps {
  statuses: Paginated<InspectionStatus>;
  machineStatuses: MachineStatus[];
  filters: Filter & { sort?: string; direction?: 'asc' | 'desc' };
}
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'General Settings',
    href: route('settings.machine-status.index'),
  },
  {
    title: 'Inspection Statuses',
    href: route('settings.inspection-status.index'),
    isCurrent: true,
  },
];

export default function Index({ statuses, machineStatuses, filters }: IndexPageProps) {
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [statusToEdit, setStatusToEdit] = React.useState<Partial<InspectionStatus> | null>(null);
  const [statusToDelete, setStatusToDelete] = React.useState<InspectionStatus | null>(null);

  const [search, setSearch] = React.useState(filters.search || '');
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
    filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null,
  );
  const isInitialMount = React.useRef(true);

  const form = useForm<{
    name: string;
    bg_color: string;
    text_color: string;
    severity: number;
    auto_creates_ticket: boolean;
    machine_status_id: number | null;
    is_default: boolean;
  }>({
    name: '',
    bg_color: '#dcfce7',
    text_color: '#166534',
    severity: 0,
    auto_creates_ticket: false,
    machine_status_id: null,
    is_default: false,
  });

  const handleDelete = (status: InspectionStatus) => {
    setStatusToDelete(status);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = (newStatusId: number) => {
    if (!statusToDelete) return;
    // Send the new status ID along with the request to the backend
    router.delete(route('settings.inspection-status.destroy', statusToDelete.id), {
      data: { new_status_id: newStatusId },
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const handleCreate = () => {
    form.reset();
    setStatusToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const onSuccess = () => setIsFormModalOpen(false);
    if (statusToEdit && 'id' in statusToEdit) {
      form.put(route('settings.inspection-status.update', statusToEdit.id!), { onSuccess });
    } else {
      form.post(route('settings.inspection-status.store'), { onSuccess });
    }
  };

  const handleEdit = (status: InspectionStatus) => {
    // --- ACTION: Set each piece of form data individually ---
    // This is the correct way to update the form state with useForm.
    form.setData('name', status.name);
    form.setData('bg_color', status.bg_color);
    form.setData('text_color', status.text_color);
    form.setData('severity', status.severity);
    form.setData('auto_creates_ticket', status.auto_creates_ticket);
    form.setData('machine_status_id', status.machine_status_id);
    form.setData('is_default', status.is_default);

    setStatusToEdit(status);
    setIsFormModalOpen(true);
  };

  const can = {
    create: useCan('inspections.edit'),
    edit: useCan('inspections.edit'),
    delete: useCan('inspections.edit'),
  };
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('settings.inspection-status.index'),
        {
          search,
          sort: sort?.id,
          direction: sort?.desc ? 'desc' : 'asc',
        },
        { preserveState: true, replace: true },
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, sort]);

  const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      setSort(null);
    } else {
      setSort({ id: columnId, desc: direction === 'desc' });
    }
  };
  // Create the columns for the data table, passing in the placeholder handlers.
  const columns = React.useMemo(() => getColumns(handleEdit, handleDelete, handleSort, sort), [sort]);

  const table = useReactTable({
    data: statuses.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const otherStatuses = statusToDelete ? statuses.data.filter((s) => s.id !== statusToDelete.id) : [];

  const toolbarAction = can.create ? (
    <Button onClick={handleCreate}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Status
    </Button>
  ) : null;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <GeneralSettingsLayout>
        <Head title="Inspection Statuses" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inspection Statuses</h1>
              <p className="text-muted-foreground">Manage the statuses that operators can assign during an inspection.</p>
            </div>
          </div>

          <ListToolbar
            onSearch={setSearch}
            searchPlaceholder="Filter by status name..."
            createAction={
              can.create ? (
                <Button onClick={handleCreate} className='drop-shadow-lg'>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Status
                </Button>
              ) : null
            }
            viewOptionsAction={<DataTableViewOptions table={table} />}
          />

          <DataTable table={table} columns={columns} />

          <Pagination paginated={statuses} />
          <InspectionStatusFormModal
            isOpen={isFormModalOpen}
            onOpenChange={setIsFormModalOpen}
            onSubmit={handleSubmit}
            status={statusToEdit}
            machineStatuses={machineStatuses}
            data={form.data}
            setData={form.setData}
            errors={form.errors}
            processing={form.processing}
          />
          <ReassignAndDeleteStatusModal
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={confirmDelete}
            statusToDelete={statusToDelete}
            otherStatuses={otherStatuses}
          />
        </div>
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
