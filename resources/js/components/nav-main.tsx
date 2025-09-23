import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>TPM Appp</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={page.url === item.href} tooltip={{ children: item.title }}>
                            <Link href={item.href} prefetch>
                                {/* --- ACTION: Wrap the icon and span in a React Fragment --- */}
                                <>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>  
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
