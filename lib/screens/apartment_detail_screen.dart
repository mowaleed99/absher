import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';
import 'login_screen.dart';
import '../services/language_service.dart';
import '../models/student.dart';

class ApartmentDetailScreen extends StatefulWidget {
  final Map<String, dynamic> apartment;
  final Student? user;
  final double? offerPrice;
  final double? originalPrice;
  final int? discountPercent;
  final String? badgeText;

  const ApartmentDetailScreen({
    super.key,
    required this.apartment,
    required this.user,
    this.offerPrice,
    this.originalPrice,
    this.discountPercent,
    this.badgeText,
  });

  @override
  State<ApartmentDetailScreen> createState() => _ApartmentDetailScreenState();
}

class _ApartmentDetailScreenState extends State<ApartmentDetailScreen> {
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();
  String _viewingDate = '';
  String _viewingTime = LanguageService.tr('auto_trans_1001');

  @override
  void initState() {
    super.initState();
    final today = DateTime.now();
    _viewingDate =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _pageController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _selectViewingDate(StateSetter setModalState) async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    DateTime initial = today;
    if (_viewingDate.isNotEmpty) {
      try {
        final parsed = DateTime.parse(_viewingDate);
        if (!parsed.isBefore(today)) {
          initial = DateTime(parsed.year, parsed.month, parsed.day);
        }
      } catch (_) {}
    }

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: today,
      lastDate: today.add(const Duration(days: 180)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final dateStr =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setModalState(() {
        _viewingDate = dateStr;
      });
      setState(() {
        _viewingDate = dateStr;
      });
    }
  }

