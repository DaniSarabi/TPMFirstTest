import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import * as React from 'react';
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
  completion_date: string | null;
  duration: string | null;
  user_name: string;
  machine_name: string;
  machine_image_url: string | null;
  stats: ReportStat;
}

interface IndexPageProps {
  reports: Paginated<Report>;
  filters: Filter;
}

export default function Index({ reports, filters }: IndexPageProps) {
  const [search, setSearch] = React.useState(filters.search || '');
  // We will add state here for the date and user filters later

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
        { search }, // We will add other filters here later
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Inspections',
      href: route('inspections.index'),
      isCurrent: true,
    },
  ];

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

        <div className='justify-between flex'>
          <ListToolbar  onSearch={setSearch} searchPlaceholder="Search by machine name...">
            {/* The filters component is now rendered inside the toolbar */}
            {/* We only show the user filter if the user is an administrator */}
            <InspectionFilters showUserFilter={can} />
          </ListToolbar>
        </div>

        <CardGrid items={reports.data} renderCard={(report) => <InspectionCard report={report} />} />

        <Pagination links={reports.links} />
      </div>
    </AppLayout>
  );
}
