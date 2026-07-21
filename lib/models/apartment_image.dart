class ApartmentImage {
  final int id;
  final String imageUrl;
  final bool isPrimary;

  ApartmentImage({required this.id, required this.imageUrl, this.isPrimary = false});

  factory ApartmentImage.fromJson(Map<String, dynamic> json) {
    return ApartmentImage(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      imageUrl: json['image_url'] ?? '',
      isPrimary: json['is_primary'] == 1 || json['is_primary'] == true || json['is_primary'] == '1',
    );
  }
}
