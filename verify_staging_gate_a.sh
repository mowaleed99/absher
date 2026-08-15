#!/bin/bash
set -e

echo "=== Staging Safety Verification Gate (Phase A: A1 - A12) ==="

FAILED=0

# A1: Staging DB connection
echo -n "Test A1 (Staging DB connection): "
DB_NAME=$(mysql absher_georgia_staging -sN -e "SELECT DATABASE();")
if [ "$DB_NAME" == "absher_georgia_staging" ]; then
    echo "PASS (DB: $DB_NAME)"
else
    echo "FAIL (Got $DB_NAME)"
    FAILED=$((FAILED + 1))
fi

# A2: Staging login
echo -n "Test A2 (Staging login): "
LOGIN_JSON=$(curl -s -X POST http://80.241.218.23/api_staging/admin/login.php \
  -H "Content-Type: application/json" \
  -d '{"identifier":"absher_admin","password":"SecureAdminPass2026!"}')

TOKEN=$(echo "$LOGIN_JSON" | php -r '$d = json_decode(file_get_contents("php://stdin"), true); echo $d["token"] ?? $d["data"]["token"] ?? "";')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "PASS (Received JWT token of length ${#TOKEN})"
else
    echo "FAIL (Response: $LOGIN_JSON)"
    FAILED=$((FAILED + 1))
fi

# A3: Staging token works against staging API
echo -n "Test A3 (Staging token on staging API): "
STAGING_GET=$(curl -s "http://80.241.218.23/api_staging/admin_api.php?action=get_all" \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo "$STAGING_GET" | php -r '$d = json_decode(file_get_contents("php://stdin"), true); echo $d["status"] ?? "";')
if [ "$STATUS" == "success" ]; then
    echo "PASS (Status: success, apartments returned)"
else
    echo "FAIL (Response: $STAGING_GET)"
    FAILED=$((FAILED + 1))
fi

# A4: Staging token REJECTED by production API (must return 401 or invalid token error)
echo -n "Test A4 (Staging token rejected by production API): "
PROD_GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://80.241.218.23/api/admin_api.php?action=get_all" \
  -H "Authorization: Bearer $TOKEN")
PROD_GET_BODY=$(curl -s "http://80.241.218.23/api/admin_api.php?action=get_all" \
  -H "Authorization: Bearer $TOKEN")

if [ "$PROD_GET_STATUS" == "401" ] || echo "$PROD_GET_BODY" | grep -q "Unauthorized\|Invalid token\|Token error"; then
    echo "PASS (HTTP $PROD_GET_STATUS - Staging token strictly rejected by production)"
else
    echo "FAIL (Expected 401/Unauthorized, got HTTP $PROD_GET_STATUS: $PROD_GET_BODY)"
    FAILED=$((FAILED + 1))
fi

# A5: Create test record via staging API
echo -n "Test A5 (Create test record via staging API): "
CREATE_JSON=$(curl -s -X POST "http://80.241.218.23/api_staging/admin_api.php?action=add_apartment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title_ar": "[GATE_TEST] شقة اختبار أمان العزل",
    "title_en": "[GATE_TEST] Safety Gate Test Apartment",
    "price": "999",
    "location_ar": "تبليسي",
    "location_en": "Tbilisi",
    "proximity_ar": "قريب",
    "proximity_en": "Near",
    "rental_type": "apartment",
    "rooms_count": 2,
    "district_id": 1,
    "images": ["uploads_staging/apartments/test_gate_mock.jpg"],
    "features_ar": ["تكييف"],
    "features_en": ["AC"],
    "universities": [1]
  }')

CREATE_STATUS=$(echo "$CREATE_JSON" | php -r '$d = json_decode(file_get_contents("php://stdin"), true); echo $d["status"] ?? "";')
if [ "$CREATE_STATUS" == "success" ]; then
    echo "PASS (Record created via staging API)"
else
    echo "FAIL (Response: $CREATE_JSON)"
    FAILED=$((FAILED + 1))
fi

# A6: Verify record exists in staging DB
echo -n "Test A6 (Verify record in staging DB): "
STAGING_COUNT=$(mysql absher_georgia_staging -sN -e "SELECT COUNT(*) FROM apartments WHERE title_ar LIKE '[GATE_TEST]%' OR title_en LIKE '[GATE_TEST]%';")
CREATED_ID=$(mysql absher_georgia_staging -sN -e "SELECT id FROM apartments WHERE title_ar LIKE '[GATE_TEST]%' OR title_en LIKE '[GATE_TEST]%' LIMIT 1;")
if [ "$STAGING_COUNT" -ge 1 ]; then
    echo "PASS (Found $STAGING_COUNT record(s) in staging DB, ID: $CREATED_ID)"
