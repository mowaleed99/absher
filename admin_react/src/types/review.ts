export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ServiceReview {
  id: number;
  student_id: number;
  service_request_id?: number | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  student_name?: string;
  uni?: string;
  date?: string;
  reviewed_by_admin_id?: number | null;
  reviewed_at?: string | null;
}

export interface ReviewsAnalytics {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  service_analytics: Array<{
    service_type: string;
    review_count: number;
    average_rating: number;
  }>;
}
