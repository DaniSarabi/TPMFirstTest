import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import useCan from '@/lib/useCan';
import { Paginated, type BreadcrumbItem } from '@/types';
import { Machine, Subsystem } from '@/types/machine';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Ticket } from '@/types/ticket';
import { Head, router, usePage } from '@inertiajs/react';
import React from 'react';
// ACTION: Standardized component paths assuming a lowercase 'components' directory
import { AddSubsystemWizard } from './Components/Modals/AddSubsystemWizard';
import { MachineHeader } from './Components/Machine/MachineHeader';
import { MaintenanceTab } from './Components/MaintenanceTab/MaintenanceTab';
import { ManageInspectionPointsModal } from './Components/Machine/ManageInspectionPointsModal';
import { EditMachineModal } from './Components/Modals/EditMachineModal';
import { EditSubsystemModal } from './Components/Modals/EditSubsystemModal';
import { QrCodeModal } from './Components/Modals/QrCodeModal';
import { SubsystemsTab } from './Components/SubsystemsTab';
// ACTION: Corrected the import path for the newly organized TicketsTab component
import { TicketsTab } from './Components/TicketsTab/TicketsTab';
//the props for the Show page
interface ShowPageProps {
  machine: Machine;
  uptime: {
    since: string | null;
    duration: string | null;
  };
  stats: any;
  allMaintenances: Paginated<ScheduledMaintenance>;
  maintenanceFilters: any;
  maintenanceFilterOptions: any;
  allTickets: Paginated<Ticket>;
  ticketFilters: any;
  ticketFilterOptions: any;
}

export default function Show({
  machine,
  uptime,
  stats,
  allMaintenances,
  maintenanceFilters,
  maintenanceFilterOptions,
  allTickets,
  ticketFilters,
  ticketFilterOptions,
}: ShowPageProps) {
  const [editModalIsOpen, setEditModalIsOpen] = React.useState(false);

  const [AddSubsystemWizardIsOpen, setAddSubsystemWizardIsOpen] = React.useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [subsystemToDelete, setSubsystemToDelete] = React.useState<number | null>(null);

  const [editSubsystemModalIsOpen, setEditSubsystemModalIsOpen] = React.useState(false);
  const [subsystemToEdit, setSubsystemToEdit] = React.useState<Subsystem | null>(null);

  const [managePointsModalIsOpen, setManagePointsModalIsOpen] = React.useState(false);
  const [subsystemToManage, setSubsystemToManage] = React.useState<Subsystem | null>(null);

  const [isMachineDeleteDialogOpen, setIsMachineDeleteDialogOpen] = React.useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
  const queryParams = (usePage().props.query as Record<string, string | undefined>) || {};
  const [activeTab, setActiveTab] = React.useState(queryParams.tab || 'subsystems');

  const can = {
    create: useCan('machines.create'),
    edit: useCan('machines.edit'),
    delete: useCan('machines.delete'),
  };

  const onTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.get(
      window.location.pathname,
      { ...queryParams, tab: newTab }, // It uses the safe queryParams from above, solving the error.
      {
        preserveState: true,
        replace: true,
        preserveScroll: true,
      },
    );
  };

  // Define the breadcrumbs for this page, including a link back to the index
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Machines',
      href: route('machines.index'),
    },
    {
      title: machine.name,
      href: route('machines.show', machine.id),
      isCurrent: true,
    },
  ];

  const handleDeleteSubsystem = (id: number) => {
    setSubsystemToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  const confirmSubsystemDelete = () => {
    if (!subsystemToDelete) return;
    router.delete(route('subsystems.destroy', subsystemToDelete), {
      preserveScroll: true, // Keep the user on the same page
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSubsystemToDelete(null);
      },
    });
  };

  // Function to handle opening the edit modal
  const handleEditSubsystem = (subsystem: Subsystem) => {
    setSubsystemToEdit(subsystem);
    setEditSubsystemModalIsOpen(true);
  };

  const handleManagePoints = (subsystem: Subsystem) => {
    setSubsystemToManage(subsystem);
    setManagePointsModalIsOpen(true);
  };
  const confirmMachineDelete = () => {
    // Note: This will redirect to the index page on success.
    router.delete(route('machines.destroy', machine.id));
  };

  // This function will be called to refresh the page data
  const handleFinish = () => {
    router.reload({ only: ['machine'] });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Machine: ${machine.name}`} />
      <div className="space-y-6 p-6">
        {/* --- Main Machine Details Card --- */}
        <MachineHeader
          machine={machine}
          stats={stats}
          uptime={uptime}
          onEdit={() => setEditModalIsOpen(true)}
          onDelete={() => setIsMachineDeleteDialogOpen(true)}
          onQrCode={() => setIsQrModalOpen(true)}
          can={can}
        />
        <Tabs value={activeTab} defaultValue="subsystems" onValueChange={onTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="subsystems">Subsystems</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>
          <TabsContent value="subsystems">
            <SubsystemsTab
              machine={machine}
              onDeleteSubsystem={handleDeleteSubsystem}
              onEditSubsystem={handleEditSubsystem}
              onManagePoints={handleManagePoints}
              onAddSubsystem={() => setAddSubsystemWizardIsOpen(true)}
              can={can}
            />
          </TabsContent>
          <TabsContent value="maintenance">
            <MaintenanceTab
              machineId={machine.id}
              allMaintenances={allMaintenances}
              maintenanceFilters={maintenanceFilters}
              maintenanceFilterOptions={maintenanceFilterOptions}
            />
          </TabsContent>
          <TabsContent value="tickets">
            <TicketsTab allTickets={allTickets} ticketFilters={ticketFilters} ticketFilterOptions={ticketFilterOptions} />
          </TabsContent>
        </Tabs>
      </div>
      <EditMachineModal machine={machine} isOpen={editModalIsOpen} onOpenChange={setEditModalIsOpen} />
      <AddSubsystemWizard
        machineId={machine.id}
        isOpen={AddSubsystemWizardIsOpen}
        onOpenChange={setAddSubsystemWizardIsOpen}
        onFinish={handleFinish}
      />
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmSubsystemDelete}
        title="Delete Subsystem"
        description="This will permanently delete the subsystem and all of its associated inspection points. This action cannot be undone."
      />
      {can.edit && <EditSubsystemModal subsystem={subsystemToEdit} isOpen={editSubsystemModalIsOpen} onOpenChange={setEditSubsystemModalIsOpen} />}{' '}
      <ManageInspectionPointsModal
        subsystem={subsystemToManage}
        isOpen={managePointsModalIsOpen}
        onOpenChange={setManagePointsModalIsOpen}
        can={can}
      />
      <ConfirmDeleteDialog
        isOpen={isMachineDeleteDialogOpen}
        onOpenChange={setIsMachineDeleteDialogOpen}
        onConfirm={confirmMachineDelete}
        title={`Delete Machine: ${machine.name}`}
        description="This action cannot be undone. This will permanently delete the entire machine, including all of its subsystems and inspection points."
      />
      <QrCodeModal machine={machine} isOpen={isQrModalOpen} onOpenChange={setIsQrModalOpen} />
    </AppLayout>
  );
}
