import 'package:flutter/material.dart';
import '../services/language_service.dart';
import '../theme/app_colors.dart';

class EmptyStateWidget extends StatelessWidget {
  final String? titleKey;
  final String? descriptionKey;
  final String? title;
  final String? description;
  final IconData icon;
  final String? actionKey;
  final VoidCallback? onAction;

  const EmptyStateWidget({
    super.key,
    this.titleKey,
    this.descriptionKey,
    this.title,
    this.description,
    required this.icon,
    this.actionKey,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedTitle =
        titleKey != null ? LanguageService.tr(titleKey!) : (title ?? '');
    final resolvedDesc = descriptionKey != null
        ? LanguageService.tr(descriptionKey!)
        : (description ?? '');
    final resolvedAction = actionKey != null
        ? LanguageService.tr(actionKey!)
        : LanguageService.tr('retry');

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 80,
              color: AppColors.textMuted.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              resolvedTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textDark,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (resolvedDesc.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                resolvedDesc,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
              ),
            ],
            if (onAction != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  resolvedAction,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
