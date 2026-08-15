export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved';
export type FeedbackType = 'suggestion' | 'bug' | 'ux' | 'feature' | string;

export interface ApplicationFeedback {
  id: number;
  student_id: number;
  feedback_type: FeedbackType;
  comment: string;
  status: FeedbackStatus;
  reviewed_by_admin_id?: number | null;
  reviewed_at?: string | null;
  date?: string;
  student_name?: string;
  student_uni?: string;
}
