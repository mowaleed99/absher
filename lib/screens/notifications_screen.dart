import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/realtime_sync_service.dart';
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
  Set<String> _deletedIds = {};
  bool _isLoading = true;
  StreamSubscription? _notifSub;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
    _loadStoredStatus();

    _notifSub = RealtimeSyncService().onNotificationsUpdated.listen((_) {
      if (mounted) {
        _loadStoredStatus();
        _fetchNotifications(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _notifSub?.cancel();
    super.dispose();
  }

  Future<void> _loadStoredStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final readList = prefs.getStringList('read_notification_ids') ?? [];
    final deletedList = prefs.getStringList('deleted_notification_ids') ?? [];
    if (mounted) {
      setState(() {
        _readIds = readList.toSet();
        _deletedIds = deletedList.toSet();
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

  Future<void> _deleteNotification(Map<String, dynamic> notif) async {
    final prefs = await SharedPreferences.getInstance();
    final isGrouped = notif['is_grouped_chat'] == true;

    if (isGrouped && notif['all_grouped_ids'] is List) {
      final ids = List<String>.from(notif['all_grouped_ids']);
      setState(() {
        _deletedIds.addAll(ids);
        _readIds.addAll(ids);
        _notifications.removeWhere((n) => ids.contains(n['id']?.toString() ?? ''));
      });
    } else {
      final id = notif['id']?.toString() ?? '';
      if (id.isNotEmpty) {
        setState(() {
          _deletedIds.add(id);
          _readIds.add(id);
          _notifications.removeWhere((n) => (n['id']?.toString() ?? '') == id);
        });
      }
    }

    await prefs.setStringList('deleted_notification_ids', _deletedIds.toList());
    await prefs.setStringList('read_notification_ids', _readIds.toList());

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(LanguageService.tr('delete_notif_success')),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _deleteAllNotifications() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.delete_outline, color: Colors.red, size: 24),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                LanguageService.tr('delete_all_confirm_title'),
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
        content: Text(
          LanguageService.tr('delete_all_confirm_msg'),
          style: const TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              LanguageService.tr('cancel'),
              style: const TextStyle(color: Colors.grey),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(LanguageService.tr('delete_notif_btn')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final allIds = _notifications
        .map((n) => n['id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toList();

    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _deletedIds.addAll(allIds);
      _readIds.addAll(allIds);
      _notifications.clear();
    });

    await prefs.setStringList('deleted_notification_ids', _deletedIds.toList());
    await prefs.setStringList('read_notification_ids', _readIds.toList());

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(LanguageService.tr('delete_all_notifs_success')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  Future<void> _fetchNotifications({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    final list = await ApiService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = list;
        _isLoading = false;
      });
    }
  }

  bool _isChatNotification(Map<String, dynamic> notif) {
    final type = notif['type']?.toString().toLowerCase() ?? '';
    if (type == 'chat' || type == 'support_reply' || type == 'chat_reply') {
      return true;
    }
    final title = _getNotifTitle(notif).toLowerCase();
    final body = _getNotifBody(notif).toLowerCase();
    final combined = '$title $body';
    return combined.contains('رد جديد من الدعم') ||
        combined.contains('ردود جديدة من الدعم') ||
        combined.contains('رد الدعم') ||
        combined.contains('الشات المباشر') ||
        combined.contains('support reply') ||
        combined.contains('live chat') ||
        combined.contains('chat message');
  }

  List<Map<String, dynamic>> _getVisibleNotifications() {
    final isAr = LanguageService.currentLang.value == 'ar';

    // Filter out permanently deleted notifications
    final activeNotifs = _notifications.where((n) {
      final id = n['id']?.toString() ?? '';
      return !_deletedIds.contains(id);
    }).toList();

    // 1. Separate unread chat notifications from non-chat notifications
    final unreadChatNotifs = activeNotifs.where((n) {
      final id = n['id']?.toString() ?? '';
      return _isChatNotification(n) && !_readIds.contains(id);
    }).toList();

    final nonChatNotifs = activeNotifs.where((n) {
      return !_isChatNotification(n);
    }).toList();

    // Sort non-chat notifications by date descending
    nonChatNotifs.sort((a, b) {
      final aDate = a['date']?.toString() ?? '';
      final bDate = b['date']?.toString() ?? '';
      return bDate.compareTo(aDate);
    });

    final List<Map<String, dynamic>> result = [];

    // 2. If there are unread chat notifications, consolidate into ONE single pinned card with count
    if (unreadChatNotifs.isNotEmpty) {
      unreadChatNotifs.sort((a, b) {
        final aDate = a['date']?.toString() ?? '';
        final bDate = b['date']?.toString() ?? '';
        return bDate.compareTo(aDate);
      });

      final latest = unreadChatNotifs.first;
      final count = unreadChatNotifs.length;
      final allChatIds = unreadChatNotifs
          .map((n) => n['id']?.toString() ?? '')
          .where((id) => id.isNotEmpty)
          .toList();

      final String title = count > 1
          ? (isAr
              ? 'ردود جديدة من الدعم الفني ($count)'
              : 'New Support Replies ($count)')
          : (isAr ? 'رد جديد من الدعم الفني' : 'New Reply from Support');

      final String body = count > 1
          ? (isAr
              ? 'لديك $count رسائل جديدة غير مقروءة في الشات المباشر مع فريق الدعم.'
              : 'You have $count unread messages in live chat.')
          : (isAr
              ? 'لديك رد جديد على استفسارك في الشات المباشر'
              : 'You have a new reply in live chat');

      result.add({
        'id': latest['id']?.toString() ?? '',
        'all_grouped_ids': allChatIds,
        'is_grouped_chat': true,
        'chat_unread_count': count,
        'type': 'chat',
        'title': title,
        'title_ar': title,
        'title_en': title,
        'content': body,
        'body_ar': body,
        'body_en': body,
        'date': latest['date']?.toString() ?? '',
      });
    }

    // 3. Add all regular notifications below
    result.addAll(nonChatNotifs);

    return result;
  }

  String _getNotifTitle(Map<String, dynamic> notif) {
    final isEn = LanguageService.currentLang.value == 'en';
    if (isEn &&
        notif['title_en'] != null &&
        notif['title_en'].toString().trim().isNotEmpty) {
      return notif['title_en'].toString();
    }
    if (!isEn &&
        notif['title_ar'] != null &&
        notif['title_ar'].toString().trim().isNotEmpty) {
      return notif['title_ar'].toString();
    }
    return notif['title']?.toString() ??
        notif['title_ar']?.toString() ??
        notif['title_en']?.toString() ??
        '';
  }

  String _getNotifBody(Map<String, dynamic> notif) {
    final isEn = LanguageService.currentLang.value == 'en';
    if (isEn &&
        notif['body_en'] != null &&
        notif['body_en'].toString().trim().isNotEmpty) {
      return notif['body_en'].toString();
    }
    if (isEn &&
        notif['content_en'] != null &&
        notif['content_en'].toString().trim().isNotEmpty) {
      return notif['content_en'].toString();
    }
    if (!isEn &&
        notif['body_ar'] != null &&
        notif['body_ar'].toString().trim().isNotEmpty) {
      return notif['body_ar'].toString();
    }
    if (!isEn &&
        notif['content_ar'] != null &&
        notif['content_ar'].toString().trim().isNotEmpty) {
      return notif['content_ar'].toString();
    }
    return notif['content']?.toString() ??
        notif['body']?.toString() ??
        notif['body_ar']?.toString() ??
        notif['body_en']?.toString() ??
        '';
  }

  Map<String, dynamic>? _getNavigationTarget(Map<String, dynamic> notif) {
    final text =
        ('${_getNotifTitle(notif)} ${_getNotifBody(notif)}').toLowerCase();
    final isAr = LanguageService.currentLang.value == 'ar';

    if (notif['is_grouped_chat'] == true ||
        text.contains('شات') ||
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
          ).then((_) {
            if (mounted) {
              _loadStoredStatus();
              _fetchNotifications(silent: true);
            }
          });
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

  Future<void> _handleNotificationTap(Map<String, dynamic> notif) async {
    final isGrouped = notif['is_grouped_chat'] == true;
    final isChat = _isChatNotification(notif) || isGrouped;

    if (isGrouped && notif['all_grouped_ids'] is List) {
      final ids = List<String>.from(notif['all_grouped_ids']);
      for (final id in ids) {
        await _markAsRead(id);
      }
      setState(() {
        _notifications.removeWhere((n) => ids.contains(n['id']?.toString() ?? ''));
      });
    } else {
      final id = notif['id']?.toString() ?? '';
      await _markAsRead(id);
      if (isChat) {
        setState(() {
          _notifications.removeWhere((n) => (n['id']?.toString() ?? '') == id);
        });
      }
    }

    if (!mounted) return;
    final target = _getNavigationTarget(notif);
    if (target != null) {
      (target['action'] as Function(BuildContext))(context);
    } else {
      _showNotificationDetail(context, notif);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visibleNotifications = _getVisibleNotifications();
    final unreadCount = visibleNotifications
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
                if (visibleNotifications.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.delete_sweep_outlined),
                    tooltip: LanguageService.tr('delete_all_notifs'),
                    onPressed: _deleteAllNotifications,
                  ),
              ],
            ),
            body: _isLoading
                ? const LoadingStateWidget(messageKey: 'loading_notifications')
                : visibleNotifications.isEmpty
                    ? const EmptyStateWidget(
                        titleKey: 'no_notifications_title',
                        descriptionKey: 'no_notifications_desc',
                        icon: Icons.notifications_off_outlined,
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: visibleNotifications.length,
                        itemBuilder: (context, index) {
                          final notif = visibleNotifications[index];
                          final id = notif['id']?.toString() ?? '';
                          final isRead = _readIds.contains(id);
                          final isChat = _isChatNotification(notif) ||
                              notif['is_grouped_chat'] == true;
                          final chatCount =
                              (notif['chat_unread_count'] as int?) ?? 1;
                          final target = _getNavigationTarget(notif);

                          return Dismissible(
                            key: Key('notif_${id}_$index'),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: AlignmentDirectional.centerEnd,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: Colors.red.shade600,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.delete_outline, color: Colors.white, size: 26),
                                ],
                              ),
                            ),
                            onDismissed: (_) => _deleteNotification(notif),
                            child: Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20)),
                              elevation: isChat ? 4.0 : (isRead ? 0.5 : 2.5),
                              clipBehavior: Clip.antiAlias,
                              child: InkWell(
                                onTap: () => _handleNotificationTap(notif),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: isChat
                                        ? const Color(0xFFF0FDF4)
                                        : (isRead
                                            ? Colors.grey.shade100
                                            : Colors.white),
                                    border: Border.all(
                                      color: isChat
                                          ? const Color(0xFF22C55E)
                                          : (isRead
                                              ? Colors.grey.shade300
                                              : AppColors.accent
                                                  .withValues(alpha: 0.4)),
                                      width: isChat ? 1.8 : 1.5,
                                    ),
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: isChat
                                        ? [
                                            BoxShadow(
                                              color: const Color(0xFF22C55E)
                                                  .withValues(alpha: 0.12),
                                              blurRadius: 10,
                                              offset: const Offset(0, 3),
                                            ),
                                          ]
                                        : null,
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Stack(
                                        clipBehavior: Clip.none,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: isChat
                                                  ? const Color(0xFFDCFCE7)
                                                  : (isRead
                                                      ? Colors.grey.shade300
                                                      : AppColors.accent
                                                          .withValues(
                                                              alpha: 0.12)),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Icon(
                                              isChat
                                                  ? Icons
                                                      .mark_chat_unread_rounded
                                                  : (target != null
                                                      ? (target['icon']
                                                          as IconData)
                                                      : Icons.campaign_rounded),
                                              color: isChat
                                                  ? const Color(0xFF16A34A)
                                                  : (isRead
                                                      ? Colors.grey.shade600
                                                      : AppColors.accent),
                                              size: 26,
                                            ),
                                          ),
                                          if (isChat && chatCount > 1)
                                            Positioned(
                                              top: -4,
                                              right: -4,
                                              child: Container(
                                                padding: const EdgeInsets.all(5),
                                                decoration: const BoxDecoration(
                                                  color: Color(0xFFEF4444),
                                                  shape: BoxShape.circle,
                                                ),
                                                child: Text(
                                                  '$chatCount',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ],
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
                                                  child: Row(
                                                    children: [
                                                      if (isChat) ...[
                                                        Container(
                                                          margin:
                                                              const EdgeInsetsDirectional
                                                                  .only(end: 6),
                                                          padding:
                                                              const EdgeInsets
                                                                  .symmetric(
                                                                  horizontal: 6,
                                                                  vertical: 2),
                                                          decoration:
                                                              BoxDecoration(
                                                            color: const Color(
                                                                0xFF16A34A),
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        6),
                                                          ),
                                                          child: Text(
                                                            isAr
                                                                ? "مثبت 📌"
                                                                : "Pinned 📌",
                                                            style:
                                                                const TextStyle(
                                                              color:
                                                                  Colors.white,
                                                              fontSize: 10,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                            ),
                                                          ),
                                                        ),
                                                        if (chatCount > 1)
                                                          Container(
                                                            margin:
                                                                const EdgeInsetsDirectional
                                                                    .only(
                                                                    end: 6),
                                                            padding:
                                                                const EdgeInsets
                                                                    .symmetric(
                                                                    horizontal:
                                                                        6,
                                                                    vertical:
                                                                        2),
                                                            decoration:
                                                                BoxDecoration(
                                                              color: const Color(
                                                                  0xFFDC2626),
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          6),
                                                            ),
                                                            child: Text(
                                                              isAr
                                                                  ? "$chatCount جديد"
                                                                  : "$chatCount New",
                                                              style:
                                                                  const TextStyle(
                                                                color: Colors
                                                                    .white,
                                                                fontSize: 10,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .bold,
                                                              ),
                                                            ),
                                                          ),
                                                      ],
                                                      Expanded(
                                                        child: Text(
                                                          _getNotifTitle(notif),
                                                          style: TextStyle(
                                                            fontSize: 15,
                                                            fontWeight:
                                                                FontWeight.bold,
                                                            color: isChat
                                                                ? const Color(
                                                                    0xFF166534)
                                                                : (isRead
                                                                    ? Colors
                                                                        .grey
                                                                        .shade700
                                                                    : AppColors
                                                                        .primaryDark),
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                // Individual Delete Button
                                                InkWell(
                                                  onTap: () => _deleteNotification(notif),
                                                  borderRadius: BorderRadius.circular(12),
                                                  child: Padding(
                                                    padding: const EdgeInsets.all(4.0),
                                                    child: Icon(
                                                      Icons.close_rounded,
                                                      size: 17,
                                                      color: Colors.grey.shade400,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Directionality(
                                              textDirection: TextDirection.ltr,
                                              child: Text(
                                                notif['date']?.toString() ??
                                                    LanguageService.tr(
                                                        'auto_trans_1191'),
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  color: isChat
                                                      ? const Color(0xFF16A34A)
                                                      : (isRead
                                                          ? Colors.grey.shade500
                                                          : Colors.grey.shade600),
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
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
                                                onTap: () =>
                                                    _handleNotificationTap(
                                                        notif),
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                                child: Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 12,
                                                      vertical: 7),
                                                  decoration: BoxDecoration(
                                                    color: isChat
                                                        ? const Color(
                                                            0xFF16A34A)
                                                        : AppColors.primary
                                                            .withValues(
                                                                alpha: 0.08),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            10),
                                                    border: Border.all(
                                                      color: isChat
                                                          ? const Color(
                                                              0xFF16A34A)
                                                          : AppColors.primary
                                                              .withValues(
                                                                  alpha: 0.2),
                                                    ),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize:
                                                        MainAxisSize.min,
                                                    children: [
                                                      Icon(
                                                          target['icon']
                                                              as IconData,
                                                          size: 15,
                                                          color: isChat
                                                              ? Colors.white
                                                              : AppColors
                                                                  .primary),
                                                      const SizedBox(width: 6),
                                                      Text(
                                                        target['label']
                                                            as String,
                                                        style: TextStyle(
                                                          color: isChat
                                                              ? Colors.white
                                                              : AppColors
                                                                  .primary,
                                                          fontSize: 12,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Icon(
                                                          LanguageService.isRtl
                                                              ? Icons
                                                                  .arrow_back_ios
                                                              : Icons
                                                                  .arrow_forward_ios,
                                                          size: 11,
                                                          color: isChat
                                                              ? Colors.white
                                                              : AppColors
                                                                  .primary),
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
                            ),
                          );
                        },
                      ),
          ),
        );
      },
    );
  }
}
