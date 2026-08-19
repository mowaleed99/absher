class University {
  final int id;
  final String name;
  final String nameAr;
  final String nameEn;

  University({
    required this.id,
    required this.name,
    this.nameAr = '',
    this.nameEn = '',
  });

  factory University.fromJson(Map<String, dynamic> json) {
    return University(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      nameAr: json['name_ar']?.toString() ?? '',
      nameEn: json['name_en']?.toString() ?? '',
    );
  }
}
