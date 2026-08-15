import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../models/student.dart';
import '../core/loading_state_widget.dart';
import '../core/empty_state_widget.dart';
import 'chat_screen.dart';
import 'flats_list_screen.dart';
import 'services_screen.dart';
import 'offers_screen.dart';

class NotificationsScreen extends StatefulWidget {
  final Student? user;
  const NotificationsScreen({super.key, this.user});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  Set<String> _readIds = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
    _loadReadStatus();
  }

  Future<void> _loadReadStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList('read_notification_ids') ?? [];
    if (mounted) {
      setState(() {
        _readIds = list.toSet();
      });
    }
  }

  Future<void> _markAsRead(String id) async {
    if (_readIds.contains(id)) return;
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _readIds.add(id);
    });
    await prefs.setStringList('read_notification_ids', _readIds.toList());
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    final list = await ApiService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = list;
        _isLoading = false;
      });
    }
  }

  String _getNotifTitle(Map<String, dynamic> notif) {
    final isEn = LanguageService.currentLang.value == 'en';
    if (isEn && notif['title_en'] != null && notif['title_en'].toString().trim().isNotEmpty) {
      return notif['title_en'].toString();
    }
    if (!isEn && notif['title_ar'] != null && notif['title_ar'].toString().trim().isNotEmpty) {
      return notif['title_ar'].toString();
    }
    return notif['title']?.toString() ?? notif['title_ar']?.toString() ?? notif['title_en']?.toString() ?? '';
  }

  String _getNotifBody(Map<String, dynamic> notif) {
    final isEn = LanguageService.currentLang.value == 'en';
    if (isEn && notif['body_en'] != null && notif['body_en'].toString().trim().isNotEmpty) {
      return notif['body_en'].toString();
    }
    if (isEn && notif['content_en'] != null && notif['content_en'].toString().trim().isNotEmpty) {
      return notif['content_en'].toString();
    }
    if (!isEn && notif['body_ar'] != null && notif['body_ar'].toString().trim().isNotEmpty) {
      return notif['body_ar'].toString();
    }
    if (!isEn && notif['content_ar'] != null && notif['content_ar'].toString().trim().isNotEmpty) {
      return notif['content_ar'].toString();
    }
    return notif['content']?.toString() ?? notif['body']?.toString() ?? notif['body_ar']?.toString() ?? notif['body_en']?.toString() ?? '';
  }

  Map<String, dynamic>? _getNavigationTarget(Map<String, dynamic> notif) {
    final text = ('${_getNotifTitle(notif)} ${_getNotifBody(notif)}').toLowerCase();
    final isAr = LanguageService.currentLang.value == 'ar';

    if (text.contains('شات') ||
        text.contains('محادثة') ||
        text.contains('رسالة') ||
        text.contains('رد الدعم') ||
        text.contains('chat') ||
        text.contains('message') ||
        text.contains('support')) {
      return {
        'label': isAr ? 'الانتقال إلى المحادثة' : 'Open Live Chat',
        'icon': Icons.chat_bubble_outline,
        'action': (BuildContext ctx) {
          Navigator.of(ctx).push(
            MaterialPageRoute(
              builder: (_) => ChatScreen(user: widget.user),
            ),
          );
        }
      };
    }

    if (text.contains('طلب') ||
        text.contains('خدمة') ||
        text.contains('خدمات') ||
        text.contains('حجز') ||
        text.contains('تأكيد') ||
        text.contains('تاكيد') ||
        text.contains('service') ||
        text.contains('booking') ||
        text.contains('request')) {
      return {
        'label': isAr ? 'عرض الخدمات والطلبات' : 'View Services & Requests',
        'icon': Icons.build_circle_outlined,
        'action': (BuildContext ctx) {
          Navigator.of(ctx).push(
            MaterialPageRoute(
              builder: (_) => ServicesScreen(user: widget.user),
            ),
          );
        }
      };
    }

    if (text.contains('شقة') ||
        text.contains('شقق') ||
        text.contains('سكن') ||
        text.contains('عقار') ||
        text.contains('ايجار') ||
        text.contains('إيجار') ||
        text.contains('استوديو') ||
        text.contains('غرفة') ||
        text.contains('apartment') ||
        text.contains('flat') ||
        text.contains('housing') ||
        text.contains('studio') ||
        text.contains('room')) {
      return {
        'label': isAr ? 'عرض الشقق السكنية' : 'View Available Flats',
        'icon': Icons.apartment,
        'action': (BuildContext ctx) async {
          final apts = await ApiService.getApartments();
          if (!ctx.mounted) return;
          Navigator.of(ctx).push(
            MaterialPageRoute(
              builder: (_) => FlatsListScreen(
                apartments: apts,
                user: widget.user,
                title: isAr ? 'الشقق المتاحة للإيجار' : 'Available Flats',
                subtitle: isAr
                    ? 'تصفح قائمة الشقق والعقارات المتاحة'
                    : 'Browse available flats and studios',
              ),
            ),
          );
        }
      };
    }

    if (text.contains('خصم') ||
        text.contains('عروض') ||
        text.contains('كوبون') ||
        text.contains('offer') ||
        text.contains('discount') ||
        text.contains('promo')) {
      return {
        'label': isAr ? 'استعراض العروض والخصومات' : 'Explore Offers',
        'icon': Icons.local_offer_outlined,
        'action': (BuildContext ctx) async {
          final apts = await ApiService.getApartments();
          if (!ctx.mounted) return;
          Navigator.of(ctx).push(
            MaterialPageRoute(
              builder: (_) => OffersScreen(user: widget.user, apartments: apts),
            ),
          );
        }
      };
    }

    return null;
  }

  void _showNotificationDetail(
      BuildContext context, Map<String, dynamic> notif) {
    final target = _getNavigationTarget(notif);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          _getNotifTitle(notif),
          style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppColors.primaryDark,
              fontSize: 16),
          textAlign: TextAlign.center,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _getNotifBody(notif),
              style: const TextStyle(
                  fontSize: 14, color: AppColors.textDark, height: 1.6),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Text(
                    notif['date']?.toString() ??
                        LanguageService.tr('auto_trans_1185'),
                    style: const TextStyle(
                        fontSize: 10,
                        color: Colors.grey,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(LanguageService.tr('auto_trans_1186'),
                style: const TextStyle(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 14)),
          ),
          if (target != null)
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: Icon(target['icon'] as IconData, size: 18),
              label: Text(
                target['label'] as String,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () {
                Navigator.pop(context);
                (target['action'] as Function(BuildContext))(context);
              },
            ),
        ],
      ),
    );
  }

  Future<void> _markAllAsRead() async {
    final allIds = _notifications
        .map((n) => n['id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList();
    if (allIds.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _readIds.addAll(allIds);
    });
    await prefs.setStringList('read_notification_ids', _readIds.toList());
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications
        .where((n) => !_readIds.contains(n['id']?.toString() ?? ''))
        .length;

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
              title: Text(
                LanguageService.tr('auto_trans_1187'),
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18),
              ),
              iconTheme: const IconThemeData(color: Colors.white),
              centerTitle: true,
              actions: [
                if (unreadCount > 0)
                  IconButton(
                    icon: const Icon(Icons.done_all),
                    tooltip: isAr ? 'تحديد الكل كمقروء' : 'Mark all as read',
                    onPressed: _markAllAsRead,
                  ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _fetchNotifications,
                  tooltip: LanguageService.tr('auto_trans_1188'),
                ),
              ],
            ),
            body: _isLoading
                ? const LoadingStateWidget(messageKey: 'loading_notifications')
                : _notifications.isEmpty
                    ? const EmptyStateWidget(
                        titleKey: 'no_notifications_title',
                        descriptionKey: 'no_notifications_desc',
                        icon: Icons.notifications_off_outlined,
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchNotifications,
                        color: AppColors.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _notifications.length,
                          itemBuilder: (context, index) {
                            final notif = _notifications[index];
                            final id = notif['id']?.toString() ?? '';
                            final isRead = _readIds.contains(id);
                            final target = _getNavigationTarget(notif);

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20)),
                              elevation: isRead ? 0.5 : 3.0,
                              clipBehavior: Clip.antiAlias,
                              child: InkWell(
                                onTap: () {
                                  _markAsRead(id);
                                  if (target != null) {
                                    (target['action'] as Function(BuildContext))(context);
                                  } else {
                                    _showNotificationDetail(context, notif);
                                  }
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: isRead
                                        ? Colors.grey.shade100
                                        : Colors.white,
                                    border: Border.all(
                                      color: isRead
                                          ? Colors.grey.shade300
                                          : AppColors.accent
                                              .withValues(alpha: 0.4),
                                      width: 1.5,
                                    ),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: isRead
                                              ? Colors.grey.shade300
                                              : AppColors.accent
                                                  .withValues(alpha: 0.12),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          target != null
                                              ? (target['icon'] as IconData)
                                              : Icons.campaign_rounded,
                                          color: isRead
                                              ? Colors.grey.shade600
                                              : AppColors.accent,
                                          size: 26,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    _getNotifTitle(notif),
                                                    style: TextStyle(
                                                      fontSize: 15,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: isRead
                                                          ? Colors.grey.shade700
                                                          : AppColors
                                                              .primaryDark,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Directionality(
                                                  textDirection:
                                                      TextDirection.ltr,
                                                  child: Text(
                                                    notif['date']?.toString() ??
                                                        LanguageService.tr(
                                                            'auto_trans_1191'),
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      color: isRead
                                                          ? Colors.grey.shade500
                                                          : Colors
                                                              .grey.shade600,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              _getNotifBody(notif),
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: isRead
                                                    ? Colors.grey.shade600
                                                    : AppColors.textDark,
                                                height: 1.5,
                                              ),
                                            ),
                                            if (target != null) ...[
                                              const SizedBox(height: 10),
                                              InkWell(
                                                onTap: () {
                                                  _markAsRead(id);
                                                  (target['action'] as Function(BuildContext))(context);
                                                },
                                                borderRadius: BorderRadius.circular(10),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(
                                                      horizontal: 12, vertical: 7),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.primary
                                                        .withValues(alpha: 0.08),
                                                    borderRadius:
                                                        BorderRadius.circular(10),
                                                    border: Border.all(
                                                      color: AppColors.primary
                                                          .withValues(alpha: 0.2),
                                                    ),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(
                                                          target['icon'] as IconData,
                                                          size: 15,
                                                          color: AppColors.primary),
                                                      const SizedBox(width: 6),
                                                      Text(
                                                        target['label'] as String,
                                                        style: const TextStyle(
                                                          color: AppColors.primary,
                                                          fontSize: 12,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Icon(
                                                          LanguageService.isRtl
                                                              ? Icons.arrow_back_ios
                                                              : Icons.arrow_forward_ios,
                                                          size: 11,
                                                          color: AppColors.primary),
                                                    ],
                                                  ),
                                                ),
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
          ),
        );
      },
    );
  }
}
