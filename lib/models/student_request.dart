import 'package:flutter/material.dart';
import '../services/language_service.dart';
import '../theme/app_colors.dart';

enum RequestCategory {
  apartmentBooking,
  roommateSearch,
  serviceRequest,
  generic
}

enum RequestStatus {
  underReview,
  pendingPayment,
  inProgress,
  completed,
  cancelled,
  unknown
}

class StudentRequest {
  final int id;
  final int? serviceId;
  final String serviceTitle;
  final String status;
  final DateTime? createdAt;
  final String rawCreatedAt;

  StudentRequest({
    required this.id,
    this.serviceId,
    required this.serviceTitle,
    required this.status,
    this.createdAt,
    required this.rawCreatedAt,
  });

  factory StudentRequest.fromJson(Map<String, dynamic> json) {
    int parsedId = 0;
    if (json['id'] is int) {
      parsedId = json['id'];
    } else if (json['id'] is String) {
      parsedId = int.tryParse(json['id']) ?? 0;
    }

    int? parsedServiceId;
    if (json['service_id'] != null) {
      if (json['service_id'] is int) {
        parsedServiceId = json['service_id'];
      } else if (json['service_id'] is String) {
        parsedServiceId = int.tryParse(json['service_id']);
      }
    }

    final parsedTitle = json['service_title']?.toString() ?? '';
    final parsedStatus = json['status']?.toString() ?? '';
    final rawDate = json['created_at']?.toString() ?? '';

    DateTime? parsedDate;
    if (rawDate.isNotEmpty) {
      try {
        parsedDate = DateTime.parse(rawDate);
      } catch (_) {
        // Safe fallback
      }
    }

    return StudentRequest(
      id: parsedId,
      serviceId: parsedServiceId,
      serviceTitle: parsedTitle,
      status: parsedStatus,
      createdAt: parsedDate,
      rawCreatedAt: rawDate,
    );
  }

  RequestCategory get category {
    if (serviceId != null && serviceId! > 0) {
      return RequestCategory.serviceRequest;
    }
    final title = serviceTitle.toLowerCase();

    // 1. Check roommate keywords first
    if (title.contains('شريك') ||
        title.contains('تجميع') ||
        title.contains('roommate') ||
        title.contains('match')) {
      return RequestCategory.roommateSearch;
    }

    // 2. Then check apartment booking keywords
    if (title.contains('حجز') ||
        title.contains('شقة') ||
        title.contains('سكن') ||
        title.contains('flat') ||
        title.contains('apartment') ||
        title.contains('booking') ||
        title.contains('rent')) {
      return RequestCategory.apartmentBooking;
    }

    return RequestCategory.generic;
  }

  String getLocalizedCategory() {
    switch (category) {
      case RequestCategory.apartmentBooking:
        return LanguageService.tr('apartment_booking');
      case RequestCategory.roommateSearch:
        return LanguageService.tr('roommate_request');
      case RequestCategory.serviceRequest:
        return LanguageService.tr('service_request');
      case RequestCategory.generic:
        return LanguageService.tr('request');
    }
  }

  IconData getCategoryIcon() {
    switch (category) {
      case RequestCategory.apartmentBooking:
        return Icons.home;
      case RequestCategory.roommateSearch:
        return Icons.people;
      case RequestCategory.serviceRequest:
        return Icons.build;
      case RequestCategory.generic:
        return Icons.description;
    }
  }

  RequestStatus get normalizedStatus {
    final s = status.trim().toLowerCase();
    switch (s) {
      case 'قيد المراجعة':
      case 'under_review':
      case 'pending':           // ← new: DB value maps to underReview
        return RequestStatus.underReview;
      case 'pending_cash':
        return RequestStatus.pendingPayment;
      case 'جاري التنفيذ':
      case 'in_progress':
      case 'in progress':
        return RequestStatus.inProgress;
      case 'مكتمل':
      case 'completed':
        return RequestStatus.completed;
      case 'cancelled':         // ← new
      case 'canceled':
      case 'ملغي':
        return RequestStatus.cancelled;
      default:
        return RequestStatus.unknown;
    }
  }

  String getLocalizedStatus() {
    return LanguageService.getLocalizedRequestStatus(status);
  }

  Color getStatusColor() {
    switch (normalizedStatus) {
      case RequestStatus.underReview:
        return Colors.orange;
      case RequestStatus.pendingPayment:
        return AppColors.accent;
      case RequestStatus.inProgress:
        return Colors.blue;
      case RequestStatus.completed:
        return AppColors.success;
      case RequestStatus.cancelled:
        return AppColors.error;
      case RequestStatus.unknown:
        return AppColors.textMuted;
    }
  }

  String getFormattedDate() {
    if (createdAt == null) {
      return rawCreatedAt.isNotEmpty
          ? rawCreatedAt
          : LanguageService.tr('auto_trans_1015');
    }
    final year = createdAt!.year;
    final month = createdAt!.month.toString().padLeft(2, '0');
    final day = createdAt!.day.toString().padLeft(2, '0');
    final hour = createdAt!.hour.toString().padLeft(2, '0');
    final minute = createdAt!.minute.toString().padLeft(2, '0');
    return '$year-$month-$day $hour:$minute';
  }
}
