export type RequestStatus = 'جديد' | 'قيد التنفيذ' | 'مكتمل' | 'ملغي' | 'قيد المراجعة';

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
  points_charged?: number;
  payment_method?: string;
  request_uuid?: string;
  created_at: string;
}