  void _selectViewingTime(StateSetter setModalState) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      initialEntryMode: TimePickerEntryMode.dial,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      if (!mounted) return;
      final timeStr = picked.format(context);
      setModalState(() {
        _viewingTime = timeStr;
      });
      setState(() {
        _viewingTime = timeStr;
      });
    }
  }

  void _showBookingDialog() {
    final isGuest = widget.user == null ||
        widget.user!.id == 0 ||
        widget.user!.fullName.contains(LanguageService.tr('auto_trans_1002'));
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
              Text(LanguageService.tr('auto_trans_1003'),
                  style: const TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(LanguageService.tr('auto_trans_1004')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(LanguageService.tr('auto_trans_1005'),
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
              child: Text(LanguageService.tr('auto_trans_1006'),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 24,
                right: 24,
                top: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_month,
                        color: AppColors.primary, size: 28),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                          'تحديد موعد لرؤية الشقة رقم (#${widget.apartment['id'] ?? '1'})',
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textDark)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  "${LanguageService.tr('auto_trans_1007')} ${widget.apartment['title']} ${LanguageService.tr('auto_trans_1008')}",
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.textMuted, height: 1.4),
                ),
                const SizedBox(height: 12),
                () {
                  final isAr = LanguageService.currentLang.value == 'ar';
                  final rawMoveIn = isAr
                      ? (widget.apartment['move_in_date_ar'] ?? widget.apartment['move_in_date'])
                      : (widget.apartment['move_in_date_en'] ?? widget.apartment['move_in_date']);
                  final moveInStr = rawMoveIn?.toString().isNotEmpty == true
                      ? rawMoveIn.toString()
                      : LanguageService.tr('immediate_move_in');
                  final isScheduled = widget.apartment['move_in_type'] == 'ميعاد' ||
                      widget.apartment['move_in_type'] == 'Scheduled' ||
                      widget.apartment['move_in_type_en'] == 'Scheduled' ||
                      (!moveInStr.contains('فوري') && !moveInStr.contains('Immediate'));

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isScheduled ? const Color(0xFFFFF3E0) : const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isScheduled ? const Color(0xFFFFB74D) : const Color(0xFFA5D6A7),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isScheduled ? Icons.calendar_month : Icons.bolt,
                          color: isScheduled ? const Color(0xFFE65100) : const Color(0xFF2E7D32),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            isAr
                                ? 'موعد الانتقال المتاح للشقة: $moveInStr'
                                : 'Available Move-in: $moveInStr',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isScheduled ? const Color(0xFFE65100) : const Color(0xFF2E7D32),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }(),
                const SizedBox(height: 14),
                TextField(
                  controller: _phoneController..text = widget.user?.phone ?? '',
                  decoration: InputDecoration(
                    labelText: LanguageService.tr('auto_trans_1009'),
                    prefixIcon:
                        const Icon(Icons.phone, color: AppColors.primary),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectViewingDate(setModalState),
                        borderRadius: BorderRadius.circular(12),
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: LanguageService.tr('auto_trans_1010'),
                            prefixIcon: const Icon(Icons.date_range,
                                color: AppColors.primary, size: 20),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 12),
                          ),
                          child: Text(
                            _viewingDate,
                            style: const TextStyle(
                                fontSize: 13, color: Colors.black87),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: InkWell(
                        onTap: () => _selectViewingTime(setModalState),
                        borderRadius: BorderRadius.circular(12),
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: LanguageService.tr('auto_trans_1011'),
                            prefixIcon: const Icon(Icons.access_time,
                                color: AppColors.primary, size: 20),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 12),
                          ),
                          child: Text(
                            _viewingTime,
                            style: const TextStyle(
                                fontSize: 13, color: Colors.black87),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _notesController,
                  decoration: InputDecoration(
                    labelText: LanguageService.tr('auto_trans_1012'),
                    prefixIcon:
                        const Icon(Icons.note, color: AppColors.primary),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                      color: const Color(0xFFFFF9C4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFBC02D))),
                  child: Row(
                    children: [
                      const Icon(Icons.lightbulb_outline,
                          color: Color(0xFFF57F17), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          LanguageService.tr('auto_trans_1013'),
                          style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF333333),
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // 1. Show loading spinner dialog
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
                                      LanguageService.tr('auto_trans_1014'),
                                      style: const TextStyle(
                                          fontFamily: 'Cairo'))),
                            ],
                          ),
                        ),
                      );

                      final aptId = widget.apartment['id']?.toString() ?? '?';
                      final aptTitle =
                          widget.apartment['title']?.toString() ?? '';
                      final aptPrice = widget.offerPrice != null
                          ? LanguageService.formatOfferPriceWithDiscount(
                              widget.offerPrice!.round(),
                              widget.discountPercent!)
                          : (widget.apartment['price']?.toString() ?? '');

                      final String rawRentalType =
                          widget.apartment['rental_type']?.toString() ?? '';
                      final String resolvedRentalType =
                          LanguageService.getLocalizedHousingType(
                              rawRentalType);

                      final resolvedNotes = _notesController.text.isNotEmpty
                          ? _notesController.text
                          : LanguageService.tr("auto_trans_1015");
                      final bookingMsg = LanguageService.formatBookingMessage(
                            aptId: aptId,
                            aptTitle: aptTitle,
                            rentalType: resolvedRentalType,
                            price: aptPrice,
                            date: _viewingDate,
                            time: _viewingTime,
                            phone: _phoneController.text,
                            notes: resolvedNotes,
                          ) +
                          LanguageService.tr("auto_trans_1016");

                      // 2. Submit booking as a service_request with all required fields
                      ApiService.submitServiceRequest(
                        studentName: widget.user?.fullName ?? '',
                        studentPhone:
                            widget.user?.phone ?? _phoneController.text,
                        studentUni: widget.user?.universityId != null
                            ? 'جامعة #${widget.user!.universityId}'
                            : '',
                        serviceTitle: 'حجز شقة #$aptId - $aptTitle',
                        details: bookingMsg,
                      ).then((result) {
                        if (!context.mounted) return;
                        Navigator.pop(context); // Dismiss loading spinner
                        Navigator.pop(context); // Close Bottom Sheet modal
                        if (result['status'] == 'error') {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                                content: Text(
                                    '${LanguageService.tr("error_sending_request")}: ${result["message"] ?? ""}')),
                          );
                          return;
                        }
                        Navigator.of(context).push(
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
                                  '${LanguageService.tr("error_sending_request")}: $e')),
                        );
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: AppColors.textDark,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                    ),
                    child: Text(LanguageService.tr('auto_trans_1019'),
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final images = List<String>.from(
        (widget.apartment['images'] as List?)?.map((e) => e.toString()) ??
            ['assets/images/apt1.png']);

    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          title: Text(
              widget.apartment['title'] ??
                  LanguageService.tr('apartment_details'),
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16)),
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // معرض الصور
                    SizedBox(
                      height: 260,
                      child: Stack(
                        children: [
                          ScrollConfiguration(
                            behavior: const MaterialScrollBehavior().copyWith(
                              dragDevices: {
                                PointerDeviceKind.touch,
                                PointerDeviceKind.mouse,
                              },
                            ),
                            child: PageView.builder(
                              controller: _pageController,
                              itemCount: images.length,
                              onPageChanged: (idx) =>
                                  setState(() => _currentImageIndex = idx),
                              itemBuilder: (context, index) {
                                final String currentImg = images[index];
                                return currentImg.startsWith('assets/')
                                    ? Image.asset(
                                        currentImg,
                                        fit: BoxFit.cover,
                                        width: double.infinity,
                                        errorBuilder: (_, __, ___) =>
                                            Image.asset(
                                                'assets/images/apt1.png',
                                                fit: BoxFit.cover,
                                                width: double.infinity),
                                      )
                                    : Image.network(
                                        ApiService.resolveImageUrl(currentImg),
                                        fit: BoxFit.cover,
                                        width: double.infinity,
                                        errorBuilder: (_, __, ___) =>
                                            Image.asset(
                                                'assets/images/apt1.png',
                                                fit: BoxFit.cover,
                                                width: double.infinity),
                                      );
                              },
                            ),
                          ),

                          // Navigation Arrows for Web/Desktop and ease of use
                          if (images.length > 1) ...[
                            PositionedDirectional(
                              start: 8,
                              top: 0,
                              bottom: 0,
                              child: Center(
                                child: Container(
                                  decoration: BoxDecoration(
                                      color:
                                          Colors.black.withValues(alpha: 0.4),
                                      shape: BoxShape.circle),
                                  child: IconButton(
                                    icon: Icon(
                                        LanguageService.isRtl
                                            ? Icons.arrow_forward_ios
                                            : Icons.arrow_back_ios_new,
                                        color: Colors.white,
                                        size: 18),
                                    onPressed: () {
                                      if (_currentImageIndex > 0) {
                                        _pageController.previousPage(
                                            duration: const Duration(
                                                milliseconds: 300),
                                            curve: Curves.easeInOut);
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ),
                            PositionedDirectional(
                              end: 8,
                              top: 0,
                              bottom: 0,
                              child: Center(
                                child: Container(
                                  decoration: BoxDecoration(
                                      color:
                                          Colors.black.withValues(alpha: 0.4),
                                      shape: BoxShape.circle),
                                  child: IconButton(
                                    icon: Icon(
                                        LanguageService.isRtl
                                            ? Icons.arrow_back_ios_new
                                            : Icons.arrow_forward_ios,
                                        color: Colors.white,
                                        size: 18),
                                    onPressed: () {
                                      if (_currentImageIndex <
                                          images.length - 1) {
                                        _pageController.nextPage(
                                            duration: const Duration(
                                                milliseconds: 300),
                                            curve: Curves.easeInOut);
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ],

                          Positioned(
                            bottom: 12,
                            right: 0,
                            left: 0,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: images.asMap().entries.map((entry) {
                                return Container(
                                  width:
                                      _currentImageIndex == entry.key ? 24 : 8,
                                  height: 8,
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 4),
                                  decoration: BoxDecoration(
                                    color: _currentImageIndex == entry.key
                                        ? AppColors.accent
                                        : Colors.white70,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          PositionedDirectional(
                            top: 12,
                            start: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.85),
                                  borderRadius: BorderRadius.circular(20)),
                              child: Text(
                                  '${_currentImageIndex + 1} / ${images.length} ${LanguageService.tr('images_count')}',
                                  style: const TextStyle(
                                      color: Colors.white, fontSize: 12)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 6,
                                      crossAxisAlignment: WrapCrossAlignment.center,
                                      children: [
                                        if (widget.apartment['is_featured'] == true ||
                                            widget.apartment['is_featured'] == 1 ||
                                            widget.apartment['is_featured'] == '1')
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              gradient: const LinearGradient(
                                                colors: [
                                                  Color(0xFFF59E0B),
                                                  Color(0xFFD97706)
                                                ],
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: const Color(0xFFF59E0B)
                                                      .withValues(alpha: 0.3),
                                                  blurRadius: 4,
                                                ),
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.star_rounded,
                                                    color: Colors.white,
                                                    size: 14),
                                                const SizedBox(width: 3),
                                                Text(
                                                  LanguageService.currentLang
                                                              .value ==
                                                          'ar'
                                                      ? "إعلان مميز"
                                                      : "Featured",
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 12),
                                                ),
                                              ],
                                            ),
                                          ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                              color: const Color(0xFFE8F5E9),
                                              borderRadius:
                                                  BorderRadius.circular(8)),
                                          child: Text(
                                              '${LanguageService.tr('apartment_number')}${widget.apartment['id'] ?? '1'}',
                                              style: const TextStyle(
                                                  color: Color(0xFF2E7D32),
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13)),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: AppColors.accentLight,
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            border: Border.all(
                                                color: AppColors.accent),
                                          ),
                                          child: Text(
                                            LanguageService
                                                .getLocalizedHousingType(widget
                                                    .apartment['rental_type']
                                                    ?.toString()),
                                            style: const TextStyle(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12),
                                          ),
                                        ),
                                        () {
                                          final isAr = LanguageService.currentLang.value == 'ar';
                                          final rawMoveIn = isAr
                                              ? (widget.apartment['move_in_date_ar'] ?? widget.apartment['move_in_date'])
                                              : (widget.apartment['move_in_date_en'] ?? widget.apartment['move_in_date']);
                                          final moveInStr = rawMoveIn?.toString().isNotEmpty == true
                                              ? rawMoveIn.toString()
                                              : LanguageService.tr('immediate_move_in');
                                          final isScheduled = widget.apartment['move_in_type'] == 'ميعاد' ||
                                              widget.apartment['move_in_type'] == 'Scheduled' ||
                                              widget.apartment['move_in_type_en'] == 'Scheduled' ||
                                              (!moveInStr.contains('فوري') && !moveInStr.contains('Immediate'));

                                          return Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: isScheduled
                                                  ? const Color(0xFFFFF3E0)
                                                  : const Color(0xFFE8F5E9),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              border: Border.all(
                                                color: isScheduled
                                                    ? const Color(0xFFFFB74D)
                                                    : const Color(0xFFA5D6A7),
                                              ),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  isScheduled
                                                      ? Icons.calendar_month
                                                      : Icons.bolt,
                                                  size: 14,
                                                  color: isScheduled
                                                      ? const Color(0xFFE65100)
                                                      : const Color(0xFF2E7D32),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  moveInStr,
                                                  style: TextStyle(
                                                    color: isScheduled
                                                        ? const Color(0xFFE65100)
                                                        : const Color(0xFF2E7D32),
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        }(),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      widget.apartment['title'] ?? '',
                                      style: const TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textDark),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  if (widget.offerPrice != null) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 14, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentLight,
                                        borderRadius: BorderRadius.circular(12),
                                        border:
                                            Border.all(color: AppColors.accent),
                                      ),
                                      child: Text(
                                        "${widget.offerPrice} \$",
                                        style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textDark),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          "${widget.originalPrice ?? widget.apartment['price']} \$",
                                          style: const TextStyle(
                                            color: AppColors.textMuted,
                                            decoration:
                                                TextDecoration.lineThrough,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        if (widget.discountPercent != null &&
                                            widget.discountPercent! > 0)
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.red.shade50,
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              LanguageService
                                                  .formatDiscountPercent(
                                                      widget.discountPercent!),
                                              style: TextStyle(
                                                color: Colors.red.shade700,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ] else ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 14, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppColors.accentLight,
                                        borderRadius: BorderRadius.circular(12),
                                        border:
                                            Border.all(color: AppColors.accent),
                                      ),
                                      child: Text(
                                        widget.apartment['price'] ?? '',
                                        style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textDark),
                                      ),
                                    ),
                                  ],
                                ],
                              )
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.location_on,
                                  color: AppColors.accent, size: 20),
                              const SizedBox(width: 6),
                              Expanded(
                                  child: Text(
                                      widget.apartment['location'] ??
                                          LanguageService.tr('auto_trans_1020'),
                                      style: const TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textMuted))),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.school,
                                  color: AppColors.primary, size: 20),
                              const SizedBox(width: 6),
                              Expanded(
                                  child: Text(
                                      '${LanguageService.tr('proximity_label')} ${widget.apartment['proximity'] ?? LanguageService.tr('close_to_unis')}',
                                      style: const TextStyle(
                                          fontSize: 13,
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600))),
                            ],
                          ),
                          if (widget.apartment['roommate_reqs'] != null ||
                              widget.apartment['roommate_facilities'] != null ||
                              (widget.apartment['rental_type']
                                      ?.toString()
                                      .contains(LanguageService.tr(
                                          'auto_trans_1021')) ??
                                  false)) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFFBEB),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                    color: const Color(0xFFF59E0B), width: 1.5),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.people_alt,
                                          color: Color(0xFFD97706), size: 22),
                                      const SizedBox(width: 8),
                                      Text(
                                          LanguageService.tr(
                                              'roommate_reqs_title'),
                                          style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                              color: Color(0xFF92400E))),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  if (widget.apartment['roommate_reqs'] != null)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 6),
                                      child: Text(
                                          '${LanguageService.tr('roommate_reqs')} ${widget.apartment['roommate_reqs']}',
                                          style: const TextStyle(
                                              fontSize: 13.5,
                                              color: Color(0xFF78350F),
                                              height: 1.4)),
                                    ),
                                  if (widget.apartment['roommate_facilities'] !=
                                      null)
                                    Text(
                                        '${LanguageService.tr('roommate_facilities')} ${widget.apartment['roommate_facilities']}',
                                        style: const TextStyle(
                                            fontSize: 13.5,
                                            color: Color(0xFF78350F),
                                            height: 1.4)),
                                ],
                              ),
                            ),
                          ],
                          const Divider(height: 32),
                          Text(LanguageService.tr('features_and_facilities'),
                              style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textDark)),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: List<String>.from(
                                    (widget.apartment['features'] as List?)
                                            ?.map((e) => e.toString()) ??
                                        [LanguageService.tr('great_features')])
                                .map((feat) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                        color: Colors.grey.shade300)),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.check_circle,
                                        color: AppColors.success, size: 16),
                                    const SizedBox(width: 6),
                                    Text(feat,
                                        style: const TextStyle(
                                            fontSize: 13,
                                            color: AppColors.textDark)),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                          const Divider(height: 32),
                          Text(LanguageService.tr('apartment_description'),
                              style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textDark)),
                          const SizedBox(height: 8),
                          Text(
                            widget.apartment['description'] ?? '',
                            style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textMuted,
                                height: 1.6),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // شريط الحجز السفلي المتجاوب مع جميع الشاشات
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 15,
                        offset: const Offset(0, -4))
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _showBookingDialog,
                        icon: const Icon(Icons.bookmark_add,
                            color: AppColors.textDark),
                        label: Text(LanguageService.tr('book_now_cash'),
                            style: const TextStyle(
                                color: AppColors.textDark,
                                fontSize: 15,
                                fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
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
    );
  }
}
