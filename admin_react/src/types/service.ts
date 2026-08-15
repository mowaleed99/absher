export interface Service {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  description: string;
  description_ar: string;
  description_en: string;
  image_url: string;
  has_form: number; // 0 or 1
  price_points: number;
  created_at?: string;
  display_title?: string;
  display_desc?: string;
}

export interface ServiceFormData {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image_url: string;
  has_form: number;
  price_points: number;
}
