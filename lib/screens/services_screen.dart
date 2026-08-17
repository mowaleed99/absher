// ignore_for_file: deprecated_member_use
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/realtime_sync_service.dart';
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
  int? _pointsBalance;
  List<Map<String, dynamic>> _services = [];
  bool _isLoading = true;
  String? _loadErrorKey;
  StreamSubscription? _servicesSub;
  StreamSubscription? _profileSub;

  @override
  void initState() {
    super.initState();
    _pointsBalance = widget.user?.pointsBalance;
    _loadServices();
    LanguageService.currentLang.addListener(_onLangChanged);

    _servicesSub = RealtimeSyncService().onServicesUpdated.listen((_) {
      if (mounted) _loadServices(silent: true);
    });

    _profileSub = RealtimeSyncService().onProfileUpdated.listen((meta) {
      if (mounted) {
        final pts = meta['points'] is int
            ? meta['points'] as int
            : int.tryParse(meta['points']?.toString() ?? '');
        if (pts != null && pts != _pointsBalance) {
          setState(() => _pointsBalance = pts);
        }
      }
    });
  }

  void _onLangChanged() {
    if (!mounted) return;
    _loadServices();
  }

  @override
  void dispose() {
    _servicesSub?.cancel();
    _profileSub?.cancel();
    LanguageService.currentLang.removeListener(_onLangChanged);
    super.dispose();
  }

  Future<void> _loadServices({bool silent = false}) async {
    if (!mounted) return;
    if (!silent) {
      setState(() {
        _isLoading = true;
        _loadErrorKey = null;
      });
    }
    try {
      final list = await ApiService.getServices();
      if (mounted) {
        setState(() {
          _services = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadErrorKey = 'failed_load_services';
          _isLoading = false;
        });
      }
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

  Future<void> _handleServiceTap(Map<String, dynamic> service) async {
    final isGuest = widget.user == null ||
        widget.user!.id == 0 ||
        widget.user!.fullName.contains(LanguageService.tr('auto_trans_1277'));
    if (isGuest) {
      _showServiceForm(context, service);
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final balance = await ApiService.getWalletBalance(widget.user!.id);
      if (mounted) {
        setState(() {
          _pointsBalance = balance;
        });
      }
    } catch (e) {
      debugPrint("Error fetching wallet balance: $e");
    } finally {
      if (mounted) Navigator.pop(context); // Pop loading indicator
    }

    if (mounted) {
      _showServiceForm(context, service);
    }
  }

  void _showServiceForm(BuildContext context, Map<String, dynamic> service) {
    final isGuest = widget.user == null ||
        widget.user!.id == 0 ||
        widget.user!.fullName.contains(LanguageService.tr('auto_trans_1277'));
    if (isGuest) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.lock_outline, color: AppColors.accent, size: 28),
              const SizedBox(width: 8),
              Text(LanguageService.tr('guest_alert_title'),
                  style: const TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(LanguageService.tr('guest_alert_body_services')),
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
              child: Text(LanguageService.tr('auto_trans_1278'),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    final initialServiceId = service['id']?.toString();
    String? selectedServiceId = initialServiceId;

    final nameCtrl = TextEditingController(text: widget.user?.fullName ?? '');
    final phoneCtrl = TextEditingController(text: widget.user?.phone ?? '');
    final addressCtrl = TextEditingController();
    final dateCtrl =
        TextEditingController(text: LanguageService.tr('auto_trans_1279'));
    final detailsCtrl = TextEditingController();
    final promoCtrl = TextEditingController();
    final roomsCtrl = TextEditingController(text: '2');
    final metersCtrl = TextEditingController(text: '60');
    double calcPrice = 60 * 3.5;
    String selectedPaymentMethod = 'wallet';

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
          final dt =
              DateTime(date.year, date.month, date.day, time.hour, time.minute);
          final formated =
              "${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} "
              "${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";
          setDialogState(() {
            dateCtrl.text = formated;
          });
        }
      }
    }

    Map<String, dynamic>? appliedPromoInfo;
    bool isValidatingPromo = false;
    String? promoError;

    Future<void> applyPromoCode(
        StateSetter setDialogState, int serviceId) async {
      final code = promoCtrl.text.trim().toUpperCase();
      if (code.isEmpty) return;
      setDialogState(() {
        isValidatingPromo = true;
        promoError = null;
      });
      try {
        final res = await ApiService.validatePromoCode(
          code: code,
          serviceId: serviceId,
          paymentMethod: 'wallet',
        );
        if (res['status'] == 'success' && res['data']?['is_valid'] == true) {
          setDialogState(() {
            appliedPromoInfo = res['data'];
            promoError = null;
            isValidatingPromo = false;
          });
        } else {
          setDialogState(() {
            appliedPromoInfo = null;
            promoError = res['message'] ??
                (LanguageService.currentLang.value == 'en'
                    ? 'Invalid promo code'
                    : 'كود الخصم غير صالح');
            isValidatingPromo = false;
          });
        }
      } catch (e) {
        setDialogState(() {
          appliedPromoInfo = null;
          promoError = e.toString().replaceAll('Exception:', '').trim();
          isValidatingPromo = false;
        });
      }
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          final currentSvc = _services.firstWhere(
              (s) => s['id']?.toString() == selectedServiceId,
              orElse: () => service);
          final currentTitle = currentSvc['title']?.toString() ?? '';
          final currentPrice =
              int.tryParse(currentSvc['price_points']?.toString() ?? '0') ?? 0;
          final currentServiceIdInt =
              int.tryParse(currentSvc['id']?.toString() ?? '0') ?? 0;
          final currentIsCleanHome =
              currentTitle.contains("تنظيف") || currentTitle.contains("Clean");

          if (currentIsCleanHome) {
            final double m2 = double.tryParse(metersCtrl.text) ?? 0;
            final double r = double.tryParse(roomsCtrl.text) ?? 0;
            calcPrice = (m2 * 2.5) + (r * 15.0);
          }

          final int originalPrice = currentPrice;
          final int discountPts =
              (appliedPromoInfo != null && selectedPaymentMethod == 'wallet')
                  ? (appliedPromoInfo!['discount_points'] as num? ??
                          appliedPromoInfo!['discount'] as num? ??
                          0)
                      .toInt()
                  : 0;
          final int effectivePrice =
              (appliedPromoInfo != null && selectedPaymentMethod == 'wallet')
                  ? (appliedPromoInfo!['final_price'] as num? ??
                          appliedPromoInfo!['final_price_points'] as num? ??
                          (originalPrice - discountPts))
                      .toInt()
                  : originalPrice;

          return AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            title: Row(
              children: [
                const Icon(Icons.design_services,
                    color: AppColors.accent, size: 28),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(LanguageService.tr('request_service_title'),
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16))),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.accentLight.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: AppColors.accent.withValues(alpha: 0.7)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.build,
                              color: AppColors.primaryDark, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currentTitle,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: AppColors.primaryDark,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              if (discountPts > 0)
                                Row(
                                  children: [
                                    Text(
                                      "$originalPrice نقطة",
                                      style: const TextStyle(
                                        decoration:
                                            TextDecoration.lineThrough,
                                        color: Colors.grey,
                                        fontSize: 11,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      "$effectivePrice نقطة",
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: Colors.green,
                                      ),
                                    ),
                                  ],
                                )
                              else
                                Text(
                                  originalPrice > 0
                                      ? "تكلفة الخدمة: $originalPrice نقطة"
                                      : LanguageService.tr('free_service'),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: originalPrice > 0
                                        ? AppColors.primary
                                        : Colors.green.shade700,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('full_name'),
                      prefixIcon:
                          const Icon(Icons.person, color: AppColors.accent),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: phoneCtrl,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('whatsapp_number'),
                      prefixIcon:
                          const Icon(Icons.phone, color: AppColors.accent),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: addressCtrl,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('detailed_address'),
                      hintText: LanguageService.tr('detailed_address_hint'),
                      prefixIcon: const Icon(Icons.location_on,
                          color: AppColors.accent),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  InkWell(
                    onTap: () => pickDateTime(setDialogState),
                    child: IgnorePointer(
                      child: TextField(
                        controller: dateCtrl,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('execution_time'),
                          prefixIcon: const Icon(Icons.calendar_today,
                              color: AppColors.accent),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (currentIsCleanHome) ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: roomsCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                                labelText: "عدد الغرف",
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12))),
                            onChanged: (val) => setDialogState(() {}),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: metersCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                                labelText: "المساحة (م²)",
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12))),
                            onChanged: (val) => setDialogState(() {}),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                          color: AppColors.accentLight,
                          borderRadius: BorderRadius.circular(8)),
                      child: Text(
                          LanguageService.formatCleaningEstimate(
                              calcPrice.toString()),
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                              color: AppColors.primary)),
                    ),
                    const SizedBox(height: 10),
                  ],

                  TextField(
                    controller: detailsCtrl,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: LanguageService.tr('additional_details'),
                      prefixIcon: const Icon(Icons.description,
                          color: AppColors.accent),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Payment Method Section
                  if (originalPrice > 0) ...[
                    Material(
                      color: Colors.grey.shade50,
                      shape: RoundedRectangleBorder(
                        side: BorderSide(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              LanguageService.tr('payment_method'),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppColors.primary),
                            ),
                            const SizedBox(height: 6),
                            RadioListTile<String>(
                              title: Text(
                                "${LanguageService.tr('auto_trans_1286')} ($effectivePrice ${LanguageService.tr('points_unit')})",
                                style: const TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(
                                LanguageService.formatCurrentBalance(
                                    _pointsBalance ?? 0),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: (_pointsBalance ?? 0) >= effectivePrice
                                      ? Colors.green
                                      : Colors.red,
                                ),
                              ),
                              value: 'wallet',
                              groupValue: selectedPaymentMethod,
                              activeColor: AppColors.accent,
                              contentPadding: EdgeInsets.zero,
                              onChanged: (val) {
                                setDialogState(() {
                                  selectedPaymentMethod = val ?? 'wallet';
                                });
                              },
                            ),
                            RadioListTile<String>(
                              title: Text(
                                LanguageService.tr('auto_trans_1287'),
                                style: const TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(
                                LanguageService.currentLang.value == 'ar'
                                    ? "يتم تحديد التكلفة النقدية مع خدمة العملاء"
                                    : "Cash cost is determined with customer service",
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Colors.blue,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              value: 'cash',
                              groupValue: selectedPaymentMethod,
                              activeColor: AppColors.accent,
                              contentPadding: EdgeInsets.zero,
                              onChanged: (val) {
                                setDialogState(() {
                                  selectedPaymentMethod = val ?? 'cash';
                                  appliedPromoInfo = null;
                                  promoCtrl.clear();
                                  promoError = null;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        border: Border.all(color: Colors.green.shade300),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        "هذه الخدمة مجانية بالكامل. لن يتم خصم أي نقاط من محفظتك.",
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],

                  // Promo Code Section (Wallet Payment Only)
                  if (originalPrice > 0 &&
                      selectedPaymentMethod == 'wallet') ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: promoCtrl,
                            textCapitalization: TextCapitalization.characters,
                            decoration: InputDecoration(
                              labelText: LanguageService.tr('promo_code'),
                              hintText: 'WELCOME20 / FIXED25',
                              prefixIcon: const Icon(Icons.discount,
                                  color: AppColors.accent),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: isValidatingPromo
                              ? null
                              : () => applyPromoCode(
                                  setDialogState, currentServiceIdInt),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: isValidatingPromo
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('تطبيق'),
                        ),
                      ],
                    ),
                    if (appliedPromoInfo != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          border: Border.all(color: Colors.green.shade300),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle,
                                color: Colors.green, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "تم تطبيق كود (${appliedPromoInfo!['code']}) بنجاح!",
                                    style: const TextStyle(
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12),
                                  ),
                                  Text(
                                    "وفرت $discountPts نقطة — السعر النهائي: $effectivePrice نقطة",
                                    style: TextStyle(
                                        color: Colors.green.shade800,
                                        fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close,
                                  size: 18, color: Colors.red),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                setDialogState(() {
                                  appliedPromoInfo = null;
                                  promoCtrl.clear();
                                  promoError = null;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (promoError != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          border: Border.all(color: Colors.red.shade300),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline,
                                color: Colors.red, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                promoError!,
                                style: const TextStyle(
                                    color: Colors.red,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ] else if (originalPrice > 0 &&
                      selectedPaymentMethod == 'cash') ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        border: Border.all(color: Colors.blue.shade200),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline,
                              color: Colors.blue.shade700, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              LanguageService.currentLang.value == 'en'
                                  ? "Promo codes are available for wallet points payments only."
                                  : "كود الخصم متاح عند الدفع بنقاط المحفظة فقط.",
                              style: TextStyle(
                                  color: Colors.blue.shade800,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (originalPrice > 0 &&
                      selectedPaymentMethod == 'wallet' &&
                      (_pointsBalance ?? 0) < effectivePrice) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF1F0),
                        border: Border.all(
                            color: const Color(0xFFFFA39E), width: 1.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline_rounded,
                              color: Color(0xFFCF1322), size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  LanguageService.currentLang.value == 'ar'
                                      ? "المحفظة فارغة / الرصيد غير كافٍ"
                                      : "Wallet Balance Insufficient",
                                  style: const TextStyle(
                                    color: Color(0xFFCF1322),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  LanguageService.currentLang.value == 'ar'
                                      ? "تكلفة الخدمة $effectivePrice نقطة ورصيدك الحالي ${_pointsBalance ?? 0} نقطة. يمكنك اختيار 'الدفع نقدًا' لإتمام الطلب."
                                      : "Service cost is $effectivePrice points and your balance is ${_pointsBalance ?? 0} points. You can select 'Pay in cash'.",
                                  style: const TextStyle(
                                    color: Color(0xFFA8071A),
                                    fontSize: 11,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(LanguageService.tr('auto_trans_1281'),
                      style: const TextStyle(color: AppColors.textMuted))),
              ElevatedButton(
                onPressed: () {
                  final finalSvc = _services.firstWhere(
                      (s) => s['id']?.toString() == selectedServiceId,
                      orElse: () => service);
                  final finalTitle = finalSvc['title']?.toString() ?? '';
                  final finalPrice = int.tryParse(
                          finalSvc['price_points']?.toString() ?? '0') ??
                      0;
                  final finalIsCleanHome = finalTitle.contains("تنظيف") ||
                      finalTitle.contains("Clean");
                  final finalServiceId =
                      int.tryParse(finalSvc['id']?.toString() ?? '');

                  final paymentMethod =
                      finalPrice > 0 ? selectedPaymentMethod : 'free';
                  final int discountPts =
                      (appliedPromoInfo != null && paymentMethod == 'wallet')
                          ? (appliedPromoInfo!['discount_points'] as num? ??
                                  appliedPromoInfo!['discount'] as num? ??
                                  0)
                              .toInt()
                          : 0;
                  final finalChargedPrice =
                      (appliedPromoInfo != null && paymentMethod == 'wallet')
                          ? (appliedPromoInfo!['final_price'] as num? ??
                                  appliedPromoInfo!['final_price_points'] as num? ??
                                  (finalPrice - discountPts))
                              .toInt()
                          : finalPrice;

                  if (finalPrice > 0 && paymentMethod == 'wallet') {
                    if ((_pointsBalance ?? 0) < finalChargedPrice) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content: Text(LanguageService.currentLang.value ==
                                    'ar'
                                ? 'رصيد محفظتك غير كافٍ لإتمام هذا الطلب'
                                : 'Your wallet balance is insufficient to complete this request')),
                      );
                      return;
                    }
                  }

                  final String resolvedAddress = addressCtrl.text.isNotEmpty
                      ? addressCtrl.text
                      : LanguageService.tr('auto_trans_1282');
                  final String resolvedDetails = detailsCtrl.text.isNotEmpty
                      ? detailsCtrl.text
                      : LanguageService.tr('auto_trans_1285');
                  final String paymentMethodText = finalPrice == 0
                      ? (LanguageService.currentLang.value == 'ar'
                          ? 'مجانية'
                          : 'Free')
                      : (paymentMethod == 'wallet'
                          ? (LanguageService.currentLang.value == 'ar'
                              ? 'خصم نقاط من المحفظة'
                              : 'Deduct points from wallet')
                          : (LanguageService.currentLang.value == 'ar'
                              ? 'نقدًا عند تنفيذ الخدمة'
                              : 'Cash upon execution'));

                  final String reqMsg =
                      LanguageService.formatServiceRequestMessage(
                    title: finalTitle,
                    name: nameCtrl.text,
                    phone: phoneCtrl.text,
                    address: resolvedAddress,
                    executionTime: dateCtrl.text,
                    hasImage: false,
                    details: resolvedDetails,
                    rooms: finalIsCleanHome ? roomsCtrl.text : null,
                    meters: finalIsCleanHome ? metersCtrl.text : null,
                    calcPrice: finalIsCleanHome ? calcPrice.toString() : null,
                    promoCode:
                        promoCtrl.text.isNotEmpty ? promoCtrl.text : null,
                    paymentMethod: paymentMethodText,
                  );

                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (_) => AlertDialog(
                      content: Row(
                        children: [
                          const CircularProgressIndicator(
                              color: AppColors.primary),
                          const SizedBox(width: 20),
                          Expanded(
                              child: Text(
                                  LanguageService.tr('sending_service_request'),
                                  style: const TextStyle(fontFamily: 'Cairo'))),
                        ],
                      ),
                    ),
                  );

                  final requestUuid = ApiService.generateUuidV4();

                  Future<void> submitData() async {
                    String finalDetails = reqMsg;

                    final requestResult = await ApiService.submitServiceRequest(
                      serviceId: finalServiceId,
                      studentName: nameCtrl.text.isNotEmpty
                          ? nameCtrl.text
                          : (widget.user?.fullName ?? ''),
                      studentPhone: phoneCtrl.text.isNotEmpty
                          ? phoneCtrl.text
                          : (widget.user?.phone ?? ''),
                      studentUni: '', // Let backend resolve it
                      universityId: widget.user?.universityId,
                      serviceTitle: finalTitle,
                      details: finalDetails,
                      payWithPoints: paymentMethod == 'wallet',
                      paymentMethod: paymentMethod,
                      promoCode: (paymentMethod == 'wallet' &&
                              appliedPromoInfo != null)
                          ? appliedPromoInfo!['code']?.toString()
                          : null,
                      requestUuid: requestUuid,
                    );

                    if (requestResult['status'] == 'success') {
                      final dataPayload = requestResult['data'];
                      if (dataPayload != null &&
                          dataPayload['balance_after'] != null) {
                        final newBalance =
                            (dataPayload['balance_after'] as num).toInt();
                        setState(() {
                          _pointsBalance = newBalance;
                        });
                      }
                    } else {
                      throw Exception(requestResult['message'] ??
                          LanguageService.tr('auto_trans_1288'));
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
                      SnackBar(
                          content: Text(
                              '${LanguageService.tr('error_sending_service')} $e')),
                    );
                  });
                },
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary),
                child: Text(LanguageService.tr('submit_form_confirm'),
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold)),
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
          centerTitle: true,
          title: Text(LanguageService.tr('all_student_services'),
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent),
        ),
      );
    }

    if (_loadErrorKey != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: AppColors.error,
                size: 60,
              ),
              const SizedBox(height: 16),
              Text(
                LanguageService.tr(_loadErrorKey!),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadServices,
                icon: const Icon(Icons.refresh, color: Colors.white),
                label: Text(
                  LanguageService.tr('retry'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_services.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.hourglass_empty,
                color: AppColors.textMuted.withValues(alpha: 0.5),
                size: 80,
              ),
              const SizedBox(height: 16),
              Text(
                LanguageService.tr('no_services_available'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final int crossAxisCount = screenWidth > 600 ? 3 : 2;
    final double childAspectRatio = screenWidth > 600
        ? 0.72
        : (screenWidth < 360 ? 0.54 : 0.58);

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: childAspectRatio,
      ),
      itemCount: _services.length,
      itemBuilder: (context, index) {
        final s = _services[index];

        return Card(
          clipBehavior: Clip.antiAlias,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 4,
          shadowColor: Colors.black.withValues(alpha: 0.15),
          child: InkWell(
            onTap: () => _handleServiceTap(s),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Larger Image Header (Takes remaining space)
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _buildImageWidget(s['img']?.toString() ?? ''),
                    ],
                  ),
                ),

                // Card Body (Text and Button below)
                Padding(
                  padding: const EdgeInsets.all(10.0),
                  child: Column(
                    children: [
                      Text(
                        s['title'] as String,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: AppColors.textDark),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        s['desc'] as String,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textMuted,
                            height: 1.3),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: (s['price_points'] as int? ?? 0) > 0
                              ? AppColors.accentLight
                              : Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          LanguageService.formatServiceCost(
                              s['price_points'] as int? ?? 0),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: (s['price_points'] as int? ?? 0) > 0
                                ? AppColors.primary
                                : Colors.green.shade700,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
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
                            ]),
                        alignment: Alignment.center,
                        child: Text(
                          LanguageService.tr('request_service_button'),
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
