import { DataTable } from '@/components/data-table';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated} from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { BehaviorsInfoModal } from '../BehaviorsInfoModal';
import { getColumns } from './Columns';
import { ReassignAndDeleteStatusModal } from './ReassindAndDeleteTicketsStatusModal';
import { TicketStatusFormModal } from './TicketStatusFormModal';
import { TicketStatus } from '@/types/ticket';
import { Behavior } from '@/types/settings';
import { Tag } from '@/types/machine';


// Define the props for the page
interface IndexPageProps {
  statuses: Paginated<TicketStatus>;
  behaviors: Behavior[];
  tags: Tag[];
  filters: Filter & { sort?: string; direction?: 'asc' | 'desc' };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'General Settings',
    href: route('settings.machine-status.index'),
  },
  {
    title: 'Ticket Statuses',
    href: route('settings.ticket-status.index'),
    isCurrent: true,
  },
];

export default function Index({ statuses, tags, behaviors, filters }: IndexPageProps) {
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [statusToEdit, setStatusToEdit] = React.useState<Partial<TicketStatus> | null>(null);
  const [statusToDelete, setStatusToDelete] = React.useState<TicketStatus | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);

  const [search, setSearch] = React.useState(filters.search || '');
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
    filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null,
  );

  const isInitialMount = React.useRef(true);

  const form = useForm({
    name: '',
    bg_color: '#dcfce7',
    text_color: '#166534',
    is_protected: false as boolean,
    behaviors: [] as { id: number; tag_id: number | null; ruleId: string }[],
  });

  const can = {
    create: useCan('tickets.status'),
    edit: useCan('tickets.status'),
    delete: useCan('tickets.status'),
  };

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('settings.ticket-status.index'),
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

  const handleCreate = () => {
    form.reset();
    setStatusToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (status: TicketStatus) => {
    // --- ACTION: Correctly map the behaviors, adding a temporary UUID for the UI ---
    form.setData({
      name: status.name,
      bg_color: status.bg_color,
      text_color: status.text_color,
      is_protected: status.is_protected,
      behaviors: status.behaviors.map((b: Behavior) => ({
        id: b.id,
        tag_id: b.pivot?.tag_id || null,
        ruleId: crypto.randomUUID(), // Add temporary ID for form state management
      })),
    });
    setStatusToEdit(status);
    setIsFormModalOpen(true);
  };

  const handleDelete = (status: TicketStatus) => {
    setStatusToDelete(status);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = (newStatusId: number) => {
    if (!statusToDelete) return;
    router.delete(route('settings.ticket-status.destroy', statusToDelete.id), {
      data: { new_status_id: newStatusId },
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const onSuccess = () => setIsFormModalOpen(false);
    if (statusToEdit && 'id' in statusToEdit) {
      form.put(route('settings.ticket-status.update', statusToEdit.id!), { onSuccess });
    } else {
      form.post(route('settings.ticket-status.store'), { onSuccess });
    }
  };

  const columns = React.useMemo(() => getColumns(handleEdit, handleDelete, handleSort, sort, tags), [sort, tags]);

  const table = useReactTable({
    data: statuses.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const otherStatuses = statusToDelete ? statuses.data.filter((s) => s.id !== statusToDelete.id) : [];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <GeneralSettingsLayout>
        <Head title="Ticket Statuses" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ticket Statuses</h1>
              <p className="text-muted-foreground">Manage the statuses that can be assigned to tickets.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Learn more about{' '}
                <button onClick={() => setIsInfoModalOpen(true)} className="text-primary italic hover:underline">
                  behaviors
                </button>
                .
              </p>
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
        <TicketStatusFormModal
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          onSubmit={handleSubmit}
          status={statusToEdit}
          tags={tags}
          behaviors={behaviors}
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
        <BehaviorsInfoModal isOpen={isInfoModalOpen} onOpenChange={setIsInfoModalOpen} behaviors={behaviors} />
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
