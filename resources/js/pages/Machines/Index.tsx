import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Row } from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import * as React from 'react';
import { getColumns, Machine } from './Columns'; // Import from your new columns file
import { SubsystemList } from './SubsystemList';
import { CreateMachineWizard } from './CreateMachineWizard';

// Define the props for the Index page
interface IndexPageProps {
  machines: Machine[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Machines',
    href: route('machines.index'),
  },
];

export default function Index({ machines }: IndexPageProps) {
  const [dialogIsOpen, setDialogIsOpen] = React.useState(false);
  const [machineToDelete, setMachineToDelete] = React.useState<number | null>(null);
  const [wizardIsOpen, setWizardIsOpen] = React.useState(false);

  // Check permissions for machine actions
  const can = {
    create: useCan('machines.create'),
    edit: useCan('machines.edit'),
    delete: useCan('machines.delete'),
  };

  // Handle the delete action
  function handleDelete(id: number) {
    setMachineToDelete(id);
    setDialogIsOpen(true);
  }

  function confirmDelete() {
    if (machineToDelete) {
      router.delete(route('machines.destroy', machineToDelete), {
        onFinish: () => {
          setMachineToDelete(null);
          setDialogIsOpen(false);
        },
      });
    }
  }

  // This function will be passed to the wizard and called when it closes.
    function handleWizardFinish() {
        // router.reload() tells Inertia to re-fetch the props for the current page.
        router.reload({ only: ['machines'] });
    }

  // Generate the columns array, passing permissions and the delete handler
  const columns = React.useMemo(() => getColumns(can, handleDelete), [can]);

  // Define the "Create Machine" button to pass to the toolbar
  const toolbarAction = can.create ? (
    <Button variant="default" className="" size="lg" onClick={() => setWizardIsOpen(true)}>
      <PlusCircle className="h-4 w-4" />
      Create Machine
    </Button>
  ) : null;

  // This function takes the table row and returns the SubsystemList component,
  // passing the specific machine data from that row.
  const renderSubComponent = ({ row }: { row: Row<Machine> }) => {
    return <SubsystemList machine={row.original} />;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Machines" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Machine Management</h1>
        </div>

        {/* Render the DataTable component */}
        <DataTable
          columns={columns}
          data={machines}
          filterColumnId="name"
          filterPlaceholder="Filter by machine name..."
          toolbarAction={toolbarAction}
          renderSubComponent={renderSubComponent}
          rowClassName='h-15'
        />
        <ConfirmDeleteDialog
          isOpen={dialogIsOpen}
          onOpenChange={setDialogIsOpen}
          onConfirm={confirmDelete}
          title="Delete Machine"
          description="This will permanently delete the machine and all of its associated subsystems and inspection points. This action cannot be undone."
        />

        <CreateMachineWizard 
          isOpen={wizardIsOpen} 
          onOpenChange={setWizardIsOpen}
          onFinish={handleWizardFinish}
        />
      </div>
    </AppLayout>
  );
}
