import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import '../services/api_service.dart';
import '../services/realtime_sync_service.dart';
import '../models/student.dart';
import '../models/housing_offer.dart';
import 'apartment_detail_screen.dart';
import 'roommate_form_screen.dart';
import '../core/loading_state_widget.dart';
import '../core/error_state_widget.dart';
import '../core/empty_state_widget.dart';

class OffersScreen extends StatefulWidget {
  final Student? user;
  final List<Map<String, dynamic>> apartments;
  const OffersScreen({super.key, required this.user, required this.apartments});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  String _selectedFilter = 'الكل';
  final List<String> _filters = ['الكل'];

  List<HousingOffer> _offers = [];
  List<Map<String, dynamic>> _allApartments = [];
  bool _isLoading = true;
  bool _isError = false;
  StreamSubscription? _offersSub;
  StreamSubscription? _aptsSub;

  @override
  void initState() {
    super.initState();
    _allApartments = List.from(widget.apartments);
    _fetchOffers();
    LanguageService.currentLang.addListener(_onLangChanged);

    _offersSub = RealtimeSyncService().onOffersUpdated.listen((_) {
      if (mounted) _fetchOffers(silent: true);
    });
    _aptsSub = RealtimeSyncService().onApartmentsUpdated.listen((_) {
      if (mounted) _fetchOffers(silent: true);
    });
  }

  void _onLangChanged() {
    if (!mounted) return;
    _fetchOffers();
  }

  @override
  void dispose() {
    _offersSub?.cancel();
    _aptsSub?.cancel();
    LanguageService.currentLang.removeListener(_onLangChanged);
    super.dispose();
  }

