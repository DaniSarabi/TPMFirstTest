import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Filter, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { LayoutGrid, List } from 'lucide-react';
import * as React from 'react';
import { Ticket } from './Columns';
import { TicketCard } from './TicketCard';

// Define the props for the Index page
interface IndexPageProps {
  tickets: Paginated<Ticket>;
  filters: Filter;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Tickets',
    href: route('tickets.index'),
    isCurrent: true,
  },
];

export default function Index({ tickets, filters }: IndexPageProps) {
  // State to manage the view mode (grid or list)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [search, setSearch] = React.useState(filters.search || '');
  const isInitialMount = React.useRef(true);

  // This effect will trigger a new data fetch when the user types in the search bar
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(
        route('tickets.index'),
        { search },
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

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

        {/* --- Conditional Rendering based on viewMode --- */}
        {viewMode === 'grid' ? (
          // Placeholder for the CardGrid
          <>
            <ListToolbar onSearch={setSearch} searchPlaceholder="Search by machine name...">
              {/* We will add filters for status, priority, etc. here later */}
            </ListToolbar>
            <div>
              <CardGrid items={tickets.data} renderCard={(ticket) => <TicketCard ticket={ticket} />} />{' '}
            </div>
          </>
        ) : (
          // Placeholder for the DataTable
          <div>
            <p className="py-8 text-center text-muted-foreground">Data Table View...</p>
          </div>
        )}

        <Pagination links={tickets.links} />
      </div>
    </AppLayout>
  );
}
