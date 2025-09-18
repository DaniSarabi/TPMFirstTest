import { CardGrid } from '@/components/card-grid';
import { Pagination } from '@/components/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Paginated } from '@/types';
import { Ticket } from '@/types/ticket';
import { router } from '@inertiajs/react';
import * as React from 'react';
import { TicketCard } from './TicketCard';
import { TicketHistoryFilters } from './TicketHistoryFilters';

interface TicketsTabProps {
  allTickets: Paginated<Ticket>;
  ticketFilters: any;
  ticketFilterOptions: any;
}

export function TicketsTab({ allTickets, ticketFilters, ticketFilterOptions }: TicketsTabProps) {
  const [filters, setFilters] = React.useState(ticketFilters);

  React.useEffect(() => {
    // Inicializar filtros de selección múltiple si están vacíos
    const initialFilters = { ...ticketFilters };
    if (!initialFilters.ticket_statuses) {
      initialFilters.ticket_statuses = ticketFilterOptions.statuses.map((s: any) => s.id);
    }
    if (!initialFilters.ticket_priorities) {
      initialFilters.ticket_priorities = ticketFilterOptions.priorities.map((p: any) => p.id);
    }
    if (!initialFilters.ticket_categories) {
      initialFilters.ticket_categories = ticketFilterOptions.categories;
    }
    setFilters(initialFilters);
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const query = { ...filters };
      Object.keys(query).forEach((key) => (query[key] == null || (Array.isArray(query[key]) && query[key].length === 0)) && delete query[key]);

      router.get(window.location.pathname, query, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleRangeFilterChange = (startKey: string, endKey: string, startValue: number | null, endValue: number | null) => {
    setFilters((prev: any) => ({
      ...prev,
      [startKey]: startValue,
      [endKey]: endValue,
    }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <Card className="border-1 border-border bg-background shadow-lg drop-shadow-lg">
      <CardContent>
        <TicketHistoryFilters
          filters={filters}
          options={ticketFilterOptions}
          onFilterChange={handleFilterChange}
          onRangeFilterChange={handleRangeFilterChange}
          onReset={handleResetFilters}
        />

        <CardGrid items={allTickets.data} renderCard={(ticket) => <TicketCard ticket={ticket as Ticket} />} gridCols={3} />

        <Pagination paginated={allTickets} perPageKey="ticket_per_page" />
      </CardContent>
    </Card>
  );
}