  Future<void> _fetchOffers({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _isError = false;
      });
    }
    try {
      final res = await ApiService.getHousingOffers();
      final apts = await ApiService.getApartments();

      if (mounted) {
        setState(() {
          _offers = res ?? [];
          if (apts.isNotEmpty) {
            _allApartments = apts;
          }
          _isLoading = false;
          _isError = false;
          _buildDynamicFilters();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isError = _offers.isEmpty && _allApartments.isEmpty;
        });
      }
    }
  }

  void _buildDynamicFilters() {
    final Set<String> dynamicFilters = {};
    final allText = LanguageService.tr('auto_trans_1193');
    dynamicFilters.add(allText.isNotEmpty ? allText : 'الكل');

    for (var offer in _offers) {
      if (offer.apartment?.universities != null) {
        for (var uni in offer.apartment!.universities) {
          if (uni.name.isNotEmpty) {
            dynamicFilters.add(uni.name);
          }
        }
      }
      if (offer.badgeText != null && offer.badgeText!.isNotEmpty) {
        dynamicFilters.add(offer.badgeText!);
      }
    }

    // Also extract universities from fallback apartments
    for (var apt in _allApartments) {
      final uniList = apt['universities'] as List?;
      if (uniList != null) {
        for (var u in uniList) {
          final name = u['name']?.toString() ?? '';
          if (name.isNotEmpty) dynamicFilters.add(name);
        }
      }
      final dist = apt['district']?.toString() ?? '';
      if (dist.isNotEmpty) dynamicFilters.add(dist);
    }

    _filters.clear();
    _filters.addAll(dynamicFilters);

    if (!_filters.contains(_selectedFilter)) {
      _selectedFilter = _filters.first;
    }
  }

  List<HousingOffer> _getFilteredOffers() {
    final allText = LanguageService.tr('auto_trans_1193');
    final isAll = _selectedFilter == 'الكل' || _selectedFilter == allText;
    if (isAll) return _offers;

    return _offers.where((offer) {
      if (offer.badgeText == _selectedFilter) return true;
      if (offer.apartment?.universities != null) {
        if (offer.apartment!.universities.any((u) => u.name == _selectedFilter)) {
          return true;
        }
      }
      final filterLower = _selectedFilter.toLowerCase();
      final offerTitle = offer.title.toLowerCase();
      final aptTitle = (offer.apartment?.title ?? '').toLowerCase();
      return offerTitle.contains(filterLower) || aptTitle.contains(filterLower);
    }).toList();
  }

  List<Map<String, dynamic>> _getFilteredApartments() {
    final allText = LanguageService.tr('auto_trans_1193');
    final isAll = _selectedFilter == 'الكل' || _selectedFilter == allText;
    if (isAll) return _allApartments;

    return _allApartments.where((apt) {
      final title = (apt['title']?.toString() ?? '').toLowerCase();
      final desc = (apt['description']?.toString() ?? '').toLowerCase();
      final district = (apt['district']?.toString() ?? '').toLowerCase();
      final filterLower = _selectedFilter.toLowerCase();

      final uniList = apt['universities'] as List?;
      if (uniList != null) {
        for (var u in uniList) {
          final uName = (u['name']?.toString() ?? '').toLowerCase();
          if (uName.contains(filterLower)) return true;
        }
      }

      return title.contains(filterLower) ||
          desc.contains(filterLower) ||
          district.contains(filterLower);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filteredOffers = _getFilteredOffers();
    final filteredApts = _getFilteredApartments();
    final bool hasSpecialOffers = _offers.isNotEmpty;

    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLang,
      builder: (context, lang, child) {
        final isAr = lang == 'ar';
        return Directionality(
          textDirection: LanguageService.textDirection,
          child: Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              elevation: 0,
              centerTitle: true,
              iconTheme: const IconThemeData(color: Colors.white),
              title: Text(
                isAr ? 'شقق' : 'Flats',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
            body: Column(
              children: [
                // 1. Roommate Search Hero Action Banner
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0A2540), Color(0xFF1E3A5F)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0A2540).withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.person_search_rounded,
                          color: AppColors.accent,
                          size: 30,
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
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              isAr
                                  ? 'ابحث عن شريك سكن متوافق معك بسهولة'
                                  : 'Find a compatible roommate easily',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  RoommateFormScreen(user: widget.user),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          foregroundColor: AppColors.textDark,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 10),
                          elevation: 0,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              isAr ? 'طلب شريك' : 'Apply',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12.5,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              isAr
                                  ? Icons.arrow_back_ios
                                  : Icons.arrow_forward_ios,
                              size: 11,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Filters Bar
                if (_filters.length > 1)
                  Container(
                    height: 52,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filters.length,
                      itemBuilder: (context, idx) {
                        final f = _filters[idx];
                        final isSelected = f == _selectedFilter;
                        return Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: ChoiceChip(
                            label: Text(
                              f,
                              style: TextStyle(
                                color: isSelected
                                    ? AppColors.textDark
                                    : Colors.white,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                fontSize: 12,
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: AppColors.accent,
                            backgroundColor: AppColors.primaryDark,
                            onSelected: (_) =>
                                setState(() => _selectedFilter = f),
                          ),
                        );
                      },
                    ),
                  ),

                // 3. Offers & Dashboard Apartments List
                Expanded(
                  child: _isLoading
                      ? const LoadingStateWidget(messageKey: 'loading_offers')
                      : _isError
                          ? ErrorStateWidget(
                              message: LanguageService.tr('error_occurred'),
                              onRetry: _fetchOffers,
                            )
                          : hasSpecialOffers
                              ? _buildOffersListView(filteredOffers)
                              : _buildApartmentsListView(filteredApts),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildOffersListView(List<HousingOffer> offers) {
    if (offers.isEmpty) {
      return const EmptyStateWidget(
        titleKey: 'no_results',
        descriptionKey: 'no_search_results_desc',
        icon: Icons.search_off,
      );
    }

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _fetchOffers,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: offers.length,
        itemBuilder: (context, idx) {
          final offer = offers[idx];
          final apt = offer.apartment;
          final String displayImg =
              offer.imageUrl ?? (apt?.primaryImage ?? '');

          return GestureDetector(
            onTap: () {
              if (apt == null) return;
              final aptMap = Map<String, dynamic>.from(apt.toJson());
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
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(20)),
                    child: _buildOfferImage(displayImg),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
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
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                LanguageService.formatDiscountPercent(
                                    offer.calculatedDiscountPercent),
                                style: TextStyle(
                                  color: Colors.red.shade700,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          offer.title,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
                          ),
                        ),
                        if (offer.description.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            offer.description,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textMuted,
                              height: 1.4,
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
    );
  }

  Widget _buildApartmentsListView(List<Map<String, dynamic>> apts) {
    if (apts.isEmpty) {
      return const EmptyStateWidget(
        titleKey: 'no_offers_title',
        descriptionKey: 'no_offers_desc',
        icon: Icons.local_offer_outlined,
      );
    }

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _fetchOffers,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: apts.length,
        itemBuilder: (context, idx) {
          final apt = apts[idx];
          final bool isFeatured = (apt['is_featured'] == true ||
              apt['is_featured'] == 1 ||
              apt['is_featured'] == '1');
          final bool isSpecialOffer = (apt['is_special_offer'] == true ||
              apt['is_special_offer'] == 1 ||
              apt['is_special_offer'] == '1');

          final String price = apt['price']?.toString() ?? '0';
          final String title = apt['title']?.toString() ?? 'شقة طلابية';
          final String district = apt['district']?.toString() ??
              apt['location']?.toString() ??
              'تبليسي';
          final images = List<String>.from((apt['images'] as List?)
                  ?.map((e) => e.toString()) ??
              ['assets/images/apt1.png']);
          final firstImg = images.isNotEmpty ? images.first : 'assets/images/apt1.png';

          return GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ApartmentDetailScreen(
                    apartment: apt,
                    user: widget.user,
                  ),
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isFeatured
                      ? const Color(0xFFF59E0B).withValues(alpha: 0.5)
                      : isSpecialOffer
                          ? const Color(0xFFEF4444).withValues(alpha: 0.5)
                          : Colors.grey.shade200,
                  width: isFeatured || isSpecialOffer ? 1.5 : 1.0,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isFeatured
                        ? const Color(0xFFF59E0B).withValues(alpha: 0.15)
                        : isSpecialOffer
                            ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                            : Colors.black.withValues(alpha: 0.06),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(20)),
                        child: _buildOfferImage(firstImg),
                      ),
                      if (isFeatured)
                        PositionedDirectional(
                          top: 12,
                          start: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B),
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '⭐ مميز',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (isSpecialOffer)
                        PositionedDirectional(
                          top: isFeatured ? 44 : 12,
                          start: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFEF4444), Color(0xFFF97316)],
                              ),
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.red.withValues(alpha: 0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.local_fire_department,
                                    color: Colors.white, size: 13),
                                SizedBox(width: 3),
                                Text(
                                  'عرض خاص',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.primaryDark,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                "$price \$ / شهرياً",
                                style: const TextStyle(
                                  color: AppColors.accent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined,
                                    size: 14, color: AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  district,
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
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
      ),
    );
  }

  Widget _buildOfferImage(String displayImg) {
    if (displayImg.isEmpty) {
      return Image.asset(
        'assets/images/apt1.png',
        height: 190,
        width: double.infinity,
        fit: BoxFit.cover,
      );
    }
    if (displayImg.startsWith('assets/')) {
      return Image.asset(
        displayImg,
        height: 190,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Image.asset(
          'assets/images/apt1.png',
          height: 190,
          width: double.infinity,
          fit: BoxFit.cover,
        ),
      );
    }
    return Image.network(
      ApiService.resolveImageUrl(displayImg),
      height: 190,
      width: double.infinity,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => Image.asset(
        'assets/images/apt1.png',
        height: 190,
        width: double.infinity,
        fit: BoxFit.cover,
      ),
    );
  }
}
