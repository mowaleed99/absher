import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import '../services/api_service.dart';
import 'apartment_detail_screen.dart';

class OffersScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  final List<Map<String, dynamic>> apartments;
  const OffersScreen({super.key, required this.user, required this.apartments});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  String _selectedFilter = LanguageService.tr('auto_trans_1192');
  final List<String> _filters = [LanguageService.tr('auto_trans_1193'), LanguageService.tr('auto_trans_1194'), LanguageService.tr('auto_trans_1195'), LanguageService.tr('auto_trans_1196'), LanguageService.tr('auto_trans_1197')];

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedFilter == LanguageService.tr('auto_trans_1198')
        ? widget.apartments
        : widget.apartments.where((a) => (a['title'] as String).contains(_selectedFilter) || (a['proximity'] as String).contains(_selectedFilter) || _selectedFilter.contains(LanguageService.tr('auto_trans_1199'))).toList();

    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLang,
      builder: (context, lang, child) {
        return Directionality(
          textDirection: LanguageService.textDirection,
          child: Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              elevation: 0,
              title: Text(LanguageService.tr('auto_trans_1200'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            body: Column(
              children: [
                // شريط الفلاتر
                Container(
                  height: 60,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filters.length,
                    itemBuilder: (context, idx) {
                      final f = _filters[idx];
                      final isSelected = f == _selectedFilter;
                      return Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: ChoiceChip(
                          label: Text(f, style: TextStyle(color: isSelected ? AppColors.textDark : Colors.white, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                          selected: isSelected,
                          selectedColor: AppColors.accent,
                          backgroundColor: AppColors.primaryDark,
                          onSelected: (_) => setState(() => _selectedFilter = f),
                        ),
                      );
                    },
                  ),
                ),

                // قائمة العروض
                Expanded(
                  child: filtered.isEmpty
                      ? Center(child: Text(LanguageService.tr('auto_trans_1201'), style: const TextStyle(color: AppColors.textMuted)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          itemBuilder: (context, idx) {
                            final apt = filtered[idx];
                            final imagesList = List<String>.from((apt['images'] as List?)?.map((e) => e.toString()) ?? ['assets/images/apt1.png']);
                            final firstImg = imagesList.isNotEmpty ? imagesList.first : 'assets/images/apt1.png';
                            return GestureDetector(
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => ApartmentDetailScreen(apartment: apt, user: widget.user)),
                              ),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 15, offset: const Offset(0, 5))],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // صورة الشقة نظيفة تماماً وبدون أي نصوص تغطي عليها
                                    ClipRRect(
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                                      child: firstImg.startsWith('assets/')
                                          ? Image.asset(
                                              firstImg,
                                              height: 200,
                                              width: double.infinity,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => Image.asset('assets/images/apt1.png', height: 200, width: double.infinity, fit: BoxFit.cover),
                                            )
                                          : Image.network(
                                              ApiService.resolveImageUrl(firstImg),
                                              height: 200,
                                              width: double.infinity,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => Image.asset('assets/images/apt1.png', height: 200, width: double.infinity, fit: BoxFit.cover),
                                            ),
                                    ),
                                    // تفاصيل الشقة أسفل الصورة وبدون أي تداخل أو Overflow
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // شريط السعر وبطاقة المميزات في الأسفل
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                                decoration: BoxDecoration(color: AppColors.primaryDark, borderRadius: BorderRadius.circular(12)),
                                                child: Text(apt['price'] as String, style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 15)),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                                                child: Text(LanguageService.tr('auto_trans_1202'), style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 12)),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          Text(apt['title'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              const Icon(Icons.location_on, color: AppColors.accent, size: 18),
                                              const SizedBox(width: 6),
                                              Expanded(
                                                child: Text(
                                                  apt['location'] as String,
                                                  style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.school, color: AppColors.primary, size: 18),
                                              const SizedBox(width: 6),
                                              Expanded(
                                                child: Text(
                                                  apt['proximity'] as String,
                                                  style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
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
      },
    );
  }
}
