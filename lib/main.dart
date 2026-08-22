import 'package:absher/services/language_service.dart';
import 'package:absher/services/realtime_sync_service.dart';
import 'package:absher/services/api_service.dart';
import 'package:absher/services/push_notification_service.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/app_colors.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LanguageService.initLanguage();
  await ApiService.initTokens();
  await PushNotificationService.initialize();
  if (ApiService.authToken != null) {
    PushNotificationService.syncTokenWithBackend();
  }
  RealtimeSyncService().init();
  runApp(const AbsherApp());
}

class AbsherApp extends StatelessWidget {
  const AbsherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLang,
      builder: (context, lang, child) {
        return MaterialApp(
          navigatorKey: PushNotificationService.navigatorKey,
          title: LanguageService.tr('auto_trans_1000'),
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            primaryColor: AppColors.primary,
            scaffoldBackgroundColor: AppColors.background,
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppColors.primary,
              primary: AppColors.primary,
              secondary: AppColors.accent,
            ),
            // Use Google Fonts Cairo — supports Arabic glyphs correctly
            textTheme: GoogleFonts.cairoTextTheme(),
            useMaterial3: true,
          ),
          builder: (context, child) {
            final mediaQuery = MediaQuery.of(context);
            final clampedTextScale = mediaQuery.textScaler.clamp(
              minScaleFactor: 0.85,
              maxScaleFactor: 1.25,
            );
            return MediaQuery(
              data: mediaQuery.copyWith(
                textScaler: clampedTextScale,
              ),
              child: Directionality(
                textDirection: LanguageService.textDirection,
                child: child!,
              ),
            );
          },
          home: const SplashScreen(),
        );
      },
    );
  }
}
