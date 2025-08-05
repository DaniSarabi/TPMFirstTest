import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import * as React from 'react';

// Define the shape of the props passed from the controller
interface NotificationsPageProps {
  allNotificationTypes: Record<string, Record<string, string>>;
  userPreferences: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Settings',
    href: '/settings/profile',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    isCurrent: true,
  },
];

export default function Notifications({ allNotificationTypes, userPreferences }: NotificationsPageProps) {
  const { data, setData, patch, processing, errors } = useForm({
    preferences: userPreferences,
  });

  // Handler for toggling a notification preference
  const handlePreferenceChange = (type: string, checked: boolean) => {
    let currentPreferences = new Set(data.preferences);
    if (checked) {
      currentPreferences.add(type);
    } else {
      currentPreferences.delete(type);
    }
    setData('preferences', Array.from(currentPreferences));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(route('profile.notifications.update'));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notification settings" />

      <SettingsLayout>
        <div className="space-y-6 ">
          <HeadingSmall
            title="In-App Notifications"
            description="Select which in-app notifications you would like to receive in the notification bell."
          />
          <form onSubmit={submit}>
            <Card className='drop-shadow-lg shadow'>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose the events you want to be notified about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(allNotificationTypes).map(([category, types]) => (
                  <div className='' key={category}>
                    <h3 className="mb-4 text-lg font-medium rounded-lg bg-primary text-primary-foreground p-2 pl-4">{category}</h3>
                    <div className="space-y-4">
                      {Object.entries(types).map(([type, description]) => (
                        <div key={type} className="drop-shadow-lg shadow-lg  flex items-center justify-between rounded-lg border p-4 hover:bg-accent">
                          <div className="space-y-0.5">
                            <Label htmlFor={type} className="text-base">
                              {description}
                            </Label>
                          </div>
                          <Switch
                            id={type}
                            checked={data.preferences.includes(type)}
                            onCheckedChange={(checked: boolean) => handlePreferenceChange(type, checked)}
                            className='bg-accent text-accent'
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={processing}>
                <Send/>
                {processing ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
