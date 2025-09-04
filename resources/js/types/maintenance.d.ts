import { Machine, Subsystem } from './machine';

// This file provides TypeScript definitions for the Maintenance Module.
// By centralizing these interfaces, we ensure type consistency across the entire frontend.

// Represents a single task within a maintenance template checklist.
// This corresponds to the `MaintenanceTemplateTask` Eloquent model.
export interface MaintenanceTemplateTask {
  id: number;
  maintenance_template_id: number;
  order: number;
  task_type: 'checkbox' | 'pass_fail' | 'numeric_input' | 'text_observation';
  label: string;
  description: string | null;
  options: {
    photo_required?: boolean;
    is_mandatory?: boolean;
    comment_required_on_fail?: boolean;
    comment_required?: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

// Represents a full maintenance template, including its nested tasks.
// This corresponds to the `MaintenanceTemplate` Eloquent model.
export interface MaintenanceTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tasks: MaintenanceTemplateTask[]; // A template has an array of tasks
}

// Represents a scheduled maintenance event formatted for the frontend calendar.
export interface ScheduledMaintenanceEvent {
  id: string;
  title: string;
  start: string;
  allDay: true;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    schedulableName: string;
    schedulableType: 'Machine' | 'Subsystem';
    series_id: string | null;
    grace_period_days: number;
    machine_image_url: string | null;
    subsystem_count: number | null;
    open_tickets_count: number;
    last_maintenance_date: string | null;
    current_uptime: string;
    report_id: number | null;
  };
}

// Represents the full ScheduledMaintenance model from the backend
export interface ScheduledMaintenance {
  id: number;
  series_id: string | null;
  title: string;
  color: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'in_progress_overdue' | 'completed_overdue';
  scheduled_date: string;
  grace_period_days: number;
  reminder_days_before: number | null;
  template: MaintenanceTemplate;
  schedulable: Machine | Subsystem;
  schedulable_type: 'App\\Models\\Machine' | 'App\\Models\\Subsystem';
  schedulable_id: number;
  report: MaintenanceReport;
}

export interface MaintenancePhoto {
  id: number;
  photo_url: string;
}

// Represents a single result for a task within a maintenance report.
// Corresponds to the `MaintenanceReportResult` model.
export interface MaintenanceReportResult {
  id: number;
  maintenance_report_id: number;
  task_label: string;
  result: any;
  comment: string | null;
  photos: MaintenancePhoto[];
}

// Represents the full MaintenanceReport model from the backend.
// This is the main data structure for the "Perform Maintenance" page.
export interface MaintenanceReport {
  id: number;
  scheduled_maintenance_id: number;
  user_id: number;
  notes: string | null;
  completed_at: string;
  user: User;
  scheduled_maintenance: ScheduledMaintenance;
  results: MaintenanceReportResult[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
}
