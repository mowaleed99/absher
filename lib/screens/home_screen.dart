import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import 'apartment_detail_screen.dart';
import 'rent_flat_screen.dart';
import 'services_screen.dart';
import 'chat_screen.dart';
import 'offers_screen.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';
import '../services/api_service.dart';
import '../models/student.dart';
import '../models/news.dart';
import '../models/university.dart';

class HomeScreen extends StatefulWidget {
  final Student? user;
  final bool isGuest;
  const HomeScreen({super.key, this.user, this.isGuest = false});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  List<News> _newsList = [];
  List<Map<String, dynamic>> _notificationsList = [];
  List<University> _universitiesList = [];
  List<String> _districtsList = [];
  List<String> _selectedUniversities = [];
  int? _maxPriceFilter;
  String _rentalTypeFilter = 'all_flats';
  String _districtFilter = 'all_districts';
  String _roomsFilter = 'all';
  String _bathroomsFilter = 'all';
  String _minutesFilter = 'all';
  final PageController _adController = PageController();
  final ValueNotifier<int> _currentAdPage = ValueNotifier<int>(0);
  Timer? _adTimer;

  // إعلانات متحركة بصور حقيقية وأحداث وتخفيضات
  final List<Map<String, String>> _adBanners = [
    {
      'title': LanguageService.tr('auto_trans_1051'),
      'desc': LanguageService.tr('auto_trans_1052'),
      'sub': LanguageService.tr('auto_trans_1053'),
      'img': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1054')
    },
    {
      'title': LanguageService.tr('auto_trans_1055'),
      'desc': LanguageService.tr('auto_trans_1056'),
      'sub': LanguageService.tr('auto_trans_1057'),
      'img': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1058')
    },
    {
      'title': LanguageService.tr('auto_trans_1059'),
      'desc': LanguageService.tr('auto_trans_1060'),
      'sub': LanguageService.tr('auto_trans_1061'),
      'img': 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1062')
    },
    {
      'title': LanguageService.tr('auto_trans_1063'),
      'desc': LanguageService.tr('auto_trans_1064'),
      'sub': LanguageService.tr('auto_trans_1065'),
      'img': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1066')
    },
  ];

