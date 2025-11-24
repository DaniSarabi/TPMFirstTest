import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { Head, Link, router } from '@inertiajs/react';
import { AtSign, Bell, Check, ChevronLeft, LoaderCircle, Lock, Mail, Send, Settings2, Unlock } from 'lucide-react';
import * as React from 'react';
// ¡Importamos los componentes que ya creamos para la página del usuario!
import HeadingSmall from '@/components/heading-small';
import { ExceptionModal } from '../Components/ExceptionModal';
import { Channel, GroupedNotification, NotificationPreference } from '../notifications';

interface EditUserNotificationsProps extends PageProps {
  userToManage: { id: number; name: string };
  allMachines: Machine[];
  allNotificationTypes: Record<string, Record<string, string>>;
  userPreferences: NotificationPreference[];
  lockedPreferences: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: route('profile.edit') },
  { title: 'Notifications', href: route('settings.notifications.edit') },
  { title: 'Manage Users', href: route('admin.notifications.manage.index') },
  { title: 'Edit User', href: '#', isCurrent: true },
];

const machineEventCategories = ['Tickets', 'Inspections', 'Maintenance','AI & Coaching'];
const systemEventCategories = ['System'];

export default function EditUserNotifications({
  userToManage,
  allMachines,
  allNotificationTypes,
  userPreferences,
  lockedPreferences,
}: EditUserNotificationsProps) {
  // ¡FIX! Usamos useState + router.patch para evitar los errores de TS
  const [preferences, setPreferences] = React.useState(userPreferences);
  const [lockedPrefs, setLockedPrefs] = React.useState(new Set(lockedPreferences));
  const [processing, setProcessing] = React.useState(false);
  const [lastSave, setLastSave] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = React.useState(false); // ¡Este faltaba!

  const [isExceptionModalOpen, setIsExceptionModalOpen] = React.useState(false);
  const [modalContext, setModalContext] = React.useState<{ eventKey: string; channel: Channel } | null>(null);

  // "El Cerebro" (agrupador de notificaciones) - Sin cambios
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
  const isLocked = (type: string) => lockedPrefs.has(type);
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

  // --- ¡Tu "Joya de la Corona"! (El Handler del Candado) ---
  const handleLockToggle = (group: GroupedNotification, channel: Channel) => {
    const type = `${group.eventKey}.${channel}`;
    setLockedPrefs((currentLocked) => {
      const next = new Set(currentLocked);
      if (next.has(type)) {
        next.delete(type); // Desbloquear
      } else {
        next.add(type); // Bloquear
      }
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setLastSave(false);

    router.patch(
      route('admin.notifications.manage.update', userToManage.id),
      {
        preferences: preferences,
        lockedPreferences: Array.from(lockedPrefs), // Convertimos el Set a un Array
      },
      {
        preserveScroll: true,
        onSuccess: () => setLastSave(true),
        onFinish: () => setProcessing(false),
      },
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Manage: ${userToManage.name}`} />
      <SettingsLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall
              title={`Manage Preferences for: ${userToManage.name}`}
              description="Override and lock notification settings for this user."
            />
            <Button asChild variant="outline" size="sm">
              <Link href={route('admin.notifications.manage.index')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to User List
              </Link>
            </Button>
          </div>

          <form onSubmit={submit}>
            <div className="space-y-8">
              <Card className="border-0 drop-shadow-lg">
                <CardHeader>
                  <CardTitle>Event Notifications</CardTitle>
                  <CardDescription>Manage notifications for Tickets, Inspections, and Maintenance.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Pestaña 1: Reglas Globales (Con Candados) */}
                  <div className="space-y-6">
                    {machineEventCategories.map((category) => (
                      <div key={category}>
                        <h4 className="mb-2 text-lg font-semibold">{category}</h4>
                        <div className="space-y-4">
                          {groupedNotifications[category]?.map((group) => (
                            <AdminNotificationRow // <-- ¡El componente con candados!
                              key={group.eventKey}
                              group={group}
                              isLocked={isLocked}
                              isGlobalOn={isGlobalOn}
                              getMachineExceptions={getMachineExceptions}
                              onMasterSwitchChange={handleMasterSwitchChange}
                              onManageExceptions={(channel) => {
                                setModalContext({ eventKey: group.eventKey, channel });
                                setIsExceptionModalOpen(true);
                              }}
                              onLockToggle={handleLockToggle}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ... (Tarjeta de System Notifications, también con <AdminNotificationRow>) ... */}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={processing || isLoadingPrefs}>
                {processing ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : lastSave ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {processing ? 'Saving...' : lastSave ? 'Saved!' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </div>
      </SettingsLayout>

      {/* El Modal (es el mismo que el del usuario) */}
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

// ============================================================================
// --- Helper: AdminNotificationRow (¡NUEVO, CON CANDADOS!) ---
// ============================================================================
interface AdminNotificationRowProps {
  group: GroupedNotification;
  isLocked: (type: string) => boolean;
  isGlobalOn: (eventKey: string, channel: Channel) => boolean;
  getMachineExceptions: (eventKey: string, channel: Channel) => Set<number>;
  onMasterSwitchChange: (eventKey: string, channel: Channel, checked: boolean) => void;
  onManageExceptions: (channel: Channel) => void;
  onLockToggle: (group: GroupedNotification, channel: Channel) => void;
}

const AdminNotificationRow = ({
  group,
  isLocked,
  isGlobalOn,
  getMachineExceptions,
  onMasterSwitchChange,
  onManageExceptions,
  onLockToggle,
}: AdminNotificationRowProps) => {
  const renderChannel = (channel: Channel, icon: React.ElementType) => {
    const type = `${group.eventKey}.${channel}`;
    const locked = isLocked(type);
    const globalOn = isGlobalOn(group.eventKey, channel);
    const exceptions = getMachineExceptions(group.eventKey, channel);
    const isChecked = globalOn || exceptions.size > 0;
    const statusText = () => {
      if (globalOn) return <span>Global ON</span>;
      if (exceptions.size > 0) return <span className="text-primary">{exceptions.size} Machine(s) ON</span>;
      return <span>Global OFF</span>;
    };

    return (
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center space-x-2">
          {/* --- ¡EL CANDADO! --- */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={locked ? 'destructive' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onLockToggle(group, channel)}
                >
                  {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{locked ? 'Unlock (Allow user to edit)' : 'Lock (Prevent user from editing)'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Switch
            id={type}
            checked={isChecked}
            onCheckedChange={(checked) => onMasterSwitchChange(group.eventKey, channel, checked)}
            disabled={locked}
          />
          <Label htmlFor={type} className={cn('flex items-center gap-1.5 text-sm', locked ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
            {React.createElement(icon, { className: 'h-4 w-4' })}
            {channel.charAt(0).toUpperCase() + channel.slice(1)}
          </Label>
        </div>

        <Button type="button" variant="ghost" size="sm" className="text-xs" disabled={locked} onClick={() => onManageExceptions(channel)}>
          <Settings2 className="mr-2 h-3 w-3" />
          {statusText()}
        </Button>
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-background p-4 shadow-md drop-shadow-sm">
      <Label className="text-base font-semibold">{group.description.replace(/^In-App:\s*/i, '')}</Label>{' '}
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {group.channels.in_app && renderChannel('in_app', Bell)}
        {group.channels.email && renderChannel('email', Mail)}
        {group.channels.teams && renderChannel('teams', AtSign)}
      </div>
    </div>
  );
};
