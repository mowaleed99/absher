class ServiceRequest {
  final int id;
  final int studentId;
  final int serviceId;
  final String status;
  final String details;

  ServiceRequest({
    required this.id,
    required this.studentId,
    required this.serviceId,
    required this.status,
    required this.details,
  });

  factory ServiceRequest.fromJson(Map<String, dynamic> json) {
    return ServiceRequest(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      studentId: json['student_id'] is int ? json['student_id'] : int.tryParse(json['student_id']?.toString() ?? '0') ?? 0,
      serviceId: json['service_id'] is int ? json['service_id'] : int.tryParse(json['service_id']?.toString() ?? '0') ?? 0,
      status: json['status'] ?? 'pending',
      details: json['details'] ?? '',
    );
  }
}
