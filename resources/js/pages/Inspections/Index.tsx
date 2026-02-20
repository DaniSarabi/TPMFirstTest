import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { Pagination } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem, type Filter, type Paginated, type User } from '@/types';
import { Machine } from '@/types/machine';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { Role } from '../Roles/Columns';
import { InspectionCard } from './InspectionCard';
import { InspectionFilters } from './InspectionFilters';
// --- Type Definitions for this page ---
import { Button } from '@/components/ui/button';
import { Report } from '@/types/report';
import { FileDown } from 'lucide-react';
import { ExportTrendModal } from './Components/ExportTrendModal';

interface IndexPageProps {
  reports: Paginated<Report>;
  filters: Filter & { machines?: number[]; user?: string; start_date?: string; end_date?: string; include_deleted?: boolean; role?: string };
  users: User[];
  roles: Role[];
  allMachines: Machine[];
}

export default function Index({ reports, filters, users, roles, allMachines }: IndexPageProps) {
  // --- State Management for Filters ---
  const [selectedMachines, setSelectedMachines] = React.useState<Set<number | string>>(new Set(filters.machines || []));
  const [search, setSearch] = React.useState(filters.search || '');
  const [selectedUser, setSelectedUser] = React.useState<number | null>(filters.user ? Number(filters.user) : null);
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(
    filters.start_date ? { from: new Date(filters.start_date), to: filters.end_date ? new Date(filters.end_date) : undefined } : undefined,
  );
  const [includeDeleted, setIncludeDeleted] = React.useState(filters.include_deleted || false);
  const [selectedRole, setSelectedRole] = React.useState<string | null>(filters.role || null);

  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);

  const isInitialMount = React.useRef(true);
  const can = useCan('inspections.administration');

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const queryParams: Record<string, any> = {
        machines: Array.from(selectedMachines),
        user: selectedUser,
        start_date: selectedDate?.from ? format(selectedDate.from, 'yyyy-MM-dd') : undefined,
        end_date: selectedDate?.to ? format(selectedDate.to, 'yyyy-MM-dd') : undefined,
        include_deleted: includeDeleted ? 1 : 0,
        role: selectedRole,
      };

      Object.keys(queryParams).forEach((key) => {
        const value = queryParams[key];
        if (value === null || value === undefined || value === '') {
          delete queryParams[key];
        }
      });
      // ACTION: La condición ahora maneja correctamente el 0.
      // Si include_deleted es 0 (falso), no es necesario enviarlo.
      if (!queryParams.include_deleted) {
        delete queryParams.include_deleted;
      }

      router.get(route('inspections.index'), queryParams, {
        preserveState: true,
        replace: true,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [selectedMachines, selectedUser, selectedDate, includeDeleted, selectedRole]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Inspections',
      href: route('inspections.index'),
      isCurrent: true,
    },
  ];

  const isFiltered = selectedMachines.size > 0 || !!selectedUser || !!selectedDate || includeDeleted || !!selectedRole;

  const handleResetFilters = () => {
    setSelectedMachines(new Set());
    setSelectedUser(null);
    setSelectedDate(undefined);
    setIncludeDeleted(false);
    setSelectedRole(null);
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
          <ListToolbar>
            <MultiSelectFilter
              title="Machines"
              options={allMachines}
              selectedValues={selectedMachines}
              onSelectedValuesChange={setSelectedMachines}
            />
            <InspectionFilters
              showUserFilter={can}
              users={users}
              roles={roles}
              selectedUser={selectedUser}
              onUserChange={setSelectedUser}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              isFiltered={isFiltered}
              onReset={handleResetFilters}
              includeDeleted={includeDeleted}
              onIncludeDeletedChange={setIncludeDeleted}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
            />
          </ListToolbar>
          <Button variant="outline" onClick={() => setIsExportModalOpen(true)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export Trend Report
          </Button>{' '}
        </div>

        <CardGrid items={reports.data} renderCard={(report) => <InspectionCard report={report} />} />

        <Pagination paginated={reports} />
      </div>
      <ExportTrendModal isOpen={isExportModalOpen} onOpenChange={setIsExportModalOpen} machines={allMachines} />
    </AppLayout>
  );
}
