class Admin {
  final int id;
  final String username;
  final String email;
  final String role;

  Admin({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
  });

  factory Admin.fromJson(Map<String, dynamic> json) {
    return Admin(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'admin',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
    };
  }
}
