// lib/services/web_helper_web.dart
import 'package:flutter/material.dart';
import 'dart:ui_web' as ui;
import 'dart:html' as html;

Widget buildEmbedVideo(String embedUrl) {
  final String viewType = 'iframe-${embedUrl.hashCode}';
  
  // تسجيل مصنع العرض لـ IFrameElement
  ui.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
    return html.IFrameElement()
      ..src = embedUrl
      ..style.border = 'none'
      ..style.width = '100%'
      ..style.height = '100%'
      ..setAttribute('allowfullscreen', 'true')
      ..allowFullscreen = true;
  });

  return HtmlElementView(viewType: viewType);
}
