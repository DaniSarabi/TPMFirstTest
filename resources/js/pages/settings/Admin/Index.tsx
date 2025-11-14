import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Settings } from 'lucide-react';

// Tipos de datos que vienen del controlador
interface UserStat extends PageProps {
  id: number;
  name: string;
  email: string;
  notification_preferences_count: number;
  locked_preferences_count: number;
}
interface IndexProps extends PageProps {
  users: UserStat[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: route('profile.edit') },
  { title: 'Notifications', href: route('settings.notifications.edit') },
  { title: 'Manage Users', href: '#', isCurrent: true },
];

export default function ManageNotificationsIndex({ users }: IndexProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Notifications" />
      <SettingsLayout>
        <Card className='bg-background border-0 shadow-none'>
          <CardHeader>
            <CardTitle>User Notification Dashboard</CardTitle>
            <CardDescription>Select a user to manage their notification preferences and locks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Enabled Prefs</TableHead>
                  <TableHead>Locked Prefs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{user.notification_preferences_count}</TableCell>
                    <TableCell>{user.locked_preferences_count}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={route('admin.notifications.manage.edit', user.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </SettingsLayout>
    </AppLayout>
  );
}
