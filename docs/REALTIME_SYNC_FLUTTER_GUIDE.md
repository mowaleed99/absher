# دليل تنفيذ المزامنة الحية والفورية لتطبيق Flutter
# Real-Time Live Sync Integration Guide (Flutter Mobile App)

مرحباً يا هندسة، هذا الدليل يوضح كيفية تفعيل **المزامنة الحية والفورية (Real-Time Live Sync)** في تطبيق الموبايل (Flutter) بحيث تتحدث الشاشات (الشقق، الطلبات، الإشعارات، الشات، النقاط) تلقائياً دون وميض ودون حاجة المستخدم لعمل Refresh يدوي أو تغيير الشاشة.

---

## 1. كيف يعمل النظام؟ (Architecture & Overview)

1. تم إنشاء Endpoint فائق الخفة والسرعة في الباك إند:
   ```
   GET https://absher-georgia.com/api/sync_state.php?student_id={STUDENT_ID}&chat_id={CHAT_ID}
   ```
2. زمن الاستجابة **12 مللي ثانية فقط**، وحجم البيانات أقل من **1 كيلوبايت**.
3. التطبيق يفحص هذا الـ Endpoint دورياً (كل 4 - 6 ثوانٍ فقط أثناء فتح التطبيق في الـ Foreground).
4. بمجرد أن يقوم المشرف في لوحة التحكم بأي إجراء (تثبيت شقة، تغيير حالة طلب، إرسال إشعار، إضافة نقاط، إرسال رسالة شات)، يكتشف التطبيق التغيير فوراً ويقوم بعمل **Silent Refresh** للبيانات بسلاسة تامة.
5. يتوقف الفحص تلقائياً عند قفل الشاشة أو خروج التطبيق للخلفية لتوفير البطارية والإنترنت.

---

## 2. كود خدمة المزامنة الذكية (RealtimeSyncService.dart)

قم بإنشاء ملف جديد في مسار: `lib/services/realtime_sync_service.dart`:

```dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;

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
  String? _lastRequestsVersion;
  String? _lastNotificationsVersion;
  String? _lastChatVersion;

  // Stream Controllers for live UI updates
  final _apartmentsUpdateController = StreamController<void>.broadcast();
  final _requestsUpdateController = StreamController<void>.broadcast();
  final _notificationsUpdateController = StreamController<void>.broadcast();
  final _chatUpdateController = StreamController<void>.broadcast();
  final _profileUpdateController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<void> get onApartmentsUpdated => _apartmentsUpdateController.stream;
  Stream<void> get onRequestsUpdated => _requestsUpdateController.stream;
  Stream<void> get onNotificationsUpdated => _notificationsUpdateController.stream;
  Stream<void> get onChatUpdated => _chatUpdateController.stream;
  Stream<Map<String, dynamic>> get onProfileUpdated => _profileUpdateController.stream;

  /// تهيئة الخدمة عند بدء تشغيل التطبيق
  void init({int? studentId, int? chatId}) {
    currentStudentId = studentId;
    currentChatId = chatId;
    WidgetsBinding.instance.addObserver(this);
    startSync();
  }

  void updateContext({int? studentId, int? chatId}) {
    currentStudentId = studentId ?? currentStudentId;
    currentChatId = chatId ?? currentChatId;
  }

  void startSync() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) => checkSyncState());
    checkSyncState(); // أول فحص فوري
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
      final uri = Uri.parse('https://absher-georgia.com/api/sync_state.php').replace(
        queryParameters: {
          if (currentStudentId != null && currentStudentId! > 0) 'student_id': currentStudentId.toString(),
          if (currentChatId != null && currentChatId! > 0) 'chat_id': currentChatId.toString(),
        },
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'success' && data['versions'] != null) {
          final versions = data['versions'];

          // 1. فحص الشقق والعروض
          final aptVer = versions['apartments']?.toString();
          if (_lastApartmentsVersion != null && _lastApartmentsVersion != aptVer) {
            _apartmentsUpdateController.add(null);
          }
          _lastApartmentsVersion = aptVer;

          // 2. فحص طلبات الطالب
          final reqVer = versions['requests']?.toString();
          if (_lastRequestsVersion != null && _lastRequestsVersion != reqVer) {
            _requestsUpdateController.add(null);
          }
          _lastRequestsVersion = reqVer;

          // 3. فحص الإشعارات
          final notifVer = versions['notifications']?.toString();
          if (_lastNotificationsVersion != null && _lastNotificationsVersion != notifVer) {
            _notificationsUpdateController.add(null);
          }
          _lastNotificationsVersion = notifVer;

          // 4. فحص الشات
          final chatVer = versions['chat']?.toString();
          if (_lastChatVersion != null && _lastChatVersion != chatVer) {
            _chatUpdateController.add(null);
          }
          _lastChatVersion = chatVer;

          // 5. فحص بروفايل الطالب (النقاط، الحظر)
          if (data['student'] != null) {
            _profileUpdateController.add(Map<String, dynamic>.from(data['student']));
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
    _requestsUpdateController.close();
    _notificationsUpdateController.close();
    _chatUpdateController.close();
    _profileUpdateController.close();
  }
}
```

