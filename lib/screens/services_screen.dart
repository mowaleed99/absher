import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'chat_screen.dart';
import '../services/language_service.dart';
import '../models/student.dart';

class ServicesScreen extends StatefulWidget {
  final Student? user;
  const ServicesScreen({super.key, required this.user});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  List<Map<String, dynamic>> _services = [
    {'title': LanguageService.tr('auto_trans_1267'), 'desc': LanguageService.tr('auto_trans_1268'), 'img': 'assets/images/10_20260712_212013_0001.png'},
    {'title': LanguageService.tr('auto_trans_1269'), 'desc': LanguageService.tr('auto_trans_1270'), 'img': 'assets/images/13_20260712_212014_0004.png'},
    {'title': LanguageService.tr('auto_trans_1271'), 'desc': LanguageService.tr('auto_trans_1272'), 'img': 'assets/images/14_20260712_212014_0005.png'},
    {'title': LanguageService.tr('auto_trans_1273'), 'desc': LanguageService.tr('auto_trans_1274'), 'img': 'assets/images/15_20260712_212014_0006.png'},
    {'title': LanguageService.tr('auto_trans_1275'), 'desc': LanguageService.tr('auto_trans_1276'), 'img': 'assets/images/16_20260712_212014_0007.png'},
  ];

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    final list = await ApiService.getServices();
    if (mounted) {
      setState(() {
        _services = list;
      });
    }
  }

  Widget _buildImageWidget(String url) {
    if (url.startsWith('data:image/')) {
      try {
        final base64String = url.split(',').last;
        final bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackIcon(),
        );
      } catch (e) {
        return _buildFallbackIcon();
      }
    }
    if (url.startsWith('assets/')) {
      return Image.asset(
        url,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildFallbackIcon(),
      );
    }
    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _buildFallbackIcon(),
    );
  }

  Widget _buildFallbackIcon() {
    return Container(
      color: AppColors.primaryDark,
      child: const Icon(Icons.handyman, color: AppColors.accent, size: 40),
    );
  }

  void _showServiceForm(BuildContext context, String initialServiceTitle) {
    final isGuest = widget.user == null || widget.user!.id == 0 || widget.user!.fullName.contains(LanguageService.tr('auto_trans_1277'));
    if (isGuest) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.lock_outline, color: AppColors.accent, size: 28),
              const SizedBox(width: 8),
              Text(LanguageService.tr('guest_alert_title'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(LanguageService.tr('guest_alert_body_services')),
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
              child: Text(LanguageService.tr('auto_trans_1278'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    String selectedService = initialServiceTitle;
    final nameCtrl = TextEditingController(text: widget.user?.fullName ?? '');
    final phoneCtrl = TextEditingController(text: widget.user?.phone ?? '');
    final addressCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: LanguageService.tr('auto_trans_1279'));
    final detailsCtrl = TextEditingController();
    final promoCtrl = TextEditingController();
    final roomsCtrl = TextEditingController(text: '2');
    final metersCtrl = TextEditingController(text: '60');
    double calcPrice = 60 * 3.5;
    bool hasAttachedImage = false;
    bool payWithPoints = false;
    XFile? attachedImageFile;

    Future<void> pickImage(StateSetter setDialogState) async {
      try {
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(source: ImageSource.gallery);
        if (image != null) {
          setDialogState(() {
            attachedImageFile = image;
            hasAttachedImage = true;
          });
        }
      } catch (e) {
        debugPrint("Error picking image: $e");
      }
    }

    Future<void> pickDateTime(StateSetter setDialogState) async {
      final date = await showDatePicker(
        context: context,
        initialDate: DateTime.now(),
        firstDate: DateTime.now(),
        lastDate: DateTime.now().add(const Duration(days: 365)),
      );
      if (date != null) {
        if (!context.mounted) return;
        final time = await showTimePicker(
          context: context,
          initialTime: TimeOfDay.now(),
        );
        if (time != null) {
          setDialogState(() {
            dateCtrl.text = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${time.format(context)}';
          });
        }
      }
    }

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          final isCleanHome = selectedService.contains(LanguageService.tr('auto_trans_1280')) || selectedService.contains('Clean');
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Row(
              children: [
                const Icon(Icons.assignment, color: AppColors.primary, size: 26),
                const SizedBox(width: 8),
                Text(LanguageService.tr('service_form_title'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 17)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(LanguageService.tr('service_form_desc'), style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  const SizedBox(height: 12),

                  // 1. اختيار الخدمة
                  TextField(
                    controller: TextEditingController(text: selectedService),
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('requested_service'),
                      prefixIcon: const Icon(Icons.build_circle, color: AppColors.primary),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      fillColor: Colors.grey.shade100,
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 2. الاسم ورقم الهاتف
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('full_name_label'),
                      prefixIcon: const Icon(Icons.person, color: AppColors.primary),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('whatsapp_contact_short'),
                      prefixIcon: const Icon(Icons.phone, color: AppColors.primary),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // 3. العنوان
                  TextField(
                    controller: addressCtrl,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('detailed_address'),
                      prefixIcon: const Icon(Icons.location_on, color: AppColors.primary),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // 4. أفضل وقت مناسب (تقويم)
                  TextField(
                    controller: dateCtrl,
                    readOnly: true,
                    onTap: () => pickDateTime(setDialogState),
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('best_time_to_execute'),
                      prefixIcon: const Icon(Icons.calendar_month, color: AppColors.accent),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 5. صورة (اختياري)
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => pickImage(setDialogState),
                      icon: Icon(hasAttachedImage ? Icons.check_circle : Icons.image, color: hasAttachedImage ? Colors.green : AppColors.primary),
                      label: Text(hasAttachedImage ? LanguageService.tr('image_attached_success') : LanguageService.tr('attach_image_optional'), style: TextStyle(color: hasAttachedImage ? Colors.green : AppColors.primary)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(color: hasAttachedImage ? Colors.green : AppColors.textMuted.withValues(alpha: 0.3)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (isCleanHome) ...[
                    Text(LanguageService.tr('cleaning_details_title'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: roomsCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(labelText: LanguageService.tr('number_of_rooms'), border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: metersCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(labelText: LanguageService.tr('area_in_meters'), border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                            onChanged: (val) {
                              final m = double.tryParse(val) ?? 0;
                              setDialogState(() => calcPrice = m * 3.5);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppColors.accentLight, borderRadius: BorderRadius.circular(8)),
                      child: Text('${LanguageService.tr('estimated_cost')} ~${calcPrice.toStringAsFixed(1)} ${LanguageService.tr('currency_gel')}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 12)),
                    ),
                    const SizedBox(height: 12),
                  ],

                  TextField(
                    controller: detailsCtrl,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: LanguageService.tr('notes_details_hint'),
                      labelText: LanguageService.tr('notes_and_details'),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: promoCtrl,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('promo_code'),
                      prefixIcon: const Icon(Icons.discount, color: AppColors.accent),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  CheckboxListTile(
                    title: Text(LanguageService.tr('use_wallet_points'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary)),
                    value: payWithPoints,
                    activeColor: AppColors.accent,
                    onChanged: (val) {
                      setDialogState(() => payWithPoints = val ?? false);
                    },
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: Text(LanguageService.tr('auto_trans_1281'), style: const TextStyle(color: AppColors.textMuted))),
              ElevatedButton(
                 onPressed: () {
                  String reqMsg = 'طلب خدمة ($selectedService):\n'
                      'الاسم: ${nameCtrl.text}\n'
                      'رقم الهاتف: ${phoneCtrl.text}\n'
                      'العنوان: ${addressCtrl.text.isNotEmpty ? addressCtrl.text : LanguageService.tr('auto_trans_1282')}\n'
                      'موعد التنفيذ: ${dateCtrl.text}\n'
                      'إرفاق صورة: ${hasAttachedImage ? LanguageService.tr('auto_trans_1283') : LanguageService.tr('auto_trans_1284')}\n'
                      'التفاصيل: ${detailsCtrl.text.isNotEmpty ? detailsCtrl.text : LanguageService.tr('auto_trans_1285')}.';
                  if (isCleanHome) {
                    reqMsg += '\n[تفاصيل التنظيف: ${roomsCtrl.text} غرف، مساحة ${metersCtrl.text} متر، التكلفة التقديرية $calcPrice لاري].';
                  }
                  if (promoCtrl.text.isNotEmpty) {
                    reqMsg += '\n[كود الخصم: ${promoCtrl.text}].';
                  }
                  reqMsg += '\n[طريقة الدفع: ${payWithPoints ? LanguageService.tr('auto_trans_1286') : LanguageService.tr('auto_trans_1287')}]';

                  // 1. Show loading spinner
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (_) => AlertDialog(
                      content: Row(
                        children: [
                          const CircularProgressIndicator(color: AppColors.primary),
                          const SizedBox(width: 20),
                          Expanded(child: Text(LanguageService.tr('sending_service_request'), style: const TextStyle(fontFamily: 'Cairo'))),
                        ],
                      ),
                    ),
                  );

                  // 2. Submit service request directly to database
                  Future<void> submitData() async {
                    String finalDetails = reqMsg;
                    if (attachedImageFile != null) {
                      final uploadedUrl = await ApiService.uploadFile(
                        attachedImageFile!.path,
                        attachedImageFile!.name,
                        fileBytes: await attachedImageFile!.readAsBytes(),
                      );
                      if (uploadedUrl != null) {
                        finalDetails += '\n\n[رابط الصورة المرفقة: $uploadedUrl]';
                      }
                    }

                    final requestResult = await ApiService.submitServiceRequest(
                      details: 'خدمة ($selectedService)\n$finalDetails',
                    );

                    if (payWithPoints) {
                      final result = await ApiService.payWithPoints(requestResult);
                      if (result['status'] == 'error') {
                        throw Exception(result['message'] ?? LanguageService.tr('auto_trans_1288'));
                      }
                    }
                  }

                  submitData().then((_) {
                    if (!context.mounted) return;
                    Navigator.pop(context); // Dismiss loading spinner
                    Navigator.pop(context); // Close dialog form
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ChatScreen(user: widget.user),
                      ),
                    );
                  }).catchError((e) {
                    if (!context.mounted) return;
                    Navigator.pop(context); // Dismiss loading spinner
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('${LanguageService.tr('error_sending_service')} $e')),
                    );
                  });
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                child: Text(LanguageService.tr('submit_form_confirm'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      ),
    );
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
          title: Text(LanguageService.tr('all_student_services'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        body: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: 0.63,
          ),
          itemCount: _services.length,
          itemBuilder: (context, index) {
            final s = _services[index];
            final hasForm = s['has_form'] == true || s['has_form'] == 1;

            return Card(
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
              shadowColor: Colors.black.withValues(alpha: 0.15),
              child: InkWell(
                onTap: () => _showServiceForm(context, s['title'] as String),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Larger Image Header (Takes 55% of card height)
                    Expanded(
                      flex: 15,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          _buildImageWidget(s['img']?.toString() ?? ''),
                          if (hasForm)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade600,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.2),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    )
                                  ]
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.edit_note, color: Colors.white, size: 12),
                                    const SizedBox(width: 2),
                                    Text(LanguageService.tr('instant_tag'), style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    
                    // Card Body (Text and Button below)
                    Expanded(
                      flex: 12,
                      child: Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              children: [
                                Text(
                                  s['title'] as String,
                                  textAlign: TextAlign.center,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textDark),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  s['desc'] as String,
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.3),
                                ),
                              ],
                            ),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.2),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  )
                                ]
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                LanguageService.tr('request_service_button'), 
                                style: const TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
