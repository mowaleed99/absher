import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import '../theme/app_colors.dart';
import '../services/language_service.dart';
import '../screens/chat_screen.dart';
import '../screens/requests_history_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/flats_list_screen.dart';
import '../screens/apartment_detail_screen.dart';
import '../models/student.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint("Handling background FCM message: ${message.messageId}, data: ${message.data}");
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  static String? currentFcmToken;
  static bool _isInitialized = false;

  static Map<String, dynamic>? _pendingNotificationData;
  static OverlayEntry? _activeOverlayEntry;
  static Timer? _overlayTimer;
  static int _lastNavigationTimestamp = 0;

  /// Initialize Firebase & FCM settings.
  static Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await Firebase.initializeApp();
      _isInitialized = true;
      debugPrint("Firebase initialized successfully.");

      // 1. Set background messaging handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 2. Request Notification Permission
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      debugPrint("FCM Permission status: ${settings.authorizationStatus}");

      // 3. Foreground presentation options (silent so our in-app banner takes precedence)
      await messaging.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: true,
        sound: true,
      );

      // 4. Retrieve initial device token
      currentFcmToken = await messaging.getToken();
      debugPrint("FCM Device Token: $currentFcmToken");

      // 5. Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        currentFcmToken = newToken;
        debugPrint("FCM Device Token Refreshed: $newToken");
        syncTokenWithBackend();
      });

      // 6. Foreground message listener -> Show custom elegant In-App Banner
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint("Foreground message received: ${message.notification?.title} - ${message.notification?.body}");
        debugPrint("Message data: ${message.data}");
        _showInAppBanner(message);
      });

      // 7. Background message opened listener
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint("onMessageOpenedApp triggered: data = ${message.data}");
        handleNotificationNavigation(message.data);
      });

      // 8. Cold start / Terminated message check
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint("getInitialMessage found cold-start notification: ${initialMessage.data}");
        _pendingNotificationData = initialMessage.data;
      }

    } catch (e) {
      debugPrint("PushNotificationService initialization error: $e");
    }
  }

  /// Process any pending navigation stored during cold start.
  static void processPendingNavigation() {
    if (_pendingNotificationData != null) {
      final data = Map<String, dynamic>.from(_pendingNotificationData!);
      _pendingNotificationData = null;
      Future.delayed(const Duration(milliseconds: 500), () {
        handleNotificationNavigation(data);
      });
    }
  }

  /// Deep-linking routing based on notification type.
  static Future<void> handleNotificationNavigation(Map<String, dynamic> data) async {
    if (data.isEmpty) return;

    // Prevent double navigation within 1 second
    final now = DateTime.now().millisecondsSinceEpoch;
    if (now - _lastNavigationTimestamp < 1000) {
      return;
    }
    _lastNavigationTimestamp = now;

    final navState = navigatorKey.currentState;
    if (navState == null) {
      // If navigator is not ready yet, store for pending processing
      _pendingNotificationData = data;
      return;
    }

    final type = (data['type'] ?? '').toString().toLowerCase().trim();

    try {
      await ApiService.initTokens();
      final currentUser = await ApiService.getCurrentUser();

      if (type == 'chat' || type == 'support_reply') {
        navState.push(
          MaterialPageRoute(
            builder: (_) => ChatScreen(user: currentUser),
          ),
        );
      } else if (type == 'request' || type == 'service_request') {
        navState.push(
          MaterialPageRoute(
            builder: (_) => const RequestsHistoryScreen(),
          ),
        );
      } else if (type == 'apartment' || type == 'housing' || type == 'new_apartment') {
        _handleApartmentNavigation(navState, data, currentUser);
      } else {
        // 'broadcast_alert', 'general', or fallback
        navState.push(
          MaterialPageRoute(
            builder: (_) => NotificationsScreen(user: currentUser),
          ),
        );
      }
    } catch (e) {
      debugPrint("Error during handleNotificationNavigation: $e");
    }
  }

  /// Handle apartment deep linking gracefully.
  static Future<void> _handleApartmentNavigation(
      NavigatorState navState, Map<String, dynamic> data, Student? currentUser) async {
    try {
      final aptId = data['apartment_id'] ?? data['target_id'] ?? data['id'];
      final apartments = await ApiService.getApartments();
      if (aptId != null && aptId.toString().isNotEmpty) {
        final match = apartments.firstWhere(
          (a) => a['id']?.toString() == aptId.toString(),
          orElse: () => <String, dynamic>{},
        );
        if (match.isNotEmpty) {
          navState.push(
            MaterialPageRoute(
              builder: (_) => ApartmentDetailScreen(apartment: match, user: currentUser),
            ),
          );
          return;
        }
      }
      navState.push(
        MaterialPageRoute(
          builder: (_) => FlatsListScreen(
            apartments: apartments,
            user: currentUser,
            title: LanguageService.currentLang.value == 'ar'
                ? 'الشقق المتاحة للإيجار'
                : 'Available Flats',
            subtitle: LanguageService.currentLang.value == 'ar'
                ? 'تصفح قائمة الشقق والعقارات المتاحة'
                : 'Browse available flats and studios',
          ),
        ),
      );
    } catch (e) {
      navState.push(
        MaterialPageRoute(
          builder: (_) => NotificationsScreen(user: currentUser),
        ),
      );
    }
  }

  /// Display a custom In-App floating banner when app is in Foreground.
  static void _showInAppBanner(RemoteMessage message) {
    final navContext = navigatorKey.currentContext;
    final overlayState = navigatorKey.currentState?.overlay;

    if (navContext == null || overlayState == null) return;

    // Remove any previously active banner smoothly
    _overlayTimer?.cancel();
    _activeOverlayEntry?.remove();
    _activeOverlayEntry = null;

    final title = message.notification?.title ??
        message.data['title'] ??
        LanguageService.tr('app_name');
    final body = message.notification?.body ??
        message.data['body'] ??
        message.data['content'] ??
        '';

    final type = (message.data['type'] ?? '').toString().toLowerCase();

    IconData bannerIcon = Icons.notifications_active_outlined;
    if (type == 'chat') {
      bannerIcon = Icons.chat_bubble_outline;
    } else if (type == 'request') {
      bannerIcon = Icons.assignment_outlined;
    } else if (type == 'apartment') {
      bannerIcon = Icons.apartment_outlined;
    }

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => _InAppNotificationWidget(
        title: title,
        body: body,
        icon: bannerIcon,
        onTap: () {
          _activeOverlayEntry?.remove();
          _activeOverlayEntry = null;
          handleNotificationNavigation(message.data);
        },
        onDismiss: () {
          _activeOverlayEntry?.remove();
          _activeOverlayEntry = null;
        },
      ),
    );

    _activeOverlayEntry = entry;
    overlayState.insert(entry);

    // Auto-dismiss after 4 seconds
    _overlayTimer = Timer(const Duration(seconds: 4), () {
      if (_activeOverlayEntry == entry) {
        _activeOverlayEntry?.remove();
        _activeOverlayEntry = null;
      }
    });
  }

  /// Sync device token to backend if user is authenticated.
  static Future<bool> syncTokenWithBackend({String? customToken, int? studentId}) async {
    try {
      final token = currentFcmToken ?? await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) {
        debugPrint("No FCM token available to register.");
        return false;
      }
      currentFcmToken = token;

      final authToken = customToken ?? ApiService.authToken;
      if (authToken == null && studentId == null) {
        debugPrint("User not authenticated yet; skipping token registration until login.");
        return false;
      }

      final platform = kIsWeb ? 'web' : (Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'android'));
      final deviceModel = kIsWeb ? 'Web Browser' : (Platform.isAndroid ? 'Android Device' : (Platform.isIOS ? 'iOS Device' : 'Unknown'));

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (authToken != null && authToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }

      final body = <String, dynamic>{
        'device_token': token,
        'platform': platform,
        'device_model': deviceModel,
      };
      if (studentId != null && studentId > 0) {
        body['student_id'] = studentId;
      }

      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/notifications/register_token.php'),
        headers: headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        debugPrint("FCM Device Token successfully registered with backend.");
        return true;
      } else {
        debugPrint("Failed to register FCM token with backend: (${response.statusCode}) ${response.body}");
        return false;
      }
    } catch (e) {
      debugPrint("syncTokenWithBackend error: $e");
      return false;
    }
  }

  /// Unregister device token from backend on user logout.
  static Future<void> unregisterToken() async {
    try {
      final token = currentFcmToken ?? await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;

      await http.post(
        Uri.parse('${ApiService.baseUrl}/notifications/unregister_token.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'device_token': token}),
      ).timeout(const Duration(seconds: 5));

      debugPrint("FCM Device Token unregistered on backend.");
    } catch (e) {
      debugPrint("unregisterToken error: $e");
    }
  }
}

/// Animated In-App Notification Banner Widget matching Absher Theme.
class _InAppNotificationWidget extends StatefulWidget {
  final String title;
  final String body;
  final IconData icon;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _InAppNotificationWidget({
    required this.title,
    required this.body,
    required this.icon,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  State<_InAppNotificationWidget> createState() => _InAppNotificationWidgetState();
}

class _InAppNotificationWidgetState extends State<_InAppNotificationWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, -1.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    ));

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _handleDismiss() {
    _animController.reverse().then((_) {
      widget.onDismiss();
    });
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topPadding + 10,
      left: 14,
      right: 14,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: widget.onTap,
              onVerticalDragEnd: (details) {
                if (details.primaryVelocity != null && details.primaryVelocity! < 0) {
                  _handleDismiss();
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.accent.withValues(alpha: 0.4),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.35),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  textDirection: LanguageService.textDirection,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.accent,
                          width: 1,
                        ),
                      ),
                      child: Icon(
                        widget.icon,
                        color: AppColors.accent,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        textDirection: LanguageService.textDirection,
                        children: [
                          Text(
                            widget.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (widget.body.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              widget.body,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                                fontSize: 12,
                                height: 1.25,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white70, size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _handleDismiss,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
