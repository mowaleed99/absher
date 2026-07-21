class Chat {
  final int id;
  final int studentId;
  final String status;
  final String? lastActivityAt;

  Chat({
    required this.id,
    required this.studentId,
    required this.status,
    this.lastActivityAt,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      studentId: json['student_id'] is int ? json['student_id'] : int.tryParse(json['student_id']?.toString() ?? '0') ?? 0,
      status: json['status'] ?? 'open',
      lastActivityAt: json['last_activity_at'],
    );
  }
}
