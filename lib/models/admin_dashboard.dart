class AdminDashboard {
  final int activeStudents;
  final int activeApartments;
  final int activeServices;
  final int serviceRequests;
  final int totalTransactions;
  final int totalPointsSpent;

  AdminDashboard({
    required this.activeStudents,
    required this.activeApartments,
    required this.activeServices,
    required this.serviceRequests,
    required this.totalTransactions,
    required this.totalPointsSpent,
  });

  factory AdminDashboard.fromJson(Map<String, dynamic> json) {
    final studentsMap = json['students'] is Map ? json['students'] as Map : null;
    final apartmentsMap = json['apartments'] is Map ? json['apartments'] as Map : null;
    final servicesMap = json['services'] is Map ? json['services'] as Map : null;
    final walletMap = json['wallet'] is Map ? json['wallet'] as Map : null;

    int totalRequests = 0;
    if (json['service_requests'] is Map) {
      for (final val in (json['service_requests'] as Map).values) {
        if (val is num) totalRequests += val.toInt();
      }
    } else if (json['serviceRequests'] is num) {
      totalRequests = (json['serviceRequests'] as num).toInt();
    }

    return AdminDashboard(
      activeStudents: (studentsMap?['active_count'] ?? json['activeStudents'] ?? json['active_students'] ?? 0) is num
          ? (studentsMap?['active_count'] ?? json['activeStudents'] ?? json['active_students'] ?? 0).toInt()
          : 0,
      activeApartments: (apartmentsMap?['active_count'] ?? json['activeApartments'] ?? json['active_apartments'] ?? 0) is num
          ? (apartmentsMap?['active_count'] ?? json['activeApartments'] ?? json['active_apartments'] ?? 0).toInt()
          : 0,
      activeServices: (servicesMap?['active_count'] ?? json['activeServices'] ?? json['active_services'] ?? 0) is num
          ? (servicesMap?['active_count'] ?? json['activeServices'] ?? json['active_services'] ?? 0).toInt()
          : 0,
      serviceRequests: totalRequests,
      totalTransactions: (walletMap?['total_transactions'] ?? json['totalTransactions'] ?? json['total_transactions'] ?? 0) is num
          ? (walletMap?['total_transactions'] ?? json['totalTransactions'] ?? json['total_transactions'] ?? 0).toInt()
          : 0,
      totalPointsSpent: (walletMap?['total_points_spent'] ?? json['totalPointsSpent'] ?? json['total_points_spent'] ?? 0) is num
          ? (walletMap?['total_points_spent'] ?? json['totalPointsSpent'] ?? json['total_points_spent'] ?? 0).toInt()
          : 0,
    );
  }
}
