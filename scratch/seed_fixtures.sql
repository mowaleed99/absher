INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, max_discount_points, min_service_price_points, status, used_count)
VALUES ('خصم ترحيبي 20%', 'WELCOME20', 'percentage', 20.00, 50, 0, 'active', 0)
ON DUPLICATE KEY UPDATE campaign_name=VALUES(campaign_name), discount_value=VALUES(discount_value);

INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, min_service_price_points, status, used_count)
VALUES ('خصم صيانة 25 نقطة', 'FIXED25', 'fixed', 25.00, 50, 'active', 0)
ON DUPLICATE KEY UPDATE campaign_name=VALUES(campaign_name), discount_value=VALUES(discount_value);

INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status, used_count)
VALUES ('خدمة مجانية للطلاب الجدد', 'FREEPASS', 'free', 0.00, 'active', 0)
ON DUPLICATE KEY UPDATE campaign_name=VALUES(campaign_name), discount_value=VALUES(discount_value);

SELECT id, campaign_name, code, discount_type, discount_value, status FROM promo_codes;
