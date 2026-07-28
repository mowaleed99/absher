import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import 'login_screen.dart';
import 'wallet_screen.dart';
import '../services/api_service.dart';
import 'admin/admin_login_screen.dart';
import 'admin/admin_shell.dart';
import 'edit_profile_screen.dart';
import 'change_password_screen.dart';
import '../models/student.dart';
import 'my_reviews_screen.dart';
import 'feedback_screen.dart';
import 'package:image_picker/image_picker.dart';

class ProfileScreen extends StatefulWidget {
  final Student? user;
  final bool isGuest;
  const ProfileScreen({super.key, required this.user, required this.isGuest});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Student? _student;
  bool _isLoading = false;
  String _errorMessage = '';
  bool _isUploadingAvatar = false;
  int _avatarTimestamp = DateTime.now().millisecondsSinceEpoch;

  @override
  void initState() {
    super.initState();
    _student = widget.user;
    if (!widget.isGuest) {
      _fetchProfile();
    }
  }

  String _localTr(String key, String fallbackAr, String fallbackEn) {
    final translation = LanguageService.tr(key);
    if (translation == key) {
      return LanguageService.currentLang.value == 'ar' ? fallbackAr : fallbackEn;
    }
    return translation;
  }

  String get _siteRootUrl {
    final base = ApiService.baseUrl;
    if (base.endsWith('/api')) {
      return base.substring(0, base.length - 4);
    }
    return base;
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final freshProfile = await ApiService.getCurrentUser();
      if (mounted) {
        setState(() {
          if (freshProfile != null) {
            _student = freshProfile;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = _localTr('failed_load_profile', 'فشل تحميل بيانات الحساب', 'Failed to load profile');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickAndUploadAvatar() async {
    if (widget.isGuest) return;

    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      
      if (image == null) return;

      final bytes = await image.readAsBytes();

      if (!mounted) return;

      // Show confirmation dialog with preview
      showDialog(
        context: context,
        builder: (dialogCtx) => AlertDialog(
          title: Text(_localTr('confirm_avatar_title', 'تغيير الصورة الشخصية', 'Change Profile Image')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_localTr('confirm_avatar_desc', 'هل تريد حفظ الصورة المختارة كصورة شخصية جديدة؟', 'Do you want to set the selected image as your profile picture?')),
              const SizedBox(height: 16),
              ClipOval(
                child: Image.memory(
                  bytes,
                  width: 120,
                  height: 120,
                  fit: BoxFit.cover,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: Text(_localTr('cancel', 'إلغاء', 'Cancel')),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogCtx);
                _performAvatarUpload(image);
              },
              child: Text(_localTr('confirm', 'تأكيد', 'Confirm')),
            ),
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_localTr('image_pick_error', 'حدث خطأ أثناء اختيار الصورة', 'Error selecting image'))),
      );
    }
  }

  Future<void> _performAvatarUpload(XFile file) async {
    setState(() {
      _isUploadingAvatar = true;
    });

    try {
      final result = await ApiService.uploadAvatar(file);
      if (mounted) {
        setState(() {
          _isUploadingAvatar = false;
        });

        if (result['success'] == true && result['avatar_url'] != null) {
          setState(() {
            _student = _student?.copyWith(avatarUrl: result['avatar_url']);
            _avatarTimestamp = DateTime.now().millisecondsSinceEpoch;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'تم تحديث الصورة بنجاح'), backgroundColor: AppColors.success),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'فشل رفع الصورة الشخصية'), backgroundColor: AppColors.error),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploadingAvatar = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    }
  }

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
            _buildLangOption(context, 'ka', LanguageService.tr('georgian_lang_label')),
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

  Widget _buildAvatarWidget() {
    ImageProvider? imageProvider;
    if (_student?.avatarUrl != null && _student!.avatarUrl!.isNotEmpty) {
      final resolvedUrl = ApiService.resolveImageUrl(_student!.avatarUrl!);
      final fullUrl = '$resolvedUrl${resolvedUrl.contains('?') ? '&' : '?'}t=$_avatarTimestamp';
      imageProvider = NetworkImage(fullUrl);
    }

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        CircleAvatar(
          radius: 50,
          backgroundColor: AppColors.accent,
          child: CircleAvatar(
            radius: 46,
            backgroundColor: Colors.white,
            backgroundImage: imageProvider,
            child: imageProvider == null
                ? Icon(widget.isGuest ? Icons.person_outline : Icons.person, size: 55, color: AppColors.primary)
                : null,
          ),
        ),
        if (_isUploadingAvatar)
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.black38,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
              ),
            ),
          ),
        if (!widget.isGuest && !_isUploadingAvatar)
          InkWell(
            onTap: _pickAndUploadAvatar,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
            ),
          ),
        if (widget.isGuest)
          Container(
            padding: const EdgeInsets.all(6),
            decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
            child: const Icon(Icons.check, color: Colors.white, size: 16),
          ),
      ],
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
              actions: [
                if (!widget.isGuest && !_isLoading)
                  IconButton(
                    icon: const Icon(Icons.refresh, color: Colors.white),
                    onPressed: _fetchProfile,
                  ),
              ],
            ),
            body: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _errorMessage.isNotEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                              const SizedBox(height: 16),
                              Text(_errorMessage, style: const TextStyle(color: AppColors.textDark, fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _fetchProfile,
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                child: Text(_localTr('retry', 'إعادة المحاولة', 'Retry'), style: const TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            // Profile Card
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))],
                              ),
                              child: Column(
                                children: [
                                  _buildAvatarWidget(),
                                  const SizedBox(height: 16),
                                  Text(
                                    _student?.fullName ?? LanguageService.tr('default_student_name'),
                                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                                    child: Text(
                                      _student?.university ?? LanguageService.tr('default_student_uni'),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(color: AppColors.accentLight, fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            if (widget.isGuest)
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

                            // Language Selection Card
                            Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                              elevation: 1,
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                                leading: const CircleAvatar(backgroundColor: AppColors.accent, child: Icon(Icons.language, color: AppColors.textDark)),
                                title: Text(LanguageService.tr('change_lang'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textDark)),
                                subtitle: Text(LanguageService.tr('lang_desc'), style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                                onTap: () => _showLanguageDialog(context),
                              ),
                            ),

                            // Profile Specific Options
                            if (!widget.isGuest) ...[
                              _buildProfileItem(
                                context,
                                Icons.edit,
                                _localTr('edit_profile_title', 'تعديل الملف الشخصي', 'Edit Profile'),
                                _localTr('edit_profile_sub', 'تعديل الاسم والبريد والهاتف والجامعة', 'Update name, email, phone, and university'),
                                onTap: () async {
                                  final result = await Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => EditProfileScreen(student: _student!)),
                                  );
                                  if (result != null && result is Student) {
                                    setState(() {
                                      _student = result;
                                    });
                                  }
                                },
                              ),
                              _buildProfileItem(
                                context,
                                Icons.lock_outline,
                                _localTr('change_password', 'تغيير كلمة المرور', 'Change Password'),
                                _localTr('change_password_sub', 'تحديث كلمة مرور حسابك بأمان', 'Update your password securely'),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const ChangePasswordScreen()),
                                  );
                                },
                              ),
                            ],

                            _buildProfileItem(context, Icons.bookmark_added, LanguageService.tr('my_bookings'), LanguageService.tr('booking_status_subtitle')),
                            
                            if (!widget.isGuest) ...[
                              _buildProfileItem(
                                context,
                                Icons.rate_review_outlined,
                                LanguageService.tr('my_reviews'),
                                LanguageService.tr('reviews_screen_title'),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const MyReviewsScreen()),
                                  );
                                },
                              ),
                              _buildProfileItem(
                                context,
                                Icons.feedback_outlined,
                                LanguageService.tr('feedback_menu_option'),
                                LanguageService.tr('feedback_form_title'),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const FeedbackScreen()),
                                  );
                                },
                              ),
                            ],
                            
                            _buildProfileItem(
                              context, 
                              Icons.account_balance_wallet, 
                              LanguageService.tr('wallet_points'), 
                              LanguageService.tr('wallet_subtitle'),
                              onTap: () {
                                if (!widget.isGuest) {
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => WalletScreen(user: _student)));
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(LanguageService.tr('please_login_wallet'))));
                                }
                              }
                            ),
                            
                            _buildProfileItem(context, Icons.phone_in_talk, LanguageService.tr('contact_support'), LanguageService.tr('support_subtitle')),
                            _buildProfileItem(context, Icons.info_outline, LanguageService.tr('about_app'), LanguageService.tr('about_subtitle')),
                            const SizedBox(height: 12),

                            Card(
                              margin: const EdgeInsets.only(bottom: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 2,
                              color: AppColors.primaryDark,
                              child: ListTile(
                                leading: const CircleAvatar(
                                  backgroundColor: AppColors.accent,
                                  child: Icon(Icons.admin_panel_settings, color: AppColors.primaryDark),
                                ),
                                title: Text(LanguageService.tr('admin_portal_btn'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                                subtitle: Text(LanguageService.tr('admin_portal_sub'), style: const TextStyle(fontSize: 12, color: AppColors.accentLight)),
                                trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.accent),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ApiService.adminToken != null
                                          ? const AdminShell()
                                          : const AdminLoginScreen(),
                                    ),
                                  );
                                },
                              ),
                            ),

                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () async {
                                  await ApiService.clearTokens();
                                  if (context.mounted) {
                                    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
                                  }
                                },
                                icon: const Icon(Icons.logout, color: AppColors.error),
                                label: Text(widget.isGuest ? LanguageService.tr('guest_logout') : LanguageService.tr('logout'), style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 15)),
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
