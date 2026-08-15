import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'apartment_detail_screen.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import 'chat_screen.dart';
import '../models/student.dart';
import '../core/empty_state_widget.dart';

class FlatsListScreen extends StatelessWidget {
  final List<Map<String, dynamic>> apartments;
  final Student? user;
  final String title;
  final String subtitle;
  final bool filterSingleOnly;

  const FlatsListScreen({
    super.key,
    required this.apartments,
    required this.user,
    required this.title,
    required this.subtitle,
    this.filterSingleOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    // تصفية الشقق بناءً على تصنيف نوع السكن (شقة كاملة vs غرفة/ستوديو)
    final filteredList = apartments.where((apt) {
      final rType = apt['rental_type']?.toString();
      if (filterSingleOnly) {
        // الخيار الثاني: غرف مشتركة واستوديوهات
        if (rType == 'room_shared' || rType == 'studio') {
          return true;
        }
        // دعم رجعي للبيانات القديمة التي لا تحتوي على نوع سكن
        if (rType == null || rType.isEmpty) {
          final titleStr = (apt['title'] ?? '').toString();
          final descStr = (apt['description'] ?? '').toString();
          final featuresList = (apt['features'] as List?)
                  ?.map((e) => e.toString())
                  .join(' ') ??
              '';
          final combined = '$titleStr $descStr $featuresList';
          return combined.contains(LanguageService.tr('auto_trans_1038')) ||
              combined.contains(LanguageService.tr('auto_trans_1039')) ||
              combined.contains(LanguageService.tr('auto_trans_1040')) ||
              combined.contains(LanguageService.tr('auto_trans_1041')) ||
              !combined.contains(LanguageService.tr('auto_trans_1042'));
        }
        return false;
      } else {
        // الخيار الأول: شقق كاملة فقط
        if (rType == 'apartment') {
          return true;
        }
        // دعم رجعي للبيانات القديمة
        if (rType == null || rType.isEmpty) {
          return true;
        }
        return false;
      }
    }).toList();

    // Always sort featured / pinned apartments at the top
    filteredList.sort((a, b) {
      final bool aFeatured = (a['is_featured'] == true ||
          a['is_featured'] == 1 ||
          a['is_featured'] == '1');
      final bool bFeatured = (b['is_featured'] == true ||
          b['is_featured'] == 1 ||
          b['is_featured'] == '1');
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return 0;
    });

    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          centerTitle: true,
          title: Text(LanguageService.tr('auto_trans_1043'),
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18)),
          iconTheme: const IconThemeData(color: Colors.white),
          actions: [
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 12.0),
              child: IconButton(
                icon: const Icon(Icons.support_agent, color: Colors.white),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => ChatScreen(user: user)),
                  );
                },
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            // هيدر توضيحي مميز
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                boxShadow: [
                  BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 4))
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.2),
                        shape: BoxShape.circle),
                    child: Icon(
                        filterSingleOnly ? Icons.person : Icons.apartment,
                        color: AppColors.accent,
                        size: 32),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title,
                            style: const TextStyle(
                                color: AppColors.accent,
                                fontWeight: FontWeight.bold,
                                fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(subtitle,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                height: 1.4)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // شريط عدد الشقق المتاحة
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                      '${LanguageService.tr('available_options')} (${filteredList.length})',
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textDark)),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(10)),
                    child: Text(LanguageService.tr('furnished_equipped'),
                        style: const TextStyle(
                            color: Color(0xFF2E7D32),
                            fontSize: 11,
                            fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),

            Expanded(
              child: filteredList.isEmpty
                  ? EmptyStateWidget(
                      titleKey: 'no_matching_flats',
                      descriptionKey: 'no_search_results_desc',
                      icon: Icons.home_work_outlined,
                      actionKey: 'go_back',
                      onAction: () => Navigator.pop(context),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: filteredList.length,
                      itemBuilder: (context, idx) {
                        final apt = filteredList[idx];
                        final imagesList = List<String>.from(
                            (apt['images'] as List?)
                                    ?.map((e) => e.toString()) ??
                                ['assets/images/apt1.png']);
                        final firstImg = imagesList.isNotEmpty
                            ? imagesList.first
                            : 'assets/images/apt1.png';

                        final moveInStr = apt['move_in_date']?.toString() ??
                            LanguageService.tr('immediate_move_in');
                        final isScheduled = apt['move_in_type'] ==
                                LanguageService.tr('auto_trans_1044') ||
                            moveInStr.contains(
                                LanguageService.tr('auto_trans_1045')) ||
                            moveInStr.contains(
                                LanguageService.tr('auto_trans_1046'));

                        final isFeatured = apt['is_featured'] == true ||
                            apt['is_featured'] == 1 ||
                            apt['is_featured'] == '1';

                        return GestureDetector(
                          onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => ApartmentDetailScreen(
                                      apartment: apt, user: user))),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(22),
                              border: isFeatured
                                  ? Border.all(
                                      color: const Color(0xFFF59E0B),
                                      width: 1.6)
                                  : Border.all(
                                      color: Colors.transparent, width: 0),
                              boxShadow: [
                                if (isFeatured)
                                  BoxShadow(
                                    color: const Color(0xFFF59E0B)
                                        .withValues(alpha: 0.18),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 15,
                                    offset: const Offset(0, 5))
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(21)),
                                      child: firstImg.startsWith('assets/')
                                          ? Image.asset(
                                              firstImg,
                                              height: 200,
                                              width: double.infinity,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) =>
                                                  Image.asset(
                                                      'assets/images/apt1.png',
                                                      height: 200,
                                                      width: double.infinity,
                                                      fit: BoxFit.cover),
                                            )
                                          : Image.network(
                                              ApiService.resolveImageUrl(firstImg),
                                              height: 200,
                                              width: double.infinity,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) =>
                                                  Image.asset(
                                                      'assets/images/apt1.png',
                                                      height: 200,
                                                      width: double.infinity,
                                                      fit: BoxFit.cover),
                                            ),
                                    ),
                                    if (isFeatured)
                                      PositionedDirectional(
                                        top: 12,
                                        end: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [
                                                Color(0xFFF59E0B),
                                                Color(0xFFD97706)
                                              ],
                                            ),
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black
                                                    .withValues(alpha: 0.25),
                                                blurRadius: 6,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.star_rounded,
                                                  color: Colors.white,
                                                  size: 15),
                                              const SizedBox(width: 4),
                                              Text(
                                                LanguageService.currentLang
                                                            .value ==
                                                        'ar'
                                                    ? "مميز"
                                                    : "Featured",
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  fontFamily: 'Cairo',
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(18),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 14, vertical: 6),
                                            decoration: BoxDecoration(
                                                color: AppColors.primaryDark,
                                                borderRadius:
                                                    BorderRadius.circular(12)),
                                            child: Text(apt['price'] as String,
                                                style: const TextStyle(
                                                    color: AppColors.accent,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 15)),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: isScheduled
                                                  ? const Color(0xFFFFF3E0)
                                                  : const Color(0xFFE8F5E9),
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                            ),
                                            child: Text(
                                              moveInStr,
                                              style: TextStyle(
                                                color: isScheduled
                                                    ? const Color(0xFFE65100)
                                                    : const Color(0xFF2E7D32),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Text(apt['title'] as String,
                                          style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textDark)),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on,
                                              color: AppColors.accent,
                                              size: 18),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              apt['location'] as String,
                                              style: const TextStyle(
                                                  fontSize: 13,
                                                  color: AppColors.textMuted),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(Icons.school,
                                              color: AppColors.primary,
                                              size: 18),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              apt['proximity'] as String,
                                              style: const TextStyle(
                                                  fontSize: 13,
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.w600),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const Divider(height: 24),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                              LanguageService.tr(
                                                  'click_to_view_images'),
                                              style: const TextStyle(
                                                  color: AppColors.accent,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13)),
                                          Icon(
                                              LanguageService.isRtl
                                                  ? Icons.arrow_back
                                                  : Icons.arrow_forward,
                                              color: AppColors.primary,
                                              size: 18),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
