import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';
import 'login_screen.dart';
import '../services/language_service.dart';
import '../models/student.dart';

class RoommateMatchScreen extends StatefulWidget {
  final Student? user;
  const RoommateMatchScreen({super.key, required this.user});

  @override
  State<RoommateMatchScreen> createState() => _RoommateMatchScreenState();
}

class _RoommateMatchScreenState extends State<RoommateMatchScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;

  String? _selectedUniId;
  List<Map<String, dynamic>> _unisList = [];
  final _majorController = TextEditingController();

  final _phoneController = TextEditingController();
  final _budgetController = TextEditingController();
  final _notesController = TextEditingController();
  String _selectedGender = 'males_only';
  String _selectedHousingPref = 'room_shared';
  String _moveInDate = 'this_month_move';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user?.fullName ?? '');
    _phoneController.text = widget.user?.phone ?? '';
    _loadUniversities(widget.user?.universityId);
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
    _phoneController.dispose();
    _budgetController.dispose();
    _notesController.dispose();
    _majorController.dispose();
    super.dispose();
  }

  void _submitForm() {
    final isGuest = widget.user == null ||
        widget.user!.id == 0 ||
        widget.user!.fullName.contains(LanguageService.tr('auto_trans_1249'));
    if (isGuest) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(LanguageService.tr('guest_alert_title'),
              style: const TextStyle(fontWeight: FontWeight.bold)),
          content: Text(LanguageService.tr('guest_alert_body_roommate')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(LanguageService.tr('cancel'),
                  style: const TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              style:
                  ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
              child: Text(LanguageService.tr('auto_trans_1250'),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final String housingPrefText;
    if (_selectedHousingPref == 'apartment') {
      housingPrefText = LanguageService.currentLang.value == 'ar'
          ? 'شقة كاملة'
          : 'Entire apartment';
    } else if (_selectedHousingPref == 'studio') {
      housingPrefText =
          LanguageService.currentLang.value == 'ar' ? 'استوديو' : 'Studio';
    } else {
      housingPrefText = LanguageService.currentLang.value == 'ar'
          ? 'غرفة في شقة مشتركة'
          : 'Room in a shared apartment';
    }

    final String genderPrefText;
    if (_selectedGender == 'males_only') {
      genderPrefText =
          LanguageService.currentLang.value == 'ar' ? 'ذكور فقط' : 'Males only';
    } else {
      genderPrefText = LanguageService.currentLang.value == 'ar'
          ? 'إناث فقط'
          : 'Females only';
    }

    final String moveInText;
    if (_moveInDate == 'immediate_move') {
      moveInText =
          LanguageService.currentLang.value == 'ar' ? 'فوري' : 'Immediate';
    } else if (_moveInDate == 'this_month_move') {
      moveInText = LanguageService.currentLang.value == 'ar'
          ? 'خلال هذا الشهر'
          : 'Within this month';
    } else {
      moveInText = LanguageService.currentLang.value == 'ar'
          ? 'مع بداية الفصل الدراسي الجديد'
          : 'At the start of the new semester';
    }

    final selectedUniMap = _unisList.firstWhere(
      (u) => u['id']?.toString() == _selectedUniId,
      orElse: () => <String, dynamic>{},
    );
    final selectedUniName = selectedUniMap['name']?.toString() ??
        (LanguageService.currentLang.value == 'ar'
            ? 'جامعة غير محددة'
            : 'Unspecified University');

    final matchMsg = LanguageService.formatRoommateRequestMessage(
      name: _nameController.text,
      university: selectedUniName,
      major: _majorController.text,
      budget: _budgetController.text,
      housingPref: housingPrefText,
      partnerPref: genderPrefText,
      moveInDate: moveInText,
      notes: _notesController.text.isNotEmpty
          ? _notesController.text
          : LanguageService.tr("auto_trans_1285"),
    );

    // Show loading spinner
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(width: 20),
            Expanded(
                child: Text(LanguageService.tr('auto_trans_1251'),
                    style: const TextStyle(fontFamily: 'Cairo'))),
          ],
        ),
      ),
    );

    ApiService.submitServiceRequest(
      studentName: _nameController.text.isNotEmpty
          ? _nameController.text
          : (widget.user!.fullName),
      studentPhone: _phoneController.text,
      studentUni: selectedUniName,
      universityId: int.tryParse(_selectedUniId ?? ''),
      serviceTitle: 'طلب بحث عن شريك سكن',
      details: matchMsg,
    ).then((_) {
      if (!context.mounted) return;
      Navigator.pop(context); // Dismiss loading spinner
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ChatScreen(user: widget.user),
        ),
      );
    }).catchError((e) {
      if (!context.mounted) return;
      Navigator.pop(context); // Dismiss loading spinner
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text('${LanguageService.tr('error_sending_request')}: $e')),
      );
    });
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
          title: Text(LanguageService.tr('auto_trans_1255'),
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // كارت شرح الخدمة
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryDark]),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.accent, width: 1.5),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.group_add,
                        color: AppColors.accent, size: 36),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(LanguageService.tr('roommate_match_card_title'),
                              style: const TextStyle(
                                  color: AppColors.accent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16)),
                          const SizedBox(height: 4),
                          Text(LanguageService.tr('roommate_match_card_desc'),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  height: 1.4)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text(LanguageService.tr('your_info_and_prefs'),
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark)),
              const SizedBox(height: 14),

              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.cardBg,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4))
                  ],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1256'),
                          prefixIcon: const Icon(Icons.person,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) => v!.isEmpty
                            ? LanguageService.tr('auto_trans_1257')
                            : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String?>(
                        value: _unisList.any(
                                (u) => u['id']?.toString() == _selectedUniId)
                            ? _selectedUniId
                            : null,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1258'),
                          prefixIcon: const Icon(Icons.school,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        items: _unisList.map((uni) {
                          return DropdownMenuItem<String?>(
                              value: uni['id']?.toString(),
                              child: Text(uni['name']?.toString() ?? '',
                                  style: const TextStyle(fontSize: 13)));
                        }).toList(),
                        onChanged: (val) =>
                            setState(() => _selectedUniId = val),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _majorController,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1259'),
                          prefixIcon:
                              const Icon(Icons.book, color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) => v!.isEmpty
                            ? LanguageService.tr('auto_trans_1260')
                            : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1261'),
                          prefixIcon:
                              const Icon(Icons.phone, color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) => v!.isEmpty
                            ? LanguageService.tr('auto_trans_1262')
                            : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _budgetController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1263'),
                          prefixIcon: const Icon(Icons.attach_money,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (v) => v!.isEmpty
                            ? LanguageService.tr('auto_trans_1264')
                            : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedHousingPref,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('housing_type_req'),
                          prefixIcon:
                              const Icon(Icons.home, color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        items: [
                          DropdownMenuItem(
                              value: 'apartment',
                              child: Text(
                                  LanguageService.getLocalizedHousingType(
                                      'apartment'))),
                          DropdownMenuItem(
                              value: 'room_shared',
                              child: Text(
                                  LanguageService.getLocalizedHousingType(
                                      'room_shared'))),
                          DropdownMenuItem(
                              value: 'studio',
                              child: Text(
                                  LanguageService.getLocalizedHousingType(
                                      'studio'))),
                        ],
                        onChanged: (val) =>
                            setState(() => _selectedHousingPref = val!),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedGender,
                        decoration: InputDecoration(
                          labelText: "شريك السكن المفضل",
                          prefixIcon:
                              const Icon(Icons.wc, color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        items: ['males_only', 'females_only']
                            .map((g) => DropdownMenuItem(
                                value: g, child: Text(LanguageService.tr(g))))
                            .toList(),
                        onChanged: (val) =>
                            setState(() => _selectedGender = val!),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _moveInDate,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('move_in_date_label'),
                          prefixIcon: const Icon(Icons.calendar_today,
                              color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        items: [
                          'immediate_move',
                          'this_month_move',
                          'next_semester_move'
                        ]
                            .map((d) => DropdownMenuItem(
                                value: d, child: Text(LanguageService.tr(d))))
                            .toList(),
                        onChanged: (val) => setState(() => _moveInDate = val!),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _notesController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('auto_trans_1265'),
                          prefixIcon:
                              const Icon(Icons.note, color: AppColors.primary),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _submitForm,
                          icon: const Icon(Icons.send, color: Colors.white),
                          label: Text(LanguageService.tr('auto_trans_1266'),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
