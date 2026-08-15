export interface NewsItem {
  id: number;
  title: string;
  title_ar: string;
  title_en: string;
  content: string;
  content_ar: string;
  content_en: string;
  image_url: string;
  date?: string;
  created_at?: string;
}

export interface NewsFormData {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  image_url: string;
}
