class University {
  final int id;
  final String name;

  University({required this.id, required this.name});

  factory University.fromJson(Map<String, dynamic> json) {
    return University(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? '',
    );
  }
}
