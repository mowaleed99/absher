USE absher_georgia_staging;

-- 1. Seed Districts reference data
INSERT INTO districts (id, name, name_ar, name_en)
SELECT id, name, name_ar, name_en FROM absher_georgia_db.districts;

-- 2. Seed Universities reference data
INSERT INTO universities (id, name, name_ar, name_en)
SELECT id, name, name_ar, name_en FROM absher_georgia_db.universities;

-- 3. Seed baseline test apartments with isolated staging image paths (Deterministic ORDER BY id ASC LIMIT 5)
INSERT INTO apartments (
    id, title, price, location, proximity, universities, capacity,
    move_in_type, move_in_date, images, features, description, is_available,
    district_id, rental_type, rooms_count, owner_phone,
    title_ar, title_en, description_ar, description_en,
    location_ar, location_en, proximity_ar, proximity_en,
    capacity_ar, capacity_en, move_in_type_ar, move_in_type_en,
    move_in_date_ar, move_in_date_en, features_ar, features_en
)
SELECT 
    id, title, price, location, proximity, universities, capacity,
    move_in_type, move_in_date, 
    REPLACE(images, 'uploads/apartments/', 'uploads_staging/apartments/'),
    features, description, is_available,
    district_id, rental_type, rooms_count, owner_phone,
    title_ar, title_en, description_ar, description_en,
    location_ar, location_en, proximity_ar, proximity_en,
    capacity_ar, capacity_en, move_in_type_ar, move_in_type_en,
    move_in_date_ar, move_in_date_en, features_ar, features_en
FROM absher_georgia_db.apartments 
ORDER BY id ASC 
LIMIT 5;

-- 4. Seed baseline housing offers (for delete cascade verification)
INSERT INTO housing_offers (id, apartment_id, title, description, original_price, offer_price, badge_text, image_url, starts_at, expires_at, is_active, display_order, created_at, updated_at, title_ar, title_en, description_ar, description_en, badge_text_ar, badge_text_en)
SELECT id, apartment_id, title, description, original_price, offer_price, badge_text, image_url, starts_at, expires_at, is_active, display_order, created_at, updated_at, title_ar, title_en, description_ar, description_en, badge_text_ar, badge_text_en 
FROM absher_georgia_db.housing_offers 
WHERE apartment_id IN (SELECT id FROM apartments);
