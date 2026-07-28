import 'package:flutter_test/flutter_test.dart';
import 'package:absher/models/housing_offer.dart';

void main() {
  group('HousingOffer Model Tests', () {
    test('Parse housing offer with standard numeric values', () {
      final json = {
        'id': 101,
        'apartment_id': 50,
        'title': 'عرض توفير الصيف',
        'description': 'وصف العرض السكني المميز',
        'original_price': 500.0,
        'offer_price': 400.0,
        'discount_percent': 20,
        'badge_text': 'لقطة',
        'image_url': 'uploads/offers/summer.jpg',
        'starts_at': '2026-08-01 00:00:00',
        'expires_at': '2026-08-31 00:00:00',
        'is_active': 1,
        'display_order': 3,
        'apartment': {
          'id': 50,
          'title': 'شقة سابورتالو الراقية',
          'description': 'شقة كاملة مفروشة ومجهزة',
          'price': '500 دولار',
          'location': 'تبليسي، سابورتالو',
          'proximity': 'قريبة من الجامعة الطبية',
          'images': ['uploads/ap1.jpg'],
          'features': ['تدفئة', 'تكييف'],
          'universities': ['الجامعة الطبية'],
          'is_available': 1
        }
      };

      final offer = HousingOffer.fromJson(json);

      expect(offer.id, 101);
      expect(offer.apartmentId, 50);
      expect(offer.title, 'عرض توفير الصيف');
      expect(offer.originalPrice, 500.0);
      expect(offer.offerPrice, 400.0);
      expect(offer.discountPercent, 20);
      expect(offer.calculatedDiscountPercent, 20);
      expect(offer.badgeText, 'لقطة');
      expect(offer.isActive, true);
      expect(offer.displayOrder, 3);
      expect(offer.apartment, isNotNull);
      expect(offer.apartment!.id, 50);
      expect(offer.apartment!.title, 'شقة سابورتالو الراقية');
    });

    test('Parse housing offer with string-encoded numeric values and fallback discount', () {
      final json = {
        'id': '202',
        'apartment_id': '99',
        'title': 'عرض الشتاء الدافئ',
        'description': 'استمتع بالتدفئة المجانية',
        'original_price': '600.00',
        'offer_price': '450.00',
        'discount_percent': null, // Test fallback calculation
        'badge_text': null,
        'image_url': null,
        'starts_at': null,
        'expires_at': null,
        'is_active': '0', // Inactive
        'display_order': '10',
        'apartment': null
      };

      final offer = HousingOffer.fromJson(json);

      expect(offer.id, 202);
      expect(offer.apartmentId, 99);
      expect(offer.originalPrice, 600.0);
      expect(offer.offerPrice, 450.0);
      expect(offer.discountPercent, 0);
      // Fallback calculation: (600 - 450) / 600 = 150 / 600 = 0.25 (25%)
      expect(offer.calculatedDiscountPercent, 25);
      expect(offer.badgeText, isNull);
      expect(offer.imageUrl, isNull);
      expect(offer.isActive, false);
      expect(offer.displayOrder, 10);
      expect(offer.apartment, isNull);
    });
  });
}
