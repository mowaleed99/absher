import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/language_service.dart';
import '../theme/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  Future<void> _launch(String urlStr) async {
    try {
      final Uri uri = Uri.parse(urlStr);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      debugPrint('Could not launch $urlStr: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isRtl = LanguageService.isRtl;

    return Directionality(
      textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          title: Text(
            LanguageService.tr('about_app'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          centerTitle: true,
          iconTheme: const IconThemeData(color: Colors.white),
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 8),
              // App Logo
              Center(
                child: Container(
                  width: 105,
                  height: 105,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.school_rounded,
                          size: 55,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              // App Name
              Text(
                LanguageService.tr('app_title'),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: 4),
              // App Subtitle / Version Info
              Text(
                LanguageService.tr('about_subtitle'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),
              // Description Card
              _buildSectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.info_outline_rounded,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          LanguageService.tr('about_app'),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      LanguageService.tr('about_description'),
                      style: const TextStyle(
                        fontSize: 13.5,
                        color: AppColors.textDark,
                        height: 1.6,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              // Official Contact Channels (From abshergroup.net)
              _buildSectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.connect_without_contact_rounded,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          LanguageService.tr('contact_us_title'),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Website
                    _buildInteractiveContactItem(
                      icon: Icons.language_rounded,
                      iconBgColor: AppColors.primary,
                      label: LanguageService.tr('website_label'),
                      value: 'abshergroup.net',
                      onTap: () => _launch('https://abshergroup.net/'),
                    ),
                    const Divider(height: 18, thickness: 0.6),
                    // WhatsApp & Phone
                    _buildInteractiveContactItem(
                      icon: Icons.chat_bubble_outline_rounded,
                      iconBgColor: const Color(0xFF25D366),
                      label: LanguageService.tr('whatsapp_label'),
                      value: '+995 551 529 019',
                      onTap: () => _launch('https://wa.me/995551529019'),
                    ),
                    const Divider(height: 18, thickness: 0.6),
                    // Instagram
                    _buildInteractiveContactItem(
                      icon: Icons.camera_alt_outlined,
                      iconGradient: const LinearGradient(
                        colors: [
                          Color(0xFF833AB4),
                          Color(0xFFFD1D1D),
                          Color(0xFFFCB045),
                        ],
                        begin: Alignment.bottomLeft,
                        end: Alignment.topRight,
                      ),
                      label: LanguageService.tr('instagram_label'),
                      value: '@absher_2',
                      onTap: () => _launch('https://www.instagram.com/absher_2/'),
                    ),
                    const Divider(height: 18, thickness: 0.6),
                    // Facebook
                    _buildInteractiveContactItem(
                      icon: Icons.facebook_rounded,
                      iconBgColor: const Color(0xFF1877F2),
                      label: LanguageService.tr('facebook_label'),
                      value: 'Absher Group',
                      onTap: () => _launch('https://www.facebook.com/Tocyprus2020'),
                    ),
                    const Divider(height: 18, thickness: 0.6),
                    // TikTok
                    _buildInteractiveContactItem(
                      icon: Icons.play_circle_filled_rounded,
                      iconBgColor: const Color(0xFF010101),
                      label: LanguageService.tr('tiktok_label'),
                      value: '@absher_2',
                      onTap: () => _launch('https://www.tiktok.com/@absher_2'),
                    ),
                    const Divider(height: 18, thickness: 0.6),
                    // YouTube
                    _buildInteractiveContactItem(
                      icon: Icons.smart_display_rounded,
                      iconBgColor: const Color(0xFFFF0000),
                      label: LanguageService.tr('youtube_label'),
                      value: '@Abshergroup',
                      onTap: () => _launch('https://www.youtube.com/@Abshergroup'),
                    ),
                    const Divider(height: 18, thickness: 0.6),
                    // Location / Map
                    _buildInteractiveContactItem(
                      icon: Icons.location_on_rounded,
                      iconBgColor: const Color(0xFFEA4335),
                      label: LanguageService.tr('office_address_label'),
                      value: LanguageService.tr('office_address_value'),
                      onTap: () => _launch('https://maps.google.com/?q=Tbilisi,Georgia'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              // Supported Languages Card
              _buildSectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      LanguageService.tr('supported_languages_title'),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildLanguageRow(label: 'العربية (Arabic)', active: true),
                    const SizedBox(height: 6),
                    _buildLanguageRow(label: 'English (English)', active: true),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({required Widget child}) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        child: SizedBox(
          width: double.infinity,
          child: child,
        ),
      ),
    );
  }

  Widget _buildLanguageRow({required String label, required bool active}) {
    return Row(
      children: [
        const Icon(
          Icons.check_circle_outline,
          size: 15,
          color: AppColors.success,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.textDark,
          ),
        ),
      ],
    );
  }

  Widget _buildInteractiveContactItem({
    required IconData icon,
    Color? iconBgColor,
    Gradient? iconGradient,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    iconGradient == null ? (iconBgColor ?? AppColors.primary) : null,
                gradient: iconGradient,
                boxShadow: [
                  BoxShadow(
                    color: (iconBgColor ?? AppColors.primary).withValues(alpha: 0.25),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.open_in_new_rounded,
              size: 15,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}
