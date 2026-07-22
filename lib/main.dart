import 'package:absher/services/language_service.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/app_colors.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
            return Directionality(
              textDirection: LanguageService.textDirection,
              child: child!,
            );
          },
          home: const SplashScreen(),
        );
      },
    );
  }
}
