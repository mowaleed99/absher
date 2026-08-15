import 'package:flutter/material.dart';
import '../models/student.dart';
import '../models/country_code.dart';
import '../widgets/country_picker_bottom_sheet.dart';
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
  late TextEditingController _localPhoneController;
  late TextEditingController _customUniController;

  late CountryCode _selectedCountry;

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

    final rawPhone = widget.student.phone ?? '';
    _selectedCountry = CountryCode.findCountryByPhone(rawPhone);
    String localPart = rawPhone;
    if (localPart.startsWith(_selectedCountry.dialCode)) {
      localPart = localPart.substring(_selectedCountry.dialCode.length);
    } else if (localPart.startsWith('+')) {
      localPart = localPart.substring(1);
    }
    _localPhoneController = TextEditingController(text: localPart);

    _customUniController = TextEditingController();
    _loadUniversities();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _localPhoneController.dispose();
    _customUniController.dispose();
    super.dispose();
  }

  Future<void> _pickCountry() async {
    final selected = await CountryPickerBottomSheet.show(
      context,
      selectedCountry: _selectedCountry,
    );
    if (selected != null && mounted) {
      setState(() {
        _selectedCountry = selected;
      });
    }
  }

  Future<void> _loadUniversities() async {
    final otherUniText = LanguageService.tr('other_uni_manual');

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
            _universities = [];
          }
          _universities.add(otherUniText);

          final currentUni = widget.student.university ?? '';
          if (_universities.contains(currentUni)) {
            _selectedUni = currentUni;
          } else if (currentUni.isNotEmpty) {
            // Add the student's current university to the list so it shows correctly
            _universities.insert(_universities.length - 1, currentUni);
            _selectedUni = currentUni;
          } else {
            _selectedUni = _universities.first;
          }
          _isLoadingUnis = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          final currentUni = widget.student.university ?? '';
          _universities = currentUni.isNotEmpty
              ? [currentUni, otherUniText]
              : [otherUniText];
          _selectedUni = _universities.first;
          _isLoadingUnis = false;
        });
      }
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final otherUniText = LanguageService.tr('other_uni_manual');
    final uniVal = _selectedUni == otherUniText
        ? _customUniController.text.trim()
        : _selectedUni;

    setState(() {
      _isSaving = true;
      _errorMessage = '';
    });

    try {
      final local = _localPhoneController.text.trim().replaceAll(RegExp(r'^0+'), '');
      final fullPhone = '${_selectedCountry.dialCode}$local';

      final result = await ApiService.updateProfile(
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: fullPhone,
        university: uniVal,
      );

      if (mounted) {
        setState(() => _isSaving = false);
        if (result['success'] == true && result['student'] != null) {
          Navigator.pop(context, result['student'] as Student);
        } else {
          setState(() {
            _errorMessage =
                result['message'] ?? LanguageService.tr('error_occurred');
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
    final title = LanguageService.tr('edit_profile_title');
    final otherUniText = LanguageService.tr('other_uni_manual');

    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          centerTitle: true,
          leading: const BackButton(color: Colors.white),
          title: Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18)),
        ),
        body: _isLoadingUnis
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary))
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
                              const Icon(Icons.error_outline,
                                  color: AppColors.error),
                              const SizedBox(width: 10),
                              Expanded(
                                  child: Text(_errorMessage,
                                      style: const TextStyle(
                                          color: AppColors.error,
                                          fontSize: 13))),
                            ],
                          ),
                        ),

                      // Full Name Field
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('full_name'),
                          prefixIcon: const Icon(Icons.person_outline,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return LanguageService.tr('required_field');
                          }
                          if (val.trim().length < 3) {
                            return LanguageService.tr('name_too_short');
                          }
                          if (val.trim().length > 150) {
                            return LanguageService.tr('name_too_long');
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
                          labelText: LanguageService.tr('email'),
                          prefixIcon: const Icon(Icons.email_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return LanguageService.tr('required_field');
                          }
                          if (!val.contains('@') || !val.contains('.')) {
                            return LanguageService.tr('invalid_email');
                          }
                          if (val.trim().length > 150) {
                            return LanguageService.tr('email_too_long');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // Phone Field مع محدد كود الدولة
                      FormField<String>(
                        validator: (_) {
                          final local = _localPhoneController.text.trim();
                          if (local.isEmpty) {
                            return LanguageService.tr('required_field');
                          }
                          final clean =
                              local.replaceAll(RegExp(r'[\s\-]'), '');
                          if (!RegExp(r'^[0-9]{6,15}$').hasMatch(clean)) {
                            return LanguageService.currentLang.value == 'ar'
                                ? 'يرجى إدخال رقم هاتف صحيح'
                                : 'Please enter a valid phone number';
                          }
                          return null;
                        },
                        builder: (fieldState) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              InputDecorator(
                                decoration: InputDecoration(
                                  labelText:
                                      LanguageService.tr('phone_example'),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                        color: AppColors.error),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 12),
                                  prefixIcon: InkWell(
                                    onTap: _isSaving ? null : _pickCountry,
                                    borderRadius: BorderRadius.circular(12),
                                    child: Padding(
                                      padding:
                                          const EdgeInsetsDirectional.only(
                                              start: 12, end: 8),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            _selectedCountry.flag,
                                            style:
                                                const TextStyle(fontSize: 20),
                                          ),
                                          const SizedBox(width: 6),
                                          Directionality(
                                            textDirection: TextDirection.ltr,
                                            child: Text(
                                              _selectedCountry.dialCode,
                                              style: const TextStyle(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 2),
                                          const Icon(
                                            Icons.keyboard_arrow_down,
                                            color: AppColors.primary,
                                            size: 18,
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            width: 1.2,
                                            height: 24,
                                            color: Colors.grey.shade300,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                child: Directionality(
                                  textDirection: TextDirection.ltr,
                                  child: TextField(
                                    controller: _localPhoneController,
                                    keyboardType: TextInputType.phone,
                                    enabled: !_isSaving,
                                    decoration: InputDecoration(
                                      hintText: '123456789',
                                      hintStyle: TextStyle(
                                        color: Colors.grey.shade400,
                                        fontSize: 14,
                                      ),
                                      border: InputBorder.none,
                                      isDense: true,
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                              vertical: 4),
                                    ),
                                    style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500),
                                    onChanged: (val) =>
                                        fieldState.didChange(val),
                                  ),
                                ),
                              ),
                              if (fieldState.hasError)
                                Padding(
                                  padding: const EdgeInsets.only(
                                      top: 6, left: 12, right: 12),
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
                      const SizedBox(height: 18),

                      // University Dropdown
                      DropdownButtonFormField<String>(
                        initialValue: _selectedUni,
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
                        onChanged: _isSaving
                            ? null
                            : (val) => setState(() => _selectedUni = val!),
                      ),
                      const SizedBox(height: 18),

                      // Custom University Entry
                      if (_selectedUni == otherUniText) ...[
                        TextFormField(
                          controller: _customUniController,
                          decoration: InputDecoration(
                            labelText: LanguageService.tr('uni_and_district'),
                            prefixIcon: const Icon(
                                Icons.edit_location_alt_outlined,
                                color: AppColors.primary),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return LanguageService.tr(
                                  'please_enter_uni_dist');
                            }
                            if (val.trim().length > 150) {
                              return LanguageService.tr('uni_too_long');
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
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14)),
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2.5),
                                )
                              : Text(
                                  LanguageService.tr('save'),
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold),
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
