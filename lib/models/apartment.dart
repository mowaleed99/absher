import 'apartment_image.dart';
import 'feature.dart';
import 'university.dart';

class Apartment {
  final int id;
  final String title;
  final String description;
  final String price;
  final String currency;
  final int? capacity;
  final String district;
  final int? districtId;
  final String? status;
  final List<ApartmentImage> images;
  final List<Feature> features;
  final List<University> universities;
  final String? moveInType;
  final String? moveInDate;
  final String? proximity;
  final bool? isAvailable;

  String get primaryImage => images.isNotEmpty ? images.first.imageUrl : '';

  Apartment({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.currency,
    this.capacity,
    required this.district,
    this.districtId,
    this.status,
    required this.images,
    required this.features,
    required this.universities,
    this.moveInType,
    this.moveInDate,
    this.proximity,
    this.isAvailable,
  });

  factory Apartment.fromJson(Map<String, dynamic> json) {
    List<ApartmentImage> parsedImages = [];
    if (json['images'] is List) {
      for (var img in json['images']) {
        if (img is String) {
          parsedImages.add(ApartmentImage(id: 0, imageUrl: img));
        } else if (img is Map<String, dynamic>) {
          parsedImages.add(ApartmentImage.fromJson(img));
        }
      }
    }

    List<Feature> parsedFeatures = [];
    if (json['features'] is List) {
      for (var feat in json['features']) {
        if (feat is String) {
          parsedFeatures.add(Feature(id: 0, name: feat));
        } else if (feat is Map<String, dynamic>) {
          parsedFeatures.add(Feature.fromJson(feat));
        }
      }
    }

    List<University> parsedUniversities = [];
    if (json['universities'] is List) {
      for (var uni in json['universities']) {
        if (uni is String) {
          parsedUniversities.add(University(id: 0, name: uni));
        } else if (uni is Map<String, dynamic>) {
          parsedUniversities.add(University.fromJson(uni));
        }
      }
    }

    return Apartment(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      price: json['price']?.toString() ?? '0',
      currency: json['currency'] ?? 'GEL',
      capacity: json['capacity'] != null ? int.tryParse(json['capacity'].toString()) : null,
      district: json['district'] ?? json['location'] ?? '',
      districtId: json['district_id'] != null ? int.tryParse(json['district_id'].toString()) : null,
      status: json['status'],
      images: parsedImages,
      features: parsedFeatures,
      universities: parsedUniversities,
      moveInType: json['move_in_type'],
      moveInDate: json['move_in_date'],
      proximity: json['proximity'],
      isAvailable: json['is_available'] == 1 || json['is_available'] == true || json['is_available'] == '1',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'price': price,
      'currency': currency,
      'capacity': capacity,
      'district': district,
      'district_id': districtId,
      'status': status,
      'images': images.map((i) => i.imageUrl).toList(),
      'features': features.map((f) => f.name).toList(),
      'universities': universities.map((u) => u.name).toList(),
      'move_in_type': moveInType,
      'move_in_date': moveInDate,
      'proximity': proximity,
      'is_available': isAvailable == true ? 1 : 0,
    };
  }
}
