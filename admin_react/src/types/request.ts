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
  created_at?: string;
}

export interface StatusReplyTemplate {
  id: number;
  status_key: string;
  status_name_ar: string;
  status_name_en: string;
  template_ar: string;
  template_en: string;
  is_enabled: number | boolean;
  updated_at?: string;
}

export interface UpdateStatusPayload {
  id: number;
  status: string;
  cancellationReason?: string;
  customMessage?: string;
  sendChat?: boolean;
  msgLang?: 'ar' | 'en' | 'both';
}
