import { LucideIcon } from 'lucide-react';
import { User } from './user';

// This file provides the single source of truth for all machine-related data structures.

// Corresponds to the `InspectionPoint` model
export interface InspectionPoint {
  id: number;
  name: string;
  description: string | null;
}

// Corresponds to the `Subsystem` model
export interface Subsystem {
  id: number;
  name: string;
  inspection_points: InspectionPoint[];
}


// Corresponds to the `Tag` model
export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
}



// This is the complete, consolidated `Machine` interface
export interface Machine {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  status: 'OPERATIONAL' | 'NEW' | 'OUT_OF_SERVICE' | string; // Status is a string
  creator: User;
  created_at: string;
  updated_at: string;
  subsystems: Subsystem[];
  tags?: Tag[]; // Tags are back
  scheduled_maintenances: ScheduledMaintenance[];
  all_maintenances: ScheduledMaintenance[];
}