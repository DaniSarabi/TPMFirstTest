import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { Paginated, type BreadcrumbItem, type Filter } from '@/types';
import { Machine } from '@/types/machine';
import { Head, router } from '@inertiajs/react';
import { CirclePlus } from 'lucide-react';
import * as React from 'react';
import { CreateMachineWizard } from './Components/Modals/CreateMachineWizard';
import { MachineCard, MachineWithStats } from './Components/Machine/MachineCard';

// Define the props for the Index page
interface IndexPageProps {
  machines: Paginated<Machine>;
  filters: Filter & { statuses?: number[] };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Machines',
    href: route('machines.index'),
  },
];

export default function Index({ machines, filters }: IndexPageProps) {
  const [dialogIsOpen, setDialogIsOpen] = React.useState(false);
  const [machineToDelete, setMachineToDelete] = React.useState<number | null>(null);
  const [wizardIsOpen, setWizardIsOpen] = React.useState(false);

  // ---  Add state for both search and status filters ---
  const [search, setSearch] = React.useState(filters.search || '');
  const [statusFilter, setStatusFilter] = React.useState<Set<number>>(new Set(filters.statuses || []));

  const canCreate = useCan('machines.create');

  const isInitialMount = React.useRef(true);

  // This effect will trigger a search when the user stops typing
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Convert the Set to an array for the request
    const statuses = Array.from(statusFilter);

    const timeout = setTimeout(() => {
      router.get(
        route('machines.index'),
        { search, statuses }, // Send both filters to the backend
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 300); // 300ms delay

    // --- Add statusFilter to the dependency array ---
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);
  // Check permissions for machine actions
  const can = {
    create: useCan('machines.create'),
    edit: useCan('machines.edit'),
    delete: useCan('machines.delete'),
  };

  // This function will be passed to the wizard and called when it closes.
  function handleWizardFinish() {
    // router.reload() tells Inertia to re-fetch the props for the current page.
    router.reload({ only: ['machines'] });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Machines" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Machine Management</h1>
        </div>

        <ListToolbar
          onSearch={setSearch}
          createAction={
            canCreate ? (
              <Button onClick={() => setWizardIsOpen(true)}>
                <CirclePlus className="h-4 w-4" />
                Create Machine
              </Button>
            ) : null
          }
        >
        </ListToolbar>

        <CardGrid items={machines.data} renderCard={(machine) => <MachineCard machine={machine as MachineWithStats} />} gridCols={4} />

        <Pagination paginated={machines} />
      </div>
      {canCreate && <CreateMachineWizard isOpen={wizardIsOpen} onOpenChange={setWizardIsOpen} onFinish={handleWizardFinish} />}{' '}
    </AppLayout>
  );
}
