import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import 'register_screen.dart';
import 'home_screen.dart';
import '../services/language_service.dart';
import '../models/student.dart';
import 'admin/admin_login_screen.dart';
import 'admin/admin_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMessage = '';

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final result = await ApiService.login(
        _identifierController.text.trim(),
        _passwordController.text,
      );

      setState(() => _isLoading = false);

      if (result['status'] == 'success' && result['user'] != null) {
        final student = Student.fromJson(result['user'] as Map<String, dynamic>);
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (_) => HomeScreen(user: student, isGuest: false),
            ),
            (route) => false,
          );
        }
      } else {
        setState(() {
          _errorMessage = result['message']?.toString() ?? LanguageService.tr('login_fail');
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  void _enterAsGuest() {
    final guestUser = Student(id: 0, fullName: LanguageService.tr('guest_name'));
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => HomeScreen(
          user: guestUser,
          isGuest: true,
        ),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // اللوجو الرسمي في أعلى الدخول
                  Container(
                    width: 100,
                    height: 100,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryDark,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.accent, width: 2),
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => Center(
                          child: Text(LanguageService.tr('app_title').split(' ')[0], style: const TextStyle(color: AppColors.accent, fontSize: 24, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    LanguageService.tr('login_welcome'),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textDark),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    LanguageService.tr('login_subtitle'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 28),

                  if (_errorMessage.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.error),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.error),
                          const SizedBox(width: 10),
                          Expanded(child: Text(_errorMessage, style: const TextStyle(color: AppColors.error, fontSize: 13))),
                        ],
                      ),
                    ),

                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            controller: _identifierController,
                            decoration: InputDecoration(
                              labelText: LanguageService.tr('email_or_phone'),
                              prefixIcon: const Icon(Icons.person_outline, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                            ),
                            validator: (value) => value == null || value.isEmpty ? LanguageService.tr('please_enter_email') : null,
                          ),
                          const SizedBox(height: 18),

                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: LanguageService.tr('password'),
                              prefixIcon: const Icon(Icons.lock_outline, color: AppColors.primary),
                              suffixIcon: IconButton(
                                icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: AppColors.textMuted),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                            ),
                            validator: (value) => value == null || value.isEmpty ? LanguageService.tr('please_enter_password') : null,
                          ),
                          const SizedBox(height: 12),

                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton(
                              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(LanguageService.tr('contact_support_pw')))),
                              child: Text(LanguageService.tr('forgot_pw'), style: const TextStyle(color: AppColors.primary)),
                            ),
                          ),
                          const SizedBox(height: 16),

                          ElevatedButton(
                            onPressed: _isLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 2,
                            ),
                            child: _isLoading
                                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text(LanguageService.tr('login_btn'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _enterAsGuest,
                      icon: const Icon(Icons.explore_outlined, color: AppColors.accent),
                      label: Text(LanguageService.tr('enter_as_guest'), style: const TextStyle(color: AppColors.textDark, fontSize: 16, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: AppColors.accent, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        backgroundColor: AppColors.accentLight.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ApiService.adminToken != null
                                ? const AdminShell()
                                : const AdminLoginScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.admin_panel_settings, color: Colors.white),
                      label: Text(LanguageService.tr('admin_portal_btn'), style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryDark,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(LanguageService.tr('no_account_yet'), style: const TextStyle(color: AppColors.textMuted)),
                      TextButton(
                        onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const RegisterScreen())),
                        child: Text(LanguageService.tr('create_new_account'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
