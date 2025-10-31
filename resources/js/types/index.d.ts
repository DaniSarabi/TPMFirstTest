import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { GlobalUserType } from './user';

export interface Auth {
  user: User;
}

export interface EmailContact {
  id: number;
  name: string;
  email: string;
  department: string;
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
  subItems?: NavItem[];
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
  avatar_url: string | null;
  avatar_color: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown; // This allows for additional properties...
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  auth: {
    user: GlobalUserType;
    permissions: string[];
  };
};

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
  path: string;
  from: number;
  to: number;
  first_page_url: string | URL;
  last_page_url: string | URL;
  next_page_url: string | URL;
  prev_page_url: string | URL;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Define the shape of the filters object
export interface Filter {
  view?: string;
  search?: string;
  statuses?: string[];
}
