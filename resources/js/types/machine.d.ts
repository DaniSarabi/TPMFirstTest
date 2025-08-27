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

// Corresponds to the `MachineStatus` model
export interface MachineStatus {
  is_operational_default: boolean;
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
}

// This is the complete, consolidated `Machine` interface
export interface Machine {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  machine_status: MachineStatus;
  creator: User;
  created_at: string;
  updated_at: string;
  subsystems: Subsystem[];
  scheduled_maintenances: ScheduledMaintenance[];
  all_maintenances: ScheduledMaintenance[];

}
