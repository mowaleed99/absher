class Student {
  final int id;
  final String fullName;
  final String? email;
  final String? phone;
  final int? universityId;
  final String? university;
  final String? avatarUrl;
  final int pointsBalance;
  final String? createdAt;

  Student({
    required this.id,
    required this.fullName,
    this.email,
    this.phone,
    this.universityId,
    this.university,
    this.avatarUrl,
    this.pointsBalance = 0,
    this.createdAt,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      fullName: json['full_name'] ?? json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      universityId: json['university_id'] != null ? int.tryParse(json['university_id'].toString()) : null,
      university: json['university'] ?? json['uni'],
      avatarUrl: json['avatar_url'],
      pointsBalance: json['points_balance'] is int ? json['points_balance'] : int.tryParse(json['points_balance']?.toString() ?? '0') ?? 0,
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'phone': phone,
      'university_id': universityId,
      'university': university,
      'avatar_url': avatarUrl,
      'points_balance': pointsBalance,
      'created_at': createdAt,
    };
  }

  Student copyWith({
    int? id,
    String? fullName,
    String? email,
    String? phone,
    int? universityId,
    String? university,
    String? avatarUrl,
    int? pointsBalance,
    String? createdAt,
  }) {
    return Student(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      universityId: universityId ?? this.universityId,
      university: university ?? this.university,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      pointsBalance: pointsBalance ?? this.pointsBalance,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
