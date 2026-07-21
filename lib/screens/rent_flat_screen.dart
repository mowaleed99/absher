import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';
import 'login_screen.dart';
import 'flats_list_screen.dart';
import '../services/language_service.dart';
import '../models/student.dart';

class RentFlatScreen extends StatefulWidget {
  final Student? user;
  final List<Map<String, dynamic>> apartments;

  const RentFlatScreen({super.key, required this.user, required this.apartments});

  @override
  State<RentFlatScreen> createState() => _RentFlatScreenState();
}

class _RentFlatScreenState extends State<RentFlatScreen> {
  // Form Controllers for Find Roommate
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  final _nationalityController = TextEditingController();
  String _selectedGender = 'male';
  
  String _selectedUni = LanguageService.tr('auto_trans_1207');
  List<String> _universities = [LanguageService.tr('auto_trans_1208')];
  
  final _majorController = TextEditingController();
  late TextEditingController _wpController;
  String _moveInDate = 'choose_date';
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final isGuest = widget.user == null || widget.user!.id == 0 || widget.user!.fullName.contains(LanguageService.tr('auto_trans_1211'));
    _nameController = TextEditingController(text: !isGuest ? (widget.user?.fullName ?? '') : '');
    _wpController = TextEditingController(text: !isGuest ? (widget.user?.phone ?? '') : '');
    _loadUniversities(!isGuest ? ((widget.user?.universityId != null && widget.user!.universityId! > 0) ? 'University #${widget.user!.universityId}' : '') : '');
  }

  Future<void> _loadUniversities(String userUni) async {
    final unis = await ApiService.getUniversities();
    if (mounted) {
      setState(() {
        if (unis.isNotEmpty) {
          _universities = unis.map((u) => (u['name'] ?? '').toString()).where((n) => n.isNotEmpty).toList();
        }
        if (userUni.isNotEmpty) {
          if (!_universities.contains(userUni)) {
            _universities.add(userUni);
          }
          _selectedUni = userUni;
        } else if (!_universities.contains(_selectedUni)) {
          _selectedUni = _universities.first;
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
    final isGuest = widget.user == null || widget.user!.id == 0 || widget.user!.fullName.contains(LanguageService.tr('auto_trans_1214'));
    if (isGuest) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(LanguageService.tr('guest_alert_title'), style: const TextStyle(fontWeight: FontWeight.bold)),
          content: Text(LanguageService.tr('guest_alert_body_booking')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(LanguageService.tr('cancel'), style: const TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
              child: Text(LanguageService.tr('auto_trans_1215'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return true;
    }
    return false;
  }

  void _submitRoommateForm() {
    if (_checkGuest()) return;
    if (!_formKey.currentState!.validate()) return;

    final msg = LanguageService.tr('auto_trans_1216');
        'الاسم: ${_nameController.text}\n'
        'الجنسية: ${_nationalityController.text}\n'
        'النوع: $_selectedGender\n'
        'الجامعة: $_selectedUni\n'
        'التخصص: ${_majorController.text}\n'
        'رقم الواتساب: ${_wpController.text}\n'
        'موعد النقل: $_moveInDate\n'
        'ملاحظات: ${_noteController.text.isNotEmpty ? _noteController.text : LanguageService.tr('auto_trans_1217')}';

    // Show loading spinner
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(width: 20),
            Expanded(child: Text(LanguageService.tr('auto_trans_1218'), style: const TextStyle(fontFamily: 'Cairo'))),
          ],
        ),
      ),
    );

    ApiService.submitServiceRequest(
      details: '${LanguageService.tr('auto_trans_1221')}\n$msg',
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
        SnackBar(content: Text('${LanguageService.tr('error_sending_request')}: $e')),
      );
    });
  }

  void _contactCustomerServiceAlone() {
    if (_checkGuest()) return;

    // Show loading spinner
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(width: 20),
            Expanded(child: Text(LanguageService.tr('auto_trans_1222'), style: const TextStyle(fontFamily: 'Cairo'))),
          ],
        ),
      ),
    );

    final aloneMsg = LanguageService.tr('auto_trans_1223');

    ApiService.submitServiceRequest(
      details: '${LanguageService.tr('auto_trans_1226')}\n$aloneMsg',
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
        SnackBar(content: Text('${LanguageService.tr('connection_error')}: $e')),
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
          title: Text(LanguageService.tr('auto_trans_1227'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          iconTheme: const IconThemeData(color: Colors.white),
          actions: [
            IconButton(
              icon: const Icon(Icons.support_agent, color: Colors.white),
              onPressed: _contactCustomerServiceAlone,
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // عنوان الشاشة والوصف
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 6))],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.real_estate_agent, color: AppColors.accent, size: 40),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(LanguageService.tr('choose_housing_method'), style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 17)),
                          const SizedBox(height: 4),
                          Text(LanguageService.tr('housing_method_desc'), style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 1. قسم السكن بمفردي (Alone -> All Flats Sc / Flat Sc / Customer Service)
              _buildAloneSection(),
              const SizedBox(height: 32),
              const Divider(thickness: 2, color: AppColors.accent),
              const SizedBox(height: 24),

              // 2. قسم نموذج البحث عن شريك سكن (Find Roommate -> Form -> Customer Service)
              _buildRoommateFormSection(),
            ],
          ),
        ),
      ),
    );
  }

  // 1. قسم السكن بمفردي (Alone -> All Flats Sc / Flat Sc / Customer Service)
  Widget _buildAloneSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // الخيار الأول: All Flats Sc
        _buildAloneCard(
          title: LanguageService.tr('browse_flats'),
          subtitle: LanguageService.tr('browse_flats_desc'),
          icon: Icons.apartment,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => FlatsListScreen(
                apartments: widget.apartments,
                user: widget.user,
                title: LanguageService.tr('auto_trans_1228'),
                subtitle: LanguageService.tr('auto_trans_1229'),
                filterSingleOnly: false,
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),

        // الخيار الثاني: Flat Sc
        _buildAloneCard(
          title: LanguageService.tr('flat_room_choice'),
          subtitle: LanguageService.tr('flat_room_desc'),
          icon: Icons.person_pin_circle,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => FlatsListScreen(
                apartments: widget.apartments,
                user: widget.user,
                title: LanguageService.tr('auto_trans_1230'),
                subtitle: LanguageService.tr('auto_trans_1231'),
                filterSingleOnly: true,
              ),
            ),
          ),
        ),

      ],
    );
  }

  Widget _buildAloneCard({required String title, required String subtitle, required IconData icon, required VoidCallback onTap, bool isPrimary = false}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isPrimary ? [AppColors.primaryDark, AppColors.primary] : [Colors.white, const Color(0xFFF8F9FA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isPrimary ? AppColors.primary : Colors.grey.shade200, width: 1.5),
          boxShadow: [
            BoxShadow(color: isPrimary ? AppColors.primary.withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.06), blurRadius: 15, offset: const Offset(0, 5))
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isPrimary ? Colors.white.withValues(alpha: 0.2) : AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: isPrimary ? Colors.white : AppColors.primary, size: 28),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: isPrimary ? Colors.white : AppColors.textDark)),
                  const SizedBox(height: 6),
                  Text(subtitle, style: TextStyle(fontSize: 13, color: isPrimary ? Colors.white.withValues(alpha: 0.8) : AppColors.textMuted, height: 1.5)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: isPrimary ? Colors.white : Colors.grey.shade400, size: 18),
          ],
        ),
      ),
    );
  }

  // 2. قسم نموذج البحث عن شريك سكن (Find Roommate -> Form -> Customer Service)
  Widget _buildRoommateFormSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(LanguageService.tr('auto_trans_1232'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textDark)),
            const SizedBox(height: 6),
            Text(LanguageService.tr('auto_trans_1233'), style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
            const SizedBox(height: 20),

            // 1. Name
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1234'),
                prefixIcon: const Icon(Icons.person_outline, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              validator: (v) => v!.isEmpty ? LanguageService.tr('auto_trans_1235') : null,
            ),
            const SizedBox(height: 14),

            // 2. Nationality
            TextFormField(
              controller: _nationalityController,
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1236'),
                prefixIcon: const Icon(Icons.flag_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              validator: (v) => v!.isEmpty ? LanguageService.tr('auto_trans_1237') : null,
            ),
            const SizedBox(height: 14),

            // 3. Gender
            DropdownButtonFormField<String>(
              initialValue: _selectedGender,
              decoration: InputDecoration(
                labelText: LanguageService.tr('gender_label'),
                prefixIcon: const Icon(Icons.wc_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              items: ['male', 'female'].map((g) => DropdownMenuItem(value: g, child: Text(LanguageService.tr(g)))).toList(),
              onChanged: (val) => setState(() => _selectedGender = val!),
            ),
            const SizedBox(height: 14),

            // 4. Uni
            DropdownButtonFormField<String>(
              initialValue: _selectedUni,
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1238'),
                prefixIcon: const Icon(Icons.school_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              items: _universities.map((uni) {
                return DropdownMenuItem(value: uni, child: Text(uni, style: const TextStyle(fontSize: 13)));
              }).toList(),
              onChanged: (val) => setState(() => _selectedUni = val!),
            ),
            const SizedBox(height: 14),

            // 5. Major
            TextFormField(
              controller: _majorController,
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1239'),
                prefixIcon: const Icon(Icons.menu_book_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              validator: (v) => v!.isEmpty ? LanguageService.tr('auto_trans_1240') : null,
            ),
            const SizedBox(height: 14),

            // 6. WP Number
            TextFormField(
              controller: _wpController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1241'),
                prefixIcon: const Icon(Icons.phone_android_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              validator: (v) => v!.isEmpty ? LanguageService.tr('auto_trans_1242') : null,
            ),
            const SizedBox(height: 14),

            // 7. When do u wanna move?
            TextFormField(
              readOnly: true,
              controller: TextEditingController(text: _moveInDate),
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1243'),
                prefixIcon: const Icon(Icons.calendar_month_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) {
                  setState(() {
                    _moveInDate = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                  });
                }
              },
              validator: (v) => _moveInDate == 'choose_date' ? LanguageService.tr('auto_trans_1244') : null,
            ),
            const SizedBox(height: 14),

            // 9. Note
            TextFormField(
              controller: _noteController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: LanguageService.tr('auto_trans_1245'),
                prefixIcon: const Icon(Icons.note_alt_outlined, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 24),

            // 10. Customer Service Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _submitRoommateForm,
                icon: const Icon(Icons.support_agent, color: Colors.white, size: 24),
                label: Text(LanguageService.tr('auto_trans_1246'), style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981), // Green color representing WhatsApp / Customer Service
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
