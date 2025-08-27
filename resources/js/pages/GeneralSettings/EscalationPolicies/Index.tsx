import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { BreadcrumbItem, EmailContact, PageProps } from '@/types';
import { EscalationPolicy } from '@/types/escalation'; // Crearemos esta definición de tipo
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { NewPolicyPopover } from './Components/NewPolicyPopover';
import { PolicyEditor } from './Components/PolicyEditor';
import { PolicyList } from './Components/PolicyList';

interface Props extends PageProps {
  policies: EscalationPolicy[];
  contacts: EmailContact[];
}
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'General Settings',
    href: route('settings.machine-status.index'),
  },
  {
    title: 'Escalation Policies',
    href: route('settings.escalation-policies.index'),
    isCurrent: true,
  },
];
export default function EscalationPoliciesIndex({ policies, contacts }: Props) {
  const [selectedPolicy, setSelectedPolicy] = useState<EscalationPolicy | null>(policies[0] || null);
  const [policyToDelete, setPolicyToDelete] = useState<EscalationPolicy | null>(null);

  // This hook runs whenever the 'policies' prop changes after a save.
  useEffect(() => {
    if (selectedPolicy) {
      // Find the fresh version of the selected policy from the new props
      const updatedPolicy = policies.find((p) => p.id === selectedPolicy.id);
      setSelectedPolicy(updatedPolicy || null);
    } else if (policies.length > 0) {
      // If nothing was selected, select the first policy
      setSelectedPolicy(policies[0]);
    }
  }, [policies]); // This hook depends on the 'policies' prop

   const handleToggleStatus = (policyId: number) => {
        router.patch(route('settings.escalation-policies.toggle-status', policyId), {}, {
            preserveScroll: true,
        });
    };
  // We will add the edit functionality later
  const handleEdit = (policy: EscalationPolicy) => {
    console.log('Editing policy:', policy.name);
  };

  const handleDelete = (policy: EscalationPolicy) => {
    setPolicyToDelete(policy);
  };

  const confirmDelete = () => {
    if (!policyToDelete) return;
    router.delete(route('settings.escalation-policies.destroy', policyToDelete.id), {
      onSuccess: () => {
        setPolicyToDelete(null);
        // If the deleted policy was the selected one, select the first one in the list
        if (selectedPolicy?.id === policyToDelete.id) {
          setSelectedPolicy(policies[0] || null);
        }
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <GeneralSettingsLayout>
        <Head title="Escalation Policies" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Escalation Policies</h1>
              <p className="text-muted-foreground">Define rules for escalating notifications for overdue tasks.</p>
            </div>
            <NewPolicyPopover />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: List of Policies */}
            <PolicyList
              policies={policies}
              selectedPolicy={selectedPolicy}
              onSelect={setSelectedPolicy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />

            {/* Right Column: Editor */}
            <main className="lg:col-span-2">
              {selectedPolicy ? (
                <PolicyEditor policy={selectedPolicy} contacts={contacts} />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                  <p className="text-muted-foreground">Select a policy to view or edit its levels.</p>
                </div>
              )}
            </main>
          </div>
        </div>
        <ConfirmDeleteDialog
          isOpen={!!policyToDelete}
          onOpenChange={() => setPolicyToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete Policy"
          description="Are you sure you want to delete this policy? This action cannot be undone."
        />
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
