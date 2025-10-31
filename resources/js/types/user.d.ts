// This file defines the global User type for the application.

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  avatar_color: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}
