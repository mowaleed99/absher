import 'package:flutter/material.dart';
import '../models/country_code.dart';
import '../services/language_service.dart';
import '../theme/app_colors.dart';

class CountryPickerBottomSheet extends StatefulWidget {
  final CountryCode selectedCountry;

  const CountryPickerBottomSheet({
    super.key,
    required this.selectedCountry,
  });

  static Future<CountryCode?> show(
    BuildContext context, {
    required CountryCode selectedCountry,
  }) {
    return showModalBottomSheet<CountryCode>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CountryPickerBottomSheet(
        selectedCountry: selectedCountry,
      ),
    );
  }

  @override
  State<CountryPickerBottomSheet> createState() =>
      _CountryPickerBottomSheetState();
}

class _CountryPickerBottomSheetState extends State<CountryPickerBottomSheet> {
  final TextEditingController _searchController = TextEditingController();
  List<CountryCode> _filteredCountries = CountryCode.allCountries;

  @override
  void initState() {
    super.initState();
    _filteredCountries = CountryCode.allCountries;
  }

  void _onSearchChanged(String query) {
    final clean = query.trim().toLowerCase();
    setState(() {
      if (clean.isEmpty) {
        _filteredCountries = CountryCode.allCountries;
      } else {
        _filteredCountries = CountryCode.allCountries.where((c) {
          final dial = c.dialCode.replaceAll('+', '').toLowerCase();
          final nameAr = c.nameAr.toLowerCase();
          final nameEn = c.nameEn.toLowerCase();
          final code = c.code.toLowerCase();
          return nameAr.contains(clean) ||
              nameEn.contains(clean) ||
              code.contains(clean) ||
              dial.contains(clean) ||
              c.dialCode.contains(clean);
        }).toList();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isAr = LanguageService.currentLang.value == 'ar';

    return Material(
      color: AppColors.cardBg,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          children: [
            // Drag handle
            const SizedBox(height: 12),
            Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    isAr ? 'اختر الدولة / رمز الاتصال' : 'Select Country Code',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: isAr ? 'ابحث باسم الدولة أو الكود (+20, مصر...)' : 'Search country or code...',
                prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.primary, width: 2),
                ),
              ),
            ),
          ),

          const Divider(height: 1),

          // Country List
          Expanded(
            child: _filteredCountries.isEmpty
                ? Center(
                    child: Text(
                      isAr ? 'لا توجد نتائج مطابقة' : 'No matching countries',
                      style: const TextStyle(color: AppColors.textMuted),
                    ),
                  )
                : ListView.separated(
                    itemCount: _filteredCountries.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, indent: 64),
                    itemBuilder: (ctx, idx) {
                      final country = _filteredCountries[idx];
                      final isSelected = country.dialCode == widget.selectedCountry.dialCode &&
                          country.code == widget.selectedCountry.code;

                      return ListTile(
                        onTap: () => Navigator.pop(context, country),
                        leading: Text(
                          country.flag,
                          style: const TextStyle(fontSize: 26),
                        ),
                        title: Text(
                          country.localizedName(isAr ? 'ar' : 'en'),
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? AppColors.primary : AppColors.textDark,
                          ),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary.withValues(alpha: 0.15)
                                : AppColors.background,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : Colors.grey.shade300,
                            ),
                          ),
                          child: Text(
                            country.dialCode,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? AppColors.primary : AppColors.textDark,
                              letterSpacing: 0.5,
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
}
