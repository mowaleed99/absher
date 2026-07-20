import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'apartment_detail_screen.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import 'chat_screen.dart';

class FlatsListScreen extends StatelessWidget {
  final List<Map<String, dynamic>> apartments;
  final Map<String, dynamic> user;
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
    // تصفية الشقق في حالة اختيار شقة بمفردك (لشخص واحد / ستوديو / 1 غرفة)
    final filteredList = filterSingleOnly
        ? apartments.where((apt) {
            final titleStr = (apt['title'] ?? '').toString();
            final descStr = (apt['description'] ?? '').toString();
            final featuresList = (apt['features'] as List?)?.map((e) => e.toString()).join(' ') ?? '';
            final combined = '$titleStr $descStr $featuresList';
            // التحقق مما إذا كانت الشقة تناسب شخص واحد (ستوديو، 1 غرفة، منفرد، بمفردك) أو إظهارها إذا لم تكن مشتركة بوضوح
            return combined.contains(LanguageService.tr('auto_trans_1038')) ||
                combined.contains(LanguageService.tr('auto_trans_1039')) ||
                combined.contains(LanguageService.tr('auto_trans_1040')) ||
                combined.contains(LanguageService.tr('auto_trans_1041')) ||
                !combined.contains(LanguageService.tr('auto_trans_1042'));
          }).toList()
        : apartments;

    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
          title: Text(LanguageService.tr('auto_trans_1043'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          iconTheme: const IconThemeData(color: Colors.white),
          actions: [
            Padding(
              padding: const EdgeInsets.only(left: 12.0),
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
                boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.2), shape: BoxShape.circle),
                    child: Icon(filterSingleOnly ? Icons.person : Icons.apartment, color: AppColors.accent, size: 32),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(subtitle, style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.4)),
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
                  Text('${LanguageService.tr('available_options')} (${filteredList.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFE8F5E9), borderRadius: BorderRadius.circular(10)),
                    child: Text(LanguageService.tr('furnished_equipped'), style: const TextStyle(color: Color(0xFF2E7D32), fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),

            // قائمة الشقق
            Expanded(
              child: filteredList.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.home_work_outlined, size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          Text(LanguageService.tr('no_matching_flats'), style: const TextStyle(fontSize: 16, color: AppColors.textMuted)),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                            child: Text(LanguageService.tr('go_back'), style: const TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: filteredList.length,
                      itemBuilder: (context, idx) {
                        final apt = filteredList[idx];
                        final imagesList = List<String>.from((apt['images'] as List?)?.map((e) => e.toString()) ?? ['assets/images/apt1.png']);
                        final firstImg = imagesList.isNotEmpty ? imagesList.first : 'assets/images/apt1.png';

                        final moveInStr = apt['move_in_date']?.toString() ?? LanguageService.tr('immediate_move_in');
                        final isScheduled = apt['move_in_type'] == LanguageService.tr('auto_trans_1044') || moveInStr.contains(LanguageService.tr('auto_trans_1045')) || moveInStr.contains(LanguageService.tr('auto_trans_1046'));

                        return GestureDetector(
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ApartmentDetailScreen(apartment: apt, user: user))),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 15, offset: const Offset(0, 5))],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                 ClipRRect(
                                   borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
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
                                Padding(
                                  padding: const EdgeInsets.all(18),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
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
                                            decoration: BoxDecoration(
                                              color: isScheduled ? const Color(0xFFFFF3E0) : const Color(0xFFE8F5E9),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: Text(
                                              moveInStr,
                                              style: TextStyle(
                                                color: isScheduled ? const Color(0xFFE65100) : const Color(0xFF2E7D32),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                              ),
                                            ),
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
                                      const Divider(height: 24),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(LanguageService.tr('click_to_view_images'), style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 13)),
                                          const Icon(Icons.arrow_back, color: AppColors.primary, size: 18),
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
