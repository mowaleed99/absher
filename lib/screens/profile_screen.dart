import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import 'login_screen.dart';
import 'wallet_screen.dart';

class ProfileScreen extends StatelessWidget {
  final Map<String, dynamic> user;
  final bool isGuest;
  const ProfileScreen({super.key, required this.user, required this.isGuest});

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.language, color: AppColors.primary),
            const SizedBox(width: 10),
            Text(LanguageService.tr('change_lang'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildLangOption(context, 'ar', LanguageService.tr('auto_trans_1203')),
            _buildLangOption(context, 'en', LanguageService.tr('auto_trans_1204')),
            _buildLangOption(context, 'ka', '🇬🇪 ქართული (Under Development / تحت التطوير)'),
          ],
        ),
      ),
    );
  }

  Widget _buildLangOption(BuildContext context, String code, String label) {
    final isSelected = LanguageService.currentLang.value == code;
    return ListTile(
      title: Text(label, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? AppColors.primary : AppColors.textDark)),
      trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
      onTap: () {
        LanguageService.currentLang.value = code;
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLang,
      builder: (context, lang, child) {
        return Directionality(
          textDirection: LanguageService.textDirection,
          child: Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              elevation: 0,
              title: Text(LanguageService.tr('profile'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // كارت الصورة الشخصية والاسم
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: Column(
                      children: [
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            CircleAvatar(
                              radius: 50,
                              backgroundColor: AppColors.accent,
                              child: CircleAvatar(
                                radius: 46,
                                backgroundColor: Colors.white,
                                child: Icon(isGuest ? Icons.person_outline : Icons.person, size: 55, color: AppColors.primary),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                              child: const Icon(Icons.check, color: Colors.white, size: 16),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(user['name'] ?? LanguageService.tr('default_student_name'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                          child: Text(user['uni'] ?? LanguageService.tr('default_student_uni'), style: const TextStyle(color: AppColors.accentLight, fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (isGuest)
                    Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: AppColors.accentLight,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.accent),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.star, color: AppColors.accent, size: 32),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(LanguageService.tr('guest_mode'), style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text(LanguageService.tr('create_account_now'), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                const SizedBox(height: 8),
                                ElevatedButton(
                                  onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen())),
                                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)),
                                  child: Text(LanguageService.tr('login_or_register'), style: const TextStyle(color: Colors.white, fontSize: 12)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                  // زر تغيير اللغة المميز في أول القائمة
                  Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 3,
                    color: AppColors.accentLight,
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      leading: const CircleAvatar(backgroundColor: AppColors.accent, child: Icon(Icons.language, color: AppColors.textDark)),
                      title: Text(LanguageService.tr('change_lang'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textDark)),
                      subtitle: Text(LanguageService.tr('lang_desc'), style: const TextStyle(fontSize: 12, color: AppColors.primaryDark, fontWeight: FontWeight.w600)),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 18, color: AppColors.primaryDark),
                      onTap: () => _showLanguageDialog(context),
                    ),
                  ),

                  // قائمة إعدادات ومتابعة الحجوزات
                  _buildProfileItem(context, Icons.bookmark_added, LanguageService.tr('my_bookings'), LanguageService.tr('booking_status_subtitle')),
                  _buildProfileItem(
                    context, 
                    Icons.account_balance_wallet, 
                    LanguageService.tr('wallet_points'), 
                    LanguageService.tr('wallet_subtitle'),
                    onTap: () {
                      if (!isGuest) {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => WalletScreen(user: user)));
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(LanguageService.tr('please_login_wallet'))));
                      }
                    }
                  ),
                  _buildProfileItem(context, Icons.phone_in_talk, LanguageService.tr('contact_support'), LanguageService.tr('support_subtitle')),
                  _buildProfileItem(context, Icons.info_outline, LanguageService.tr('about_app'), LanguageService.tr('about_subtitle')),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen())),
                      icon: const Icon(Icons.logout, color: AppColors.error),
                      label: Text(isGuest ? LanguageService.tr('guest_logout') : LanguageService.tr('logout'), style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 15)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: AppColors.error, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileItem(BuildContext context, IconData icon, String title, String subtitle, {VoidCallback? onTap}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: ListTile(
        leading: CircleAvatar(backgroundColor: AppColors.primary.withValues(alpha: 0.1), child: Icon(icon, color: AppColors.primary)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textDark)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: onTap ?? () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${LanguageService.tr('clicked_on')} $title'))),
      ),
    );
  }
}
