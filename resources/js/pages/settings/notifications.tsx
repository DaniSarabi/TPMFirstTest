import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import useCan from '@/lib/useCan';
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { Head, Link, router } from '@inertiajs/react';
import { Check, LoaderCircle, Send, Users } from 'lucide-react';
import * as React from 'react';
import { ExceptionModal } from './Components/ExceptionModal';
import { NotificationCategoryCard } from './Components/NotificationCategoryCard';

export interface NotificationPreference {
  notification_type: string;
  preferable_id: number | null;
  preferable_type: string | null;
}

interface NotificationsPageProps extends PageProps {
  allMachines: Machine[];
  allNotificationTypes: Record<string, Record<string, string>>;
  userPreferences: NotificationPreference[];
  lockedPreferences: string[]; // ¡La lista de "candados"!
}

export type Channel = 'in_app' | 'email' | 'teams';
export interface GroupedNotification {
  eventKey: string;
  description: string;
  channels: Partial<Record<Channel, string>>;
}
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: route('profile.edit') },
  { title: 'Notifications', href: route('settings.notifications.edit'), isCurrent: true },
];

const machineEventCategories = ['Tickets', 'Inspections', 'Maintenance'];

// ============================================================================
// --- Componente Principal (Refactorizado) ---
// ============================================================================
export default function Notifications({ allMachines, allNotificationTypes, userPreferences, lockedPreferences }: NotificationsPageProps) {
  const [preferences, setPreferences] = React.useState<NotificationPreference[]>(userPreferences);
  const [processing, setProcessing] = React.useState(false);
  // Comparamos el estado actual con el original para saber si hay cambios
  const [isDirty, setIsDirty] = React.useState(false);

  const canAdmin = useCan('notifications.admin');
  const [isExceptionModalOpen, setIsExceptionModalOpen] = React.useState(false);
  const [modalContext, setModalContext] = React.useState<{ eventKey: string; channel: Channel } | null>(null);

  // "El Cerebro": Agrupa las notificaciones por categoría y evento
  const groupedNotifications = React.useMemo(() => {
    const grouped: Record<string, GroupedNotification[]> = {};
    Object.entries(allNotificationTypes).forEach(([category, types]) => {
      if (category === 'System') return; // El usuario normal no ve 'System'

      const categoryGroups: Record<string, GroupedNotification> = {};
      Object.entries(types).forEach(([type, description]) => {
        const parts = type.split('.');
        const channel = parts.pop() as Channel;
        const eventKey = parts.join('.');
        const baseDescription = description.split(':').pop()?.trim() || 'Notification Event';
        if (!categoryGroups[eventKey]) {
          categoryGroups[eventKey] = { eventKey, description, channels: {} };
        }
        categoryGroups[eventKey].channels[channel] = description;
      });
      grouped[category] = Object.values(categoryGroups);
    });
    return grouped;
  }, [allNotificationTypes]);

  // --- Lógica de Estado (El "Cerebro" del Frontend) ---

  const isLocked = (type: string) => lockedPreferences.includes(type);

  const isGlobalOn = (eventKey: string, channel: Channel) => {
    const type = `${eventKey}.${channel}`;
    return preferences.some((p) => p.notification_type === type && p.preferable_id === null);
  };

  const getMachineExceptions = (eventKey: string, channel: Channel): Set<number> => {
    const type = `${eventKey}.${channel}`;
    const machineIds = preferences.filter((p) => p.notification_type === type && p.preferable_id !== null).map((p) => p.preferable_id as number);
    return new Set(machineIds);
  };

  const handleMasterSwitchChange = (eventKey: string, channel: Channel, checked: boolean) => {
    const type = `${eventKey}.${channel}`;

    setPreferences((currentPrefs) => {
      const otherPrefs = currentPrefs.filter((p) => p.notification_type !== type);
      if (checked) {
        return [
          ...otherPrefs,
          {
            notification_type: type,
            preferable_id: null,
            preferable_type: null,
          },
        ];
      } else {
        return otherPrefs;
      }
    });
    setIsDirty(true);
  };

  const handleExceptionSave = (eventKey: string, channel: Channel, selectedMachineIds: Set<number>) => {
    const type = `${eventKey}.${channel}`;

    setPreferences((currentPrefs) => {
      const otherPrefs = currentPrefs.filter((p) => p.notification_type !== type);

      if (selectedMachineIds.size === allMachines.length) {
        // "Colapsar" a Global ON
        return [
          ...otherPrefs,
          {
            notification_type: type,
            preferable_id: null,
            preferable_type: null,
          },
        ];
      } else {
        // "Expandir" a N filas
        const newMachinePrefs = Array.from(selectedMachineIds).map((machineId) => ({
          notification_type: type,
          preferable_id: machineId,
          preferable_type: 'Machine',
        }));
        return [...otherPrefs, ...newMachinePrefs];
      }
    });
    setIsExceptionModalOpen(false);
    setIsDirty(true); // ¡Marcamos que hay cambios!
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    router.patch(
      route('settings.notifications.update'),
      {
        preferences: preferences, // Mandamos el array de estado
      },
      {
        preserveScroll: true,
        onSuccess: () => setIsDirty(false), // Marcamos como "guardado"
        onFinish: () => setProcessing(false),
      },
    );
  };
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notification Settings" />
      <SettingsLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall title="My Notification Preferences" description="Choose which events you want to be notified about." />
            {canAdmin && (
              <Button asChild variant="outline">
                <Link href={route('admin.notifications.manage.index')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage All Users
                </Link>
              </Button>
            )}
          </div>

          <form onSubmit={submit}>
            <div className="space-y-8">
              {machineEventCategories.map((category) => (
                <NotificationCategoryCard
                  key={category}
                  categoryName={category}
                  events={groupedNotifications[category] || []}
                  isLocked={isLocked}
                  isGlobalOn={isGlobalOn}
                  getMachineExceptions={getMachineExceptions}
                  onMasterSwitchChange={handleMasterSwitchChange}
                  onManageExceptions={(eventKey, channel) => {
                    setModalContext({ eventKey, channel });
                    setIsExceptionModalOpen(true);
                  }}
                />
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={processing || !isDirty}>
                {processing ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : isDirty ? (
                  <Send className="mr-2 h-4 w-4" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {processing ? 'Saving...' : isDirty ? 'Save Preferences' : 'Saved'}
              </Button>
            </div>
          </form>
        </div>
      </SettingsLayout>

      <ExceptionModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        context={modalContext}
        allMachines={allMachines}
        isGlobalOn={isGlobalOn}
        getMachineExceptions={getMachineExceptions}
        onSave={handleExceptionSave}
        allNotificationTypes={allNotificationTypes}
      />
    </AppLayout>
  );
}
