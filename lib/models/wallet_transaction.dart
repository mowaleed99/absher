class WalletTransaction {
  final int id;
  final int amount;
  final String type;
  final String? description;
  final int? serviceRequestId;
  final DateTime? createdAt;
  final String rawCreatedAt;

  WalletTransaction({
    required this.id,
    required this.amount,
    required this.type,
    this.description,
    this.serviceRequestId,
    this.createdAt,
    required this.rawCreatedAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    DateTime? parsedDate;
    final dateStr = json['created_at']?.toString() ?? '';
    if (dateStr.isNotEmpty) {
      try {
        parsedDate = DateTime.parse(dateStr);
      } catch (_) {
        // Safe fallback if parsing fails
      }
    }

    return WalletTransaction(
      id: json['id'] is num
          ? (json['id'] as num).toInt()
          : int.tryParse(json['id']?.toString() ?? '') ?? 0,
      amount: json['amount'] is num
          ? (json['amount'] as num).toInt()
          : int.tryParse(json['amount']?.toString() ?? '') ?? 0,
      type: json['type']?.toString() ?? '',
      description: json['description']?.toString(),
      serviceRequestId: json['service_request_id'] != null
          ? (json['service_request_id'] is num
              ? (json['service_request_id'] as num).toInt()
              : int.tryParse(json['service_request_id'].toString()))
          : null,
      createdAt: parsedDate,
      rawCreatedAt: dateStr,
    );
  }

  /// Returns true if this is a credit (add points) transaction.
  bool get isCredit {
    final t = type.trim().toLowerCase();
    return t == 'credit' ||
        t == 'إضافة' ||
        t == 'add' ||
        t == 'deposit' ||
        t == 'top_up';
  }
}
