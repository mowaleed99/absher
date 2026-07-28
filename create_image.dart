import 'dart:io';
import 'dart:convert';

void main() {
  final base64Image = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  final file = File('real_test_image.jpg');
  file.writeAsBytesSync(base64Decode(base64Image));
  print('Image created');
}