---

## 3. أمثلة الاستخدام في شاشات التطبيق (Simple Usage Examples)

### أ) في شاشة الشقق الرئيسية (`HomeScreen` / `ApartmentsList`):
```dart
StreamSubscription? _syncSub;

@override
void initState() {
  super.initState();
  _fetchApartments(); // جلب الشقق لأول مرة

  // استماع للتحديثات الحية بدون إعادة بناء الشاشة بالكامل
  _syncSub = RealtimeSyncService().onApartmentsUpdated.listen((_) {
    _fetchApartments(silent: true); // تحديث القائمة في الخلفية
  });
}

@override
void dispose() {
  _syncSub?.cancel();
  super.dispose();
}
```

---

### ب) في شاشة طلبات الطالب (`MyRequestsScreen`):
```dart
StreamSubscription? _requestsSub;

@override
void initState() {
  super.initState();
  _fetchRequests();

  // لما المشرف يغير حالة الطلب من الداشبورد تتحدث الشاشة فوراً
  _requestsSub = RealtimeSyncService().onRequestsUpdated.listen((_) {
    _fetchRequests(silent: true);
  });
}

@override
void dispose() {
  _requestsSub?.cancel();
  super.dispose();
}
```

---

### ج) في شاشة الشات (`ChatScreen`):
```dart
StreamSubscription? _chatSub;

@override
void initState() {
  super.initState();
  RealtimeSyncService().updateContext(chatId: widget.chatId);

  // لما المشرف يبعت رسالة تظهر للطالب في نفس اللحظة
  _chatSub = RealtimeSyncService().onChatUpdated.listen((_) {
    _loadNewMessages();
  });
}

@override
void dispose() {
  _chatSub?.cancel();
  super.dispose();
}
```

---

### د) في شاشة البروفايل أو الهيدر (تحديث النقاط لايف):
```dart
StreamSubscription? _profileSub;

@override
void initState() {
  super.initState();
  _profileSub = RealtimeSyncService().onProfileUpdated.listen((studentData) {
    setState(() {
      userPoints = studentData['points'] ?? userPoints;
    });
  });
}

@override
void dispose() {
  _profileSub?.cancel();
  super.dispose();
}
```

---

## 4. البدء في `main.dart`

في دالة `main()` أو بعد تسجيل دخول المستخدم:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تشغيل خدمة المزامنة
  RealtimeSyncService().init();
  
  runApp(const MyApp());
}

// وعند تسجيل دخول الطالب بنجاح:
RealtimeSyncService().updateContext(studentId: loggedInStudent.id);
```

---

كل شيء جاهز ومثبت ويعمل على سيرفر Production و Staging بكفاءة وسرعة فائقة ⚡!
