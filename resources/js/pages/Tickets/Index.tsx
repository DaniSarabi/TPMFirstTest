import { CardGrid } from '@/components/card-grid';
import { Pagination } from '@/components/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Filter, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import * as React from 'react';
import { TicketFilters } from './Components/TicketFilters';
import { TicketCard } from './TicketCard';

interface IndexPageProps {
  tickets: Paginated<any>;
  filters: Filter;
  filterOptions: any;
}

export default function Index({ tickets, filters, filterOptions }: IndexPageProps) {
  const [activeFilters, setActiveFilters] = React.useState(filters);
  const isInitialMount = React.useRef(true);

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const queryParams: Record<string, any> = { ...activeFilters };

      // Limpiamos los parámetros antes de enviarlos
      if (queryParams.start_date) queryParams.start_date = format(queryParams.start_date, 'yyyy-MM-dd');
      if (queryParams.end_date) queryParams.end_date = format(queryParams.end_date, 'yyyy-MM-dd');
      if (queryParams.include_deleted) queryParams.include_deleted = 1;

      Object.keys(queryParams).forEach((key) => {
        const value = queryParams[key];
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || value === false) {
          delete queryParams[key];
        }
      });

      router.get(route('tickets.index'), queryParams, { preserveState: true, replace: true });
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeFilters]);

  const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tickets', href: route('tickets.index'), isCurrent: true }];

  const isFiltered = Object.keys(filters).length > 1 || (filters.view && Object.keys(filters).length > 0);

  const handleResetFilters = () => {
    setActiveFilters({ view: 'open' });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Tickets" />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ticket Center</h1>
            <p className="text-muted-foreground">Manage and review all maintenance tickets.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Tabs value={activeFilters.view || 'open'} onValueChange={(value) => handleFilterChange('view', value)}>
              <TabsList className="">
                <TabsTrigger className="data-[state=active]:border-dashed data-[state=active]:border-primary" value="open">
                  Open Tickets
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:border-dashed data-[state=active]:border-primary">
                  All Tickets
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <TicketFilters
            filters={activeFilters}
            onFilterChange={handleFilterChange}
            options={filterOptions}
            isFiltered={isFiltered}
            onReset={handleResetFilters}
          />
        </div>

        <CardGrid items={tickets.data} renderCard={(ticket) => <TicketCard ticket={ticket} />} />
        <Pagination paginated={tickets} />
      </div>
    </AppLayout>
  );
}
