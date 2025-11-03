import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef } from 'react';
// --- Import the Link and usePage components ---
import { Link, usePage } from '@inertiajs/react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    // --- Get the current page to determine active state ---
    const { url } = usePage();

    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            {/* --- Wrap the button with the Inertia Link component --- */}
                            <Link href={item.href} prefetch>
                                <SidebarMenuButton
                                className='hover:cursor-pointer'
                                    // Add the isActive prop to highlight the current page
                                    isActive={url.startsWith(item.href)}
                                    
                                >
                                    {/* The icon and title remain inside the button for styling */}
                                    {item.icon && <item.icon className="h-5 w-5" />}
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
