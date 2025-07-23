import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated, type User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { InspectionCard } from './InspectionCard';
import { InspectionFilters } from './InspectionFilters';

// --- Type Definitions for this page ---
interface ReportStat {
  ok_count: number;
  warning_count: number;
  critical_count: number;
}

interface Report {
  id: number;
  status: string;
  start_date: string;
  completion_date: string | null;
  badge_text: string;
  user_name: string;
  machine_name: string;
  machine_image_url: string | null;
  stats: ReportStat;
  duration: string | null;
}

interface IndexPageProps {
  reports: Paginated<Report>;
  filters: Filter & { user?: string; start_date?: string; end_date?: string };
  users: User[];
}

export default function Index({ reports, filters, users }: IndexPageProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  const [selectedUser, setSelectedUser] = React.useState<number | null>(filters.user ? Number(filters.user) : null);
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(
    filters.start_date ? { from: new Date(filters.start_date), to: filters.end_date ? new Date(filters.end_date) : undefined } : undefined,
  );

  const isInitialMount = React.useRef(true);

  const can = useCan('inspections.administration');

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      router.get(
        route('inspections.index'),
        {
          search,
          user: selectedUser,
          start_date: selectedDate?.from ? format(selectedDate.from, 'yyyy-MM-dd') : undefined,
          end_date: selectedDate?.to ? format(selectedDate.to, 'yyyy-MM-dd') : undefined,
        },
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, selectedUser, selectedDate]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Inspections',
      href: route('inspections.index'),
      isCurrent: true,
    },
  ];
  const isFiltered = !!search || !!selectedUser || !!selectedDate;

  const handleResetFilters = () => {
    setSearch('');
    setSelectedUser(null);
    setSelectedDate(undefined);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inspection History" />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inspection History</h1>
            <p className="text-muted-foreground">Review previously completed inspection reports.</p>
          </div>
        </div>

        <div className="flex justify-between">
          <ListToolbar onSearch={setSearch} searchPlaceholder="Search by machine name...">
            <InspectionFilters
              showUserFilter={can}
              users={users}
              selectedUser={selectedUser}
              onUserChange={setSelectedUser}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              isFiltered={isFiltered}
              onReset={handleResetFilters}
            />
          </ListToolbar>
        </div>

        <CardGrid items={reports.data} renderCard={(report) => <InspectionCard report={report} />} />

        <Pagination paginated={reports} />
      </div>
    </AppLayout>
  );
}