else
    echo "FAIL (Record not found in staging DB)"
    FAILED=$((FAILED + 1))
fi

# A7: Verify record does NOT exist in production DB
echo -n "Test A7 (Verify record NOT in production DB): "
PROD_COUNT=$(mysql absher_georgia_db -sN -e "SELECT COUNT(*) FROM apartments WHERE title_ar LIKE '[GATE_TEST]%' OR title_en LIKE '[GATE_TEST]%';")
if [ "$PROD_COUNT" -eq 0 ]; then
    echo "PASS (0 records found in production DB - Absolute DB Isolation Proven)"
else
    echo "FAIL (Found $PROD_COUNT records in PRODUCTION DB! Cross-contamination detected!)"
    FAILED=$((FAILED + 1))
fi

# A8: Upload image via staging
echo -n "Test A8 (Upload image via staging upload endpoint): "
# Create a dummy image file
echo "GIF89a" > /tmp/gate_test_img.gif
UPLOAD_JSON=$(curl -s -X POST "http://80.241.218.23/api_staging/upload/image.php?folder=apartments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/gate_test_img.gif;type=image/gif")

IMG_URL=$(echo "$UPLOAD_JSON" | php -r '$d = json_decode(file_get_contents("php://stdin"), true); echo $d["url"] ?? $d["data"]["url"] ?? "";')
IMG_FILENAME=$(basename "$IMG_URL")

if [[ "$IMG_URL" =~ ^uploads_staging/apartments/ ]]; then
    echo "PASS (Returned URL correctly prefixed with uploads_staging: $IMG_URL)"
else
    echo "FAIL (Unexpected upload URL: $IMG_URL - Full Response: $UPLOAD_JSON)"
    FAILED=$((FAILED + 1))
fi

# A9: Verify image physical location in uploads_staging
echo -n "Test A9 (Verify image physically in uploads_staging/apartments): "
if [ -n "$IMG_FILENAME" ] && [ -f "/var/www/absher/backend_php/uploads_staging/apartments/$IMG_FILENAME" ]; then
    echo "PASS (File exists in /var/www/absher/backend_php/uploads_staging/apartments/$IMG_FILENAME)"
else
    echo "FAIL (File missing in uploads_staging/apartments)"
    FAILED=$((FAILED + 1))
fi

# A10: Verify image NOT in production uploads
echo -n "Test A10 (Verify image NOT in production uploads/apartments): "
if [ -n "$IMG_FILENAME" ] && [ ! -f "/var/www/absher/backend_php/uploads/apartments/$IMG_FILENAME" ]; then
    echo "PASS (File strictly absent from production uploads/apartments - Upload Isolation Proven)"
else
    echo "FAIL (File was written to production uploads!)"
    FAILED=$((FAILED + 1))
fi

# A11: Delete test record via staging API
echo -n "Test A11 (Delete test record via staging API): "
if [ -n "$CREATED_ID" ]; then
    DEL_JSON=$(curl -s -X POST "http://80.241.218.23/api_staging/admin_api.php?action=delete_apartment" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"id\": $CREATED_ID}")
    
    DEL_COUNT=$(mysql absher_georgia_staging -sN -e "SELECT COUNT(*) FROM apartments WHERE id = $CREATED_ID;")
    if [ "$DEL_COUNT" -eq 0 ]; then
        echo "PASS (Record $CREATED_ID deleted and verified absent from staging DB)"
    else
        echo "FAIL (Record still in staging DB after delete)"
        FAILED=$((FAILED + 1))
    fi
else
    echo "SKIP (No test record ID)"
    FAILED=$((FAILED + 1))
fi

# A12: Cleanup staging test image
echo -n "Test A12 (Cleanup staging test image): "
if [ -n "$IMG_FILENAME" ] && [ -f "/var/www/absher/backend_php/uploads_staging/apartments/$IMG_FILENAME" ]; then
    rm -f "/var/www/absher/backend_php/uploads_staging/apartments/$IMG_FILENAME"
    rm -f /tmp/gate_test_img.gif
    echo "PASS (Test image successfully cleaned up)"
else
    echo "PASS (Already clean)"
fi

echo "=== Verification Result: $FAILED Failures ==="
if [ "$FAILED" -eq 0 ]; then
    echo "ALL 12 STAGING SAFETY GATE (PHASE A) TESTS PASSED PERFECTLY!"
    exit 0
else
    echo "SAFETY GATE FAILED! Fix issues before proceeding."
    exit 1
fi
