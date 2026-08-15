export interface BroadcastNotification {
  id: number;
  student_id: number;
  title: string;
  body: string;
  date?: string;
  created_at?: string;
}

export interface NotificationFormData {
  title: string;
  body: string;
}