  // الشقق السكنية المجهزة بالصور المرفقة بالظبط
  List<Map<String, dynamic>> _apartments = [
    {
      'id': '1',
      'title': LanguageService.tr('auto_trans_1067'),
      'price': LanguageService.tr('auto_trans_1068'),
      'location': LanguageService.tr('auto_trans_1069'),
      'proximity': LanguageService.tr('auto_trans_1070'),
      'rental_type': LanguageService.tr('auto_trans_1071'),
      'capacity': LanguageService.tr('auto_trans_1072'),
      'images': [
        'assets/images/apt1.png',
        'assets/images/apt2.png',
        'assets/images/apt3.png',
        'assets/images/apt4.png',
      ],
      'features': [LanguageService.tr('auto_trans_1073'), LanguageService.tr('auto_trans_1074'), LanguageService.tr('auto_trans_1075'), LanguageService.tr('auto_trans_1076'), LanguageService.tr('auto_trans_1077'), LanguageService.tr('auto_trans_1078'), LanguageService.tr('auto_trans_1079')],
      'description': LanguageService.tr('auto_trans_1080')
    },
    {
      'id': '2',
      'title': LanguageService.tr('auto_trans_1081'),
      'price': LanguageService.tr('auto_trans_1082'),
      'location': LanguageService.tr('auto_trans_1083'),
      'proximity': LanguageService.tr('auto_trans_1084'),
      'rental_type': LanguageService.tr('auto_trans_1085'),
      'capacity': LanguageService.tr('auto_trans_1086'),
      'images': [
        'assets/images/apt4.png',
        'assets/images/apt2.png',
        'assets/images/apt1.png',
      ],
      'features': [LanguageService.tr('auto_trans_1087'), LanguageService.tr('auto_trans_1088'), LanguageService.tr('auto_trans_1089'), LanguageService.tr('auto_trans_1090'), LanguageService.tr('auto_trans_1091'), LanguageService.tr('auto_trans_1092')],
      'description': LanguageService.tr('auto_trans_1093')
    },
    {
      'id': '3',
      'title': LanguageService.tr('auto_trans_1094'),
      'price': LanguageService.tr('auto_trans_1095'),
      'location': LanguageService.tr('auto_trans_1096'),
      'proximity': LanguageService.tr('auto_trans_1097'),
      'rental_type': LanguageService.tr('auto_trans_1098'),
      'capacity': LanguageService.tr('auto_trans_1099'),
      'roommate_reqs': LanguageService.tr('auto_trans_1100'),
      'roommate_facilities': LanguageService.tr('auto_trans_1101'),
      'images': [
        'assets/images/apt3.png',
        'assets/images/apt1.png',
        'assets/images/apt4.png',
        'assets/images/apt2.png',
      ],
      'features': [LanguageService.tr('auto_trans_1102'), LanguageService.tr('auto_trans_1103'), LanguageService.tr('auto_trans_1104'), LanguageService.tr('auto_trans_1105'), LanguageService.tr('auto_trans_1106'), LanguageService.tr('auto_trans_1107')],
      'description': LanguageService.tr('auto_trans_1108')
    },
    {
      'id': '4',
      'title': LanguageService.tr('auto_trans_1109'),
      'price': LanguageService.tr('auto_trans_1110'),
      'location': LanguageService.tr('auto_trans_1111'),
      'proximity': LanguageService.tr('auto_trans_1112'),
      'rental_type': LanguageService.tr('auto_trans_1113'),
      'capacity': LanguageService.tr('auto_trans_1114'),
      'images': [
        'assets/images/apt2.png',
        'assets/images/apt3.png',
      ],
      'features': [LanguageService.tr('auto_trans_1115'), LanguageService.tr('auto_trans_1116'), LanguageService.tr('auto_trans_1117'), LanguageService.tr('auto_trans_1118'), LanguageService.tr('auto_trans_1119'), LanguageService.tr('auto_trans_1120')],
      'description': LanguageService.tr('auto_trans_1121')
    },
    {
      'id': '5',
      'title': LanguageService.tr('auto_trans_1122'),
      'price': LanguageService.tr('auto_trans_1123'),
      'location': LanguageService.tr('auto_trans_1124'),
      'proximity': LanguageService.tr('auto_trans_1125'),
      'rental_type': LanguageService.tr('auto_trans_1126'),
      'capacity': LanguageService.tr('auto_trans_1127'),
      'roommate_reqs': LanguageService.tr('auto_trans_1128'),
      'roommate_facilities': LanguageService.tr('auto_trans_1129'),
      'images': [
        'assets/images/apt1.png',
        'assets/images/apt4.png',
      ],
      'features': [LanguageService.tr('auto_trans_1130'), LanguageService.tr('auto_trans_1131'), LanguageService.tr('auto_trans_1132'), LanguageService.tr('auto_trans_1133'), LanguageService.tr('auto_trans_1134')],
      'description': LanguageService.tr('auto_trans_1135')
    },
  ];

  List<Widget> _buildPages(Student? usr) => [
        _buildHomeTab(usr),
        ServicesScreen(user: usr),
        ChatScreen(user: usr),
        OffersScreen(user: usr, apartments: _apartments),
        ProfileScreen(user: usr, isGuest: widget.isGuest),
      ];

