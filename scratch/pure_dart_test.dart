import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;

final baseUrl = 'http://localhost:8000/api';
String? adminToken;

Future<void> adminLogin(String identifier, String password) async {
  final response = await http.post(
    Uri.parse('$baseUrl/admin/login.php'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'identifier': identifier, 'password': password}),
  );
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    adminToken = data['token'] ?? data['data']?['token'];
  } else {
    throw Exception('Login failed: ${response.body}');
  }
}

Future<String?> uploadImage(String imageFile, String folder) async {
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('$baseUrl/upload/image.php?folder=$folder'),
  );
  if (adminToken != null) {
    request.headers['Authorization'] = 'Bearer $adminToken';
  }
  request.fields['folder'] = folder;
  request.files.add(await http.MultipartFile.fromPath('file', imageFile));

  final streamed = await request.send();
  final response = await http.Response.fromStream(streamed);
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final isSuccess = data['success'] == true || data['status'] == 'success';
    final rawUrl = data['url']?.toString() ?? data['data']?['url']?.toString();
    if (isSuccess && rawUrl != null && rawUrl.isNotEmpty) {
      return rawUrl;
    }
  }
  return null;
}

Future<bool> createApartment(Map<String, dynamic> payload) async {
  final response = await http.post(
    Uri.parse('$baseUrl/admin_api.php?action=add_apartment'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $adminToken'
    },
    body: jsonEncode(payload),
  );
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['status'] == 'success' || data['success'] == true;
  }
  return false;
}

Future<bool> createService(Map<String, dynamic> payload) async {
  final response = await http.post(
    Uri.parse('$baseUrl/admin_api.php?action=add_service'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $adminToken'
    },
    body: jsonEncode(payload),
  );
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    if (data['status'] != 'success' && data['success'] != true) {
      print('Service error: ${data}');
    }
    return data['status'] == 'success' || data['success'] == true;
  } else {
    print('Service error response: ${response.statusCode} ${response.body}');
  }
  return false;
}

void main() async {
  print('Logging in as admin...');
  await adminLogin('admin', 'admin123'); // Adjust credentials if needed
  print('Logged in successfully. Token: $adminToken');

  final testImagePath = 'real_test_image.jpg';
  final testImageFile = File(testImagePath);

  try {
    print('\n--- Testing Apartment Upload with Image ---');
    final rawUrl = await uploadImage(testImagePath, 'apartments');
    print('Upload Image Response Path: $rawUrl');

    if (rawUrl != null && rawUrl.isNotEmpty) {
      final payload = {
        'title': 'Test Apartment ${DateTime.now().millisecondsSinceEpoch}',
        'price': '500 USD',
        'district_id': 18,
        'location': 'Detailed street or landmark',
        'proximity': 'Near Gate 1',
        'capacity': '1 Person',
        'move_in_type': 'Immediate',
        'move_in_date': 'Today',
        'description': 'A nice test apartment',
        'universities': ['Test Uni'],
        'features': ['AC'],
        'images': [rawUrl],
        'is_available': 1
      };
      print('Apartment Payload: ${jsonEncode(payload)}');
      final success = await createApartment(payload);
      print('Apartment Creation Success: $success');
    }

    print('\n--- Testing Service Upload with Image ---');
    final serviceRawUrl = await uploadImage(testImagePath, 'services');
    print('Upload Image Response Path: $serviceRawUrl');

    if (serviceRawUrl != null && serviceRawUrl.isNotEmpty) {
      final servicePayload = {
        'title': 'Test Service ${DateTime.now().millisecondsSinceEpoch}',
        'description': 'Test Service Description',
        'has_form': 1,
        'image_url': serviceRawUrl
      };
      print('Service Payload: ${jsonEncode(servicePayload)}');
      final success = await createService(servicePayload);
      print('Service Creation Success: $success');
    }

    print('\n--- Testing Upload Failure (Blocking Save) ---');
    final largeFile = File('large_test.jpg');
    await largeFile.writeAsString('Not an image file');
    final failedUrl = await uploadImage(largeFile.path, 'apartments');
    print('Upload Image Failed Result: $failedUrl');
    if (failedUrl == null || failedUrl.isEmpty) {
      print(
          'Upload correctly returned null/empty. The save operation would be blocked.');
    } else {
      print('Upload unexpectedly succeeded.');
    }
  } finally {
    final largeFile = File('large_test.jpg');
    if (await largeFile.exists()) {
      await largeFile.delete();
    }
  }

  print('\nDone.');
}
