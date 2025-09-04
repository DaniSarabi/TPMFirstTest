import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { Head, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import * as React from 'react';

// Define the shape of the data coming from our new controller
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

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: '/settings/profile' },
  { title: 'Notifications', href: '/settings/notifications', isCurrent: true },
];

export default function Notifications({ allMachines, allNotificationTypes, userPreferences }: NotificationsPageProps) {
  const { data, setData, patch, processing } = useForm({
    preferences: userPreferences.map((p) => ({
      notification_type: p.notification_type,
      preferable_id: p.preferable_id,
      // We strip the 'App\Models\' prefix to make it cleaner for the form state
      preferable_type: p.preferable_type ? p.preferable_type.split('\\').pop() : null,
    })),
  });

  const [selectedMachineId, setSelectedMachineId] = React.useState<string>(allMachines[0]?.id.toString() || '');

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

  const machineNotificationTypes = {
    ...allNotificationTypes['Tickets'],
    ...allNotificationTypes['Inspections'],
    ...allNotificationTypes['Maintenance'],
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('settings.notifications.update'));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notification Settings" />
      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="In-App & Email Notifications" description="Choose which events you want to be notified about." />
          <form onSubmit={submit}>
            <div className="space-y-8">
              {/* Global Notifications Card */}
              <Card className="shadow drop-shadow-lg">
                <CardHeader>
                  <CardTitle>Global Notifications</CardTitle>
                  <CardDescription>Receive a notification when any of these events happen in the system.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(allNotificationTypes['Global']).map(([type, description]) => (
                    <div key={type} className="bg-background flex items-center justify-between rounded-lg  p-4 hover:bg-accent shadow-lg drop-shadow-sm">
                      <Label htmlFor={`global-${type}`} className="cursor-pointer text-base">
                        {description}
                      </Label>
                      <Switch
                        id={`global-${type}`}
                        checked={isGlobalChecked(type)}
                        onCheckedChange={(checked) => handleGlobalPreferenceChange(type, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Machine-Specific Notifications Card */}
              <Card className="shadow drop-shadow-lg">
                <CardHeader>
                  <CardTitle>Machine-Specific Notifications</CardTitle>
                  <CardDescription>Select a machine to manage notifications only for that machine.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                    <SelectTrigger className='bg-primary text-primary-foreground border-0 shadow-2xl drop-shadow-lg text-lg py-6 hover:cursor-pointer'>
                      <SelectValue placeholder="Select a machine..." />
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
                    <div className="space-y-4 border-t border-primary pt-6">
                      {Object.entries(machineNotificationTypes).map(([type, description]) => (
                        <div key={type} className="flex items-center justify-between rounded-lg  p-4 hover:bg-accent bg-background shadow-lg drop-shadow-sm">
                          <Label htmlFor={`machine-${type}`} className="cursor-pointer text-base">
                            {description}
                          </Label>
                          <Switch
                            id={`machine-${type}`}
                            checked={isMachineChecked(type, parseInt(selectedMachineId))}
                            onCheckedChange={(checked) => handleMachinePreferenceChange(type, parseInt(selectedMachineId), checked)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
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
