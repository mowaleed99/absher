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

  static String localize(String? rawUni, {List<University>? universitiesList, bool isEnglish = false}) {
    if (rawUni == null || rawUni.trim().isEmpty) return '';
    final trimmed = rawUni.trim();

    if (trimmed.toUpperCase() == 'OTHERS' || trimmed == 'أخرى' || trimmed == 'اخرى') {
      return isEnglish ? 'OTHERS' : 'أخرى';
    }

    if (universitiesList != null && universitiesList.isNotEmpty) {
      for (final u in universitiesList) {
        if (u.name == trimmed ||
            u.nameAr == trimmed ||
            u.nameEn == trimmed ||
            (u.nameAr.isNotEmpty && trimmed.contains(u.nameAr)) ||
            (u.nameEn.isNotEmpty && trimmed.contains(u.nameEn))) {
          return isEnglish
              ? (u.nameEn.isNotEmpty ? u.nameEn : u.name)
              : (u.nameAr.isNotEmpty ? u.nameAr : u.name);
        }
      }
    }

    // If English requested and has abbreviation in parentheses e.g. (GRUNI), (CIU), (SEU)
    final match = RegExp(r'\(([A-Za-z0-9]+)\)').firstMatch(trimmed);
    if (match != null && isEnglish) {
      return match.group(0) ?? trimmed;
    }

    return trimmed;
  }
}
