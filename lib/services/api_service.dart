import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/student.dart';
import '../models/chat_message.dart';
import 'language_service.dart';
import '../models/housing_offer.dart';
import '../models/student_request.dart';
import '../models/wallet_transaction.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  static const _keyAuthToken = 'auth_token';

  // Token state (populated by initTokens)
  static String? authToken;

  /// Must be called at startup to restore persisted tokens.
  static Future<void> initTokens() async {
    authToken = await _storage.read(key: _keyAuthToken);
  }

  /// Persist student auth token after login.
  static Future<void> saveAuthToken(String token) async {
    authToken = token;
    await _storage.write(key: _keyAuthToken, value: token);
  }

  /// Clear all tokens on logout.
  static Future<void> clearTokens() async {
    authToken = null;
    await _storage.delete(key: _keyAuthToken);
  }

  /// Fetch the currently logged-in student using the stored auth token.
  /// Response format: {"success":true,"data":{"student":{...}}}
  static Future<Student?> getCurrentUser() async {
    if (authToken == null) return null;
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/profile/get.php'),
        headers: {'Authorization': 'Bearer $authToken'},
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final isSuccess =
            data['success'] == true || data['status'] == 'success';
        final student = data['data']?['student'] ?? data['student'];
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
  static const String prodUrl = 'http://80.241.218.23/api';

  // تحديد العنوان ديناميكياً لتسهيل التطوير والافتبار المحلي
  static String get baseUrl {
    return prodUrl;
  }

  static String get serverRoot => baseUrl.replaceAll('/api', '');

  /// Returns the current language code for API requests ('ar' or 'en').
  static String get _langParam =>
      LanguageService.currentLang.value == 'en' ? 'en' : 'ar';

  static String resolveImageUrl(String path) {
    if (path.isEmpty) return 'assets/images/apt1.png';
    if (path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('data:image/')) {
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
  static Future<Map<String, dynamic>> login(
      String identifier, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': identifier,
          'password': password,
        }),
      );

      Map<String, dynamic> data = {};
      try {
        if (response.body.isNotEmpty) {
          final decoded = jsonDecode(response.body);
          if (decoded is Map<String, dynamic>) {
            data = decoded;
          }
        }
      } catch (e) {
        debugPrint('Error parsing login response JSON: $e');
      }

      final isSuccess = response.statusCode == 200 &&
          (data['success'] == true || data['status'] == 'success');

      if (isSuccess) {
        final token = data['data']?['token'] ?? data['token'];
        if (token != null) {
          await saveAuthToken(token.toString());
        }
        return data;
      } else {
        final serverMsg = data['message'] ?? data['error'];
        final String errorMessage =
            (serverMsg != null && serverMsg.toString().isNotEmpty)
                ? serverMsg.toString()
                : 'خطأ في الاتصال بالخادم (${response.statusCode})';
        return {
          'success': false,
          'message': errorMessage,
        };
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
    String? nationality,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/register.php'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'full_name': fullName,
              'email': email,
              'phone': phone,
              'university': university,
              'password': password,
              'nationality': nationality,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final isSuccess =
          response.statusCode == 200 || response.statusCode == 201;

      if (isSuccess && data['success'] == true) {
        final token = data['data']?['token'];
        if (token != null) {
          await saveAuthToken(token.toString());
        }
        final student = data['data']?['student'] ?? {};
        return {
          'status': 'success',
          'message': data['message'] ?? 'تم إنشاء الحساب بنجاح',
          'user': {
            'id': student['id'],
            'name': student['full_name'],
            'email': student['email'],
            'phone': student['phone'],
            'uni': student['university'],
            'is_guest': false
          }
        };
      } else {
        return {
          'status': 'error',
          'message':
              data['message'] ?? 'خطأ في إنشاء الحساب (${response.statusCode})'
        };
      }
    } catch (e) {
      debugPrint('register error: $e');
      return {'status': 'error', 'message': 'فشل الاتصال بالخادم: $e'};
    }
  }

  // جلب كافة الشقق السكنية المتاحة (مع دعم الفلترة من الخادم)
  // Calls /apartments/list.php — public endpoint, returns is_available=1 only
  // Response: {"success":true,"data":{"apartments":[...]}}
  static Future<List<Map<String, dynamic>>> getApartments({
    String? rentalType, // 'apartment' | 'room_shared' | 'studio' | null = all
    int? roomsCount, // exact bedroom count | null = all
    int? districtId, // district FK | null = all
  }) async {
    try {
      final params = <String, String>{
        't': DateTime.now().millisecondsSinceEpoch.toString(),
        'lang': _langParam,
      };
      if (rentalType != null && rentalType.isNotEmpty) {
        params['rental_type'] = rentalType;
      }
      if (roomsCount != null && roomsCount > 0) {
        params['rooms_count'] = roomsCount.toString();
      }
      if (districtId != null && districtId > 0) {
        params['district_id'] = districtId.toString();
      }

      final uri = Uri.parse('$baseUrl/apartments/list.php')
          .replace(queryParameters: params);
      final response = await http.get(uri);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess =
            data['success'] == true || data['status'] == 'success';
        final payload =
            data['data'] is Map ? data['data'] as Map<String, dynamic> : data;
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
              'district_id': a['district_id'] is int
                  ? a['district_id'] as int
                  : (int.tryParse(a['district_id']?.toString() ?? '')),
              'proximity': a['proximity']?.toString() ?? '',
              'capacity': a['capacity']?.toString() ?? '',
              'rental_type': a['rental_type']?.toString() ?? '',
              'rooms_count': a['rooms_count'] is int
                  ? a['rooms_count'] as int
                  : (int.tryParse(a['rooms_count']?.toString() ?? '')),
              'move_in_type': a['move_in_type']?.toString() ?? '',
              'move_in_date': a['move_in_date']?.toString() ?? '',
              'description': a['description']?.toString() ?? '',
              'is_available':
                  a['is_available'] == true || a['is_available'] == 1,
              'is_featured': a['is_featured'] == true ||
                  a['is_featured'] == 1 ||
                  a['is_featured'] == '1',
              'featured_until': a['featured_until']?.toString(),
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

  static Future<List<HousingOffer>?> getHousingOffers() async {
    final String url =
        '$baseUrl/offers/list.php?lang=$_langParam&t=${DateTime.now().millisecondsSinceEpoch}';
    try {
      final response =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final isSuccess =
            data['status'] == 'success' || data['success'] == true;

        List? rawList;
        if (data['data'] is Map && data['data']['offers'] is List) {
          rawList = data['data']['offers'] as List;
        } else if (data['data'] is List) {
          rawList = data['data'] as List;
        } else if (data['offers'] is List) {
          rawList = data['offers'] as List;
        }

        if (isSuccess && rawList != null) {
          return rawList
              .map(
                  (item) => HousingOffer.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching housing offers at $url: $e');
      return null;
    }
  }

  // جلب كافة الجامعات
  static Future<List<Map<String, dynamic>>> getUniversities() async {
    try {
      final response = await http.get(
        Uri.parse(
            '$baseUrl/wallet_api.php?action=get_universities&lang=$_langParam&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['universities'] != null) {
          return (data['universities'] as List)
              .map((u) => <String, dynamic>{
                    'id': u['id']?.toString() ?? '',
                    'name': u['name']?.toString() ?? '',
                  })
              .toList();
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
        Uri.parse(
            '$baseUrl/wallet_api.php?action=get_districts&lang=$_langParam&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['districts'] != null) {
          return (data['districts'] as List)
              .map((d) => <String, dynamic>{
                    'id': d['id']?.toString() ?? '',
                    'name': d['name']?.toString() ?? '',
                  })
              .toList();
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
        Uri.parse(
            '$baseUrl/student_requests.php?action=get_news&lang=$_langParam&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['news'] != null) {
          return (data['news'] as List)
              .map((n) => <String, dynamic>{
                    'id': n['id']?.toString() ?? '',
                    'title': n['title']?.toString() ?? '',
                    'content': n['content']?.toString() ?? '',
                    'image_url':
                        resolveImageUrl(n['image_url']?.toString() ?? ''),
                    'date': n['date']?.toString() ??
                        n['created_at']?.toString() ??
                        LanguageService.tr('auto_trans_1356'),
                  })
              .toList();
        }
      }
    } catch (e) {
      // error fetching news
    }
    // إرجاع قائمة فارغة بدلاً من بيانات وهمية في حال فشل الاتصال
    return [];
  }

  // جلب التنبيهات والإشعارات الفعالة (خلال آخر 24 ساعة)
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final Map<String, String> headers = {};
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final response = await http.get(
        Uri.parse(
            '$baseUrl/student_requests.php?action=get_notifications&t=${DateTime.now().millisecondsSinceEpoch}'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['notifications'] != null) {
          return (data['notifications'] as List)
              .map((n) => <String, dynamic>{
                    'id': n['id']?.toString() ?? '',
                    'title': n['title']?.toString() ?? '',
                    'content': n['content']?.toString() ?? '',
                    'date': n['date']?.toString() ??
                        n['created_at']?.toString() ??
                        LanguageService.tr('auto_trans_1366'),
                  })
              .toList();
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

  static String generateUuidV4() {
    final random = Random.secure();
    final values = List<int>.generate(16, (i) => random.nextInt(256));
    values[6] = (values[6] & 0x0f) | 0x40; // version 4
    values[8] = (values[8] & 0x3f) | 0x80; // variant RFC 4122
    final buffer = StringBuffer();
    for (var i = 0; i < 16; i++) {
      if (i == 4 || i == 6 || i == 8 || i == 10) buffer.write('-');
      buffer.write(values[i].toRadixString(16).padLeft(2, '0'));
    }
    return buffer.toString();
  }

  // جلب قائمة الخدمات الطلابية
  // Calls /services/list.php — public endpoint
  // Response: {"success":true,"data":{"services":[...]}}
  static Future<List<Map<String, dynamic>>> getServices() async {
    try {
      final response = await http.get(
        Uri.parse(
            '$baseUrl/services/list.php?lang=$_langParam&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess =
            data['success'] == true || data['status'] == 'success';
        final payload =
            data['data'] is Map ? data['data'] as Map<String, dynamic> : data;
        final list = payload['services'];
        if (isSuccess && list is List) {
          return list.map((s) {
            final svc = s as Map<String, dynamic>;
            return <String, dynamic>{
              'id': svc['id']?.toString() ?? '',
              'title': svc['title']?.toString() ?? '',
              'desc': svc['description']?.toString() ?? '',
              'img': resolveImageUrl(svc['image_url']?.toString() ?? ''),
              'has_form': svc['has_form'] == true ||
                  svc['has_form'] == 1 ||
                  svc['has_form'] == '1',
              'price_points': (() {
                final raw = svc['price_points'];
                final svcId = svc['id']?.toString() ?? 'unknown';
                if (raw == null) {
                  throw FormatException(
                      'Missing price_points field for service ID: $svcId');
                }
                if (raw is int) return raw;
                if (raw is num) return raw.toInt();
                if (raw is String) {
                  final parsed = int.tryParse(raw);
                  if (parsed == null) {
                    throw FormatException(
                        'Malformed price_points value: "$raw" for service ID: $svcId');
                  }
                  return parsed;
                }
                throw FormatException(
                    'Unexpected price_points type: ${raw.runtimeType} for service ID: $svcId');
              })(),
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

  static Future<Map<String, dynamic>> validatePromoCode({
    required String code,
    required int serviceId,
    String paymentMethod = 'wallet',
  }) async {
    try {
      final headers = {'Content-Type': 'application/json'};
      if (authToken != null && authToken!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final response = await http
          .post(
            Uri.parse('$baseUrl/services/validate_promo.php'),
            headers: headers,
            body: jsonEncode({
              'code': code.trim().toUpperCase(),
              'service_id': serviceId,
              'payment_method': paymentMethod,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final Map<String, dynamic> data = jsonDecode(response.body);
      return data;
    } catch (e) {
      debugPrint('Error validating promo code: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> submitServiceRequest({
    int? serviceId,
    String studentName = '',
    String studentPhone = '',
    String studentUni = '',
    int? universityId,
    String serviceTitle = '',
    required String details,
    bool payWithPoints = false,
    String paymentMethod = 'free',
    String? promoCode,
    String? requestUuid,
  }) async {
    try {
      final finalUuid = (requestUuid == null || requestUuid.isEmpty)
          ? generateUuidV4()
          : requestUuid;
      // Always attach Authorization header so the backend can resolve student_id from JWT
      final headers = {'Content-Type': 'application/json'};
      if (authToken != null && authToken!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final bodyMap = <String, dynamic>{
        'action': 'submit',
        'service_id': serviceId,
        'student_name': studentName,
        'student_phone': studentPhone,
        'student_uni': studentUni,
        'university_id': universityId,
        'service_title': serviceTitle,
        'details': details,
        'pay_with_points': payWithPoints,
        'payment_method': paymentMethod,
        'request_uuid': finalUuid,
      };
      if (promoCode != null &&
          promoCode.trim().isNotEmpty &&
          paymentMethod == 'wallet') {
        bodyMap['promo_code'] = promoCode.trim().toUpperCase();
      }
      final response = await http.post(
        Uri.parse('$baseUrl/student_requests.php'),
        headers: headers,
        body: jsonEncode(bodyMap),
      );
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        if (data['status'] == 'error') {
          throw Exception(
              data['message'] ?? 'حدث خطأ أثناء معالجة الطلب في الخادم');
        }
        return data;
      } else {
        throw Exception(
            'فشل الاتصال بالخادم: رمز الاستجابة ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error submitting request: $e');
      rethrow;
    }
  }

  // جلب محادثات الطالب من الخادم
  static Future<List<Map<String, dynamic>>> getStudentChat(String phone) async {
    try {
      final response = await http.get(
        Uri.parse(
            '$baseUrl/chat.php?action=get&phone=${Uri.encodeComponent(phone)}&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['messages'] != null) {
          return (data['messages'] as List)
              .map((m) => <String, dynamic>{
                    'sender': m['sender']?.toString() ?? 'student',
                    'text': m['text']?.toString() ?? '',
                    'type': m['type']?.toString() ?? 'text',
                    'imageUrl': m['imageUrl']?.toString() ??
                        m['image_url']?.toString() ??
                        '',
                    'quoteText': m['quoteText']?.toString() ??
                        m['quote_text']?.toString() ??
                        '',
                    'quoteSender': m['quoteSender']?.toString() ??
                        m['quote_sender']?.toString() ??
                        '',
                    'time': m['time']?.toString() ??
                        LanguageService.tr('auto_trans_1385'),
                  })
              .toList();
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
      final token = authToken;
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

  // ─── Student Requests ──────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getMyServiceRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student_requests.php?action=list'),
        headers: {
          'Authorization': 'Bearer $authToken',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['data']?['requests'] ?? data['requests'];
        if (list is List) {
          return list.cast<Map<String, dynamic>>();
        }
      }
      throw Exception(
          jsonDecode(response.body)['message'] ?? 'Failed to load requests');
    } catch (e) {
      debugPrint('getMyServiceRequests error: $e');
      rethrow;
    }
  }

  static Future<List<StudentRequest>> getMyStudentRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/student_requests.php?action=list'),
        headers: {
          'Authorization': 'Bearer $authToken',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['data']?['requests'] ?? data['requests'];
        if (list is List) {
          return list
              .map((item) =>
                  StudentRequest.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }
      }
      throw Exception(
          jsonDecode(response.body)?['message'] ?? 'Failed to load requests');
    } catch (e) {
      debugPrint('getMyStudentRequests error: $e');
      rethrow;
    }
  }

  // ─── Service Reviews (Track 5 System A) ───────────────────────────────────

  static Future<Map<String, dynamic>> createServiceReview({
    required int rating,
    required String comment,
    required int serviceRequestId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reviews/create.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'rating': rating,
          'comment': comment,
          'service_request_id': serviceRequestId,
        }),
      );
      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 201 || response.statusCode == 200,
        'message': data['message'] ?? 'Successfully submitted review',
        'data': data['data'] ?? data,
      };
    } catch (e) {
      debugPrint('createServiceReview error: $e');
      return {
        'success': false,
        'message': LanguageService.tr('auto_trans_1386')
      };
    }
  }

  static Future<List<Map<String, dynamic>>> getMyServiceReviews() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/reviews/my.php'),
        headers: {
          'Authorization': 'Bearer $authToken',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['data'] ?? data;
        if (list is List) {
          return list.cast<Map<String, dynamic>>();
        }
      }
      throw Exception(
          jsonDecode(response.body)['message'] ?? 'Failed to load reviews');
    } catch (e) {
      debugPrint('getMyServiceReviews error: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> updateServiceReview({
    required int id,
    required int rating,
    required String comment,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reviews/update.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'id': id,
          'rating': rating,
          'comment': comment,
        }),
      );
      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 200,
        'message': data['message'] ?? 'Successfully updated review',
      };
    } catch (e) {
      debugPrint('updateServiceReview error: $e');
      return {
        'success': false,
        'message': LanguageService.tr('auto_trans_1386')
      };
    }
  }

  static Future<Map<String, dynamic>> deleteServiceReview({
    required int id,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reviews/delete.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'id': id,
        }),
      );
      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 200,
        'message': data['message'] ?? 'Successfully deleted review',
      };
    } catch (e) {
      debugPrint('deleteServiceReview error: $e');
      return {
        'success': false,
        'message': LanguageService.tr('auto_trans_1386')
      };
    }
  }

  // ─── Application Feedback (Track 5 System B) ───────────────────────────────

  static Future<Map<String, dynamic>> submitFeedback({
    required String feedbackType,
    required String comment,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/feedback/create.php'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'feedback_type': feedbackType,
          'comment': comment,
        }),
      );
      final data = jsonDecode(response.body);
      return {
        'success': response.statusCode == 201 || response.statusCode == 200,
        'message': data['message'] ?? 'Successfully submitted feedback',
      };
    } catch (e) {
      debugPrint('submitFeedback error: $e');
      return {
        'success': false,
        'message': LanguageService.tr('auto_trans_1386')
      };
    }
  }

  static Future<List<Map<String, dynamic>>> getMyFeedback() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/feedback/my.php'),
        headers: {
          'Authorization': 'Bearer $authToken',
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['data'] ?? data;
        if (list is List) {
          return list.cast<Map<String, dynamic>>();
        }
      }
      throw Exception(
          jsonDecode(response.body)['message'] ?? 'Failed to load feedback');
    } catch (e) {
      debugPrint('getMyFeedback error: $e');
      rethrow;
    }
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

  /// Fetch the student's transaction history from the `wallet_transactions` table.
  static Future<List<WalletTransaction>> getWalletTransactions() async {
    if (authToken == null) throw Exception('Not authenticated');
    final response = await http.get(
      Uri.parse('$baseUrl/wallet/history.php'),
      headers: {'Authorization': 'Bearer $authToken'},
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final isSuccess = data['success'] == true || data['status'] == 'success';
      final txList = data['data'];
      if (isSuccess && txList is List) {
        return txList
            .map((json) =>
                WalletTransaction.fromJson(json as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception(data['message'] ?? 'Failed to load transactions');
      }
    } else {
      throw Exception('Server returned status code ${response.statusCode}');
    }
  }

  // المحفظة - الدفع بالنقاط
  // studentIdOrResult can be:
  //   - an int (direct student ID)
  //   - a Map from submitServiceRequest (student_id is resolved server-side via JWT)
  static Future<Map<String, dynamic>> payWithPoints(dynamic studentIdOrResult,
      [int amount = 0, String serviceTitle = '']) async {
    // Extract student_id: prefer Map['student_id'], then int cast, then JWT-resolved (send 0 and let server resolve)
    int studentId = 0;
    if (studentIdOrResult is int) {
      studentId = studentIdOrResult;
    } else if (studentIdOrResult is Map) {
      studentId = (studentIdOrResult['student_id'] as num?)?.toInt() ?? 0;
    }

    try {
      // Always include Authorization so backend resolves from JWT when studentId is still 0
      final headers = {'Content-Type': 'application/json'};
      if (authToken != null && authToken!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final response = await http.post(
        Uri.parse('$baseUrl/wallet_api.php?action=pay_with_points'),
        headers: headers,
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
    return {
      'status': 'error',
      'message': LanguageService.tr('auto_trans_1386')
    };
  }

  // ─── Upload ───────────────────────────────────────────────────────────────

  /// Upload an image file for student use (requests, chat, etc.).
  /// Returns the raw server-relative path (e.g. "/uploads/chat/file.jpg").
  static Future<String?> uploadImage(dynamic imageFile, String folder) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/upload/image.php?folder=$folder'),
      );
      if (authToken != null && authToken!.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $authToken';
      }
      request.fields['folder'] = folder;
      if (imageFile is String) {
        request.files.add(await http.MultipartFile.fromPath('file', imageFile));
      } else {
        final bytes = await imageFile.readAsBytes();
        final name =
            imageFile.name ?? (imageFile.path as String).split('/').last;
        request.files
            .add(http.MultipartFile.fromBytes('file', bytes, filename: name));
      }
      final streamed = await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamed).timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final isSuccess =
            data['success'] == true || data['status'] == 'success';
        final rawUrl =
            data['url']?.toString() ?? data['data']?['url']?.toString();
        if (isSuccess && rawUrl != null && rawUrl.isNotEmpty) {
          return rawUrl;
        } else {
          debugPrint('uploadImage error response: ${response.body}');
        }
      } else {
        debugPrint(
            'uploadImage failed statusCode ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      debugPrint('uploadImage error: $e');
    }
    return null;
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
        if ((data['status'] == 'success' || data['success'] == true) &&
            (data['chat_id'] != null ||
                (data['data'] != null && data['data']['chat_id'] != null))) {
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
  /// Requires auth JWT in Authorization header.
  static Future<List<ChatMessage>> getMessages(int chatId) async {
    try {
      final headers = <String, String>{};
      if (authToken != null && authToken!.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final response = await http.get(
        Uri.parse(
            '$baseUrl/chat/messages.php?chat_id=$chatId&t=${DateTime.now().millisecondsSinceEpoch}'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list =
            data['messages'] ?? (data['data'] is List ? data['data'] : null);
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

  // ─── Profile Overhaul REST APIs ─────────────────────────────────────────────

  static Future<Map<String, dynamic>> updateProfile({
    required String fullName,
    required String email,
    required String phone,
    required String university,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/profile/update.php'),
            headers: {
              'Content-Type': 'application/json',
              if (authToken != null) 'Authorization': 'Bearer $authToken',
            },
            body: jsonEncode({
              'full_name': fullName,
              'email': email,
              'phone': phone,
              'university': university,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم تحديث الحساب بنجاح',
          'student': Student.fromJson(
              data['data']?['student'] ?? data['student'] ?? {}),
        };
      } else {
        return {
          'success': false,
          'message':
              data['message'] ?? 'خطأ في تحديث الحساب (${response.statusCode})',
        };
      }
    } catch (e) {
      debugPrint('updateProfile error: $e');
      return {
        'success': false,
        'message': 'فشل الاتصال بالخادم: $e',
      };
    }
  }

  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/profile/change_password.php'),
            headers: {
              'Content-Type': 'application/json',
              if (authToken != null) 'Authorization': 'Bearer $authToken',
            },
            body: jsonEncode({
              'current_password': currentPassword,
              'new_password': newPassword,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم تغيير كلمة المرور بنجاح',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ??
              'خطأ في تغيير كلمة المرور (${response.statusCode})',
        };
      }
    } catch (e) {
      debugPrint('changePassword error: $e');
      return {
        'success': false,
        'message': 'فشل الاتصال بالخادم: $e',
      };
    }
  }

  static Future<Map<String, dynamic>> uploadAvatar(dynamic imageFile) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/profile/upload_avatar.php'),
      );
      if (authToken != null && authToken!.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $authToken';
      }

      if (imageFile is String) {
        request.files
            .add(await http.MultipartFile.fromPath('image', imageFile));
      } else {
        final bytes = await imageFile.readAsBytes();
        final name =
            imageFile.name ?? (imageFile.path as String).split('/').last;
        request.files
            .add(http.MultipartFile.fromBytes('image', bytes, filename: name));
      }

      final streamed =
          await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamed);
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        final rawUrl = data['avatar_url'] ?? data['data']?['avatar_url'];
        return {
          'success': true,
          'avatar_url': rawUrl,
          'message': data['message'] ?? 'تم رفع الصورة الشخصية بنجاح',
        };
      } else {
        return {
          'success': false,
          'message':
              data['message'] ?? 'فشل رفع الصورة (${response.statusCode})',
        };
      }
    } catch (e) {
      debugPrint('uploadAvatar error: $e');
      return {
        'success': false,
        'message': 'فشل الاتصال بالخادم: $e',
      };
    }
  }
}
