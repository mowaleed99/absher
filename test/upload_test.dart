import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:absher/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Test Apartment and Service Upload and Creation', () async {
    // Override baseUrl to localhost for the test environment
    // Use the actual dev server root if testing via flutter test
    
    print('Logging in as admin...');
    await ApiService.adminLogin('admin', 'admin123'); // Adjust credentials if needed
    print('Logged in successfully. Token: ${ApiService.adminToken}');

    final testImagePath = 'test_image.jpg';
    final testImageFile = File(testImagePath);
    await testImageFile.writeAsBytes(List.generate(1024, (i) => i % 256));

    try {
      print('\n--- 1. Testing Apartment Upload with Image ---');
      final rawUrl = await ApiService.uploadImage(testImagePath, 'apartments');
      print('Upload Image Response Path: $rawUrl');
      
      expect(rawUrl, isNotNull);
      expect(rawUrl!.isNotEmpty, isTrue);

      final payload = {
        'title': 'Test Apartment ${DateTime.now().millisecondsSinceEpoch}',
        'price': '500 USD',
        'location': 'Test Location',
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
      print('Apartment Payload: $payload');
      final success = await ApiService.createApartment(payload);
      print('Apartment Creation Success: $success');
      expect(success, isTrue);

      print('\n--- 2. Testing Service Upload with Image ---');
      final serviceRawUrl = await ApiService.uploadImage(testImagePath, 'services');
      print('Upload Image Response Path: $serviceRawUrl');
      
      expect(serviceRawUrl, isNotNull);
      expect(serviceRawUrl!.isNotEmpty, isTrue);

      final servicePayload = {
        'title': 'Test Service ${DateTime.now().millisecondsSinceEpoch}',
        'description': 'Test Description',
        'price_points': 50,
        'has_form': 1,
        'image_url': serviceRawUrl
      };
      print('Service Payload: $servicePayload');
      final serviceSuccess = await ApiService.createService(servicePayload);
      print('Service Creation Success: $serviceSuccess');
      expect(serviceSuccess, isTrue);

      print('\n--- 3. Testing Upload Failure (Blocking Save) ---');
      final largeFile = File('large_test.jpg');
      await largeFile.writeAsString('Not an image file');
      final failedUrl = await ApiService.uploadImage(largeFile.path, 'apartments');
      print('Upload Image Failed Result: $failedUrl');
      expect(failedUrl, isNull);
    } finally {
      if (await testImageFile.exists()) {
        await testImageFile.delete();
      }
      final largeFile = File('large_test.jpg');
      if (await largeFile.exists()) {
        await largeFile.delete();
      }
    }
  });
}
