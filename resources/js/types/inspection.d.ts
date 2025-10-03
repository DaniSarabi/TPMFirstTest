import { InspectionPoint, Machine, Subsystem } from './machine';
import { Report } from './report';
import { Behavior } from './settings';
// Corresponde al modelo `InspectionStatus`
export interface InspectionStatus {
  id: number;
  name: string;
  severity: number;
  bg_color: string;
  text_color: string;
  is_default: boolean;
  behaviors: Behavior[]; //
}

// Interfaz base para un reporte de inspección que se usa en la página 'Perform'
export interface InspectionReport {
  id: number;
  machine: Machine;
}

// --- Interfaces para la página de 'Show' (Detalles del Reporte) ---

export interface InspectionReportItem {
  id: number;
  comment: string | null;
  image_url: string | null;
  status: InspectionStatus;
  point: InspectionPoint;
  ticket: { id: number } | null;
  pinged_ticket: { id: number } | null;
}

// Extiende el Subsystem base para añadir los items del reporte
export interface SubsystemWithReportItems extends Subsystem {
  report_items: InspectionReportItem[];
}

// Extiende la interfaz Report base para añadir los detalles de la inspección
export interface DetailedReport extends Report {
  grouped_items: SubsystemWithReportItems[];
  status_change_info: string | null;
}
