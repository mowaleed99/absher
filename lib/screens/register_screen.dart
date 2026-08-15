import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import '../services/language_service.dart';
import '../models/student.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  // Local 9-digit part only (user types: 5XXXXXXXX)
  final _localPhoneController = TextEditingController();
  final _passwordController = TextEditingController();
  static const String _countryCode = '+995';

  final _customUniController = TextEditingController();

  String _selectedUni = '';
  List<String> _universities = [];
  bool _isLoadingUnis = true;

  @override
  void initState() {
    super.initState();
    _loadUniversities();
  }

  Future<void> _loadUniversities() async {
    final unis = await ApiService.getUniversities();
    if (mounted) {
      setState(() {
        _isLoadingUnis = false;
        if (unis.isNotEmpty) {
          _universities = unis
              .map((u) => (u['name'] ?? '').toString())
              .where((n) => n.isNotEmpty)
              .toList();
          _universities.add(LanguageService.tr('other_uni_manual'));
        } else {
          _universities = [LanguageService.tr('other_uni_manual')];
        }
        _selectedUni = _universities.first;
      });
    }
  }

  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMessage = '';

  /// Returns the full phone number in E.164 format: +995XXXXXXXXX
  String get _fullPhone => _countryCode + _localPhoneController.text.trim();

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final result = await ApiService.register(
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _fullPhone,
        university: _selectedUni == LanguageService.tr('other_uni_manual')
            ? _customUniController.text.trim()
            : _selectedUni,
        password: _passwordController.text,
      );

      setState(() => _isLoading = false);

      if (result['status'] == 'success' && result['user'] != null) {
        final student =
            Student.fromJson(result['user'] as Map<String, dynamic>);
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
          _errorMessage = result['message']?.toString() ??
              LanguageService.tr('register_fail');
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
    final guestUser =
        Student(id: 0, fullName: LanguageService.tr('guest_name'));
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
                  Text(
                    LanguageService.tr('create_account_title'),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    LanguageService.tr('create_account_subtitle'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 24),

                  if (_errorMessage.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.error),
                      ),
                      child: Text(
                        _errorMessage,
                        style: const TextStyle(
                            color: AppColors.error, fontSize: 13),
                      ),
                    ),

                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // الاسم الكامل
                          TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: LanguageService.tr('full_name'),
                              prefixIcon: const Icon(Icons.badge_outlined,
                                  color: AppColors.primary),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            validator: (value) => value == null || value.isEmpty
                                ? LanguageService.tr('required_field')
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // البريد الإلكتروني
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: LanguageService.tr('email'),
                              prefixIcon: const Icon(Icons.email_outlined,
                                  color: AppColors.primary),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            validator: (value) =>
                                value == null || !value.contains('@')
                                    ? LanguageService.tr('invalid_email')
                                    : null,
                          ),
                          const SizedBox(height: 16),

                          // رقم الهاتف — fixed +995 prefix + local 9-digit input
                          FormField<String>(
                            validator: (_) {
                              final local = _localPhoneController.text.trim();
                              if (local.isEmpty) {
                                return LanguageService.tr('required_field');
                              }
                              // Must be exactly 9 digits starting with 5
                              final reg = RegExp(r'^5[0-9]{8}$');
                              if (!reg.hasMatch(local)) {
                                return LanguageService.currentLang.value == 'ar'
                                    ? 'رقم الهاتف غير صالح. أدخل 9 أرقام تبدأ بـ 5 (مثال: 555123456)'
                                    : 'Invalid number. Enter 9 digits starting with 5 (e.g. 555123456)';
                              }
                              return null;
                            },
                            builder: (fieldState) {
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  InputDecorator(
                                    decoration: InputDecoration(
                                      labelText: LanguageService.tr('phone_example'),
                                      prefixIcon: const Icon(
                                          Icons.phone_outlined,
                                          color: AppColors.primary),
                                      border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(12)),
                                      errorBorder: OutlineInputBorder(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                            color: AppColors.error),
                                      ),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 14),
                                    ),
                                    child: Row(
                                      children: [
                                        // ── Fixed non-editable prefix ──
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary
                                                .withValues(alpha: 0.12),
                                            borderRadius:
                                                BorderRadius.circular(8),
                                          ),
                                          child: const Text(
                                            '+995',
                                            style: TextStyle(
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        // ── Editable local number ──
                                        Expanded(
                                          child: TextField(
                                            controller:
                                                _localPhoneController,
                                            keyboardType:
                                                TextInputType.number,
                                            maxLength: 9,
                                            decoration:
                                                const InputDecoration(
                                              hintText: '5XXXXXXXX',
                                              border: InputBorder.none,
                                              counterText: '',
                                              isDense: true,
                                            ),
                                            style: const TextStyle(
                                                fontSize: 15),
                                            onChanged: (_) =>
                                                fieldState.didChange(
                                                    _localPhoneController
                                                        .text),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (fieldState.hasError)
                                    Padding(
                                      padding: const EdgeInsets.only(
                                          top: 6, left: 12),
                                      child: Text(
                                        fieldState.errorText!,
                                        style: const TextStyle(
                                          color: AppColors.error,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                ],
                              );
                            },
                          ),
                          const SizedBox(height: 16),

                          // اختيار الجامعة
                          _isLoadingUnis
                              ? DropdownButtonFormField<String>(
                                  decoration: InputDecoration(
                                    labelText: LanguageService.tr('georgia_uni'),
                                    prefixIcon: const Icon(Icons.school_outlined,
                                        color: AppColors.primary),
                                    border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12)),
                                  ),
                                  items: const [
                                    DropdownMenuItem(
                                        value: '__loading__',
                                        child: Text('جاري التحميل...'))
                                  ],
                                  onChanged: null,
                                  initialValue: '__loading__',
                                )
                              : DropdownButtonFormField<String>(
                                  initialValue: _selectedUni.isEmpty ? null : _selectedUni,
                                  decoration: InputDecoration(
                                    labelText: LanguageService.tr('georgia_uni'),
                                    prefixIcon: const Icon(Icons.school_outlined,
                                        color: AppColors.primary),
                                    border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12)),
                                  ),
                                  items: _universities.map((uni) {
                                    return DropdownMenuItem(
                                        value: uni,
                                        child: Text(uni,
                                            style: const TextStyle(fontSize: 13)));
                                  }).toList(),
                                  onChanged: (val) =>
                                      setState(() => _selectedUni = val!),
                                ),
                          const SizedBox(height: 16),

                          if (_selectedUni ==
                              LanguageService.tr('other_uni_manual')) ...[
                            TextFormField(
                              controller: _customUniController,
                              decoration: InputDecoration(
                                labelText:
                                    LanguageService.tr('uni_and_district'),
                                prefixIcon: const Icon(
                                    Icons.edit_location_alt_outlined,
                                    color: AppColors.primary),
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12)),
                              ),
                              validator: (value) => value == null ||
                                      value.isEmpty
                                  ? LanguageService.tr('please_enter_uni_dist')
                                  : null,
                            ),
                            const SizedBox(height: 16),
                          ],

                          // كلمة المرور
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: LanguageService.tr('password'),
                              prefixIcon: const Icon(Icons.lock_outline,
                                  color: AppColors.primary),
                              suffixIcon: IconButton(
                                icon: Icon(_obscurePassword
                                    ? Icons.visibility_off
                                    : Icons.visibility),
                                onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword),
                              ),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            validator: (value) =>
                                value != null && value.length < 6
                                    ? LanguageService.tr('pw_min_6')
                                    : null,
                          ),
                          const SizedBox(height: 24),

                          // زر التسجيل
                          ElevatedButton(
                            onPressed: _isLoading ? null : _handleRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                        color: Colors.white))
                                : Text(LanguageService.tr('create_account_btn'),
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // زر الدخول كزائر
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _enterAsGuest,
                      icon: const Icon(Icons.explore_outlined,
                          color: AppColors.accent),
                      label: Text(
                        LanguageService.tr('enter_as_guest'),
                        style: const TextStyle(
                            color: AppColors.textDark,
                            fontSize: 16,
                            fontWeight: FontWeight.bold),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side:
                            const BorderSide(color: AppColors.accent, width: 2),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        backgroundColor:
                            AppColors.accentLight.withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(LanguageService.tr('already_have_account'),
                          style: const TextStyle(color: AppColors.textMuted)),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                                builder: (_) => const LoginScreen()),
                          );
                        },
                        child: Text(LanguageService.tr('login_btn'),
                            style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold)),
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
