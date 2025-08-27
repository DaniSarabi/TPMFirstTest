// This file provides TypeScript definitions for the Escalation Policy Module.

// Corresponds to the `EmailContact` model, but specifically for this context.
// If you have a global User or Contact type, you can use that instead.
export interface EscalationContact {
  id: number;
  name: string;
  email: string;
  department: string;
}

// Corresponds to the `EscalationLevel` model.
// It represents a single step in a policy.
export interface EscalationLevel {
  id: number;
  escalation_policy_id: number;
  level: number;
  days_after: number;
  // This is the many-to-many relationship
  email_contacts: EscalationContact[];
}

// Corresponds to the `EscalationPolicy` model.
// This is the main data structure for the new settings page.
export interface EscalationPolicy {
  id: number;
  name: string;
  description: string | null;
  // A policy has an array of levels
  is_active: boolean; // Añade la nueva propiedad
  levels: EscalationLevel[];
}
