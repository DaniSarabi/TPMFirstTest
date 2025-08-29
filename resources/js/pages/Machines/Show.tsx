import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import useCan from '@/lib/useCan';
import { type BreadcrumbItem } from '@/types';
import { Machine, MachineStatus, Subsystem } from '@/types/machine';
import { Head, router } from '@inertiajs/react';
import React from 'react';
import { AddSubsystemWizard } from './AddSubsystemWizard';
import { MachineHeader } from './Components/MachineHeader';
import { MaintenanceTab } from './Components/MaintenanceTab';
import { QrCodeModal } from './Components/QrCodeModal';
import { SubsystemsTab } from './Components/SubsystemsTab';
import { EditMachineModal } from './EditMachineModal';
import { EditSubsystemModal } from './EditSubsystemModal';
import { ManageInspectionPointsModal } from './ManageInspectionPointsModal';

// Define the props for the Show page
interface ShowPageProps {
  machine: Machine;
  statuses: MachineStatus[];
  uptime: {
    since: string | null;
    duration: string | null;
  };
  stats: any;
}

export default function Show({ machine, statuses, uptime, stats }: ShowPageProps) {
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

  const can = {
    create: useCan('machines.create'),
    edit: useCan('machines.edit'),
    delete: useCan('machines.delete'),
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
        <Tabs defaultValue="subsystems" className="w-full">
          <TabsList>
            <TabsTrigger value="subsystems">Subsystems</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
            <MaintenanceTab maintenances={machine.all_maintenances} machineId={machine.id}/>
          </TabsContent>
          <TabsContent value='reports'>
            <div>
              <span>
                Reports tab
              </span>
            </div>
            {/* <ReportsTab /> */}
          </TabsContent>
        </Tabs>
      </div>
      <EditMachineModal machine={machine} statuses={statuses} isOpen={editModalIsOpen} onOpenChange={setEditModalIsOpen} />
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
