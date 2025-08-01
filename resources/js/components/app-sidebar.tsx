import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Bolt, FileClock, LayoutGrid, ReceiptText, Settings, Shield, Ticket, UserRound } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    title: 'Machines',
    href: '/machines',
    icon: Bolt,
  },
  {
    title: 'Start Inspections',
    href: '/inspections/start',
    icon: ReceiptText,
  },
  {
    title: 'Inspections History',
    href: '/inspections',
    icon: FileClock,
  },
  {
    title: 'Tickets',
    href: route('tickets.index'), 
    icon: Ticket,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'Users',
    href: '/users',
    icon: UserRound,
  },
  {
    title: 'Roles',
    href: '/roles',
    icon: Shield,
  },
  {
    title: 'Application Settings ',
    href: route('settings.machine-status.index'),
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
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
