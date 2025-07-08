import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
    isCurrent?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Define the shape of a single pagination link
export interface Link {
    url: string | null;
    label: string;
    active: boolean;
}

// Define the shape of a paginated API response from Laravel
export interface Paginated<T> {
    data: T[];
    links: Link[];
    // You can add other pagination properties here if needed
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Define the shape of the filters object
export interface Filter {
    search?: string;
    statuses?: string[];
}
