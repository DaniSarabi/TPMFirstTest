export interface ReportStat {
  ok_count: number;
  warning_count: number;
  critical_count: number;
}

export interface Report {
  id: number;
  status: string;
  start_date: string;
  completion_date: string | null;
  badge_text: string;
  user_name: string;
  machine_name: string;
  is_machine_deleted: boolean;
  machine_image_url: string | null;
  stats: ReportStat;
  duration: string | null;
}
