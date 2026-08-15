export type RequestStatus = 'جديد' | 'قيد التنفيذ' | 'مكتمل' | 'ملغي' | 'قيد المراجعة' | 'pending_cash';

export interface ServiceRequest {
  id: number;
  student_id: number;
  service_id: number;
  service_title: string;
  student_name: string;
  student_phone: string;
  status: string;
  details?: string;
  form_data?: string;
  service_price_points?: number;
  promo_code_id?: number | null;
  discount_points?: number;
  final_price_points?: number;
  points_charged?: number;
  payment_method?: string;
  request_uuid?: string;
  cancelled_at?: string | null;
  cancelled_by_admin_id?: number | null;
  cancellation_reason?: string | null;
  refund_status?: string;
  created_at: string;
}
