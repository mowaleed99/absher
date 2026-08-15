export type DiscountType = 'percentage' | 'fixed' | 'free';
export type PromoStatus = 'active' | 'paused' | 'archived';
export type ScopeType = 'all' | 'selected';

export interface PromoCode {
  id: number;
  campaign_name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_points: number | null;
  min_service_price_points: number;
  start_at: string | null;
  expires_at: string | null;
  status: PromoStatus;
  service_scope: ScopeType;
  audience_scope: ScopeType;
  service_ids: number[];
  student_ids: number[];
  total_usage_limit: number | null;
  per_student_limit: number;
  used_count: number;
  applied_redemptions_count?: number;
  total_redemptions_count?: number;
  points_saved?: number;
  created_at: string;
  updated_at: string;
}

export interface PromoRedemption {
  id: number;
  promo_code_id: number;
  service_request_id: number | null;
  request_id_snapshot: number;
  student_id: number | null;
  student_name_snapshot: string;
  student_phone_snapshot: string;
  student_email_snapshot: string;
  service_id: number | null;
  service_title_snapshot: string;
  code_snapshot: string;
  campaign_snapshot: string;
  discount_type_snapshot: string;
  discount_value_snapshot: number;
  original_price_points: number;
  discount_points: number;
  final_price_points: number;
  payment_method: string;
  status: 'applied' | 'reversed';
  reversed_at: string | null;
  reversed_reason: string | null;
  created_at: string;
  formatted_date?: string;
  formatted_reversed_date?: string;
}

export interface PromoFormInput {
  campaign_name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_points: number | null;
  min_service_price_points: number;
  start_at: string | null;
  expires_at: string | null;
  status: PromoStatus;
  service_scope: ScopeType;
  service_ids: number[];
  audience_scope: ScopeType;
  student_ids: number[];
  total_usage_limit: number | null;
  per_student_limit: number;
}
