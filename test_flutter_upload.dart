import 'dart:io';
import 'package:flutter/widgets.dart';
import 'package:absher/services/api_service.dart';
import 'package:http/http.dart' as http;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set up API Service for localhost/tests
  // Login first to get admin token
  print('Logging in as admin...');
  try {
    await ApiService.adminLogin('admin', 'admin123'); // Adjust credentials if needed
    print('Logged in successfully. Token: ${ApiService.adminToken}');
  } catch (e) {
    print('Admin login failed. Adjust credentials or ensure server is running.');
    return;
  }

  // 1. Create a dummy image file
  final testImagePath = 'test_image.jpg';
  final testImageFile = File(testImagePath);
  await testImageFile.writeAsBytes(List.generate(1024, (i) => i % 256));

  try {
    print('\n--- 1. Testing Apartment Upload with Image ---');
    final rawUrl = await ApiService.uploadImage(testImagePath, 'apartments');
    print('Upload Image Response Path: $rawUrl');
    
    if (rawUrl != null && rawUrl.isNotEmpty) {
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
        'images': [rawUrl], // Array with raw URL string
        'is_available': 1
      };
      print('Apartment Payload: $payload');
      final success = await ApiService.createApartment(payload);
      print('Apartment Creation Success: $success');
    }

    print('\n--- 2. Testing Service Upload with Image ---');
    final serviceRawUrl = await ApiService.uploadImage(testImagePath, 'services');
    print('Upload Image Response Path: $serviceRawUrl');
    
    if (serviceRawUrl != null && serviceRawUrl.isNotEmpty) {
      final servicePayload = {
        'title': 'Test Service ${DateTime.now().millisecondsSinceEpoch}',
        'description': 'Test Description',
        'price_points': 50,
        'has_form': 1,
        'image_url': serviceRawUrl
      };
      print('Service Payload: $servicePayload');
      final success = await ApiService.createService(servicePayload);
      print('Service Creation Success: $success');
    }

    print('\n--- 3. Testing Upload Failure (Blocking Save) ---');
    // We will test if uploadImage throws or returns null on failure
    print('Attempting to upload a large file to trigger failure...');
    final largeFile = File('large_test.jpg');
    // Note: just simulate by sending non-image content or something
    await largeFile.writeAsString('Not an image file');
    final failedUrl = await ApiService.uploadImage(largeFile.path, 'apartments');
    print('Upload Image Failed Result: $failedUrl');
    if (failedUrl == null || failedUrl.isEmpty) {
      print('Upload correctly returned null/empty. The save operation would be blocked.');
    } else {
      print('Upload unexpectedly succeeded.');
    }

  } finally {
    if (await testImageFile.exists()) {
      await testImageFile.delete();
    }
    final largeFile = File('large_test.jpg');
    if (await largeFile.exists()) {
      await largeFile.delete();
    }
  }

  print('\nDone.');
  exit(0);
}
