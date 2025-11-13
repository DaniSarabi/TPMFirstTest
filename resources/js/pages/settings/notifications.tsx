import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import useCan from '@/lib/useCan';
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { Head, Link, useForm } from '@inertiajs/react';
import { AtSign, Bell, Mail, Send, Users } from 'lucide-react';
import * as React from 'react';

// ============================================================================
// --- Type Definitions (Nuevas) ---
// ============================================================================

interface NotificationPreference {
  id: number;
  notification_type: string;
  preferable_id: number | null;
  preferable_type: string | null;
}

interface NotificationsPageProps extends PageProps {
  allMachines: Machine[];
  allNotificationTypes: Record<string, Record<string, string>>;
  userPreferences: NotificationPreference[];
}

type Channel = 'in_app' | 'email' | 'teams';
interface GroupedNotification {
  eventKey: string; // ej. "ticket.created"
  description: string; // ej. "Cuando se crea un nuevo ticket"
  channels: Partial<Record<Channel, string>>; // ej. { in_app: "In-App: ...", email: "Email: ..." }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: '/settings/profile' },
  { title: 'Notifications', href: '/settings/notifications', isCurrent: true },
];

// ============================================================================
// --- Helper: NotificationGroup Component (Nuevo) ---
// ============================================================================

// Un sub-componente para renderizar un grupo de switches (In-App, Email, Teams)
const NotificationGroup = ({
  group,
  isMachine,
  machineId,
  isGlobalChecked,
  isMachineChecked,
  handleGlobalChange,
  handleMachineChange,
}: {
  group: GroupedNotification;
  isMachine?: boolean;
  machineId?: number;
  isGlobalChecked: (type: string) => boolean;
  isMachineChecked: (type: string, id: number) => boolean;
  handleGlobalChange: (type: string, checked: boolean) => void;
  handleMachineChange: (type: string, id: number, checked: boolean) => void;
}) => {
  const { eventKey, description, channels } = group;

  const handleChange = (channel: Channel, checked: boolean) => {
    const type = `${eventKey}.${channel}`;
    if (isMachine && machineId) {
      handleMachineChange(type, machineId, checked);
    } else {
      handleGlobalChange(type, checked);
    }
  };

  const isChecked = (channel: Channel) => {
    const type = `${eventKey}.${channel}`;
    return isMachine && machineId ? isMachineChecked(type, machineId) : isGlobalChecked(type);
  };

  return (
    <div className="flex flex-col justify-between rounded-lg bg-background p-4 shadow-lg drop-shadow-sm hover:bg-accent">
      <Label className="text-base font-semibold">{description}</Label>
      <div className="mt-3 flex items-center space-x-6 pl-1">
        {channels.in_app && (
          <div className="flex items-center space-x-2">
            <Switch id={`${eventKey}-in_app`} checked={isChecked('in_app')} onCheckedChange={(checked) => handleChange('in_app', checked)} />
            <Label htmlFor={`${eventKey}-in_app`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bell className="h-4 w-4" />
              In-App
            </Label>
          </div>
        )}
        {channels.email && (
          <div className="flex items-center space-x-2">
            <Switch id={`${eventKey}-email`} checked={isChecked('email')} onCheckedChange={(checked) => handleChange('email', checked)} />
            <Label htmlFor={`${eventKey}-email`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </Label>
          </div>
        )}
        {channels.teams && (
          <div className="flex items-center space-x-2">
            <Switch id={`${eventKey}-teams`} checked={isChecked('teams')} onCheckedChange={(checked) => handleChange('teams', checked)} />
            <Label htmlFor={`${eventKey}-teams`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AtSign className="h-4 w-4" />
              Teams
            </Label>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// --- Componente Principal (Refactorizado) ---
// ============================================================================

export default function Notifications({ allMachines, allNotificationTypes, userPreferences }: NotificationsPageProps) {
  const { data, setData, patch, processing } = useForm({
    preferences: userPreferences.map((p) => ({
      notification_type: p.notification_type,
      preferable_id: p.preferable_id,
      preferable_type: p.preferable_type ? p.preferable_type.split('\\').pop() : null,
    })),
  });

  const canAdmin = useCan('notifications.admin');

  const [selectedMachineId, setSelectedMachineId] = React.useState<string>(allMachines[0]?.id.toString() || '');

  // Transforma la lista de config/notifications.php en una estructura agrupada para la UI
  const groupedNotifications = React.useMemo(() => {
    const grouped: Record<string, GroupedNotification[]> = {};

    Object.entries(allNotificationTypes).forEach(([category, types]) => {
      const categoryGroups: Record<string, GroupedNotification> = {};

      Object.entries(types).forEach(([type, description]) => {
        // ej. 'ticket.created.in_app'
        const parts = type.split('.');
        const channel = parts.pop() as Channel; // 'in_app'
        const eventKey = parts.join('.'); // 'ticket.created'

        // Saca una descripción limpia (ej. "Cuando se crea un nuevo ticket")
        const baseDescription = description.split(':').pop()?.trim() || 'Notification Event';

        if (!categoryGroups[eventKey]) {
          categoryGroups[eventKey] = {
            eventKey: eventKey,
            description: baseDescription,
            channels: {},
          };
        }
        categoryGroups[eventKey].channels[channel] = description;
      });
      grouped[category] = Object.values(categoryGroups);
    });
    return grouped;
  }, [allNotificationTypes]);

  // --- Los handlers de change/check siguen funcionando, solo usan las nuevas keys (ej. 'ticket.created.email') ---
  const handleGlobalPreferenceChange = (type: string, checked: boolean) => {
    let currentPrefs = data.preferences;
    if (checked) {
      currentPrefs.push({ notification_type: type, preferable_id: null, preferable_type: null });
    } else {
      currentPrefs = currentPrefs.filter((p) => !(p.notification_type === type && p.preferable_id === null));
    }
    setData('preferences', currentPrefs);
  };

  const handleMachinePreferenceChange = (type: string, machineId: number, checked: boolean) => {
    let currentPrefs = data.preferences;
    if (checked) {
      currentPrefs.push({ notification_type: type, preferable_id: machineId, preferable_type: 'Machine' });
    } else {
      currentPrefs = currentPrefs.filter((p) => !(p.notification_type === type && p.preferable_id === machineId));
    }
    setData('preferences', currentPrefs);
  };

  const isGlobalChecked = (type: string) => {
    return data.preferences.some((p) => p.notification_type === type && p.preferable_id === null);
  };

  const isMachineChecked = (type: string, machineId: number) => {
    return data.preferences.some((p) => p.notification_type === type && p.preferable_id === machineId);
  };
  // --- Fin de los handlers ---

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('settings.notifications.update'));
  };

  const machineEventCategories = ['Tickets', 'Inspections', 'Maintenance'];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notification Settings" />
      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="In-App & Email Notifications" description="Choose which events you want to be notified about." />
          {canAdmin && (
            <Button asChild variant="outline">
              <Link href={route('admin.notifications.settings.notifications.manage')}>
                <Users className="mr-2 h-4 w-4" />
                Manage All Users
              </Link>
            </Button>
          )}
          <form onSubmit={submit}>
            <div className="space-y-8">
              {/* --- Global Notifications Card (Actualizada) --- */}
              {/* <Card className="shadow drop-shadow-lg">
                <CardHeader>
                  <CardTitle>Global Notifications</CardTitle>
                  <CardDescription>Receive a notification for these events from *any* machine.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedNotifications['Global']?.map((group) => (
                    <NotificationGroup
                      key={group.eventKey}
                      group={group}
                      isGlobalChecked={isGlobalChecked}
                      handleGlobalChange={handleGlobalPreferenceChange}
                      isMachineChecked={isMachineChecked} // Dummy prop
                      handleMachineChange={() => {}} // Dummy prop
                    />
                  ))}
                </CardContent>
              </Card> */}

              {/* --- Machine-Specific Notifications Card (Actualizada) --- */}
              <Card className="shadow drop-shadow-lg">
                {' '}
                <CardHeader>
                  <CardTitle>Event Notifications</CardTitle>{' '}
                  <CardDescription>Manage notifications for Tickets, Inspections, and Maintenance.</CardDescription>{' '}
                </CardHeader>{' '}
                <CardContent>
                  <Tabs defaultValue="global-rules">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="global-rules">Global Rules (for All Machines)</TabsTrigger>
                      <TabsTrigger value="per-machine-rules">Per-Machine Overrides</TabsTrigger>
                    </TabsList>

                    {/* --- Pestaña 1: Reglas Globales (para todas las máquinas) --- */}
                    <TabsContent value="global-rules" className="pt-6">
                      <CardDescription className="mb-4">
                        These settings apply to all machines unless you set a specific override in the next tab.
                      </CardDescription>
                      <div className="space-y-6">
                        {machineEventCategories.map((category) => (
                          <div key={category}>
                            <h4 className="mb-2 text-lg font-semibold">{category}</h4>
                            <div className="space-y-4">
                              {groupedNotifications[category]?.map((group) => (
                                <NotificationGroup
                                  key={group.eventKey}
                                  group={group}
                                  isGlobalChecked={isGlobalChecked}
                                  handleGlobalChange={handleGlobalPreferenceChange}
                                  isMachineChecked={isMachineChecked}
                                  handleMachineChange={() => {}} // Dummies
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* --- Pestaña 2: Reglas por Máquina (Overrides) --- */}
                    <TabsContent value="per-machine-rules" className="pt-6">
                      <CardDescription className="mb-4">
                        Select a machine to set specific rules that **override** your global settings.
                      </CardDescription>
                      <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                        <SelectTrigger className="border-primary/20 bg-primary/10 py-6 text-lg shadow-lg hover:cursor-pointer">
                          <SelectValue placeholder="Select a machine to override..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allMachines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedMachineId && (
                        <div className="mt-6 space-y-6 border-t border-primary/20 pt-6">
                          {machineEventCategories.map((category) => (
                            <div key={category}>
                              <h4 className="mb-2 text-lg font-semibold">{category}</h4>
                              <div className="space-y-4">
                                {groupedNotifications[category]?.map((group) => (
                                  <NotificationGroup
                                    key={group.eventKey}
                                    group={group}
                                    isMachine
                                    machineId={parseInt(selectedMachineId)}
                                    isGlobalChecked={isGlobalChecked} // Dummy
                                    isMachineChecked={isMachineChecked}
                                    handleGlobalChange={() => {}} // Dummy
                                    handleMachineChange={handleMachinePreferenceChange}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>{' '}
                </CardContent>{' '}
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={processing}>
                <Send className="mr-2 h-4 w-4" />
                {processing ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}

//
