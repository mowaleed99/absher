import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../models/student.dart';
import 'chat_screen.dart';
import 'login_screen.dart';

class RoommateFormScreen extends StatefulWidget {
  final Student? user;

  const RoommateFormScreen({super.key, required this.user});

  @override
  State<RoommateFormScreen> createState() => _RoommateFormScreenState();
}

class _RoommateFormScreenState extends State<RoommateFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  final _nationalityController = TextEditingController();
  String _selectedGender = 'male';

  String? _selectedUniId;
  List<Map<String, dynamic>> _unisList = [];

  final _majorController = TextEditingController();
  late TextEditingController _wpController;
  String _moveInDate = 'choose_date';
  final _noteController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final isGuest = widget.user == null ||
        widget.user!.id == 0 ||
        widget.user!.fullName.contains(LanguageService.tr('guest_name')) ||
        widget.user!.fullName.contains(LanguageService.tr('auto_trans_1211'));
    _nameController = TextEditingController(
        text: !isGuest ? (widget.user?.fullName ?? '') : '');
    _wpController =
        TextEditingController(text: !isGuest ? (widget.user?.phone ?? '') : '');
    _loadUniversities(!isGuest ? widget.user?.universityId : null);
  }

  Future<void> _loadUniversities(int? userUniId) async {
    final list = await ApiService.getUniversities();
    if (mounted) {
      setState(() {
        _unisList = list;
        if (userUniId != null &&
            userUniId > 0 &&
            _unisList.any((u) => u['id']?.toString() == userUniId.toString())) {
          _selectedUniId = userUniId.toString();
        } else if (_unisList.isNotEmpty) {
          _selectedUniId = _unisList.first['id']?.toString();
        }
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nationalityController.dispose();
    _majorController.dispose();
    _wpController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  bool _checkGuest() {
    final isGuest = widget.user == null ||
        widget.user!.id == 0 ||
        widget.user!.fullName.contains(LanguageService.tr('guest_name')) ||
        widget.user!.fullName.contains(LanguageService.tr('auto_trans_1211'));
    if (isGuest) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            LanguageService.tr('guest_alert_title'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: Text(
            LanguageService.tr('guest_alert_desc'),
            textAlign: TextAlign.center,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(LanguageService.tr('cancel'),
                  style: const TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              child: Text(LanguageService.tr('login_btn')),
            ),
          ],
        ),
      );
      return true;
    }
    return false;
  }

  Future<void> _submitRoommateForm() async {
    if (_checkGuest()) return;

    if (!_formKey.currentState!.validate()) return;
    if (_moveInDate == 'choose_date') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(LanguageService.tr('auto_trans_1215')),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final selectedUniMap = _unisList.firstWhere(
      (u) => u['id']?.toString() == _selectedUniId,
      orElse: () => <String, dynamic>{},
    );
    final selectedUniName =
        selectedUniMap['name']?.toString() ?? 'جامعة غير محددة';

    final String resolvedGender = _selectedGender == 'male'
        ? (LanguageService.currentLang.value == 'ar' ? 'ذكر' : 'Male')
        : (LanguageService.currentLang.value == 'ar' ? 'أنثى' : 'Female');
    final String resolvedNotes = _noteController.text.isNotEmpty
        ? _noteController.text
        : LanguageService.tr('auto_trans_1217');

    final msg = LanguageService.tr('auto_trans_1216') +
        LanguageService.formatRentRequestMessage(
          name: _nameController.text,
          nationality: _nationalityController.text,
          gender: resolvedGender,
          university: selectedUniName,
          major: _majorController.text,
          whatsapp: _wpController.text,
          moveInDate: _moveInDate,
          notes: resolvedNotes,
        );

    setState(() => _isSubmitting = true);

    try {
      await ApiService.submitServiceRequest(
        studentName: _nameController.text,
        studentPhone: _wpController.text,
        studentUni: selectedUniName,
        universityId: int.tryParse(_selectedUniId ?? ''),
        serviceTitle: LanguageService.isEn
            ? 'Roommate Search Request'
            : 'طلب بحث عن شريك سكن',
        details: msg,
      );
      if (!mounted) return;
      setState(() => _isSubmitting = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم إرسال طلب البحث عن شريك سكن بنجاح!'),
          backgroundColor: Color(0xFF10B981),
        ),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ChatScreen(user: widget.user),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${LanguageService.tr('error_sending_request')}: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          title: Text(
            LanguageService.tr('roommate_form_title'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          centerTitle: true,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Form Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primaryDark, AppColors.primary],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.person_search_rounded,
                        color: AppColors.accent,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            LanguageService.tr('roommate_form_title'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            LanguageService.tr('auto_trans_1233'),
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Form Container
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. Full Name
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('full_name'),
                          prefixIcon: const Icon(Icons.person_outline,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 2),
                          ),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? LanguageService.tr('auto_trans_1235')
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // 2. Nationality
                      TextFormField(
                        controller: _nationalityController,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('nationality_label'),
                          prefixIcon: const Icon(Icons.flag_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 2),
                          ),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? LanguageService.tr('auto_trans_1237')
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // 3. Gender
                      DropdownButtonFormField<String>(
                        isExpanded: true,
                        initialValue: _selectedGender,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('gender_label'),
                          prefixIcon: const Icon(Icons.wc_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                        items: ['male', 'female']
                            .map((g) => DropdownMenuItem(
                                value: g,
                                child: Text(
                                  LanguageService.tr(g),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                )))
                            .toList(),
                        onChanged: (val) =>
                            setState(() => _selectedGender = val ?? 'male'),
                      ),
                      const SizedBox(height: 16),

                      // 4. University
                      DropdownButtonFormField<String?>(
                        isExpanded: true,
                        initialValue: _unisList.any((u) =>
                                u['id']?.toString() == _selectedUniId)
                            ? _selectedUniId
                            : null,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1238'),
                          prefixIcon: const Icon(Icons.school_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                        items: _unisList.map((uni) {
                          return DropdownMenuItem<String?>(
                            value: uni['id']?.toString(),
                            child: Text(
                              uni['name']?.toString() ?? '',
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                              style: const TextStyle(fontSize: 13),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) =>
                            setState(() => _selectedUniId = val),
                      ),
                      const SizedBox(height: 16),

                      // 5. Major
                      TextFormField(
                        controller: _majorController,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1239'),
                          prefixIcon: const Icon(Icons.menu_book_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 2),
                          ),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? LanguageService.tr('auto_trans_1240')
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // 6. WhatsApp Number
                      TextFormField(
                        controller: _wpController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1241'),
                          prefixIcon: const Icon(Icons.phone_android_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 2),
                          ),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty
                            ? LanguageService.tr('auto_trans_1242')
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // 7. Move-in Date
                      TextFormField(
                        readOnly: true,
                        controller: TextEditingController(
                            text: _moveInDate == 'choose_date'
                                ? LanguageService.tr('auto_trans_1243')
                                : _moveInDate),
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1243'),
                          prefixIcon: const Icon(Icons.calendar_month_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 365)),
                          );
                          if (date != null) {
                            setState(() {
                              _moveInDate =
                                  '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                            });
                          }
                        },
                        validator: (v) => _moveInDate == 'choose_date'
                            ? LanguageService.tr('auto_trans_1244')
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // 8. Notes
                      TextFormField(
                        controller: _noteController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1245'),
                          prefixIcon: const Icon(Icons.note_alt_outlined,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _isSubmitting ? null : _submitRoommateForm,
                          icon: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.support_agent,
                                  color: Colors.white, size: 22),
                          label: Text(
                            LanguageService.tr('auto_trans_1246'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
