import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'apartment_detail_screen.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../services/realtime_sync_service.dart';
import 'chat_screen.dart';
import '../models/student.dart';
import '../core/empty_state_widget.dart';

class FlatsListScreen extends StatefulWidget {
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
  State<FlatsListScreen> createState() => _FlatsListScreenState();
}

class _FlatsListScreenState extends State<FlatsListScreen> {
  late List<Map<String, dynamic>> _apartments;
  StreamSubscription? _aptsSub;

  // Search & Filters
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  final List<String> _selectedUniversities = [];
  int? _maxPriceFilter;
  int? _districtIdFilter;
  String? _rentalTypeFilter;
  int? _roomsCountFilter;

  List<Map<String, dynamic>> _districtsList = [];

  @override
  void initState() {
    super.initState();
    _apartments = List.from(widget.apartments);
    _loadDistricts();
    _loadApartments();

    _aptsSub = RealtimeSyncService().onApartmentsUpdated.listen((_) {
      if (mounted) _loadApartments();
    });
  }

  Future<void> _loadDistricts() async {
    try {
      final dists = await ApiService.getDistricts();
      if (mounted) {
        setState(() {
          _districtsList = dists;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _aptsSub?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadApartments() async {
    try {
      final list = await ApiService.getApartments();
      if (mounted && list.isNotEmpty) {
        setState(() {
          _apartments = list;
        });
      }
    } catch (_) {}
  }

  List<Map<String, dynamic>> get _filteredApartments {
    final list = _apartments.where((apt) {
      final rType = apt['rental_type']?.toString();
      final roomsCount = apt['rooms_count'] is int
          ? apt['rooms_count'] as int
          : int.tryParse(apt['rooms_count']?.toString() ?? '');

      // 1. Single / Shared filter mode
      if (widget.filterSingleOnly) {
        bool matchesSingle = (roomsCount == 1 || rType == 'room_shared' || rType == 'studio');
        if (!matchesSingle) {
          final titleStr = (apt['title'] ?? '').toString();
          final descStr = (apt['description'] ?? '').toString();
          final featuresList = (apt['features'] as List?)?.map((e) => e.toString()).join(' ') ?? '';
          final combined = '$titleStr $descStr $featuresList'.toLowerCase();
          matchesSingle = combined.contains('غرفة') ||
              combined.contains('غرفه') ||
              combined.contains('مشترك') ||
              combined.contains('استوديو') ||
              combined.contains('studio') ||
              combined.contains('room');
        }
        if (!matchesSingle) return false;
      }

      // 2. Text Search
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final title = (apt['title'] ?? '').toString().toLowerCase();
        final desc = (apt['description'] ?? '').toString().toLowerCase();
        final loc = (apt['location'] ?? '').toString().toLowerCase();
        final id = (apt['id'] ?? '').toString();
        final features = (apt['features'] as List?)?.map((e) => e.toString().toLowerCase()).join(' ') ?? '';
        if (!title.contains(q) && !desc.contains(q) && !loc.contains(q) && !id.contains(q) && !features.contains(q)) {
          return false;
        }
      }

      // 3. University filter
      if (_selectedUniversities.isNotEmpty) {
        final aptUnis = (apt['universities'] as List?)?.map((u) => u.toString()).toList() ?? [];
        final hasUni = _selectedUniversities.any((selected) =>
            aptUnis.any((u) => u.toLowerCase().contains(selected.toLowerCase())));
        if (!hasUni) return false;
      }

      // 4. Max Price filter
      if (_maxPriceFilter != null) {
        final priceStr = (apt['price'] ?? '').toString().replaceAll(RegExp(r'[^0-9]'), '');
        final price = int.tryParse(priceStr) ?? 0;
        if (price > _maxPriceFilter!) return false;
      }

      // 5. District filter
      if (_districtIdFilter != null) {
        final distId = apt['district_id'] is int
            ? apt['district_id'] as int
            : int.tryParse(apt['district_id']?.toString() ?? '');
        if (distId != _districtIdFilter) return false;
      }

      // 6. Rental Type filter
      if (_rentalTypeFilter != null && _rentalTypeFilter != 'all_flats') {
        if (rType != _rentalTypeFilter) return false;
      }

      // 7. Rooms Count filter
      if (_roomsCountFilter != null) {
        if (roomsCount != _roomsCountFilter) return false;
      }

      return true;
    }).toList();

    // Sort featured items first
    list.sort((a, b) {
      final bool aFeatured = (a['is_featured'] == true || a['is_featured'] == 1 || a['is_featured'] == '1');
      final bool bFeatured = (b['is_featured'] == true || b['is_featured'] == 1 || b['is_featured'] == '1');
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return 0;
    });

    return list;
  }

  bool get _hasActiveFilters =>
      _searchQuery.isNotEmpty ||
      _selectedUniversities.isNotEmpty ||
      _maxPriceFilter != null ||
      _districtIdFilter != null ||
      _rentalTypeFilter != null ||
      _roomsCountFilter != null;

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _searchQuery = '';
      _selectedUniversities.clear();
      _maxPriceFilter = null;
      _districtIdFilter = null;
      _rentalTypeFilter = null;
      _roomsCountFilter = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _filteredApartments;
    final isAr = LanguageService.currentLang.value == 'ar';

    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          centerTitle: true,
          title: Text(
            widget.filterSingleOnly
                ? (isAr ? 'اختيار غرفة في شقة' : 'Shared Rooms & Flats')
                : (isAr ? 'إيجار الشقق' : 'Rent Flats'),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          iconTheme: const IconThemeData(color: Colors.white),
          actions: [
            IconButton(
              icon: const Icon(Icons.support_agent, color: Colors.white),
              tooltip: LanguageService.tr('chat'),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => ChatScreen(user: widget.user)),
                );
              },
            ),
          ],
        ),
        body: Column(
          children: [
            // 1. هيدر توضيحي مميز
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
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
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.2),
                        shape: BoxShape.circle),
                    child: Icon(
                        widget.filterSingleOnly
                            ? Icons.meeting_room_outlined
                            : Icons.apartment,
                        color: AppColors.accent,
                        size: 26),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.bold,
                              fontSize: 15),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.subtitle,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 2. شريط البحث النصي وحالة الفلاتر
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade300, width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // حقل البحث
                    TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val.trim()),
                      decoration: InputDecoration(
                        hintText: isAr
                            ? 'ابحث باسم الشقة، الحي، المواصفات...'
                            : 'Search by title, district, features...',
                        hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                        prefixIcon: const Icon(Icons.search, color: AppColors.primary, size: 22),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),

                    // أزرار الفلاتر السريعة
                    Row(
                      children: [
                        // فلتر الحي
                        Expanded(
                          child: _buildFilterDropdown(
                            label: isAr ? 'الحي' : 'District',
                            value: _districtIdFilter != null
                                ? (_districtsList.firstWhere(
                                    (d) => d['id']?.toString() == _districtIdFilter.toString(),
                                    orElse: () => {'name': isAr ? 'كل الأحياء' : 'All'},
                                  )['name'] as String)
                                : (isAr ? 'كل الأحياء' : 'All'),
                            items: [
                              isAr ? 'كل الأحياء' : 'All',
                              ..._districtsList.map((e) => e['name'].toString())
                            ],
                            onChanged: (val) {
                              if (val == null || val == 'كل الأحياء' || val == 'All') {
                                setState(() => _districtIdFilter = null);
                              } else {
                                final d = _districtsList.firstWhere(
                                    (d) => d['name'].toString() == val,
                                    orElse: () => {});
                                setState(() => _districtIdFilter =
                                    d['id'] != null ? int.tryParse(d['id'].toString()) : null);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 8),

                        // فلتر السعر
                        Expanded(
                          child: _buildFilterButton(
                            label: _maxPriceFilter == null
                                ? (isAr ? 'السعر' : 'Price')
                                : '≤ $_maxPriceFilter\$',
                            isActive: _maxPriceFilter != null,
                            onTap: _showPriceDialog,
                          ),
                        ),
                        const SizedBox(width: 8),

                        // فلتر الغرف
                        Expanded(
                          child: _buildFilterDropdown(
                            label: isAr ? 'الغرف' : 'Rooms',
                            value: _roomsCountFilter != null
                                ? '${_roomsCountFilter!} ${isAr ? "غرفة" : "rm"}'
                                : (isAr ? 'الكل' : 'All'),
                            items: [
                              isAr ? 'الكل' : 'All',
                              '1 ${isAr ? "غرفة" : "rm"}',
                              '2 ${isAr ? "غرفة" : "rm"}',
                              '3 ${isAr ? "غرفة" : "rm"}',
                              '4+ ${isAr ? "غرفة" : "rm"}',
                            ],
                            onChanged: (val) {
                              if (val == null || val == 'الكل' || val == 'All') {
                                setState(() => _roomsCountFilter = null);
                              } else {
                                final numMatch = RegExp(r'\d+').firstMatch(val);
                                setState(() => _roomsCountFilter =
                                    numMatch != null ? int.tryParse(numMatch.group(0)!) : null);
                              }
                            },
                          ),
                        ),

                        // زر مسح الفلاتر
                        if (_hasActiveFilters) ...[
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: _clearFilters,
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: const Icon(Icons.refresh, color: Colors.red, size: 20),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),

            // 3. شريط عدد النتائج
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${isAr ? "النتائج المتاحة" : "Available flats"}: ${filteredList.length}',
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMuted),
                  ),
                  if (filteredList.any((a) => a['is_featured'] == true || a['is_featured'] == 1))
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          isAr ? 'عروض مميزة في الأعلى' : 'Featured on top',
                          style: const TextStyle(
                              fontSize: 11,
                              color: Colors.amber,
                              fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                ],
              ),
            ),

            // 4. قائمة الشقق
            Expanded(
              child: filteredList.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.apartment_outlined,
                      title: isAr ? 'لا توجد شقق مطابقة' : 'No matching flats found',
                      description: isAr
                          ? 'لم نجد أي شقق تطابق البحث أو الفلاتر المحددة. جرب تغيير معايير البحث.'
                          : 'No flats match your search or filter criteria. Try resetting filters.',
                      onAction: _hasActiveFilters ? _clearFilters : null,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: filteredList.length,
                      itemBuilder: (context, index) {
                        final apt = filteredList[index];
                        final bool isFeatured = (apt['is_featured'] == true ||
                            apt['is_featured'] == 1 ||
                            apt['is_featured'] == '1');
                        final bool isSpecialOffer = (apt['is_special_offer'] == true ||
                            apt['is_special_offer'] == 1 ||
                            apt['is_special_offer'] == '1');

                        final images = (apt['images'] as List?)?.map((e) => e.toString()).toList() ?? [];
                        final String? firstImg = images.isNotEmpty ? images.first : null;
                        final String title = apt['title']?.toString() ?? '';
                        final String price = apt['price']?.toString() ?? '';
                        final String location = apt['location']?.toString() ?? '';
                        final String proximity = apt['proximity']?.toString() ?? '';
                        final String rentalType = apt['rental_type']?.toString() ?? 'apartment';

                        String rentalTypeLabel = isAr ? 'شقة' : 'Flat';
                        Color rtColor = Colors.amber.shade700;
                        if (rentalType == 'room_shared' || rentalType == 'مشترك' || rentalType == 'غرفة في شقة') {
                          rentalTypeLabel = isAr ? 'غرفة مشتركة' : 'Shared Room';
                          rtColor = Colors.lightBlue.shade700;
                        } else if (rentalType == 'studio' || rentalType == 'ستوديو') {
                          rentalTypeLabel = isAr ? 'ستوديو' : 'Studio';
                          rtColor = Colors.purple.shade600;
                        }

                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
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
                                color: isFeatured ? Colors.amber.shade400 : Colors.grey.shade200,
                                width: isFeatured ? 2.0 : 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: isFeatured
                                      ? Colors.amber.withValues(alpha: 0.15)
                                      : Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 12,
                                  offset: const Offset(0, 5),
                                )
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // صورة الشقة مع الشارات
                                  Stack(
                                    children: [
                                      SizedBox(
                                        height: 180,
                                        width: double.infinity,
                                        child: firstImg != null && firstImg.isNotEmpty
                                            ? (firstImg.startsWith('http') || firstImg.startsWith('uploads/'))
                                                ? Image.network(
                                                    ApiService.resolveImageUrl(firstImg),
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (_, __, ___) => Container(
                                                      color: Colors.grey.shade200,
                                                      child: const Icon(Icons.apartment, size: 50, color: Colors.grey),
                                                    ),
                                                  )
                                                : Image.asset(
                                                    firstImg,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (_, __, ___) => Container(
                                                      color: Colors.grey.shade200,
                                                      child: const Icon(Icons.apartment, size: 50, color: Colors.grey),
                                                    ),
                                                  )
                                            : Container(
                                                color: Colors.grey.shade200,
                                                child: const Icon(Icons.apartment, size: 50, color: Colors.grey),
                                              ),
                                      ),

                                      // شارة السعر
                                      PositionedDirectional(
                                        bottom: 12,
                                        end: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: AppColors.primaryDark.withValues(alpha: 0.9),
                                            borderRadius: BorderRadius.circular(20),
                                            border: Border.all(color: AppColors.accent, width: 1.5),
                                          ),
                                          child: Text(
                                            price.contains('\$') ? price : '$price\$',
                                            style: const TextStyle(
                                                color: AppColors.accent,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14),
                                          ),
                                        ),
                                      ),

                                      // شارة نوع السكن
                                      PositionedDirectional(
                                        top: 12,
                                        start: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: rtColor.withValues(alpha: 0.9),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            rentalTypeLabel,
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11),
                                          ),
                                        ),
                                      ),

                                      // شارة مميز
                                      if (isFeatured)
                                        PositionedDirectional(
                                          top: 12,
                                          end: 12,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(
                                              gradient: const LinearGradient(
                                                colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                                              ),
                                              borderRadius: BorderRadius.circular(12),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.amber.withValues(alpha: 0.4),
                                                  blurRadius: 6,
                                                  offset: const Offset(0, 2),
                                                )
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.star, color: Colors.white, size: 12),
                                                const SizedBox(width: 4),
                                                Text(
                                                  isAr ? 'مميز' : 'Featured',
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 11),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),

                                      // شارة عرض خاص
                                      if (isSpecialOffer)
                                        PositionedDirectional(
                                          top: isFeatured ? 44 : 12,
                                          end: 12,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(
                                              gradient: const LinearGradient(
                                                colors: [Color(0xFFEF4444), Color(0xFFF97316)],
                                              ),
                                              borderRadius: BorderRadius.circular(12),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.red.withValues(alpha: 0.4),
                                                  blurRadius: 6,
                                                  offset: const Offset(0, 2),
                                                )
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.local_fire_department, color: Colors.white, size: 13),
                                                const SizedBox(width: 4),
                                                Text(
                                                  isAr ? 'عرض خاص' : 'Special Offer',
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 11),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),

                                  // تفاصيل الشقة
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textDark),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on_outlined, size: 16, color: AppColors.accent),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                location,
                                                style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (proximity.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.directions_walk, size: 16, color: AppColors.primary),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  proximity,
                                                  style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
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

  Widget _buildFilterButton({required String label, required bool isActive, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 38,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withValues(alpha: 0.1) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? AppColors.primary : Colors.grey.shade300,
            width: 1.2,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? AppColors.primary : AppColors.textDark,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            fontSize: 11.5,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  Widget _buildFilterDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    final bool isSelected = value != (LanguageService.currentLang.value == 'ar' ? 'كل الأحياء' : 'All') &&
        value != (LanguageService.currentLang.value == 'ar' ? 'الكل' : 'All');

    return Container(
      height: 38,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isSelected ? AppColors.primary : Colors.grey.shade300,
          width: 1.2,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: items.contains(value) ? value : items.first,
          isExpanded: true,
          icon: Icon(Icons.arrow_drop_down,
              color: isSelected ? AppColors.primary : Colors.grey.shade600, size: 18),
          style: TextStyle(
            color: isSelected ? AppColors.primary : AppColors.textDark,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 11.5,
          ),
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item, maxLines: 1, overflow: TextOverflow.ellipsis),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  void _showPriceDialog() {
    final isAr = LanguageService.currentLang.value == 'ar';
    final prices = [300, 500, 700, 1000, 1500, 2000];

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isAr ? 'الحد الأقصى للسعر شهرياً (\$)' : 'Maximum Monthly Price (\$)',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                ...prices.map((p) => ChoiceChip(
                      label: Text('$p\$'),
                      selected: _maxPriceFilter == p,
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: _maxPriceFilter == p ? Colors.white : AppColors.textDark,
                        fontWeight: FontWeight.bold,
                      ),
                      onSelected: (selected) {
                        setState(() => _maxPriceFilter = selected ? p : null);
                        Navigator.pop(context);
                      },
                    )),
                ChoiceChip(
                  label: Text(isAr ? 'الكل (أي سعر)' : 'Any Price'),
                  selected: _maxPriceFilter == null,
                  onSelected: (_) {
                    setState(() => _maxPriceFilter = null);
                    Navigator.pop(context);
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
