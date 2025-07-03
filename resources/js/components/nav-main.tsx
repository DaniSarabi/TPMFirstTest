import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    // The SidebarMenuItem is a standard list item again
                    <SidebarMenuItem key={item.title}>
                        {/* --- ACTION: Wrap the button with the Link component --- */}
                        {/* The Link component will handle the navigation */}
                        <Link href={item.href} prefetch>
                            {/* --- ACTION: Tell the button to render as a 'div' --- */}
                            {/* This prevents conflicting button/link behavior */}
                            <SidebarMenuButton  isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
