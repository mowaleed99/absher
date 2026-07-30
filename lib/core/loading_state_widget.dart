import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';

class LoadingStateWidget extends StatelessWidget {
  final String? messageKey;
  final String? message;

  const LoadingStateWidget({
    super.key,
    this.messageKey,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedMessage =
        messageKey != null ? LanguageService.tr(messageKey!) : message;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
            if (resolvedMessage != null && resolvedMessage.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                resolvedMessage,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
