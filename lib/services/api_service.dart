import 'package:absher/services/language_service.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
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
      final filename = path.split('/').last;
      return '$serverRoot/api/media.php?file=$filename';
    }
    // Remove leading slash if any
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return '$serverRoot/$cleanPath';
  }

  // تسجيل الدخول
  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': identifier, // البريد الإلكتروني أو رقم الهاتف
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'status': 'error', 'message': 'خطأ في الاتصال بالخادم (${response.statusCode})'};
      }
    } catch (e) {
      // وضع محاكاة (Fallback Simulation) للتجربة الفورية قبل تشغيل سيرفر الـ PHP
      await Future.delayed(const Duration(milliseconds: 800));
      if (identifier.isNotEmpty && password.isNotEmpty) {
        return {
          'status': 'success',
          'user': {
            'id': 1,
            'name': LanguageService.tr('auto_trans_1292'),
            'email': identifier,
            'uni': LanguageService.tr('auto_trans_1293'),
            'is_guest': false
          }
        };
      }
      return {'status': 'error', 'message': 'فشل الاتصال بالخادم: $e'};
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
  static Future<List<Map<String, dynamic>>> getApartments() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin_api.php?action=get_all&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['apartments'] != null) {
          return (data['apartments'] as List).map((apt) {
            final imagesList = (apt['images'] != null && apt['images'] is List)
                ? (apt['images'] as List).map((e) => e.toString()).toList()
                : ['assets/images/apt1.png'];
            final featuresList = (apt['features'] != null && apt['features'] is List)
                ? (apt['features'] as List).map((e) => e.toString()).toList()
                : [LanguageService.tr('auto_trans_1295')];
            final universitiesList = (apt['universities'] != null && apt['universities'] is List)
                ? (apt['universities'] as List).map((e) => e.toString()).toList()
                : [];

            return <String, dynamic>{
              'id': apt['id']?.toString() ?? '',
              'title': apt['title']?.toString() ?? LanguageService.tr('auto_trans_1296'),
              'price': apt['price']?.toString() ?? LanguageService.tr('auto_trans_1297'),
              'location': apt['location']?.toString() ?? LanguageService.tr('auto_trans_1298'),
              'proximity': apt['proximity']?.toString() ?? LanguageService.tr('auto_trans_1299'),
              'capacity': apt['capacity']?.toString() ?? LanguageService.tr('auto_trans_1300'),
              'rental_type': apt['rental_type']?.toString() ?? LanguageService.tr('auto_trans_1301'),
              'owner_phone': apt['owner_phone']?.toString() ?? '',
              'move_in_type': LanguageService.tr('auto_trans_1302'),
              'move_in_date': LanguageService.tr('auto_trans_1303'),
              'description': apt['description']?.toString() ?? '',
              'images': imagesList,
              'features': featuresList,
              'universities': universitiesList,
            };
          }).toList();
        }
      }
    } catch (e) {
      print('Error fetching apartments from backend: $e');
    }
    // الالتجاء للقيم الافتراضية في حال عدم اتصال الخادم
    return [
      {
        'id': '1',
        'title': LanguageService.tr('auto_trans_1304'),
        'price': LanguageService.tr('auto_trans_1305'),
        'location': LanguageService.tr('auto_trans_1306'),
        'proximity': LanguageService.tr('auto_trans_1307'),
        'capacity': LanguageService.tr('auto_trans_1308'),
        'rental_type': LanguageService.tr('auto_trans_1309'),
        'owner_phone': '+995555111222',
        'move_in_type': LanguageService.tr('auto_trans_1310'),
        'move_in_date': LanguageService.tr('auto_trans_1311'),
        'images': [
          'assets/images/apt1.png',
          'assets/images/apt2.png',
          'assets/images/apt3.png',
          'assets/images/apt4.png',
        ],
        'features': [LanguageService.tr('auto_trans_1312'), LanguageService.tr('auto_trans_1313'), LanguageService.tr('auto_trans_1314'), LanguageService.tr('auto_trans_1315'), LanguageService.tr('auto_trans_1316')],
        'universities': [LanguageService.tr('auto_trans_1317')],
        'description': LanguageService.tr('auto_trans_1318')
      },
      {
        'id': '2',
        'title': LanguageService.tr('auto_trans_1319'),
        'price': LanguageService.tr('auto_trans_1320'),
        'location': LanguageService.tr('auto_trans_1321'),
        'proximity': LanguageService.tr('auto_trans_1322'),
        'capacity': LanguageService.tr('auto_trans_1323'),
        'rental_type': LanguageService.tr('auto_trans_1324'),
        'owner_phone': '+995555333444',
        'move_in_type': LanguageService.tr('auto_trans_1325'),
        'move_in_date': LanguageService.tr('auto_trans_1326'),
        'images': [
          'assets/images/apt4.png',
          'assets/images/apt2.png',
          'assets/images/apt1.png',
        ],
        'features': [LanguageService.tr('auto_trans_1327'), LanguageService.tr('auto_trans_1328'), LanguageService.tr('auto_trans_1329'), LanguageService.tr('auto_trans_1330')],
        'description': LanguageService.tr('auto_trans_1331')
      },
      {
        'id': '3',
        'title': LanguageService.tr('auto_trans_1332'),
        'price': LanguageService.tr('auto_trans_1333'),
        'location': LanguageService.tr('auto_trans_1334'),
        'proximity': LanguageService.tr('auto_trans_1335'),
        'capacity': LanguageService.tr('auto_trans_1336'),
        'rental_type': LanguageService.tr('auto_trans_1337'),
        'owner_phone': '+995555888999',
        'move_in_type': LanguageService.tr('auto_trans_1338'),
        'move_in_date': LanguageService.tr('auto_trans_1339'),
        'images': [
          'assets/images/apt3.png',
          'assets/images/apt1.png',
          'assets/images/apt4.png',
          'assets/images/apt2.png',
        ],
        'features': [LanguageService.tr('auto_trans_1340'), LanguageService.tr('auto_trans_1341'), LanguageService.tr('auto_trans_1342'), LanguageService.tr('auto_trans_1343')],
        'universities': [LanguageService.tr('auto_trans_1344')],
        'description': LanguageService.tr('auto_trans_1345')
      },
    ];
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
      print('Error fetching universities from backend: $e');
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
      print('Error fetching districts from backend: $e');
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
      print('Error fetching news: $e');
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
      print('Error fetching notifications: $e');
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
  static Future<List<Map<String, dynamic>>> getServices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin_api.php?action=get_all&t=${DateTime.now().millisecondsSinceEpoch}'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' && data['services'] != null) {
          return (data['services'] as List).map((s) => <String, dynamic>{
            'title': s['title']?.toString() ?? LanguageService.tr('auto_trans_1373'),
            'desc': s['description']?.toString() ?? '',
            'img': resolveImageUrl(s['image_url']?.toString() ?? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80'),
            'has_form': s['has_form'] == 1 || s['has_form'] == true || s['has_form'] == '1',
          }).toList();
        }
      }
    } catch (e) {
      print('Error fetching services from backend: $e');
    }
    // محاكاة البيانات في حال عدم اتصال الخادم
    return [
      {'title': LanguageService.tr('auto_trans_1374'), 'desc': LanguageService.tr('auto_trans_1375'), 'img': 'assets/images/10_20260712_212013_0001.png', 'has_form': true},
      {'title': LanguageService.tr('auto_trans_1376'), 'desc': LanguageService.tr('auto_trans_1377'), 'img': 'assets/images/13_20260712_212014_0004.png', 'has_form': true},
      {'title': LanguageService.tr('auto_trans_1378'), 'desc': LanguageService.tr('auto_trans_1379'), 'img': 'assets/images/14_20260712_212014_0005.png', 'has_form': true},
      {'title': LanguageService.tr('auto_trans_1380'), 'desc': LanguageService.tr('auto_trans_1381'), 'img': 'assets/images/15_20260712_212014_0006.png', 'has_form': true},
      {'title': LanguageService.tr('auto_trans_1382'), 'desc': LanguageService.tr('auto_trans_1383'), 'img': 'assets/images/16_20260712_212014_0007.png', 'has_form': true},
    ];
  }

  // إرسال طلب خدمة أو حجز شقة أو تجميع شريك سكن
  static Future<Map<String, dynamic>> submitServiceRequest({
    required String studentName,
    required String studentPhone,
    required String studentUni,
    required String serviceTitle,
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
      print('Error submitting request: $e');
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
      print('Error fetching chat: $e');
    }
    return [];
  }

  // إرسال رسالة شات من الطالب إلى الدعم الفني
  static Future<bool> sendChatMessage({
    required String phone,
    required String studentName,
    required String studentUni,
    required String text,
    String type = 'text',
    String imageUrl = '',
    String quoteText = '',
    String quoteSender = '',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat.php'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': 'send',
          'phone': phone,
          'student_name': studentName,
          'student_uni': studentUni,
          'text': text,
          'type': type,
          'image_url': imageUrl,
          'quote_text': quoteText,
          'quote_sender': quoteSender,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error sending chat message: $e');
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
      print('Error submitting review: $e');
      return false;
    }
  }

  // رفع ملف (صورة أو فيديو) إلى السيرفر
  static Future<String?> uploadFile(String filePath, String fileName, {List<int>? fileBytes}) async {
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload.php'));
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
        if (data['status'] == 'success' && data['url'] != null) {
          final domain = baseUrl.replaceAll('/api', '');
          return '$domain/${data['url']}';
        }
      }
    } catch (e) {
      print('Error uploading file: $e');
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
      print('Error getting wallet: $e');
    }
    return {'status': 'error', 'points': 0, 'notifications': []};
  }

  // المحفظة - الدفع بالنقاط
  static Future<Map<String, dynamic>> payWithPoints(int studentId, int amount, String serviceTitle) async {
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
      print('Error paying with points: $e');
    }
    return {'status': 'error', 'message': LanguageService.tr('auto_trans_1386')};
  }
}
