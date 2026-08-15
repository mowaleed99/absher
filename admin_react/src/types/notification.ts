export interface BroadcastNotification {
  id: number;
  student_id: number;
  title: string;
  body: string;
  title_ar?: string;
  title_en?: string;
  body_ar?: string;
  body_en?: string;
  date?: string;
  created_at?: string;
}

export interface NotificationFormData {
  title_ar: string;
  title_en?: string;
  body_ar: string;
  body_en?: string;
  title?: string;
  body?: string;
}
