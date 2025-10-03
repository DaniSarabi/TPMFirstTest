import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { Paginated, type BreadcrumbItem, type Filter } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CirclePlus } from 'lucide-react';
import * as React from 'react';
import { MachineCard } from './Components/Machine/MachineCard';
import { MachineFilters } from './Components/MachinesFilters'; // Se importa el nuevo componente
import { CreateMachineWizard } from './Components/Modals/CreateMachineWizard';

interface IndexPageProps {
  machines: Paginated<any>;
  filters: Filter;
  filterOptions: any;
}

export default function Index({ machines, filters, filterOptions }: IndexPageProps) {
  const [wizardIsOpen, setWizardIsOpen] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState(filters);
  const isInitialMount = React.useRef(true);
  const canCreate = useCan('machines.create');

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
      if (queryParams.include_deleted) queryParams.include_deleted = 1;
      Object.keys(queryParams).forEach((key) => {
        const value = queryParams[key];
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || value === false) {
          delete queryParams[key];
        }
      });
      router.get(route('machines.index'), queryParams, { preserveState: true, replace: true });
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeFilters]);

  const breadcrumbs: BreadcrumbItem[] = [{ title: 'Machines', href: route('machines.index') }];

  const handleResetFilters = () => {
    setActiveFilters({});
  };

  const handleWizardFinish = () => {
    router.reload({ only: ['machines'] });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Machines" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Machine Management</h1>
        </div>
        <ListToolbar
          onSearch={(value) => handleFilterChange('search', value)}
          searchPlaceholder="Search by machine name..."
          createAction={
            canCreate ? (
              <Button onClick={() => setWizardIsOpen(true)}>
                <CirclePlus className="mr-2 h-4 w-4" />
                Create Machine
              </Button>
            ) : null
          }
        >
          <MachineFilters filters={activeFilters} onFilterChange={handleFilterChange} options={filterOptions} onReset={handleResetFilters} />
        </ListToolbar>
        <CardGrid items={machines.data} renderCard={(machine) => <MachineCard machine={machine} />} />
        <Pagination paginated={machines} />
      </div>
      {canCreate && <CreateMachineWizard isOpen={wizardIsOpen} onOpenChange={setWizardIsOpen} onFinish={handleWizardFinish} />}
    </AppLayout>
  );
}
