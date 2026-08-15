import 'dart:async';
import 'dart:convert';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class RealtimeSyncService with WidgetsBindingObserver {
  static final RealtimeSyncService _instance = RealtimeSyncService._internal();
  factory RealtimeSyncService() => _instance;
  RealtimeSyncService._internal();

  Timer? _timer;
  bool _isPolling = false;
  bool _isInForeground = true;

  int? currentStudentId;
  int? currentChatId;

  // Cached versions
  String? _lastApartmentsVersion;
  String? _lastServicesVersion;
  String? _lastOffersVersion;
  String? _lastNewsVersion;
  String? _lastRequestsVersion;
  String? _lastNotificationsVersion;
  String? _lastChatVersion;

  // Stream Controllers for live UI updates
  final _apartmentsUpdateController = StreamController<void>.broadcast();
  final _servicesUpdateController = StreamController<void>.broadcast();
  final _offersUpdateController = StreamController<void>.broadcast();
  final _newsUpdateController = StreamController<void>.broadcast();
  final _requestsUpdateController = StreamController<void>.broadcast();
  final _notificationsUpdateController = StreamController<void>.broadcast();
  final _chatUpdateController = StreamController<void>.broadcast();
  final _profileUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<void> get onApartmentsUpdated => _apartmentsUpdateController.stream;
  Stream<void> get onServicesUpdated => _servicesUpdateController.stream;
  Stream<void> get onOffersUpdated => _offersUpdateController.stream;
  Stream<void> get onNewsUpdated => _newsUpdateController.stream;
  Stream<void> get onRequestsUpdated => _requestsUpdateController.stream;
  Stream<void> get onNotificationsUpdated =>
      _notificationsUpdateController.stream;
  Stream<void> get onChatUpdated => _chatUpdateController.stream;
  Stream<Map<String, dynamic>> get onProfileUpdated =>
      _profileUpdateController.stream;

  /// Initialize service at app startup
  void init({int? studentId, int? chatId}) {
    currentStudentId = studentId;
    currentChatId = chatId;
    WidgetsBinding.instance.addObserver(this);
    startSync();
  }

  void updateContext({int? studentId, int? chatId}) {
    if (studentId != null) currentStudentId = studentId;
    if (chatId != null) currentChatId = chatId;
  }

  void triggerNotificationsUpdate() {
    if (!_notificationsUpdateController.isClosed) {
      _notificationsUpdateController.add(null);
    }
  }

  void triggerChatUpdate() {
    if (!_chatUpdateController.isClosed) {
      _chatUpdateController.add(null);
    }
  }

  void startSync() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) => checkSyncState());
    checkSyncState(); // immediate first check
  }

  void stopSync() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _isInForeground = true;
      startSync();
    } else {
      _isInForeground = false;
      stopSync();
    }
  }

  Future<void> checkSyncState() async {
    if (!_isInForeground || _isPolling) return;
    _isPolling = true;

    try {
      final base = ApiService.baseUrl;
      final uri = Uri.parse('$base/sync_state.php').replace(
        queryParameters: {
          if (currentStudentId != null && currentStudentId! > 0)
            'student_id': currentStudentId.toString(),
          if (currentChatId != null && currentChatId! > 0)
            'chat_id': currentChatId.toString(),
        },
      );

      final response =
          await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'success' && data['versions'] != null) {
          final versions = data['versions'];

          // 1. Apartments
          final aptVer = versions['apartments']?.toString();
          if (_lastApartmentsVersion != null &&
              _lastApartmentsVersion != aptVer) {
            _apartmentsUpdateController.add(null);
          }
          _lastApartmentsVersion = aptVer;

          // 2. Services
          final srvVer = versions['services']?.toString();
          if (_lastServicesVersion != null && _lastServicesVersion != srvVer) {
            _servicesUpdateController.add(null);
          }
          _lastServicesVersion = srvVer;

          // 3. Housing Offers
          final offVer = versions['housing_offers']?.toString();
          if (_lastOffersVersion != null && _lastOffersVersion != offVer) {
            _offersUpdateController.add(null);
          }
          _lastOffersVersion = offVer;

          // 4. News
          final newsVer = versions['news']?.toString();
          if (_lastNewsVersion != null && _lastNewsVersion != newsVer) {
            _newsUpdateController.add(null);
          }
          _lastNewsVersion = newsVer;

          // 5. Service Requests
          final reqVer = versions['requests']?.toString();
          if (_lastRequestsVersion != null && _lastRequestsVersion != reqVer) {
            _requestsUpdateController.add(null);
          }
          _lastRequestsVersion = reqVer;

          // 6. Notifications
          final notifVer = versions['notifications']?.toString();
          if (_lastNotificationsVersion != null &&
              _lastNotificationsVersion != notifVer) {
            _notificationsUpdateController.add(null);
          }
          _lastNotificationsVersion = notifVer;

          // 7. Chat Messages
          final chatVer = versions['chat']?.toString();
          if (_lastChatVersion != null && _lastChatVersion != chatVer) {
            _chatUpdateController.add(null);
          }
          _lastChatVersion = chatVer;

          // 8. Student Profile Metadata (points, is_blocked, admin_status)
          if (data['student'] != null) {
            _profileUpdateController
                .add(Map<String, dynamic>.from(data['student']));
          }
        }
      }
    } catch (e) {
      debugPrint('[RealtimeSyncService] error: $e');
    } finally {
      _isPolling = false;
    }
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    stopSync();
    _apartmentsUpdateController.close();
    _servicesUpdateController.close();
    _offersUpdateController.close();
    _newsUpdateController.close();
    _requestsUpdateController.close();
    _notificationsUpdateController.close();
    _chatUpdateController.close();
    _profileUpdateController.close();
  }
}
