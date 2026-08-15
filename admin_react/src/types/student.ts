export interface Student {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  university: string;
  nationality?: string | null;
  points: number;
  admin_status?: string | null;
  admin_note?: string | null;
  is_blocked?: number | boolean;
  created_at: string;
}

export interface StudentFormData {
  full_name: string;
  email: string;
  phone: string;
  university: string;
  nationality: string;
  password?: string;
}

export interface PointsUpdateData {
  student_id: number;
  amount: number;
  operation: 'add' | 'deduct';
  reason?: string;
}

export interface AdminMetaUpdateData {
  id: number;
  admin_status?: string | null;
  admin_note?: string | null;
}

export interface BlockedIdentity {
  id: number;
  identifier_type: 'email' | 'phone';
  identifier_value: string;
  normalized_value: string;
  source_student_id?: number | null;
  reason?: string | null;
  created_by_admin?: string | null;
  created_at: string;
}
