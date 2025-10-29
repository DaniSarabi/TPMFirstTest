import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Bolt, Calendar, FileClock, LayoutGrid, ReceiptText, Settings, Shield, Ticket, UserRound } from 'lucide-react';
import AppLogo from './app-logo';


const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: route('dashboard'),
    icon: LayoutGrid,
  },
  {
    title: 'Machines',
    href: route('machines.index'),
    icon: Bolt,
  },
  {
    title: 'Start Inspections',
    href: route('inspections.start'),
    icon: ReceiptText,
  },
  {
    title: 'Inspections History',
    href: route('inspections.index'),
    icon: FileClock,
  },
  {
    title: 'Tickets',
    href: route('tickets.index'),
    icon: Ticket,
  },
  {
    title: 'Maintenances',
    href: route('maintenance-calendar.index'),
    icon: Calendar,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'Users',
    href: route('users.index'),
    icon: UserRound,
  },
  {
    title: 'Roles',
    href: route('roles.index'),
    icon: Shield,
  },
  {
    title: 'Application Settings ',
    href: route('settings.inspection-status.index'),
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={route('dashboard')} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