  @override
  void initState() {
    super.initState();
    _loadApartments();
    _loadNews();
    _loadNotifications();
    _loadUniversities();
    _loadDistricts();

    // تشغيل التمرير التلقائي للإعلانات كل 3.5 ثانية
    _adTimer = Timer.periodic(const Duration(milliseconds: 3500), (timer) {
      if (_adController.hasClients) {
        int nextPage = _currentAdPage.value + 1;
        final listLength = _newsList.isNotEmpty ? _newsList.length : _adBanners.length;
        if (nextPage >= listLength) nextPage = 0;
        _adController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _loadApartments() async {
    final list = await ApiService.getApartments();
    if (mounted) {
      setState(() {
        _apartments = list;
      });
    }
  }

  Future<void> _loadNews() async {
    final list = await ApiService.getNews();
    if (mounted) {
      setState(() {
        _newsList = list.map((n) => News.fromJson(n)).toList();
      });
    }
  }

  Future<void> _loadNotifications() async {
    final list = await ApiService.getNotifications();
    if (mounted) {
      setState(() {
        _notificationsList = list;
      });
    }
  }

  Future<void> _loadUniversities() async {
    final list = await ApiService.getUniversities();
    if (mounted) {
      setState(() {
        _universitiesList = list.map((u) => University.fromJson(u)).toList();
      });
    }
  }

  Future<void> _loadDistricts() async {
    final list = await ApiService.getDistricts();
    if (mounted) {
      setState(() {
        _districtsList = list.map((d) => d['name'].toString()).toList();
      });
    }
  }

  @override
  void dispose() {
    _adTimer?.cancel();
    _adController.dispose();
    super.dispose();
  }

  void _showNotificationsDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        height: MediaQuery.of(context).size.height * 0.6,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.notifications_active, color: AppColors.accent, size: 28),
                const SizedBox(width: 10),
                Text(LanguageService.tr('auto_trans_1136'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _newsList.isEmpty
                  ? Center(
                      child: Text(
                        LanguageService.tr('auto_trans_1137'),
                        style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _newsList.length,
                      itemBuilder: (context, index) {
                        final n = _newsList[index];
                        return _buildNotificationItem(
                          n.title,
                          n.content,
                          n.date ?? LanguageService.tr('auto_trans_1138'),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationItem(String title, String desc, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.accentLight, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accent.withValues(alpha: 0.3))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: AppColors.primary, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textDark)),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
            ),
          ),
          Text(time, style: const TextStyle(fontSize: 10, color: AppColors.primaryDark)),
        ],
      ),
    );
  }





  Widget _buildFilterChipDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    final isSelected = value != 'all' && value != 'all_districts' && value != 'all_flats';
    final bgColor = isSelected ? AppColors.primary : const Color(0xFFF1F5F9);
    final borderColor = isSelected ? AppColors.primary : AppColors.primary.withValues(alpha: 0.06);
    final textColor = isSelected ? Colors.white : Colors.black87;
    final iconColor = isSelected ? Colors.white : Colors.black54;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down, size: 18, color: iconColor),
          style: TextStyle(
            color: textColor,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            fontFamily: 'Cairo',
          ),
          dropdownColor: Colors.white,
          items: items.map((item) {
            final bool isAllItem = item == 'all' || item == 'all_flats' || item == 'all_districts' || item == LanguageService.tr('auto_trans_1139');
            return DropdownMenuItem(
              value: item,
              child: Text(
                isAllItem ? label : LanguageService.tr(item),
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: AppColors.textDark, fontWeight: FontWeight.normal),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildCustomFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final bgColor = isSelected ? AppColors.primary : const Color(0xFFF1F5F9);
    final borderColor = isSelected ? AppColors.primary : AppColors.primary.withValues(alpha: 0.06);
    final textColor = isSelected ? Colors.white : Colors.black87;
    final iconColor = isSelected ? Colors.white : Colors.black54;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: textColor,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
            Icon(Icons.arrow_drop_down, size: 18, color: iconColor),
          ],
        ),
      ),
    );
  }

  void _showUniversitiesDialog() {
    final allUnis = _universitiesList.map((u) => u.name).toList();
    if (allUnis.isEmpty) {
      allUnis.addAll([
        LanguageService.tr('auto_trans_1140'),
        LanguageService.tr('auto_trans_1141'),
        LanguageService.tr('auto_trans_1142'),
        LanguageService.tr('auto_trans_1143'),
      ]);
    }
    List<String> tempSelected = List.from(_selectedUniversities);

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(LanguageService.tr('select_universities'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: allUnis.map((uni) {
                    final isChecked = tempSelected.contains(uni);
                    return CheckboxListTile(
                      title: Text(uni, style: const TextStyle(fontSize: 13)),
                      value: isChecked,
                      activeColor: AppColors.primary,
                      onChanged: (val) {
                        setDialogState(() {
                          if (val == true) {
                            tempSelected.add(uni);
                          } else {
                            tempSelected.remove(uni);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    setState(() => _selectedUniversities = []);
                    Navigator.pop(context);
                  },
                  child: Text(LanguageService.tr('no_results'), style: const TextStyle(color: AppColors.textMuted)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  onPressed: () {
                    setState(() => _selectedUniversities = tempSelected);
                    Navigator.pop(context);
                  },
                  child: Text(LanguageService.tr('apply_filter'), style: const TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showPriceDialog() {
    final controller = TextEditingController(text: _maxPriceFilter != null ? _maxPriceFilter.toString() : '');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(LanguageService.tr('budget_title'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(LanguageService.tr('enter_budget_hint'), style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: LanguageService.tr('search_flats'),
                prefixIcon: const Icon(Icons.attach_money, color: AppColors.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() => _maxPriceFilter = null);
              Navigator.pop(context);
            },
            child: Text(LanguageService.tr('cancel_filter'), style: const TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () {
              final val = int.tryParse(controller.text.trim());
              setState(() => _maxPriceFilter = val);
              Navigator.pop(context);
            },
            child: Text(LanguageService.tr('apply'), style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }



  // محتوى التبويب الرئيسي (Home)
  Widget _buildHomeTab(Student? usr) {
    List<Map<String, dynamic>> filteredApts = List.from(_apartments);
    final List<Map<String, dynamic>> carouselItems = _newsList.isNotEmpty 
        ? _newsList.map((n) => {'title': n.title, 'content': n.content, 'image_url': n.imageUrl}).toList()
        : _adBanners.map((e) => Map<String, dynamic>.from(e)).toList();

    // 0. تصفية نوع الإيجار (جميع الشقق vs شقة vs غرفة في شقة)
    if (_rentalTypeFilter != 'all_flats') {
      filteredApts = filteredApts.where((a) {
        final rType = (a['rental_type'] ?? '').toString();
        final featStr = (a['features'] as List?)?.map((e) => e.toString()).join(' ') ?? '';
        final tit = (a['title'] ?? '').toString();
        final cap = (a['capacity'] ?? '').toString();
        final combined = '$rType $featStr $tit $cap';
        if (_rentalTypeFilter == LanguageService.tr('auto_trans_1144')) {
          return combined.contains(LanguageService.tr('auto_trans_1145')) || rType == LanguageService.tr('auto_trans_1146') || (!combined.contains(LanguageService.tr('auto_trans_1147')) && !combined.contains(LanguageService.tr('auto_trans_1148')) && !combined.contains(LanguageService.tr('auto_trans_1149')));
        } else if (_rentalTypeFilter == LanguageService.tr('auto_trans_1150')) {
          return combined.contains(LanguageService.tr('auto_trans_1151')) || rType == LanguageService.tr('auto_trans_1152') || combined.contains(LanguageService.tr('auto_trans_1153'));
        }
        return true;
      }).toList();
    }

    // 0.1 تصفية الحي
    if (_districtFilter != 'all_districts') {
      filteredApts = filteredApts.where((a) {
        final loc = (a['location'] ?? '').toString();
        final tit = (a['title'] ?? '').toString();
        final desc = (a['description'] ?? '').toString();
        final shortDistrict = _districtFilter.split(' ')[0]; // e.g. LanguageService.tr('auto_trans_1154')
        return loc.contains(shortDistrict) || tit.contains(shortDistrict) || desc.contains(shortDistrict);
      }).toList();
    }

    // 1. تصفية الجامعات (اختيار جامعة أو أكثر)
    if (_selectedUniversities.isNotEmpty) {
      filteredApts = filteredApts.where((a) {
        final aptUnis = (a['universities'] as List?)?.map((e) => e.toString()).toList() ?? [];
        if (aptUnis.isNotEmpty) {
          return _selectedUniversities.any((selected) => aptUnis.contains(selected));
        }
        
        final prox = (a['proximity'] ?? '').toString();
        final tit = (a['title'] ?? '').toString();
        final desc = (a['description'] ?? '').toString();
        final combined = '$prox $tit $desc';
        return _selectedUniversities.any((uni) {
          final shortUni = uni.split(' ')[0];
          return combined.contains(uni) || combined.contains(shortUni);
        });
      }).toList();
    }

    // 2. تصفية حسب السعر الذي يحدده المستخدم بنفسه (الميزانية)
    if (_maxPriceFilter != null && _maxPriceFilter! > 0) {
      filteredApts = filteredApts.where((a) {
        final priceStr = a['price'].toString().replaceAll(RegExp(r'[^0-9]'), '');
        final p = int.tryParse(priceStr) ?? 0;
        return p <= _maxPriceFilter!;
      }).toList();
    }

    // 2. تصفية غرف النوم
    if (_roomsFilter != 'all') {
      final key = _roomsFilter.split('_')[0]; // 'one', 'two', 'three'
      filteredApts = filteredApts.where((a) => (a['features'] as List).any((f) => f.toString().contains(key)) || (a['title'] as String).contains(key)).toList();
    }

    // 4. تصفية عدد الحمامات (تم إضافتها بدلاً من التعاقد ونوع السكن)
    if (_bathroomsFilter != 'all') {
      final key = _bathroomsFilter.split(' ')[0]; // '1' or '2' or '3+'
      filteredApts = filteredApts.where((a) {
        final featStr = (a['features'] as List?)?.map((e) => e.toString()).join(' ') ?? '';
        final descStr = (a['description'] ?? '').toString();
        return featStr.contains('$key حمام') || descStr.contains('$key حمام') || featStr.contains(LanguageService.tr('auto_trans_1155'));
      }).toList();
    }

    // 5. تصفية كم دقيقة للجامعة (10 دقائق أو 20 أو 30 أو وقت مفتوح)
    if (_minutesFilter != LanguageService.tr('auto_trans_1156') && _minutesFilter != LanguageService.tr('auto_trans_1157')) {
      final targetMins = int.tryParse(_minutesFilter.replaceAll(RegExp(r'[^0-9]'), '')) ?? 10;
      filteredApts = filteredApts.where((a) {
        final proxStr = (a['proximity'] ?? '').toString();
        if (proxStr.contains(LanguageService.tr('auto_trans_1158')) && targetMins >= 10) return true;
        final matches = RegExp(r'(\d+)\s*دقيقة').allMatches(proxStr);
        if (matches.isEmpty) return true; // الشقق التي لم يحدد بها وقت تظهر في كل الخيارات
        for (final m in matches) {
          final mVal = int.tryParse(m.group(1) ?? '999') ?? 999;
          if (mVal <= targetMins) return true;
        }
        return false;
      }).toList();
    }



    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
          // 1. App Bar علوي مخصص يحتوي على اللوجو وصورة الشخص واسمه
          Container(
            padding: const EdgeInsets.only(top: 16, bottom: 20, left: 20, right: 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppColors.accent,
                  child: CircleAvatar(
                    radius: 24,
                    backgroundColor: Colors.white,
                    child: Icon(widget.isGuest ? Icons.person_outline : Icons.person, color: AppColors.primary, size: 30),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${LanguageService.tr('welcome')} ${usr?.fullName ?? LanguageService.tr('auto_trans_1160')}',
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (usr?.universityId != null && usr!.universityId! > 0) ? 'University #${usr.universityId}' : LanguageService.tr('auto_trans_1161'),
                        style: const TextStyle(color: AppColors.accentLight, fontSize: 13),
                      ),
                    ],
                  ),
                ),

                IconButton(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => NotificationsScreen(user: usr))),
                  icon: Stack(
                    children: [
                      const Icon(Icons.notifications_outlined, color: Colors.white, size: 28),
                      if (_notificationsList.isNotEmpty)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                            child: Text(
                              _notificationsList.length.toString(),
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                    ],
                  ),
                  tooltip: LanguageService.tr('notifications'),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 48,
                  height: 48,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: AppColors.primaryDark, shape: BoxShape.circle, border: Border.all(color: AppColors.accent, width: 1.5)),
                  child: ClipOval(child: Image.asset('assets/images/logo.png', fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.star, color: AppColors.accent))),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. بانر الإعلانات المتحرك أفقياً (Carousel / PageView) مع صور حقيقية كثيرة
          Column(
            children: [
              SizedBox(
                height: 165,
                child: PageView.builder(
                  controller: _adController,
                  onPageChanged: (idx) => _currentAdPage.value = idx,
                  itemCount: carouselItems.length,
                  itemBuilder: (context, idx) {
                    final ad = carouselItems[idx];
                    final String imgUrl = ad['image_url']?.toString() ?? ad['img']?.toString() ?? '';
                    const String fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80';
                    final String title = ad['title']?.toString() ?? '';
                    final String desc = ad['content']?.toString() ?? ad['desc']?.toString() ?? '';
                    final String sub = ad['date']?.toString() ?? ad['sub']?.toString() ?? LanguageService.tr('auto_trans_1164');

                    return GestureDetector(
                      onTap: () => _showNewsDetail(context, ad),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.25), blurRadius: 15, offset: const Offset(0, 8))],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(22),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              // صورة الإعلان الحقيقية
                              Image.network(
                                imgUrl.isNotEmpty ? imgUrl : fallbackImg,
                                cacheWidth: 800,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: AppColors.primaryDark,
                                  child: const Icon(Icons.newspaper, size: 50, color: AppColors.accent),
                                ),
                              ),
                              // تدرج لوني داكن وذهبي لحماية النصوص
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomRight,
                                    end: Alignment.topLeft,
                                    colors: [
                                      AppColors.primaryDark.withValues(alpha: 0.95),
                                      AppColors.primaryDark.withValues(alpha: 0.6),
                                      Colors.transparent,
                                    ],
                                  ),
                                ),
                              ),
                              // محتوى الشريحة
                              Padding(
                                padding: const EdgeInsets.all(18),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        Text('${idx + 1} / ${carouselItems.length}', style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const Spacer(),
                                    Text(
                                      title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: AppColors.accent, fontSize: 16, fontWeight: FontWeight.w900),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      desc,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      sub,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                                    ),
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
              const SizedBox(height: 10),
              // نقاط المؤشر المؤكدة للحركة
              ValueListenableBuilder<int>(
                valueListenable: _currentAdPage,
                builder: (context, currentPage, _) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(carouselItems.length, (index) {
                      final isActive = index == currentPage;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 22 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isActive ? AppColors.accent : Colors.grey.shade400,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 3. كارت حجز السكن الطلابى (بمفردي أو مع شريك سكن)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => RentFlatScreen(user: usr, apartments: _apartments))),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.accent, width: 2),
                  boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.15), blurRadius: 15, offset: const Offset(0, 6))],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                        height: 160, // تم تقليل الارتفاع بناءً على الطلب
                        child: Image.asset(
                          'assets/images/new_card_bg.jpg',
                          fit: BoxFit.cover,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        color: AppColors.primary,
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(LanguageService.tr('book_apartment_title'), style: const TextStyle(color: AppColors.accent, fontSize: 17, fontWeight: FontWeight.w900)),
                                  const SizedBox(height: 6),
                                  Text(LanguageService.tr('book_apartment_desc'), style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                              child: const Icon(Icons.arrow_forward_ios, color: AppColors.textDark, size: 18),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 5. الفلتر داخل كارت كبير
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade300, width: 1.5),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                children: [
                  if (_selectedUniversities.isNotEmpty || _maxPriceFilter != null || _rentalTypeFilter != 'all_flats' || _districtFilter != 'all_districts' || _roomsFilter != 'all' || _bathroomsFilter != 'all' || _minutesFilter != 'all')
                    Align(
                      alignment: Alignment.centerLeft,
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedUniversities = [];
                            _maxPriceFilter = null;
                            _rentalTypeFilter = 'all_flats';
                            _districtFilter = 'all_districts';
                            _roomsFilter = 'all';
                            _bathroomsFilter = 'all';
                            _minutesFilter = 'all';
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.refresh, size: 18, color: Colors.red),
                              const SizedBox(width: 4),
                              Text(LanguageService.tr('clear_filter'), style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  Row(
                    children: [
                      Expanded(
                        flex: 6,
                        child: _buildCustomFilterChip(
                          label: _selectedUniversities.isEmpty ? LanguageService.tr('auto_trans_1165') : _selectedUniversities.join(" + "),
                          isSelected: _selectedUniversities.isNotEmpty,
                          onTap: _showUniversitiesDialog,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 5,
                        child: _buildCustomFilterChip(
                          label: _maxPriceFilter == null ? LanguageService.tr('auto_trans_1166') : '${LanguageService.tr("up_to_price")} $_maxPriceFilter\$',
                          isSelected: _maxPriceFilter != null,
                          onTap: _showPriceDialog,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _buildFilterChipDropdown(
                          label: LanguageService.tr('auto_trans_1167'),
                          value: _districtFilter,
                          items: ['all_districts', ..._districtsList.isNotEmpty ? _districtsList : [LanguageService.tr('auto_trans_1168'), LanguageService.tr('auto_trans_1169'), LanguageService.tr('auto_trans_1170')]],
                          onChanged: (val) => setState(() => _districtFilter = val!),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildFilterChipDropdown(
                          label: LanguageService.tr('auto_trans_1171'),
                          value: _rentalTypeFilter,
                          items: ['all_flats', 'flat_alone', 'with_roommate'],
                          onChanged: (val) => setState(() => _rentalTypeFilter = val!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _buildFilterChipDropdown(
                          label: LanguageService.tr('auto_trans_1172'),
                          value: _roomsFilter,
                          items: ['all', 'one_room', 'two_rooms', 'three_plus_rooms'],
                          onChanged: (val) => setState(() => _roomsFilter = val!),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildFilterChipDropdown(
                          label: LanguageService.tr('auto_trans_1173'),
                          value: _bathroomsFilter,
                          items: ['all', LanguageService.tr('auto_trans_1174'), LanguageService.tr('auto_trans_1175'), LanguageService.tr('auto_trans_1176')],
                          onChanged: (val) => setState(() => _bathroomsFilter = val!),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
            ],
          ),
        ),

        // 6. قائمة الشقق
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, idx) {
              final apt = filteredApts[idx];
              final imagesList = List<String>.from((apt['images'] as List?)?.map((e) => e.toString()) ?? ['assets/images/apt1.png']);
              final firstImg = imagesList.isNotEmpty ? imagesList.first : 'assets/images/apt1.png';
              final moveInStr = apt['move_in_date']?.toString() ?? LanguageService.tr('auto_trans_1177');
              final isScheduled = apt['move_in_type'] == LanguageService.tr('auto_trans_1178') || moveInStr.contains(LanguageService.tr('auto_trans_1179')) || moveInStr.contains(LanguageService.tr('auto_trans_1180'));

              return GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ApartmentDetailScreen(apartment: apt, user: usr))),
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
                                cacheWidth: 800,
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
                                Text(LanguageService.tr('auto_trans_1181'), style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 13)),
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
            childCount: filteredApts.length,
          ),
        ),
        ),
        const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
      ],
    );
  }

  Widget _buildServicePhotoCard(String title, String imageUrl) {
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = 1),
      child: Container(
        height: 95,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: AppColors.primaryDark, child: const Icon(Icons.build, color: AppColors.accent)),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      AppColors.primaryDark.withValues(alpha: 0.9),
                      AppColors.primaryDark.withValues(alpha: 0.3),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 10,
                left: 8,
                right: 8,
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLang,
      builder: (context, lang, child) {
        return Directionality(
          textDirection: LanguageService.textDirection,
          child: Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: _buildPages(widget.user ?? Student(id: 0, fullName: LanguageService.tr('auto_trans_1182')))[_currentIndex],
            ),
            bottomNavigationBar: Container(
              decoration: BoxDecoration(
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
              ),
              child: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (idx) => setState(() => _currentIndex = idx),
                type: BottomNavigationBarType.fixed,
                backgroundColor: Colors.white,
                selectedItemColor: AppColors.primary,
                unselectedItemColor: AppColors.textMuted,
                selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                items: [
                  BottomNavigationBarItem(icon: const Icon(Icons.home_outlined), activeIcon: const Icon(Icons.home), label: LanguageService.tr('home')),
                  BottomNavigationBarItem(icon: const Icon(Icons.build_circle_outlined), activeIcon: const Icon(Icons.build_circle), label: LanguageService.tr('services')),
                  BottomNavigationBarItem(icon: const Icon(Icons.chat_bubble_outline), activeIcon: const Icon(Icons.chat_bubble), label: LanguageService.tr('chat')),
                  BottomNavigationBarItem(icon: const Icon(Icons.local_offer_outlined), activeIcon: const Icon(Icons.local_offer), label: LanguageService.tr('offers')),
                  BottomNavigationBarItem(icon: const Icon(Icons.person_outline), activeIcon: const Icon(Icons.person), label: LanguageService.tr('profile')),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showNewsDetail(BuildContext context, Map<String, dynamic> news) {
    final imgUrl = news['image_url']?.toString() ?? news['img']?.toString() ?? '';
    const fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80';
    final content = news['content']?.toString() ?? news['desc']?.toString() ?? '';
    final date = news['date']?.toString() ?? news['sub']?.toString() ?? LanguageService.tr('auto_trans_1184');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: Column(
            children: [
              // Top handle bar
              Container(
                height: 5,
                width: 50,
                margin: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Image.network(
                        imgUrl.isNotEmpty ? imgUrl : fallbackImg,
                        cacheWidth: 800,
                        height: 220,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 220,
                          color: AppColors.primaryDark,
                          child: const Icon(Icons.newspaper, size: 60, color: AppColors.accent),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.schedule, color: AppColors.accent, size: 18),
                                const SizedBox(width: 6),
                                Text(
                                  date,
                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              news['title']?.toString() ?? '',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryDark, height: 1.4),
                            ),
                            const Divider(height: 24, thickness: 1.2),
                            Text(
                              content,
                              style: const TextStyle(fontSize: 14, color: AppColors.textDark, height: 1.6),
                            ),
                            const SizedBox(height: 20),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
