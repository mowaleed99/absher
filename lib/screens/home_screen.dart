import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import '../services/realtime_sync_service.dart';
import 'rent_flat_screen.dart';
import 'services_screen.dart';
import 'chat_screen.dart';
import 'offers_screen.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';
import 'login_screen.dart';
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

class _HomeScreenState extends State<HomeScreen>
    with WidgetsBindingObserver, RouteAware {
  int _currentIndex = 0;
  int _unreadChatCount = 0;
  Student? _currentUser;
  List<News> _newsList = [];
  List<Map<String, dynamic>> _notificationsList = [];
  Set<String> _readNotificationIds = {};
  List<University> _universitiesList = [];
  List<Map<String, dynamic>> _myRequests = [];
  bool _myRequestsLoaded = false;
  bool _isRatingPromptShowing = false;
  Timer? _chatPollTimer;

  // Realtime Sync Subscriptions
  StreamSubscription? _aptSyncSub;
  StreamSubscription? _newsSyncSub;
  StreamSubscription? _notifSyncSub;
  StreamSubscription? _reqSyncSub;
  StreamSubscription? _chatSyncSub;
  StreamSubscription? _profSyncSub;
  StreamSubscription? _serviceSyncSub;

  List<Map<String, dynamic>> _servicesList = [];
  bool _isLoadingServices = false;

  final PageController _adController = PageController();
  final ValueNotifier<int> _currentAdPage = ValueNotifier<int>(0);
  Timer? _adTimer;
  int _activeRequestId = 0;

  // إعلانات متحركة بصور حقيقية وأحداث وتخفيضات
  final List<Map<String, String>> _adBanners = [
    {
      'title': LanguageService.tr('auto_trans_1051'),
      'desc': LanguageService.tr('auto_trans_1052'),
      'sub': LanguageService.tr('auto_trans_1053'),
      'img':
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1054')
    },
    {
      'title': LanguageService.tr('auto_trans_1055'),
      'desc': LanguageService.tr('auto_trans_1056'),
      'sub': LanguageService.tr('auto_trans_1057'),
      'img':
          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1058')
    },
    {
      'title': LanguageService.tr('auto_trans_1059'),
      'desc': LanguageService.tr('auto_trans_1060'),
      'sub': LanguageService.tr('auto_trans_1061'),
      'img':
          'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=800&q=80',
      'badge': LanguageService.tr('auto_trans_1062')
    },
    {
      'title': LanguageService.tr('auto_trans_1063'),
      'desc': LanguageService.tr('auto_trans_1064'),
      'sub': LanguageService.tr('auto_trans_1065'),
      'img':
          'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
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
      'features': [
        LanguageService.tr('auto_trans_1073'),
        LanguageService.tr('auto_trans_1074'),
        LanguageService.tr('auto_trans_1075'),
        LanguageService.tr('auto_trans_1076'),
        LanguageService.tr('auto_trans_1077'),
        LanguageService.tr('auto_trans_1078'),
        LanguageService.tr('auto_trans_1079')
      ],
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
      'features': [
        LanguageService.tr('auto_trans_1087'),
        LanguageService.tr('auto_trans_1088'),
        LanguageService.tr('auto_trans_1089'),
        LanguageService.tr('auto_trans_1090'),
        LanguageService.tr('auto_trans_1091'),
        LanguageService.tr('auto_trans_1092')
      ],
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
      'features': [
        LanguageService.tr('auto_trans_1102'),
        LanguageService.tr('auto_trans_1103'),
        LanguageService.tr('auto_trans_1104'),
        LanguageService.tr('auto_trans_1105'),
        LanguageService.tr('auto_trans_1106'),
        LanguageService.tr('auto_trans_1107')
      ],
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
      'features': [
        LanguageService.tr('auto_trans_1115'),
        LanguageService.tr('auto_trans_1116'),
        LanguageService.tr('auto_trans_1117'),
        LanguageService.tr('auto_trans_1118'),
        LanguageService.tr('auto_trans_1119'),
        LanguageService.tr('auto_trans_1120')
      ],
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
      'features': [
        LanguageService.tr('auto_trans_1130'),
        LanguageService.tr('auto_trans_1131'),
        LanguageService.tr('auto_trans_1132'),
        LanguageService.tr('auto_trans_1133'),
        LanguageService.tr('auto_trans_1134')
      ],
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
    _currentUser = widget.user;
    if (!widget.isGuest) {
      _loadCurrentUser();
    }
    WidgetsBinding.instance.addObserver(this);
    _loadApartments();
    _loadNews();
    _loadNotifications();
    _loadUniversities();
    _loadServices();
    if (!widget.isGuest) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _checkCompletedServiceRequestsForRating();
      });
    }

    // تشغيل التمرير التلقائي للإعلانات كل 3.5 ثانية
    _adTimer = Timer.periodic(const Duration(milliseconds: 3500), (timer) {
      if (_adController.hasClients) {
        int nextPage = _currentAdPage.value + 1;
        final listLength =
            _newsList.isNotEmpty ? _newsList.length : _adBanners.length;
        if (nextPage >= listLength) nextPage = 0;
        _adController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      }
    });

    _loadUnreadChatCount();
    _chatPollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted) _loadUnreadChatCount();
    });

    // إعداد المزامنة الحية والفورية (Real-Time Live Sync)
    final sync = RealtimeSyncService();
    sync.updateContext(studentId: _currentUser?.id);

    _aptSyncSub = sync.onApartmentsUpdated.listen((_) {
      if (mounted) _loadApartments();
    });

    _newsSyncSub = sync.onNewsUpdated.listen((_) {
      if (mounted) _loadNews();
    });

    _notifSyncSub = sync.onNotificationsUpdated.listen((_) {
      if (mounted) _loadNotifications();
    });

    _serviceSyncSub = sync.onServicesUpdated.listen((_) {
      if (mounted) _loadServices(silent: true);
    });

    _reqSyncSub = sync.onRequestsUpdated.listen((_) {
      if (mounted && !widget.isGuest) {
        setState(() {
          _myRequestsLoaded = false;
        });
        _checkCompletedServiceRequestsForRating();
      }
    });

    _chatSyncSub = sync.onChatUpdated.listen((_) {
      if (mounted) _loadUnreadChatCount();
    });

    _profSyncSub = sync.onProfileUpdated.listen((meta) {
      if (mounted && _currentUser != null) {
        final isBlocked = meta['is_blocked'] == true ||
            meta['is_blocked'] == 1 ||
            meta['is_blocked']?.toString() == '1';

        if (isBlocked) {
          _handleBlockedAccount();
          return;
        }

        final newPoints = meta['points'] is int
            ? meta['points'] as int
            : int.tryParse(meta['points']?.toString() ?? '');
        if (newPoints != null && newPoints != _currentUser!.pointsBalance) {
          setState(() {
            _currentUser = _currentUser!.copyWith(pointsBalance: newPoints);
          });
        }
      }
    });

    // إعادة جلب البيانات المترجمة عند تغيير اللغة
    LanguageService.currentLang.addListener(_onLangChanged);
  }

  bool _isHandlingBlock = false;
  Future<void> _handleBlockedAccount() async {
    if (_isHandlingBlock) return;
    _isHandlingBlock = true;

    await ApiService.clearTokens();

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.block, color: AppColors.error, size: 28),
            const SizedBox(width: 10),
            Text(
              LanguageService.isEn ? 'Account Blocked' : 'تم حظر الحساب',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        content: Text(
          LanguageService.isEn
              ? 'This account has been blocked by administration. You have been signed out.'
              : 'تم حظر هذا الحساب من قبل الإدارة. تم تسجيل خروجك، يرجى التواصل مع الدعم الفني.',
          style: const TextStyle(fontSize: 15, height: 1.4),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Text(
              LanguageService.isEn ? 'OK' : 'حسناً',
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _adTimer?.cancel();
    _adController.dispose();
    _chatPollTimer?.cancel();
    _aptSyncSub?.cancel();
    _newsSyncSub?.cancel();
    _notifSyncSub?.cancel();
    _reqSyncSub?.cancel();
    _chatSyncSub?.cancel();
    _profSyncSub?.cancel();
    _serviceSyncSub?.cancel();
    LanguageService.currentLang.removeListener(_onLangChanged);
    super.dispose();
  }

  /// Called whenever the user switches language — triggers a full refetch so
  /// the server-side localised fields (title_ar/en, etc.) are up to date.
  void _onLangChanged() {
    if (!mounted) return;
    _loadApartments();
    _loadNews();
    _loadUniversities();
    _loadServices(silent: true);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadApartments();
      if (!widget.isGuest) {
        // Force fresh fetch so the rating check sees the latest status
        setState(() {
          _myRequestsLoaded = false;
        });
        _checkCompletedServiceRequestsForRating();
      }
    }
  }

  Future<void> _checkCompletedServiceRequestsForRating() async {
    if (_isRatingPromptShowing) return;
    try {
      if (!_myRequestsLoaded) {
        _myRequests = await ApiService.getMyServiceRequests();
        _myRequestsLoaded = true;
      }
      // Admin JS sends value="completed" (English); legacy rows may store 'مكتمل' (Arabic).
      // Accept both so the popup fires regardless of which value the backend stored.
      final completedRequests = _myRequests.where((r) {
        final s = (r['status'] ?? '').toString().trim().toLowerCase();
        return s == 'completed' || s == 'مكتمل';
      }).toList();
      if (completedRequests.isEmpty) return;

      final reviews = await ApiService.getMyServiceReviews();
      final reviewedRequestIds = reviews
          .map((rev) =>
              int.tryParse(rev['service_request_id']?.toString() ?? '0') ?? 0)
          .where((id) => id > 0)
          .toSet();

      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now().millisecondsSinceEpoch;

      for (final req in completedRequests) {
        final reqId = int.tryParse(req['id']?.toString() ?? '0') ?? 0;
        if (reqId == 0) continue;

        if (reviewedRequestIds.contains(reqId)) {
          await prefs.remove('service_review_reminder_$reqId');
          continue;
        }

        final reminderTime =
            prefs.getInt('service_review_reminder_$reqId') ?? 0;
        if (reminderTime > 0 && now < reminderTime) {
          continue;
        }

        if (mounted) {
          setState(() {
            _isRatingPromptShowing = true;
          });
          _showRatingPromptDialog(req);
          break; // Show only one prompt at a time
        }
      }
    } catch (e) {
      debugPrint('Error checking completed requests for rating: $e');
    }
  }

  void _showRatingPromptDialog(Map<String, dynamic> request) {
    final reqId = int.tryParse(request['id']?.toString() ?? '0') ?? 0;
    final serviceTitle =
        request['service_title'] ?? LanguageService.tr('service_requests');

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (promptCtx) {
        return AlertDialog(
          backgroundColor: AppColors.cardBg,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            LanguageService.tr('rate_service_prompt'),
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: AppColors.primary),
            textAlign: TextAlign.center,
          ),
          content: Text(
            LanguageService.formatRatingPromptMessage(serviceTitle),
            style: const TextStyle(color: AppColors.textDark),
            textAlign: TextAlign.center,
          ),
          actionsAlignment: MainAxisAlignment.spaceEvenly,
          actions: [
            TextButton(
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                final cooldownTime = DateTime.now().millisecondsSinceEpoch +
                    (2 * 60 * 60 * 1000);
                await prefs.setInt(
                    'service_review_reminder_$reqId', cooldownTime);
                if (mounted) {
                  setState(() {
                    _isRatingPromptShowing = false;
                  });
                }
                if (promptCtx.mounted) {
                  Navigator.pop(promptCtx);
                }
              },
              child: Text(
                LanguageService.tr('remind_later'),
                style: const TextStyle(
                    color: AppColors.textMuted, fontWeight: FontWeight.bold),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(promptCtx);
                _showRatingFormDialog(request);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                LanguageService.tr('rate_now'),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showRatingFormDialog(Map<String, dynamic> request) {
    final reqId = int.tryParse(request['id']?.toString() ?? '0') ?? 0;
    final serviceTitle =
        request['service_title'] ?? LanguageService.tr('service_requests');
    int selectedRating = 5;
    final commentCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (formCtx) {
        return StatefulBuilder(
          builder: (formCtx, setFormState) {
            return AlertDialog(
              backgroundColor: AppColors.cardBg,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20)),
              title: Text(
                LanguageService.tr('rate_customer_service'),
                style: const TextStyle(
                    fontWeight: FontWeight.bold, color: AppColors.textDark),
                textAlign: TextAlign.center,
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      serviceTitle,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppColors.primary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final starValue = index + 1;
                        return IconButton(
                          icon: Icon(
                            starValue <= selectedRating
                                ? Icons.star
                                : Icons.star_border,
                            color: Colors.amber,
                            size: 36,
                          ),
                          onPressed: isSaving
                              ? null
                              : () {
                                  setFormState(() {
                                    selectedRating = starValue;
                                  });
                                },
                        );
                      }),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: commentCtrl,
                      maxLines: 3,
                      enabled: !isSaving,
                      decoration: InputDecoration(
                        hintText: LanguageService.tr('comment_optional'),
                        hintStyle: const TextStyle(color: AppColors.textMuted),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                        ),
                      ),
                      style: const TextStyle(color: AppColors.textDark),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving
                      ? null
                      : () {
                          if (mounted) {
                            setState(() {
                              _isRatingPromptShowing = false;
                            });
                          }
                          Navigator.pop(formCtx);
                        },
                  child: Text(
                    LanguageService.tr('cancel'),
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                ),
                ElevatedButton(
                  onPressed: isSaving
                      ? null
                      : () async {
                          setFormState(() {
                            isSaving = true;
                          });
                          final messenger = ScaffoldMessenger.of(context);
                          final res = await ApiService.createServiceReview(
                            rating: selectedRating,
                            comment: commentCtrl.text.trim(),
                            serviceRequestId: reqId,
                          );
                          if (res['success']) {
                            if (mounted) {
                              setState(() {
                                _isRatingPromptShowing = false;
                                _myRequestsLoaded =
                                    false; // Reset to reload on next opportunity
                              });
                            }
                            if (formCtx.mounted) {
                              Navigator.pop(formCtx);
                            }
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(LanguageService.tr('rating_success_msg')),
                                backgroundColor: AppColors.success,
                              ),
                            );
                            final prefs = await SharedPreferences.getInstance();
                            await prefs
                                .remove('service_review_reminder_$reqId');
                          } else {
                            setFormState(() {
                              isSaving = false;
                            });
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(res['message']),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          LanguageService.tr('submit_review'),
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _loadApartments() async {
    final requestId = ++_activeRequestId;
    final list = await ApiService.getApartments();
    if (!mounted || requestId != _activeRequestId) return;
    setState(() {
      _apartments = list;
    });
  }

  Future<void> _loadServices({bool silent = false}) async {
    if (!silent && mounted) setState(() => _isLoadingServices = true);
    try {
      final list = await ApiService.getServices();
      if (mounted) {
        setState(() {
          _servicesList = list;
          _isLoadingServices = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingServices = false);
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
    final prefs = await SharedPreferences.getInstance();
    final readList = prefs.getStringList('read_notification_ids') ?? [];
    if (mounted) {
      setState(() {
        _notificationsList = list;
        _readNotificationIds = readList.toSet();
      });
    }
  }

  int get _unreadNotificationsCount {
    return _notificationsList.where((n) {
      final id = n['id']?.toString() ?? '';
      return id.isNotEmpty && !_readNotificationIds.contains(id);
    }).length;
  }

  Future<void> _loadUniversities() async {
    final list = await ApiService.getUniversities();
    if (mounted) {
      setState(() {
        _universitiesList = list.map((u) => University.fromJson(u)).toList();
      });
    }
  }

  String _getLocalizedUniversity(String? rawUni) {
    if (rawUni == null || rawUni.trim().isEmpty) return '';
    final isEn = LanguageService.currentLang.value == 'en';
    final trimmed = rawUni.trim();

    // 1. Direct match with university items
    for (final u in _universitiesList) {
      if (u.name == trimmed ||
          u.nameAr == trimmed ||
          u.nameEn == trimmed ||
          (u.nameAr.isNotEmpty && trimmed.contains(u.nameAr)) ||
          (u.nameEn.isNotEmpty && trimmed.contains(u.nameEn))) {
        return isEn
            ? (u.nameEn.isNotEmpty ? u.nameEn : u.name)
            : (u.nameAr.isNotEmpty ? u.nameAr : u.name);
      }
    }

    // 2. Extract abbreviation in parentheses like (GRUNI), (CIU), (SEU)
    final match = RegExp(r'\(([A-Za-z0-9]+)\)').firstMatch(trimmed);
    if (match != null) {
      final code = match.group(1)!;
      for (final u in _universitiesList) {
        if (u.name.contains('($code)') ||
            u.nameAr.contains('($code)') ||
            u.nameEn.contains('($code)')) {
          return isEn
              ? (u.nameEn.isNotEmpty ? u.nameEn : u.name)
              : (u.nameAr.isNotEmpty ? u.nameAr : u.name);
        }
      }
    }

    return trimmed;
  }

  Future<void> _loadCurrentUser() async {
    try {
      final freshUser = await ApiService.getCurrentUser();
      if (freshUser != null && mounted) {
        setState(() {
          _currentUser = freshUser;
        });
      }
    } catch (e) {
      debugPrint('HomeScreen load user error: $e');
    }
  }

  Future<void> _loadUnreadChatCount() async {
    final usr = _currentUser ?? widget.user;
    if (usr == null || usr.id <= 0 || widget.isGuest) {
      if (_unreadChatCount != 0 && mounted) {
        setState(() => _unreadChatCount = 0);
      }
      return;
    }

    if (_currentIndex == 2) {
      if (_unreadChatCount != 0 && mounted) {
        setState(() => _unreadChatCount = 0);
      }
      return;
    }

    try {
      final chatId = await ApiService.createChat(usr.id);
      if (chatId != null && chatId > 0) {
        final messages = await ApiService.getMessages(chatId);
        final prefs = await SharedPreferences.getInstance();
        final lastReadId =
            prefs.getInt('last_read_chat_msg_id_${usr.id}') ?? 0;

        final unreadAdminMsgs = messages
            .where((m) => m.senderType != 'student' && m.id > lastReadId)
            .length;

        if (mounted && _unreadChatCount != unreadAdminMsgs) {
          setState(() => _unreadChatCount = unreadAdminMsgs);
        }
      }
    } catch (e) {
      debugPrint('Error loading unread chat count: $e');
    }
  }

  Widget _buildHomeServicesSection(Student? usr) {
    final isAr = LanguageService.currentLang.value == 'ar';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 4,
                    height: 18,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isAr ? 'الخدمات الطلابية' : 'Student Services',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: () {
                  setState(() => _currentIndex = 1);
                },
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Row(
                    children: [
                      Text(
                        isAr ? 'عرض الكل' : 'View All',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.accent,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        isAr ? Icons.arrow_back_ios : Icons.arrow_forward_ios,
                        size: 12,
                        color: AppColors.accent,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Services Horizontal 2-Row Grid
        if (_isLoadingServices && _servicesList.isEmpty)
          const SizedBox(
            height: 190,
            child: Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          )
        else if (_servicesList.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Center(
                child: Text(
                  isAr ? 'لا توجد خدمات متاحة حالياً' : 'No services available',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          )
        else
          SizedBox(
            height: 200,
            child: GridView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 0.38,
              ),
              itemCount: _servicesList.length,
              itemBuilder: (context, idx) {
                final s = _servicesList[idx];
                final title = s['title']?.toString() ?? '';
                final desc = s['desc']?.toString() ?? '';
                final imgUrl = s['img']?.toString() ?? '';
                final int points = (s['price_points'] as int?) ?? 0;
                final double cash = ((s['price_cash'] as num?)?.toDouble()) ?? 0.0;

                String priceTag = '';
                if (cash > 0) {
                  priceTag = cash.truncateToDouble() == cash ? '${cash.toInt()} \$' : '${cash.toStringAsFixed(2)} \$';
                } else if (points > 0) {
                  priceTag = '$points ${LanguageService.tr('points_unit')}';
                } else {
                  priceTag = isAr ? 'مجاناً' : 'Free';
                }

                return Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      setState(() => _currentIndex = 1);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          // Service thumbnail
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              width: 56,
                              height: 56,
                              color: AppColors.primaryDark,
                              child: imgUrl.isNotEmpty
                                  ? Image.network(
                                      imgUrl,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        color: AppColors.primaryDark,
                                        child: const Icon(
                                          Icons.build_circle_rounded,
                                          color: AppColors.accent,
                                          size: 28,
                                        ),
                                      ),
                                    )
                                  : const Icon(
                                      Icons.build_circle_rounded,
                                      color: AppColors.accent,
                                      size: 28,
                                    ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Service details
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryDark,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                if (desc.isNotEmpty) ...[
                                  Text(
                                    desc,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                ],
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: cash > 0
                                        ? const Color(0xFFECFDF5)
                                        : (points > 0
                                            ? const Color(0xFFEFF6FF)
                                            : const Color(0xFFFEF3C7)),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    priceTag,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: cash > 0
                                          ? const Color(0xFF065F46)
                                          : (points > 0
                                              ? const Color(0xFF1E40AF)
                                              : const Color(0xFF92400E)),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            isAr ? Icons.chevron_left : Icons.chevron_right,
                            color: AppColors.accent,
                            size: 20,
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
    );
  }

  // محتوى التبويب الرئيسي (Home)
  Widget _buildHomeTab(Student? usr) {
    final List<Map<String, dynamic>> carouselItems = _newsList.isNotEmpty
        ? _newsList
            .map((n) => {
                  'title': n.title,
                  'content': n.content,
                  'image_url': n.imageUrl
                })
            .toList()
        : _adBanners.map((e) => Map<String, dynamic>.from(e)).toList();

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          _loadApartments(),
          _loadNews(),
          _loadServices(),
          _loadUniversities(),
          if (!widget.isGuest) _loadCurrentUser(),
        ]);
      },
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. App Bar علوي مخصص يحتوي على اللوجو وصورة الشخص واسمه
                Container(
                  padding: const EdgeInsets.only(
                      top: 16, bottom: 20, left: 20, right: 20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                        colors: [AppColors.primaryDark, AppColors.primary]),
                    borderRadius:
                        BorderRadius.vertical(bottom: Radius.circular(28)),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: (widget.isGuest || usr == null)
                            ? () => Navigator.of(context).push(
                                  MaterialPageRoute(
                                      builder: (_) => const LoginScreen()),
                                )
                            : null,
                        child: CircleAvatar(
                          radius: 26,
                          backgroundColor: AppColors.accent,
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.white,
                            backgroundImage: (usr?.avatarUrl != null &&
                                    usr!.avatarUrl!.isNotEmpty)
                                ? NetworkImage(
                                    ApiService.resolveImageUrl(usr.avatarUrl!))
                                : null,
                            child: (usr?.avatarUrl == null ||
                                    usr!.avatarUrl!.isEmpty)
                                ? Icon(
                                    widget.isGuest
                                        ? Icons.person_outline
                                        : Icons.person,
                                    color: AppColors.primary,
                                    size: 30)
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: widget.isGuest || usr == null
                            ? Align(
                                alignment: LanguageService.isRtl
                                    ? Alignment.centerRight
                                    : Alignment.centerLeft,
                                child: InkWell(
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute(
                                        builder: (_) => const LoginScreen()),
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 7),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [
                                          AppColors.accent,
                                          Color(0xFFE5A610),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.accent
                                              .withValues(alpha: 0.35),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.login_rounded,
                                          color: AppColors.primaryDark,
                                          size: 17,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          LanguageService.currentLang.value == 'ar'
                                              ? 'تسجيل الدخول'
                                              : 'Log In',
                                          style: const TextStyle(
                                            color: AppColors.primaryDark,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${LanguageService.tr('welcome')} ${usr.fullName}',
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  if (usr.university != null &&
                                      usr.university!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      _getLocalizedUniversity(usr.university),
                                      style: const TextStyle(
                                          color: AppColors.accentLight,
                                          fontSize: 13),
                                    ),
                                  ],
                                ],
                              ),
                      ),
                      IconButton(
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => NotificationsScreen(user: usr),
                            ),
                          );
                          // Refresh unread count immediately upon returning
                          _loadNotifications();
                        },
                        icon: Stack(
                          children: [
                            const Icon(Icons.notifications_outlined,
                                color: Colors.white, size: 28),
                            if (_unreadNotificationsCount > 0)
                              Positioned(
                                right: 0,
                                top: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                      color: Colors.redAccent,
                                      shape: BoxShape.circle),
                                  constraints: const BoxConstraints(
                                      minWidth: 16, minHeight: 16),
                                  child: Center(
                                    child: Text(
                                      _unreadNotificationsCount > 99
                                          ? '99+'
                                          : _unreadNotificationsCount.toString(),
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold),
                                    ),
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
                        decoration: BoxDecoration(
                            color: AppColors.primaryDark,
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: AppColors.accent, width: 1.5)),
                        child: ClipOval(
                            child: Image.asset('assets/images/logo.png',
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => const Icon(
                                    Icons.star,
                                    color: AppColors.accent))),
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
                          final String imgUrl = ad['image_url']?.toString() ??
                              ad['img']?.toString() ??
                              '';
                          const String fallbackImg =
                              'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80';
                          final String title = ad['title']?.toString() ?? '';
                          final String desc = ad['content']?.toString() ??
                              ad['desc']?.toString() ??
                              '';
                          final String sub = ad['date']?.toString() ??
                              ad['sub']?.toString() ??
                              LanguageService.tr('auto_trans_1164');

                          return GestureDetector(
                            onTap: () => _showNewsDetail(context, ad),
                            child: Container(
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 20),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(22),
                                boxShadow: [
                                  BoxShadow(
                                      color: AppColors.primaryDark
                                          .withValues(alpha: 0.25),
                                      blurRadius: 15,
                                      offset: const Offset(0, 8))
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(22),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    // صورة الإعلان الحقيقية
                                    Image.network(
                                      imgUrl.isNotEmpty
                                          ? (imgUrl.startsWith('http')
                                              ? imgUrl
                                              : ApiService.resolveImageUrl(
                                                  imgUrl))
                                          : fallbackImg,
                                      cacheWidth: 800,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        color: AppColors.primaryDark,
                                        child: const Icon(Icons.newspaper,
                                            size: 50, color: AppColors.accent),
                                      ),
                                    ),
                                    // تدرج لوني داكن وذهبي لحماية النصوص
                                    Container(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.bottomRight,
                                          end: Alignment.topLeft,
                                          colors: [
                                            AppColors.primaryDark
                                                .withValues(alpha: 0.95),
                                            AppColors.primaryDark
                                                .withValues(alpha: 0.6),
                                            Colors.transparent,
                                          ],
                                        ),
                                      ),
                                    ),
                                    // محتوى الشريحة
                                    Padding(
                                      padding: const EdgeInsets.all(18),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.end,
                                            children: [
                                              Text(
                                                  '${idx + 1} / ${carouselItems.length}',
                                                  style: const TextStyle(
                                                      color: Colors.white70,
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.bold)),
                                            ],
                                          ),
                                          const Spacer(),
                                          Text(
                                            title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                                color: AppColors.accent,
                                                fontSize: 16,
                                                fontWeight: FontWeight.w900),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            desc,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            sub,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                                color: Colors.white70,
                                                fontSize: 11),
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
                          children:
                              List.generate(carouselItems.length, (index) {
                            final isActive = index == currentPage;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: isActive ? 22 : 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: isActive
                                    ? AppColors.accent
                                    : Colors.grey.shade400,
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
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => RentFlatScreen(
                            user: usr, apartments: _apartments))),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: AppColors.accent, width: 2),
                        boxShadow: [
                          BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              blurRadius: 15,
                              offset: const Offset(0, 6))
                        ],
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
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                            LanguageService.tr(
                                                'book_apartment_title'),
                                            style: const TextStyle(
                                                color: AppColors.accent,
                                                fontSize: 17,
                                                fontWeight: FontWeight.w900)),
                                        const SizedBox(height: 6),
                                        Text(
                                            LanguageService.tr(
                                                'book_apartment_desc'),
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 13,
                                                height: 1.4,
                                                fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: const BoxDecoration(
                                        color: AppColors.accent,
                                        shape: BoxShape.circle),
                                    child: Icon(
                                        LanguageService.isRtl
                                            ? Icons.arrow_back_ios
                                            : Icons.arrow_forward_ios,
                                        color: AppColors.textDark,
                                        size: 18),
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

                const SizedBox(height: 8),

                // 4. قسم الخدمات الطلابية (صفين بالتمرير الأفقي)
                _buildHomeServicesSection(usr),
                const SizedBox(height: 28),
              ],
            ),
          ),
        ],
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
              child: _buildPages(_currentUser ??
                      widget.user ??
                      Student(
                          id: 0,
                          fullName: LanguageService.tr('auto_trans_1182')))[
                  _currentIndex],
            ),
            bottomNavigationBar: Container(
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 20,
                      offset: const Offset(0, -5))
                ],
              ),
              child: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (idx) {
                  setState(() {
                    _currentIndex = idx;
                    if (idx == 2) {
                      _unreadChatCount = 0;
                    }
                  });
                  if (idx == 0 && !widget.isGuest) {
                    _loadCurrentUser();
                  }
                  if (idx == 2) {
                    final usr = _currentUser ?? widget.user;
                    if (usr != null && usr.id > 0) {
                      ApiService.createChat(usr.id).then((cid) {
                        if (cid != null && cid > 0) {
                          ApiService.getMessages(cid).then((msgs) {
                            final adminMsgs = msgs
                                .where((m) => m.senderType != 'student')
                                .toList();
                            if (adminMsgs.isNotEmpty) {
                              final maxId = adminMsgs
                                  .map((m) => m.id)
                                  .reduce((a, b) => a > b ? a : b);
                              SharedPreferences.getInstance().then((prefs) {
                                prefs.setInt(
                                    'last_read_chat_msg_id_${usr.id}', maxId);
                              });
                            }
                          });
                        }
                      });
                    }
                  }
                },
                type: BottomNavigationBarType.fixed,
                backgroundColor: Colors.white,
                selectedItemColor: AppColors.primary,
                unselectedItemColor: AppColors.textMuted,
                selectedLabelStyle:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                items: [
                  BottomNavigationBarItem(
                      icon: const Icon(Icons.home_outlined),
                      activeIcon: const Icon(Icons.home),
                      label: LanguageService.tr('home')),
                  BottomNavigationBarItem(
                      icon: const Icon(Icons.build_circle_outlined),
                      activeIcon: const Icon(Icons.build_circle),
                      label: LanguageService.tr('services')),
                  BottomNavigationBarItem(
                      icon: Badge(
                        isLabelVisible: _unreadChatCount > 0,
                        backgroundColor: Colors.redAccent,
                        label: Text(
                          _unreadChatCount > 99
                              ? '99+'
                              : _unreadChatCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        child: const Icon(Icons.chat_bubble_outline),
                      ),
                      activeIcon: Badge(
                        isLabelVisible: _unreadChatCount > 0,
                        backgroundColor: Colors.redAccent,
                        label: Text(
                          _unreadChatCount > 99
                              ? '99+'
                              : _unreadChatCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        child: const Icon(Icons.chat_bubble),
                      ),
                      label: LanguageService.tr('chat')),
                  BottomNavigationBarItem(
                      icon: const Icon(Icons.apartment_outlined),
                      activeIcon: const Icon(Icons.apartment),
                      label: LanguageService.currentLang.value == 'ar'
                          ? 'شقق'
                          : 'Flats'),
                  BottomNavigationBarItem(
                      icon: const Icon(Icons.person_outline),
                      activeIcon: const Icon(Icons.person),
                      label: LanguageService.tr('profile')),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showNewsDetail(BuildContext context, Map<String, dynamic> news) {
    final imgUrl =
        news['image_url']?.toString() ?? news['img']?.toString() ?? '';
    const fallbackImg =
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80';
    final content =
        news['content']?.toString() ?? news['desc']?.toString() ?? '';
    final date = news['date']?.toString() ??
        news['sub']?.toString() ??
        LanguageService.tr('auto_trans_1184');

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
                decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10)),
              ),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Image.network(
                        imgUrl.isNotEmpty
                            ? (imgUrl.startsWith('http')
                                ? imgUrl
                                : ApiService.resolveImageUrl(imgUrl))
                            : fallbackImg,
                        cacheWidth: 800,
                        height: 220,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 220,
                          color: AppColors.primaryDark,
                          child: const Icon(Icons.newspaper,
                              size: 60, color: AppColors.accent),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.schedule,
                                    color: AppColors.accent, size: 18),
                                const SizedBox(width: 6),
                                Text(
                                  date,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textMuted,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              news['title']?.toString() ?? '',
                              style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryDark,
                                  height: 1.4),
                            ),
                            const Divider(height: 24, thickness: 1.2),
                            Text(
                              content,
                              style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textDark,
                                  height: 1.6),
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
