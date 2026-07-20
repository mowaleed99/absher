import 'package:absher/services/language_service.dart';
// lib/services/web_helper_stub.dart
import 'package:flutter/material.dart';

Widget buildEmbedVideo(String embedUrl) {
  return Container(
    color: Colors.black87,
    child: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.video_library, color: Colors.white, size: 40),
          const SizedBox(height: 8),
          Text(
            LanguageService.tr('auto_trans_1387'),
            style: const TextStyle(color: Colors.white70, fontSize: 12, fontFamily: 'Cairo'),
          ),
        ],
      ),
    ),
  );
}
