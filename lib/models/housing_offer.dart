import 'apartment.dart';

class HousingOffer {
  final int id;
  final int apartmentId;
  final String title;
  final String description;
  final double originalPrice;
  final double offerPrice;
  final int discountPercent;
  final String? badgeText;
  final String? imageUrl;
  final String? startsAt;
  final String? expiresAt;
  final bool isActive;
  final int displayOrder;
  final Apartment? apartment;

  HousingOffer({
    required this.id,
    required this.apartmentId,
    required this.title,
    required this.description,
    required this.originalPrice,
    required this.offerPrice,
    required this.discountPercent,
    this.badgeText,
    this.imageUrl,
    this.startsAt,
    this.expiresAt,
    required this.isActive,
    required this.displayOrder,
    this.apartment,
  });

  int get calculatedDiscountPercent {
    if (discountPercent > 0) return discountPercent;
    if (originalPrice > 0 && offerPrice < originalPrice) {
      return (((originalPrice - offerPrice) / originalPrice) * 100).round();
    }
    return 0;
  }

  factory HousingOffer.fromJson(Map<String, dynamic> json) {
    return HousingOffer(
      id: json['id'] is int
          ? json['id']
          : (int.tryParse(json['id']?.toString() ?? '') ?? 0),
      apartmentId: json['apartment_id'] is int
          ? json['apartment_id']
          : (int.tryParse(json['apartment_id']?.toString() ?? '') ?? 0),
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      originalPrice: json['original_price'] is num
          ? (json['original_price'] as num).toDouble()
          : (double.tryParse(json['original_price']?.toString() ?? '') ?? 0.0),
      offerPrice: json['offer_price'] is num
          ? (json['offer_price'] as num).toDouble()
          : (double.tryParse(json['offer_price']?.toString() ?? '') ?? 0.0),
      discountPercent: json['discount_percent'] is int
          ? json['discount_percent']
          : (int.tryParse(json['discount_percent']?.toString() ?? '') ?? 0),
      badgeText: json['badge_text']?.toString(),
      imageUrl: json['image_url']?.toString(),
      startsAt: json['starts_at']?.toString(),
      expiresAt: json['expires_at']?.toString(),
      isActive: json['is_active'] == 1 ||
          json['is_active'] == true ||
          json['is_active'] == '1',
      displayOrder: json['display_order'] is int
          ? json['display_order']
          : (int.tryParse(json['display_order']?.toString() ?? '') ?? 0),
      apartment: json['apartment'] != null
          ? Apartment.fromJson(json['apartment'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'apartment_id': apartmentId,
      'title': title,
      'description': description,
      'original_price': originalPrice,
      'offer_price': offerPrice,
      'discount_percent': discountPercent,
      'badge_text': badgeText,
      'image_url': imageUrl,
      'starts_at': startsAt,
      'expires_at': expiresAt,
      'is_active': isActive ? 1 : 0,
      'display_order': displayOrder,
      'apartment': apartment?.toJson(),
    };
  }
}
