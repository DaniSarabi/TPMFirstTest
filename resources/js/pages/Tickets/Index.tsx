import { CardGrid } from '@/components/card-grid';
import { DataTable } from '@/components/data-table';
import { DataTableViewOptions } from '@/components/data-table-view-options';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import useCan from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { LayoutGrid, List } from 'lucide-react';
import * as React from 'react';
import { getColumns, Ticket, TicketStatus } from './Columns';
import { TicketCard } from './TicketCard';
import { TicketStatusFilter } from './Components/TicketStatusFilter';

// Define the props for the Index page
interface IndexPageProps {
  tickets: Paginated<Ticket>;
  filters: Filter & { statuses?: number[] } & { view?: 'grid' | 'list' } & { sort?: string; direction?: 'asc' | 'desc' };
  ticketStatuses: TicketStatus[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Tickets',
    href: route('tickets.index'),
    isCurrent: true,
  },
];

export default function Index({ tickets, filters, ticketStatuses }: IndexPageProps) {
  // State to manage the view mode (grid or list)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>(filters.view || 'grid');
  const [search, setSearch] = React.useState(filters.search || '');
  const [statusFilter, setStatusFilter] = React.useState<Set<number>>(new Set(filters.statuses || []));
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(
    filters.sort ? { id: filters.sort, desc: filters.direction === 'desc' } : null,
  );
  const isInitialMount = React.useRef(true);

  const can = {
    create: useCan('roles.create'),
    edit: useCan('roles.edit'),
    delete: useCan('roles.delete'),
  };
  // This effect will trigger a new data fetch when the user types in the search bar
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('tickets.index'),
        { search, view: viewMode, statuses: Array.from(statusFilter) },
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, viewMode, statusFilter]);

  const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      setSort(null);
    } else {
      setSort({ id: columnId, desc: direction === 'desc' });
    }
  };
  const columns = React.useMemo(() => getColumns(can, handleSort, sort), [can, sort]);

  // Create the table instance for the DataTable and View Options
  const table = useReactTable({
    data: tickets.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Active Tickets" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Active Maintenance Tickets</h1>
            <p className="text-muted-foreground">A list of all tickets that are currently open or in progress.</p>
          </div>
          {/* --- View Toggle Buttons --- */}
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ListToolbar
          onSearch={setSearch}
          searchPlaceholder="Search by machine name..."
          viewOptionsAction={viewMode === 'list' ? <DataTableViewOptions table={table} /> : null}
        >
          <TicketStatusFilter title="Status" options={ticketStatuses} selectedValues={statusFilter} onSelectedValuesChange={setStatusFilter} />{' '}
        </ListToolbar>

        {/* --- Conditional Rendering based on viewMode --- */}
        {viewMode === 'grid' ? (
          <CardGrid items={tickets.data} renderCard={(ticket) => <TicketCard ticket={ticket} />} />
        ) : (
          <DataTable table={table} columns={columns} />
        )}

        <Pagination paginated={tickets} />
      </div>
    </AppLayout>
  );
}
