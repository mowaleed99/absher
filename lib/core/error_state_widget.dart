import 'package:flutter/material.dart';
import '../services/language_service.dart';
import '../theme/app_colors.dart';

class ErrorStateWidget extends StatelessWidget {
  final String? messageKey;
  final String? message;
  final IconData icon;
  final VoidCallback? onRetry;

  const ErrorStateWidget({
    super.key,
    this.messageKey,
    this.message,
    this.icon = Icons.error_outline,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedMessage =
        messageKey != null ? LanguageService.tr(messageKey!) : (message ?? '');

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: AppColors.error,
              size: 60,
            ),
            const SizedBox(height: 16),
            Text(
              resolvedMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.textDark,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, color: Colors.white, size: 18),
                label: Text(
                  LanguageService.tr('retry'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
