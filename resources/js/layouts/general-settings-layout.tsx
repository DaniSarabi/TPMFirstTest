import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bolt, Mail, ReceiptText, TicketCheck } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
  {
    title: 'Machine Statuses',
    href: route('settings.machine-status.index'),
    icon: Bolt,
  },
  {
    title: 'Inspection Statuses',
    href: route('settings.inspection-status.index'),
    icon: ReceiptText,
  },
  {
    title: 'Ticket Statuses',
    href: route('settings.ticket-status.index'),
    icon: TicketCheck,
  },
  {
    title: 'Mail Contacts',
    href: route('settings.email-contacts.index'),
    icon: Mail,
  },
];

export default function GeneralSettingsLayout({ children }: PropsWithChildren) {
  const { url } = usePage();
  return (
    <div className="px-4 py-6">
      <Heading title="General Settings" description="Manage application-wide settings and configurations." />

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="w-full lg:w-48">
          <nav className="flex flex-col space-y-1">
            {sidebarNavItems.map((item, index) => (
              <Button
                key={`${item.href}-${index}`}
                size="sm"
                variant="ghost"
                asChild
                className={cn('w-full justify-start', {
                  'bg-muted hover:bg-muted': url.startsWith(item.href),
                })}
              >
                <Link href={item.href} prefetch>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>

        <Separator className="my-6 md:hidden" />

        <div className="flex-1">
          <section className="space-y-12">{children}</section>
        </div>
      </div>
    </div>
  );
}
