export interface HousingOffer {
  id: number;
  apartment_id: number;
  title: string;
  description: string;
  original_price: number;
  offer_price: number;
  discount_percent?: number;
  badge_text: string | null;
  image_url: string | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: number | boolean;
  display_order: number;
  title_ar?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  badge_text_ar?: string | null;
  badge_text_en?: string | null;
  display_title?: string;
  display_desc?: string;
  display_badge_text?: string;
  created_at?: string;
  updated_at?: string;
  apartment_title?: string;
}

export interface HousingOfferFormInput {
  apartment_id: number;
  title_ar: string;
  title_en?: string;
  description_ar: string;
  description_en?: string;
  original_price: number;
  offer_price: number;
  badge_text_ar?: string | null;
  badge_text_en?: string | null;
  image_url?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: number | boolean;
  display_order?: number;
}
