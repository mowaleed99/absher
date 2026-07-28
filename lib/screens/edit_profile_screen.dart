import 'package:flutter/material.dart';
import '../models/student.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../theme/app_colors.dart';

class EditProfileScreen extends StatefulWidget {
  final Student student;
  const EditProfileScreen({super.key, required this.student});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _customUniController;

  String _selectedUni = '';
  List<String> _universities = [];
  bool _isLoadingUnis = true;
  bool _isSaving = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.student.fullName);
    _emailController = TextEditingController(text: widget.student.email ?? '');
    _phoneController = TextEditingController(text: widget.student.phone ?? '');
    _customUniController = TextEditingController();

    _loadUniversities();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _customUniController.dispose();
    super.dispose();
  }

  String _localTr(String key, String fallbackAr, String fallbackEn) {
    final translation = LanguageService.tr(key);
    if (translation == key) {
      return LanguageService.currentLang.value == 'ar' ? fallbackAr : fallbackEn;
    }
    return translation;
  }

  Future<void> _loadUniversities() async {
    final otherUniText = _localTr('other_uni_manual', 'أخرى (إدخال يدوي)', 'Other (Manual Entry)');
    
    try {
      final unis = await ApiService.getUniversities();
      if (mounted) {
        setState(() {
          if (unis.isNotEmpty) {
            _universities = unis
                .map((u) => (u['name'] ?? '').toString())
                .where((n) => n.isNotEmpty)
                .toList();
          } else {
            _universities = [
              _localTr('auto_trans_1205', 'جامعة تبليسي الطبية (TSMU)', 'Tbilisi State Medical University (TSMU)'),
              'University of Georgia (UG)',
              'Ilia State University',
              'Tbilisi State University (TSU)'
            ];
          }
          _universities.add(otherUniText);
          
          final currentUni = widget.student.university ?? '';
          if (_universities.contains(currentUni)) {
            _selectedUni = currentUni;
          } else if (currentUni.isNotEmpty) {
            _selectedUni = otherUniText;
            _customUniController.text = currentUni;
          } else {
            _selectedUni = _universities.first;
          }
          _isLoadingUnis = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _universities = [
            _localTr('auto_trans_1205', 'جامعة تبليسي الطبية (TSMU)', 'Tbilisi State Medical University (TSMU)'),
            otherUniText
          ];
          _selectedUni = _universities.first;
          _isLoadingUnis = false;
        });
      }
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final otherUniText = _localTr('other_uni_manual', 'أخرى (إدخال يدوي)', 'Other (Manual Entry)');
    final uniVal = _selectedUni == otherUniText 
        ? _customUniController.text.trim() 
        : _selectedUni;

    setState(() {
      _isSaving = true;
      _errorMessage = '';
    });

    try {
      final result = await ApiService.updateProfile(
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        university: uniVal,
      );

      if (mounted) {
        setState(() => _isSaving = false);
        if (result['success'] == true && result['student'] != null) {
          Navigator.pop(context, result['student'] as Student);
        } else {
          setState(() {
            _errorMessage = result['message'] ?? _localTr('error_occurred', 'حدث خطأ ما', 'An error occurred');
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _localTr('edit_profile_title', 'تعديل الملف الشخصي', 'Edit Profile');
    final otherUniText = _localTr('other_uni_manual', 'أخرى (إدخال يدوي)', 'Other (Manual Entry)');
    
    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        ),
        body: _isLoadingUnis
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
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

                      // Full Name Field
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: _localTr('full_name', 'الاسم الكامل', 'Full Name'),
                          prefixIcon: const Icon(Icons.person_outline, color: AppColors.primary),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return _localTr('required_field', 'حقل مطلوب', 'Required field');
                          }
                          if (val.trim().length < 3) {
                            return _localTr('name_too_short', 'الاسم قصير جداً (3 أحرف على الأقل)', 'Name is too short (min 3 characters)');
                          }
                          if (val.trim().length > 150) {
                            return _localTr('name_too_long', 'الاسم طويل جداً (الحد الأقصى 150 حرفاً)', 'Name is too long (max 150 characters)');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // Email Field
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: _localTr('email', 'البريد الإلكتروني', 'Email'),
                          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return _localTr('required_field', 'حقل مطلوب', 'Required field');
                          }
                          if (!val.contains('@') || !val.contains('.')) {
                            return _localTr('invalid_email', 'البريد الإلكتروني غير صالح', 'Invalid email address');
                          }
                          if (val.trim().length > 150) {
                            return _localTr('email_too_long', 'البريد الإلكتروني طويل جداً', 'Email is too long');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // Phone Field
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: _localTr('phone_example', 'رقم الهاتف (مثال: 995555123456+)', 'Phone number'),
                          prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.primary),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return _localTr('required_field', 'حقل مطلوب', 'Required field');
                          }
                          if (val.trim().length < 5 || val.trim().length > 50) {
                            return _localTr('phone_len_error', 'رقم الهاتف يجب أن يكون بين 5 و 50 رقم', 'Phone number must be between 5 and 50 characters');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // University Dropdown
                      DropdownButtonFormField<String>(
                        value: _selectedUni,
                        decoration: InputDecoration(
                          labelText: _localTr('georgia_uni', 'الجامعة في جورجيا', 'University in Georgia'),
                          prefixIcon: const Icon(Icons.school_outlined, color: AppColors.primary),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: _universities.map((uni) {
                          return DropdownMenuItem(value: uni, child: Text(uni, style: const TextStyle(fontSize: 13)));
                        }).toList(),
                        onChanged: _isSaving ? null : (val) => setState(() => _selectedUni = val!),
                      ),
                      const SizedBox(height: 18),

                      // Custom University Entry
                      if (_selectedUni == otherUniText) ...[
                        TextFormField(
                          controller: _customUniController,
                          decoration: InputDecoration(
                            labelText: _localTr('uni_and_district', 'اسم الجامعة واسم الحي المنطقه', 'University & District'),
                            prefixIcon: const Icon(Icons.edit_location_alt_outlined, color: AppColors.primary),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return _localTr('please_enter_uni_dist', 'يرجى إدخال اسم الجامعة والحي', 'Please enter university and district');
                            }
                            if (val.trim().length > 150) {
                              return _localTr('uni_too_long', 'الاسم طويل جداً (الحد الأقصى 150 حرفاً)', 'University name is too long (max 150 characters)');
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 18),
                      ],

                      const SizedBox(height: 12),

                      // Save Button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _handleSave,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                )
                              : Text(
                                  _localTr('save', 'حفظ التعديلات', 'Save Changes'),
                                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
