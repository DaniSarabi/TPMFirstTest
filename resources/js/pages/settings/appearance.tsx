import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { AvatarSettings } from './Components/AvatarSettings';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Appearance settings',
    href: '/settings/appearance',
  },
];

export default function Appearance() {
  const { auth } = usePage<{ auth: { user: User; permissions: string[] } }>().props;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Appearance settings" />

      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
          <AppearanceTabs />

          <div className="pt-6">
            <AvatarSettings user={auth.user} />
          </div>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
