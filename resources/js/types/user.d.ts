// This file defines the global User type for the application.

export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    avatar_color: string | null;
}
