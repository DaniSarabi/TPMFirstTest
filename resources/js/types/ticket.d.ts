import { Machine, Subsystem } from './machine';
import { Tag } from './maintenance';
import { Behavior } from './settings';
import { GlobalUserType } from './user';

// Defines the shape of a Ticket Status
export interface TicketStatus {
  id: number;
  name: string;
  bg_color: string;
  text_color: string;
  is_protected: boolean; // ACTION: Add missing field
  behaviors: Behavior[]; // ACTION: Add missing field
}

// Defines a simplified shape for the Inspection Item linked to a ticket
export interface InspectionReportItem {
  id: number;
  image_url: string | null;
  point: {
    id: number;
    name: string;
    description: string | null;
    subsystem: Subsystem;
  };
  inspection_report_id: number;
}

// This is the core interface for the new, refactored Timeline Event
export interface TicketUpdate {
  id: number;
  comment: string | null;
  action_taken: string | null;
  category: string | null;
  parts_used: string | null;
  created_at: string;
  user: GlobalUserType;
  old_status: TicketStatus | null;
  new_status: TicketStatus | null;
  action: 'applied' | 'removed' | 'escalated' | 'downgraded' | null;
  loggable_id: number | null;
  loggable_type: string | null;
  loggable: Tag | null; // For now, we know it can be a Tag
  photos: {
    id: number;
    photo_url: string;
  }[];
}

// The main, consolidated Ticket interface
export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  priority: number;
  created_at: string;
  creator: GlobalUserType;
  machine: Machine;
  status: TicketStatus;
  inspection_item: InspectionReportItem | null;
  updates: TicketUpdate[];
}
