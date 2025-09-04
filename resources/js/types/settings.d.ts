import { Tag } from './maintenance';

// Define la forma de un "behavior" (comportamiento) que puede ser asignado a un estado.
// Nota: El 'pivot' ahora contiene 'tag_id' en lugar de 'machine_status_id'.
export interface Behavior {
    id: number;
    name: string;
    title: string;
    description: string;
    pivot: {
        tag_id: number | null;
    };
}

// Define la forma de un estado de inspección, incluyendo sus comportamientos asociados.
export interface InspectionStatus {
    id: number;
    name: string;
    severity: number;
    bg_color: string;
    text_color: string;
    is_default: boolean;
    behaviors: Behavior[];
}
