import { DataTable } from '@/components/data-table';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { useCan } from '@/lib/useCan';
import { Filter, Paginated, type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { ReassignAndDeleteStatusModal } from '../ReassingAndDeleteModal';
import { getColumns, MachineStatus } from './Columns';
import { StatusFormModal } from './MachineStatusFormModal';

// Define the props for the page
interface IndexPageProps {
  statuses: Paginated<MachineStatus>;
  filters: Filter & { sort?: string; direction?: 'asc' | 'desc' };
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

export default function Index({ statuses, filters }: IndexPageProps) {
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [statusToEdit, setStatusToEdit] = React.useState<Partial<MachineStatus> | null>(null);
  const [statusToDelete, setStatusToDelete] = React.useState<MachineStatus | null>(null);

  const [search, setSearch] = React.useState(filters.search || '');
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
    filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null,
  );

  const isInitialMount = React.useRef(true);

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

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('settings.machine-status.index'),
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
  
  // --- handlers to reset the form state ---
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
        <Head title="Machine Statuses" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Machine Statuses</h1>
              <p className="text-muted-foreground">Manage the statuses that can be assigned to machines.</p>
            </div>
          </div>

          <ListToolbar
            onSearch={setSearch}
            searchPlaceholder="Filter by status name..."
            createAction={
              can.create ? (
                <Button onClick={handleCreate}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Status
                </Button>
              ) : null
            }
            viewOptionsAction={<DataTableViewOptions table={table} />}
          />

          <DataTable table={table} columns={columns} />

          <Pagination paginated={statuses} />
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
