import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/student.dart';
import '../models/apartment.dart';
import '../models/admin_dashboard.dart';
import '../models/chat_message.dart';
import 'language_service.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  static const _keyAuthToken = 'auth_token';
  static const _keyAdminToken = 'admin_token';

  // Token state (populated by initTokens)
  static String? adminToken;
  static String? authToken;

  /// Must be called at startup to restore persisted tokens.
  static Future<void> initTokens() async {
    adminToken = await _storage.read(key: _keyAdminToken);
    authToken = await _storage.read(key: _keyAuthToken);
  }

  /// Persist student auth token after login.
  static Future<void> saveAuthToken(String token) async {
    authToken = token;
    await _storage.write(key: _keyAuthToken, value: token);
  }

  /// Persist admin auth token after admin login.
  static Future<void> saveAdminToken(String token) async {
    adminToken = token;
    await _storage.write(key: _keyAdminToken, value: token);
  }

  /// Clear all tokens on logout.
  static Future<void> clearTokens() async {
    authToken = null;
    adminToken = null;
    await _storage.delete(key: _keyAuthToken);
    await _storage.delete(key: _keyAdminToken);
  }

  /// Fetch the currently logged-in student using the stored auth token.
  /// Response format: {"success":true,"data":{"student":{...}}}
  static Future<Student?> getCurrentUser() async {
    if (authToken == null) return null;
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me.php'),
        headers: {'Authorization': 'Bearer $authToken'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final isSuccess = data['success'] == true || data['status'] == 'success';
        final student = data['data']?['student'] ?? data['user'];
        if (isSuccess && student != null) {
          return Student.fromJson(student as Map<String, dynamic>);
        }
      }
    } catch (e) {
      debugPrint('getCurrentUser error: $e');
    }
    return null;
  }

  /// Convenience alias — returns the student's wallet points balance.
  static Future<int> getWalletBalance(int studentId) async {
    final result = await getWallet(studentId);
    return (result['points'] as num?)?.toInt() ?? 0;
  }

  // ─── URL Configuration ──────────────────────────────────────────────────────
  // عنوان سيرفر الباك اند PHP المستضاف على Hostinger (الإنتاج)
  static const String prodUrl = 'https://lime-vulture-117634.hostingersite.com/api';

  // تحديد العنوان ديناميكياً لتسهيل التطوير والافتبار المحلي
  static String get baseUrl {
    if (kReleaseMode) {
      return prodUrl;
    }
    // في وضع التطوير المحلي (Debug Mode)
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:8000/api'; // Android Emulator
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
        return 'http://localhost:8000/api';
      default:
        return prodUrl;
    }
  }

  static String get serverRoot => baseUrl.replaceAll('/api', '');

  static String resolveImageUrl(String path) {
    if (path.isEmpty) return 'assets/images/apt1.png';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image/')) {
      return path;
    }
    if (path.startsWith('assets/')) {
      return path;
    }
    // Route local uploads through media CORS proxy to support local Flutter Web testing
    if (path.contains('uploads/')) {
      final idx = path.indexOf('uploads/');
      final relPath = path.substring(idx + 'uploads/'.length);
      return '$serverRoot/api/media.php?file=$relPath';
    }
    // Remove leading slash if any
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return '$serverRoot/$cleanPath';
  }

  // تسجيل الدخول — يستخدم /auth/login.php الذي يصدر JWT
  // Response: {"success":true,"data":{"token":"...","student":{...}}}
  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess = data['success'] == true || data['status'] == 'success';
        // Save token if login succeeded
        final token = data['data']?['token'] ?? data['token'];
        if (isSuccess && token != null) {
          await saveAuthToken(token.toString());
        }
        return data;
      } else {
        return {'success': false, 'message': 'خطأ في الاتصال بالخادم (${response.statusCode})'};
      }
    } catch (e) {
      debugPrint('login error: $e');
      return {'success': false, 'message': 'فشل الاتصال بالخادم: $e'};
    }
  }

  // إنشاء حساب جديد
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String phone,
    required String university,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'email': email,
          'phone': phone,
          'university': university,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'status': 'error', 'message': 'خطأ في الاتصال بالخادم (${response.statusCode})'};
      }
    } catch (e) {
      // وضع محاكاة للتجربة الفورية
      await Future.delayed(const Duration(milliseconds: 800));
      return {
        'status': 'success',
        'message': LanguageService.tr('auto_trans_1294'),
        'user': {
          'id': 2,
          'name': fullName,
          'email': email,
          'uni': university,
          'is_guest': false
        }
      };
    }
  }

  // جلب كافة الشقق السكنية المتاحة
  // Calls /apartments/list.php — public endpoint, returns is_available=1 only
  // Response: {"success":true,"data":{"apartments":[...]}}
  static Future<List<Map<String, dynamic>>> getApartments() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/apartments/list.php?t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess = data['success'] == true || data['status'] == 'success';
        final payload = data['data'] is Map ? data['data'] as Map<String, dynamic> : data;
        final list = payload['apartments'];
        if (isSuccess && list is List) {
          return list.map((apt) {
            final a = apt as Map<String, dynamic>;
            final rawImages = a['images'];
            final imagesList = rawImages is List
                ? rawImages.map((e) => e.toString()).toList()
                : <String>[];
            final rawFeatures = a['features'];
            final featuresList = rawFeatures is List
                ? rawFeatures.map((e) => e.toString()).toList()
                : <String>[];
            final rawUnis = a['universities'];
            final universitiesList = rawUnis is List
                ? rawUnis.map((e) => e.toString()).toList()
                : <String>[];
            return <String, dynamic>{
              'id': a['id']?.toString() ?? '',
              'title': a['title']?.toString() ?? '',
              'price': a['price']?.toString() ?? '',
              'location': a['location']?.toString() ?? '',
              'proximity': a['proximity']?.toString() ?? '',
              'capacity': a['capacity']?.toString() ?? '',
              'move_in_type': a['move_in_type']?.toString() ?? '',
              'move_in_date': a['move_in_date']?.toString() ?? '',
              'description': a['description']?.toString() ?? '',
              'is_available': a['is_available'] == true || a['is_available'] == 1,
              'images': imagesList,
              'features': featuresList,
              'universities': universitiesList,
            };
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching apartments from backend: $e');
    }
    // No mock fallback — return empty list so UI shows "no data" state
    return [];
  }

  // جلب كافة الجامعات
  static Future<List<Map<String, dynamic>>> getUniversities() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/wallet_api.php?action=get_universities&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['universities'] != null) {
          return (data['universities'] as List).map((u) => <String, dynamic>{
            'id': u['id']?.toString() ?? '',
            'name': u['name']?.toString() ?? '',
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching universities from backend: $e');
    }
    // الالتجاء للقيم الافتراضية في حال عدم اتصال الخادم
    return [
      {'id': '1', 'name': LanguageService.tr('auto_trans_1346')},
      {'id': '2', 'name': LanguageService.tr('auto_trans_1347')},
      {'id': '3', 'name': LanguageService.tr('auto_trans_1348')},
      {'id': '4', 'name': LanguageService.tr('auto_trans_1349')},
    ];
  }

  // جلب كافة الأحياء السكنية
  static Future<List<Map<String, dynamic>>> getDistricts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/wallet_api.php?action=get_districts&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['districts'] != null) {
          return (data['districts'] as List).map((d) => <String, dynamic>{
            'id': d['id']?.toString() ?? '',
            'name': d['name']?.toString() ?? '',
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching districts from backend: $e');
    }
    // الالتجاء للقيم الافتراضية في حال عدم اتصال الخادم
    return [
      {'id': '1', 'name': LanguageService.tr('auto_trans_1350')},
      {'id': '2', 'name': LanguageService.tr('auto_trans_1351')},
      {'id': '3', 'name': LanguageService.tr('auto_trans_1352')},
      {'id': '4', 'name': LanguageService.tr('auto_trans_1353')},
      {'id': '5', 'name': LanguageService.tr('auto_trans_1354')},
      {'id': '6', 'name': LanguageService.tr('auto_trans_1355')},
    ];
  }

  // جلب كافة الأخبار والتنبيهات
  static Future<List<Map<String, dynamic>>> getNews() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student_requests.php?action=get_news&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['news'] != null) {
          return (data['news'] as List).map((n) => <String, dynamic>{
            'id': n['id']?.toString() ?? '',
            'title': n['title']?.toString() ?? '',
            'content': n['content']?.toString() ?? '',
            'image_url': n['image_url']?.toString() ?? '',
            'date': n['date']?.toString() ?? n['created_at']?.toString() ?? LanguageService.tr('auto_trans_1356'),
          }).toList();
        }
      }
    } catch (e) {
      // error fetching news
    }
    // محاكاة تنبيهات افتراضية في حال تعذر الاتصال بالسيرفر
    return [
      {
        'id': '1',
        'title': LanguageService.tr('auto_trans_1357'),
        'content': LanguageService.tr('auto_trans_1358'),
        'image_url': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=500&q=80',
        'date': LanguageService.tr('auto_trans_1359'),
      },
      {
        'id': '2',
        'title': LanguageService.tr('auto_trans_1360'),
        'content': LanguageService.tr('auto_trans_1361'),
        'image_url': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
        'date': LanguageService.tr('auto_trans_1362'),
      },
      {
        'id': '3',
        'title': LanguageService.tr('auto_trans_1363'),
        'content': LanguageService.tr('auto_trans_1364'),
        'image_url': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80',
        'date': LanguageService.tr('auto_trans_1365'),
      },
    ];
  }

  // جلب التنبيهات والإشعارات الفعالة (خلال آخر 24 ساعة)
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student_requests.php?action=get_notifications&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['notifications'] != null) {
          return (data['notifications'] as List).map((n) => <String, dynamic>{
            'id': n['id']?.toString() ?? '',
            'title': n['title']?.toString() ?? '',
            'content': n['content']?.toString() ?? '',
            'date': n['date']?.toString() ?? n['created_at']?.toString() ?? LanguageService.tr('auto_trans_1366'),
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    }
    // محاكاة إشعارات افتراضية نشطة عند عدم الاتصال بالسيرفر
    return [
      {
        'id': '1',
        'title': LanguageService.tr('auto_trans_1367'),
        'content': LanguageService.tr('auto_trans_1368'),
        'date': LanguageService.tr('auto_trans_1369'),
      },
      {
        'id': '2',
        'title': LanguageService.tr('auto_trans_1370'),
        'content': LanguageService.tr('auto_trans_1371'),
        'date': LanguageService.tr('auto_trans_1372'),
      },
    ];
  }

  // جلب قائمة الخدمات الطلابية
  // Calls /services/list.php — public endpoint
  // Response: {"success":true,"data":{"services":[...]}}
  static Future<List<Map<String, dynamic>>> getServices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/services/list.php?t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess = data['success'] == true || data['status'] == 'success';
        final payload = data['data'] is Map ? data['data'] as Map<String, dynamic> : data;
        final list = payload['services'];
        if (isSuccess && list is List) {
          return list.map((s) {
            final svc = s as Map<String, dynamic>;
            return <String, dynamic>{
              'id': svc['id']?.toString() ?? '',
              'title': svc['title']?.toString() ?? '',
              'desc': svc['description']?.toString() ?? '',
              'img': resolveImageUrl(svc['image_url']?.toString() ?? ''),
              'has_form': svc['has_form'] == true || svc['has_form'] == 1 || svc['has_form'] == '1',
            };
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching services from backend: $e');
    }
    // No mock fallback — return empty list so UI shows "no data" state
    return [];
  }

  // إرسال طلب خدمة أو حجز شقة أو تجميع شريك سكن
  static Future<Map<String, dynamic>> submitServiceRequest({
    String studentName = '',
    String studentPhone = '',
    String studentUni = '',
    String serviceTitle = '',
    required String details,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/student_requests.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': 'submit',
          'student_name': studentName,
          'student_phone': studentPhone,
          'student_uni': studentUni,
          'service_title': serviceTitle,
          'details': details,
        }),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error submitting request: $e');
    }
    return {'status': 'success', 'message': LanguageService.tr('auto_trans_1384')};
  }

  // جلب محادثات الطالب من الخادم
  static Future<List<Map<String, dynamic>>> getStudentChat(String phone) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chat.php?action=get&phone=${Uri.encodeComponent(phone)}&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['messages'] != null) {
          return (data['messages'] as List).map((m) => <String, dynamic>{
            'sender': m['sender']?.toString() ?? 'student',
            'text': m['text']?.toString() ?? '',
            'type': m['type']?.toString() ?? 'text',
            'imageUrl': m['imageUrl']?.toString() ?? m['image_url']?.toString() ?? '',
            'quoteText': m['quoteText']?.toString() ?? m['quote_text']?.toString() ?? '',
            'quoteSender': m['quoteSender']?.toString() ?? m['quote_sender']?.toString() ?? '',
            'time': m['time']?.toString() ?? LanguageService.tr('auto_trans_1385'),
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching chat: $e');
    }
    return [];
  }

  // إرسال رسالة شات من الطالب إلى الدعم الفني
  static Future<bool> sendChatMessage({
    required int chatId,
    required String text,
    String type = 'text',
    String imageUrl = '',
    String quoteText = '',
    String quoteSender = '',
  }) async {
    try {
      final headers = {'Content-Type': 'application/json'};
      final token = authToken ?? adminToken;
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.post(
        Uri.parse('$baseUrl/chat/send.php'),
        headers: headers,
        body: jsonEncode({
          'chat_id': chatId,
          'sender_type': 'student',
          'message_type': type,
          'content': text,
          'image_url': imageUrl,
          'quote_text': quoteText,
          'quote_sender': quoteSender,
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error sending chat message: $e');
      return false;
    }
  }

  // إرسال تقييم من الطالب للتطبيق ولخدمة العملاء
  static Future<bool> submitReview({
    required String studentName,
    required String uni,
    required int rating,
    required String comment,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reviews.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': 'add',
          'student_name': studentName,
          'uni': uni,
          'rating': rating,
          'comment': comment,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error submitting review: $e');
      return false;
    }
  }

  // رفع ملف (صورة أو فيديو) إلى السيرفر
  static Future<String?> uploadFile(String filePath, String fileName, {List<int>? fileBytes}) async {
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload.php'));
      final authHeader = adminToken ?? authToken;
      if (authHeader != null && authHeader.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $authHeader';
      }
      if (kIsWeb || filePath.isEmpty) {
        if (fileBytes != null) {
          request.files.add(http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));
        } else {
          return null;
        }
      } else {
        request.files.add(await http.MultipartFile.fromPath('file', filePath, filename: fileName));
      }
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if ((data['status'] == 'success' || data['success'] == true) && (data['url'] != null || (data['data'] != null && data['data']['url'] != null))) {
          final rawUrl = (data['url'] ?? data['data']['url']).toString();
          final domain = baseUrl.replaceAll('/api', '');
          return rawUrl.startsWith('http') ? rawUrl : (rawUrl.startsWith('/') ? '$domain$rawUrl' : '$domain/$rawUrl');
        } else {
          debugPrint('uploadFile error response: ${response.body}');
        }
      } else {
        debugPrint('uploadFile failed statusCode ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      debugPrint('uploadFile exception: $e');
    }
    return null;
  }

  // المحفظة - جلب الرصيد والإشعارات
  static Future<Map<String, dynamic>> getWallet(int studentId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/wallet_api.php?action=get_wallet'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'student_id': studentId}),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error getting wallet: $e');
    }
    return {'status': 'error', 'points': 0, 'notifications': []};
  }

  // المحفظة - الدفع بالنقاط
  static Future<Map<String, dynamic>> payWithPoints(dynamic studentIdOrResult, [int amount = 0, String serviceTitle = '']) async {
    // Supports being called with just a Map result from submitServiceRequest
    final int studentId = studentIdOrResult is int ? studentIdOrResult : 0;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/wallet_api.php?action=pay_with_points'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'student_id': studentId,
          'amount': amount,
          'service_title': serviceTitle,
        }),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error paying with points: $e');
    }
    return {'status': 'error', 'message': LanguageService.tr('auto_trans_1386')};
  }

  // ─── Admin Auth ─────────────────────────────────────────────────────────────

  static Future<void> adminLogin(String identifier, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/admin/login.php'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'identifier': identifier, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final isSuccess = data['status'] == 'success' || data['success'] == true;
      final token = data['token'] ?? data['data']?['token'];
      if (isSuccess && token != null) {
        await saveAdminToken(token.toString());
        return;
      }
      throw Exception(data['message'] ?? 'Admin login failed');
    }
    throw Exception('Server error ${response.statusCode}');
  }

  static Future<void> adminLogout() async {
    await clearTokens();
  }

  static Map<String, String> get _adminHeaders => {
    'Content-Type': 'application/json',
    if (adminToken != null) 'Authorization': 'Bearer $adminToken',
  };

  // ─── Admin Dashboard ────────────────────────────────────────────────────────

  static Future<AdminDashboard?> getAdminDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin_api.php?action=get_dashboard_stats'),
        headers: _adminHeaders,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payload = data['data'] is Map ? (data['data'] as Map<String, dynamic>) : data;
        return AdminDashboard.fromJson(payload);
      }
    } catch (e) {
      debugPrint('getAdminDashboard error: $e');
    }
    return null;
  }

  // ─── Admin Apartments ───────────────────────────────────────────────────────

  static Future<List<Apartment>> getAdminApartments() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin_api.php?action=get_apartments'),
        headers: _adminHeaders,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payload = data['data'] is Map ? data['data'] : data;
        final list = payload['apartments'] ?? (payload is List ? payload : null);
        if (list != null) {
          return (list as List)
              .map((a) => Apartment.fromJson(a as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('getAdminApartments error: $e');
    }
    return [];
  }

  static Future<bool> createApartment(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin_api.php?action=add_apartment'),
        headers: _adminHeaders,
        body: jsonEncode(payload),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'success' || data['success'] == true;
      }
    } catch (e) {
      debugPrint('createApartment error: $e');
    }
    return false;
  }

  static Future<bool> updateApartment(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin_api.php?action=update_apartment'),
        headers: _adminHeaders,
        body: jsonEncode(payload),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'success' || data['success'] == true;
      }
    } catch (e) {
      debugPrint('updateApartment error: $e');
    }
    return false;
  }

  // ─── Admin Services ─────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getAdminServices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin_api.php?action=get_services'),
        headers: _adminHeaders,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payload = data['data'] is Map ? data['data'] : data;
        final list = payload['services'] ?? (payload is List ? payload : null);
        if (list != null) {
          return (list as List).cast<Map<String, dynamic>>();
        }
      }
    } catch (e) {
      debugPrint('getAdminServices error: $e');
    }
    return [];
  }

  static Future<bool> createService(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin_api.php?action=add_service'),
        headers: _adminHeaders,
        body: jsonEncode(payload),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'success' || data['success'] == true;
      }
    } catch (e) {
      debugPrint('createService error: $e');
    }
    return false;
  }

  static Future<bool> updateService(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin_api.php?action=update_service'),
        headers: _adminHeaders,
        body: jsonEncode(payload),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'success' || data['success'] == true;
      }
    } catch (e) {
      debugPrint('updateService error: $e');
    }
    return false;
  }

  // ─── Admin Students ─────────────────────────────────────────────────────────

  static Future<List<Student>> getAdminStudents({
    int page = 1,
    int limit = 20,
    String search = '',
  }) async {
    try {
      final uri = Uri.parse(
        '$baseUrl/admin_api.php?action=get_students&page=$page&limit=$limit&search=${Uri.encodeComponent(search)}',
      );
      final response = await http.get(uri, headers: _adminHeaders);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final payload = data['data'] is Map ? data['data'] : data;
        final list = payload['students'] ?? (payload is List ? payload : null);
        if (list != null) {
          return (list as List)
              .map((s) => Student.fromJson(s as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('getAdminStudents error: $e');
    }
    return [];
  }

  // ─── Admin Upload ───────────────────────────────────────────────────────────

  /// Upload an image file for admin use (apartments, services, etc.).
  /// Returns the raw server-relative path (e.g. "/uploads/apartments/file.jpg").
  /// Callers must NOT store the resolved full URL in the database —
  /// store the raw path and resolve it only at display time via [resolveImageUrl].
  static Future<String?> uploadImage(dynamic imageFile, String folder) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/upload/image.php?folder=$folder'),
      );
      final authHeader = adminToken ?? authToken;
      if (authHeader != null && authHeader.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $authHeader';
      }
      request.fields['folder'] = folder;
      if (imageFile is String) {
        request.files.add(await http.MultipartFile.fromPath('file', imageFile));
      } else {
        final bytes = await imageFile.readAsBytes();
        final name = imageFile.name ?? (imageFile.path as String).split('/').last;
        request.files.add(http.MultipartFile.fromBytes('file', bytes, filename: name));
      }
      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess = data['success'] == true || data['status'] == 'success';
        final rawUrl = data['url']?.toString() ?? data['data']?['url']?.toString();
        if (isSuccess && rawUrl != null && rawUrl.isNotEmpty) {
          // Return raw path — do NOT resolve to full URL here; DB must store raw paths.
          return rawUrl;
        } else {
          debugPrint('uploadImage error response: ${response.body}');
        }
      } else {
        debugPrint('uploadImage failed statusCode ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      debugPrint('uploadImage error: $e');
    }
    return null;
  }

  // ─── Admin Chat ─────────────────────────────────────────────────────────────

  /// Fetches all chats with embedded messages for admin management.
  static Future<List<Map<String, dynamic>>> getAdminChats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chat/admin_list.php?t=${DateTime.now().millisecondsSinceEpoch}'),
        headers: _adminHeaders,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final chats = data['chats'] ?? data['data']?['chats'];
        if (chats is List) {
          return chats.cast<Map<String, dynamic>>();
        }
      }
    } catch (e) {
      debugPrint('getAdminChats error: $e');
    }
    return [];
  }

  /// Sends an admin reply to a student chat.
  /// Uses the dedicated admin-only endpoint so sender is verified by JWT.
  static Future<bool> adminSendMessage({
    required int chatId,
    required String text,
    String type = 'text',
    String imageUrl = '',
    String quoteText = '',
    String quoteSender = '',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat/admin_reply.php'),
        headers: {
          'Content-Type': 'application/json',
          if (adminToken != null) 'Authorization': 'Bearer $adminToken',
        },
        body: jsonEncode({
          'chat_id': chatId,
          'content': text,
          'message_type': type,
          'image_url': imageUrl,
          'quote_text': quoteText,
          'quote_sender': quoteSender,
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('adminSendMessage error: $e');
      return false;
    }
  }

  // ─── Chat (new typed endpoints) ─────────────────────────────────────────────

  /// Creates a new chat session for [studentId] and returns the chat ID.
  /// Requires student JWT in Authorization header.
  static Future<int?> createChat(int studentId) async {
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (authToken != null && authToken!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final response = await http.post(
        Uri.parse('$baseUrl/chat/create.php'),
        headers: headers,
        body: jsonEncode({'student_id': studentId}),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if ((data['status'] == 'success' || data['success'] == true) && (data['chat_id'] != null || (data['data'] != null && data['data']['chat_id'] != null))) {
          final cid = data['chat_id'] ?? data['data']['chat_id'];
          return (cid as num).toInt();
        }
      }
    } catch (e) {
      debugPrint('createChat error: $e');
    }
    return null;
  }

  /// Fetches all messages for [chatId].
  /// Requires auth JWT (student or admin) in Authorization header.
  static Future<List<ChatMessage>> getMessages(int chatId) async {
    try {
      final token = authToken ?? adminToken;
      final headers = <String, String>{};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
      final response = await http.get(
        Uri.parse('$baseUrl/chat/messages.php?chat_id=$chatId&t=${DateTime.now().millisecondsSinceEpoch}'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['messages'] ?? (data['data'] is List ? data['data'] : null);
        if (list != null && list is List) {
          return list
              .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('getMessages error: $e');
    }
    return [];
  }
}

