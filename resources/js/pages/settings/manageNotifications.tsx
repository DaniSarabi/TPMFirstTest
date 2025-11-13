import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { AtSign, Bell, Check, LoaderCircle, Mail, Send } from 'lucide-react';
import * as React from 'react';

// ============================================================================
// --- Type Definitions ---
// ============================================================================

interface User {
  id: number;
  name: string;
}

interface NotificationPreference {
  notification_type: string;
  preferable_id: number | null;
  preferable_type: string | null;
}

interface ManageNotificationsProps extends PageProps {
  allUsers: User[];
  allMachines: Machine[];
  allNotificationTypes: Record<string, Record<string, string>>;
}

type Channel = 'in_app' | 'email' | 'teams';
interface GroupedNotification {
  eventKey: string;
  description: string;
  channels: Partial<Record<Channel, string>>;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: route('profile.edit') },
  { title: 'Notifications', href: route('settings.notifications.edit') },
  { title: 'Manage Users', href: '#', isCurrent: true },
];

// ============================================================================
// --- Helper: NotificationGroup Component (Copiado de Notifications.tsx) ---
// ============================================================================
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
// --- Componente Principal (La Nueva Página de Admin) ---
// ============================================================================

export default function ManageNotifications({ allUsers, allMachines, allNotificationTypes }: ManageNotificationsProps) {
  const [selectedUserId, setSelectedUserId] = React.useState<string>('');
  const [isLoadingPrefs, setIsLoadingPrefs] = React.useState(false);
  const [lastSave, setLastSave] = React.useState(false); // Para el feedback del botón
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>(allMachines[0]?.id.toString() || '');

  const [preferences, setPreferences] = React.useState<NotificationPreference[]>([]);
  const [processing, setProcessing] = React.useState(false);

  // "El Cerebro" (agrupador de notificaciones)
  const groupedNotifications = React.useMemo(() => {
    const grouped: Record<string, GroupedNotification[]> = {};
    Object.entries(allNotificationTypes).forEach(([category, types]) => {
      const categoryGroups: Record<string, GroupedNotification> = {};
      Object.entries(types).forEach(([type, description]) => {
        const parts = type.split('.');
        const channel = parts.pop() as Channel;
        const eventKey = parts.join('.');
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

  // --- Lógica de Carga de Datos ---
  React.useEffect(() => {
    if (!selectedUserId) {
      setPreferences([]); // Limpiar
      return;
    }
    setIsLoadingPrefs(true);
    axios
      .get(route('admin.notifications.users.preferences', selectedUserId))
      .then((response) => {
        setPreferences(response.data.preferences);
      })
      .finally(() => setIsLoadingPrefs(false));
  }, [selectedUserId]);

  // --- FIX: Handlers ahora usan setPreferences (inmutable) ---
  const handleGlobalPreferenceChange = (type: string, checked: boolean) => {
    setPreferences((currentPrefs) => {
      if (checked) {
        return [...currentPrefs, { notification_type: type, preferable_id: null, preferable_type: null }];
      } else {
        return currentPrefs.filter((p) => !(p.notification_type === type && p.preferable_id === null));
      }
    });
  };

  const handleMachinePreferenceChange = (type: string, machineId: number, checked: boolean) => {
    setPreferences((currentPrefs) => {
      if (checked) {
        return [...currentPrefs, { notification_type: type, preferable_id: machineId, preferable_type: 'Machine' }];
      } else {
        return currentPrefs.filter((p) => !(p.notification_type === type && p.preferable_id === machineId));
      }
    });
  };
  const isGlobalChecked = (type: string) => {
    return preferences.some((p) => p.notification_type === type && p.preferable_id === null);
  };
  const isMachineChecked = (type: string, machineId: number) => {
    return preferences.some((p) => p.notification_type === type && p.preferable_id === machineId);
  };

  // --- FIX: Handler de Guardado ahora envía TODAS las preferencias ---
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setLastSave(false);
    setProcessing(true);

    router.patch(
      route('admin.notifications.users.preferences.update', selectedUserId),
      {
        preferences: preferences, // Enviamos el array completo
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setLastSave(true);
          setTimeout(() => setLastSave(false), 2000);
        },
        onFinish: () => {
          setProcessing(false);
        },
      },
    );
  };
  const machineEventCategories = ['Tickets', 'Inspections', 'Maintenance'];
  const selectedUserName = allUsers.find((u) => u.id.toString() === selectedUserId)?.name || '...';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Notifications" />
      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="Manage User Notifications" description="Select a user to view and override their notification preferences." />

          <Card className="shadow drop-shadow-lg">
            <CardHeader>
              <CardTitle>Select User</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="border-primary/20 bg-primary/10 py-6 text-lg shadow-lg hover:cursor-pointer">
                  <SelectValue placeholder="Select a user to manage..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedUserId && (
            <form onSubmit={submit}>
              {isLoadingPrefs ? (
                <div className="flex h-64 items-center justify-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-8">
                  <Card className="shadow drop-shadow-lg">
                    <CardHeader>
                      <CardTitle>
                        Event Notifications for: <span className="text-primary">{selectedUserName}</span>
                      </CardTitle>
                      <CardDescription>Manage notifications for Tickets, Inspections, and Maintenance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="global-rules">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="global-rules">Global Rules (for All Machines)</TabsTrigger>
                          <TabsTrigger value="per-machine-rules">Per-Machine Overrides</TabsTrigger>
                        </TabsList>

                        <TabsContent value="global-rules" className="pt-6">
                          <CardDescription className="mb-4">These settings apply to **all machines** unless overridden.</CardDescription>
                          <div className="space-y-6">
                            {machineEventCategories.map((category) => (
                              <div key={category}>
                                <h4 className="mb-2 text-lg font-semibold">{category}</h4>
                                <div className="space-y-4">
                                  {(groupedNotifications as any)[category]?.map((group: GroupedNotification) => (
                                    <NotificationGroup
                                      key={group.eventKey}
                                      group={group}
                                      isMachine={false}
                                      isGlobalChecked={isGlobalChecked}
                                      handleGlobalChange={handleGlobalPreferenceChange}
                                      isMachineChecked={isMachineChecked} // Dummy
                                      handleMachineChange={handleMachinePreferenceChange} // Dummy
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="per-machine-rules" className="pt-6">
                          <CardDescription className="mb-4">
                            Select a machine to set specific rules that **override** global settings.
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
                                    {(groupedNotifications as any)[category]?.map((group: GroupedNotification) => (
                                      <NotificationGroup
                                        key={group.eventKey}
                                        group={group}
                                        isMachine={true}
                                        machineId={parseInt(selectedMachineId)}
                                        isGlobalChecked={isGlobalChecked} // Dummy
                                        isMachineChecked={isMachineChecked}
                                        handleGlobalChange={handleGlobalPreferenceChange} // Dummy
                                        handleMachineChange={handleMachinePreferenceChange}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={processing || isLoadingPrefs || !selectedUserId}>
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
          )}
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
