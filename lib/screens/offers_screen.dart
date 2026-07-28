import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import '../services/api_service.dart';
import '../models/student.dart';
import '../models/housing_offer.dart';
import 'apartment_detail_screen.dart';

class OffersScreen extends StatefulWidget {
  final Student? user;
  final List<Map<String, dynamic>> apartments;
  const OffersScreen({super.key, required this.user, required this.apartments});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  String _selectedFilter = LanguageService.tr('auto_trans_1192');
  final List<String> _filters = [
    LanguageService.tr('auto_trans_1193'),
    LanguageService.tr('auto_trans_1194'),
    LanguageService.tr('auto_trans_1195'),
    LanguageService.tr('auto_trans_1196'),
    LanguageService.tr('auto_trans_1197')
  ];

  List<HousingOffer> _offers = [];
  bool _isLoading = true;
  bool _isError = false;

  @override
  void initState() {
    super.initState();
    _fetchOffers();
  }

  Future<void> _fetchOffers() async {
    setState(() {
      _isLoading = true;
      _isError = false;
    });
    final res = await ApiService.getHousingOffers();
    if (res == null) {
      setState(() {
        _isLoading = false;
        _isError = true;
      });
    } else {
      setState(() {
        _offers = res;
        _isLoading = false;
        _isError = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAll = _selectedFilter == LanguageService.tr('auto_trans_1192') ||
        _selectedFilter == LanguageService.tr('auto_trans_1193') ||
        _selectedFilter == 'الكل' ||
        _selectedFilter == 'All';

    final isSpecial = _selectedFilter == LanguageService.tr('auto_trans_1194') ||
        _selectedFilter == 'عروض خاصة' ||
        _selectedFilter == 'Special Offers';

    final filtered = _offers.where((offer) {
      if (isAll || isSpecial) {
        return true;
      }

      final String filterLower = _selectedFilter.toLowerCase();
      final String proximity = (offer.apartment?.proximity ?? '').toLowerCase();
      final String offerTitle = offer.title.toLowerCase();
      final String aptTitle = (offer.apartment?.title ?? '').toLowerCase();
      if (filterLower.contains('طبية') || filterLower.contains('tsmu')) {
        return proximity.contains('tsmu') || proximity.contains('الطبية') || aptTitle.contains('الطبية');
      }
      if (filterLower.contains('ستوديو') || filterLower.contains('studio')) {
        return offerTitle.contains('ستوديو') || offerTitle.contains('studio') || aptTitle.contains('ستوديو') || aptTitle.contains('studio');
      }
      if (filterLower.contains('مشترك') || filterLower.contains('shared')) {
        return offerTitle.contains('مشترك') || offerTitle.contains('shared') || aptTitle.contains('مشترك') || aptTitle.contains('shared');
      }

      return offerTitle.contains(filterLower) ||
          aptTitle.contains(filterLower) ||
          proximity.contains(filterLower);
    }).toList();

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
              title: Text(
                LanguageService.tr('auto_trans_1200'),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
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
                          label: Text(
                            f,
                            style: TextStyle(
                              color: isSelected ? AppColors.textDark : Colors.white,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
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
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                      : _isError
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.cloud_off, size: 64, color: AppColors.textMuted),
                                    const SizedBox(height: 16),
                                    Text(
                                      LanguageService.tr('connection_error'),
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textDark),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      LanguageService.tr('error_occurred'),
                                      style: const TextStyle(fontSize: 14, color: AppColors.textMuted),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton(
                                      onPressed: _fetchOffers,
                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                      child: Text(LanguageService.tr('retry'), style: const TextStyle(color: Colors.white)),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : _offers.isEmpty
                              ? Center(
                                  child: Text(
                                    LanguageService.tr('no_matching_flats'),
                                    style: const TextStyle(color: AppColors.textMuted),
                                  ),
                                )
                              : filtered.isEmpty
                                  ? Center(
                                      child: Text(
                                        LanguageService.tr('no_results'),
                                        style: const TextStyle(color: AppColors.textMuted),
                                      ),
                                    )
                              : RefreshIndicator(
                                  color: AppColors.accent,
                                  onRefresh: _fetchOffers,
                                  child: ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: filtered.length,
                                    itemBuilder: (context, idx) {
                                      final offer = filtered[idx];
                                      final apt = offer.apartment;
                                      final aptTitle = apt?.title ?? 'شقة طلابية';
                                      
                                      // Image priority: offer image -> apartment first image -> default asset
                                      final String displayImg = offer.imageUrl ?? (apt?.primaryImage ?? '');

                                      return GestureDetector(
                                        onTap: () {
                                          if (apt == null) return;
                                          // Map to expected Map<String, dynamic> format with compatibility keys
                                          final aptMap = Map<String, dynamic>.from(apt.toJson());
                                          // Explicit compatibility variables
                                          aptMap['location'] = apt.district;
                                          
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => ApartmentDetailScreen(
                                                apartment: aptMap,
                                                user: widget.user,
                                                offerPrice: offer.offerPrice,
                                                originalPrice: offer.originalPrice,
                                                discountPercent: offer.calculatedDiscountPercent,
                                                badgeText: offer.badgeText,
                                              ),
                                            ),
                                          );
                                        },
                                        child: Container(
                                          margin: const EdgeInsets.only(bottom: 16),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(20),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withValues(alpha: 0.06),
                                                blurRadius: 15,
                                                offset: const Offset(0, 5),
                                              )
                                            ],
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              ClipRRect(
                                                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                                                child: displayImg.isEmpty
                                                    ? Image.asset(
                                                        'assets/images/apt1.png',
                                                        height: 200,
                                                        width: double.infinity,
                                                        fit: BoxFit.cover,
                                                      )
                                                    : displayImg.startsWith('assets/')
                                                        ? Image.asset(
                                                            displayImg,
                                                            height: 200,
                                                            width: double.infinity,
                                                            fit: BoxFit.cover,
                                                            errorBuilder: (_, __, ___) => Image.asset(
                                                              'assets/images/apt1.png',
                                                              height: 200,
                                                              width: double.infinity,
                                                              fit: BoxFit.cover,
                                                            ),
                                                          )
                                                        : Image.network(
                                                            ApiService.resolveImageUrl(displayImg),
                                                            height: 200,
                                                            width: double.infinity,
                                                            fit: BoxFit.cover,
                                                            errorBuilder: (_, __, ___) => Image.asset(
                                                              'assets/images/apt1.png',
                                                              height: 200,
                                                              width: double.infinity,
                                                              fit: BoxFit.cover,
                                                            ),
                                                          ),
                                              ),
                                              Padding(
                                                padding: const EdgeInsets.all(16),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    // Badge & Prices Row
                                                    Row(
                                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                      children: [
                                                        // Pricing Bubble
                                                        Row(
                                                          children: [
                                                            Container(
                                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                              decoration: BoxDecoration(
                                                                color: AppColors.primaryDark,
                                                                borderRadius: BorderRadius.circular(12),
                                                              ),
                                                              child: Text(
                                                                "${offer.offerPrice} \$",
                                                                style: const TextStyle(
                                                                  color: AppColors.accent,
                                                                  fontWeight: FontWeight.bold,
                                                                  fontSize: 15,
                                                                ),
                                                              ),
                                                            ),
                                                            const SizedBox(width: 8),
                                                            Text(
                                                              "${offer.originalPrice} \$",
                                                              style: const TextStyle(
                                                                color: AppColors.textMuted,
                                                                decoration: TextDecoration.lineThrough,
                                                                fontSize: 13,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                        // Badge Text / Promotion tag
                                                        Row(
                                                          children: [
                                                            if (offer.badgeText != null && offer.badgeText!.isNotEmpty) ...[
                                                              Container(
                                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                                decoration: BoxDecoration(
                                                                  color: AppColors.accent.withValues(alpha: 0.2),
                                                                  borderRadius: BorderRadius.circular(10),
                                                                ),
                                                                child: Text(
                                                                  offer.badgeText!,
                                                                  style: const TextStyle(
                                                                    color: AppColors.textDark,
                                                                    fontWeight: FontWeight.bold,
                                                                    fontSize: 11,
                                                                  ),
                                                                ),
                                                              ),
                                                              const SizedBox(width: 6),
                                                            ],
                                                            Container(
                                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                              decoration: BoxDecoration(
                                                                color: Colors.red.shade50,
                                                                borderRadius: BorderRadius.circular(10),
                                                              ),
                                                              child: Text(
                                                                "خصم ${offer.calculatedDiscountPercent}%",
                                                                style: TextStyle(
                                                                  color: Colors.red.shade700,
                                                                  fontWeight: FontWeight.bold,
                                                                  fontSize: 11,
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 12),
                                                    // Offer Title
                                                    Text(
                                                      offer.title,
                                                      style: const TextStyle(
                                                        fontSize: 18,
                                                        fontWeight: FontWeight.bold,
                                                        color: AppColors.textDark,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 6),
                                                    // Linked Apartment
                                                    Row(
                                                      children: [
                                                        const Icon(Icons.home, color: AppColors.accent, size: 16),
                                                        const SizedBox(width: 6),
                                                        Expanded(
                                                          child: Text(
                                                            "${LanguageService.tr('apartment_number')}${offer.apartmentId} - $aptTitle",
                                                            style: const TextStyle(
                                                              fontSize: 13,
                                                              color: AppColors.textMuted,
                                                              fontWeight: FontWeight.w600,
                                                            ),
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 6),
                                                    // Location
                                                    Row(
                                                      children: [
                                                        const Icon(Icons.location_on, color: AppColors.primary, size: 16),
                                                        const SizedBox(width: 6),
                                                        Expanded(
                                                          child: Text(
                                                            apt?.district ?? '',
                                                            style: const TextStyle(
                                                              fontSize: 13,
                                                              color: AppColors.textMuted,
                                                            ),
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    if (offer.description.isNotEmpty) ...[
                                                      const SizedBox(height: 8),
                                                      Text(
                                                        offer.description,
                                                        style: const TextStyle(
                                                          fontSize: 13,
                                                          color: AppColors.textMuted,
                                                        ),
                                                        maxLines: 2,
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ],
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
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
