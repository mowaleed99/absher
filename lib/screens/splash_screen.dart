import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'home_screen.dart';
import '../services/language_service.dart';
import '../services/api_service.dart';
import '../models/student.dart';
import 'admin/admin_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    Timer(const Duration(seconds: 3), _navigateToHome);
  }

  Future<void> _navigateToHome() async {
    await ApiService.initTokens();
    if (!mounted) return;

    if (ApiService.adminToken != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AdminShell()),
      );
      return;
    }

    if (ApiService.authToken != null) {
      Student? user = await ApiService.getCurrentUser();
      if (!mounted) return;
      if (user != null) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => HomeScreen(
              user: user,
              isGuest: false,
            ),
          ),
        );
        return;
      }
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const HomeScreen(
          user: null,
          isGuest: true,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primaryDark,
              AppColors.primary,
              Color(0xFF081B28),
            ],
          ),
        ),
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                // اللوجو الرسمي المرفق
                Container(
                  width: 160,
                  height: 160,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryDark,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.accent, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withValues(alpha: 0.3),
                        blurRadius: 35,
                        spreadRadius: 8,
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Center(
                        child: Text(
                          LanguageService.tr('app_title').split(' ')[0],
                          style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w900, color: AppColors.accent),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'ABSHER',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppColors.accent,
                    letterSpacing: 6,
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    LanguageService.tr('splash_subtitle'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.w500),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.accent.withValues(alpha: 0.5)),
                  ),
                  child: const Text('@absher_georgia', style: TextStyle(color: AppColors.accentLight, fontSize: 14)),
                ),
                const Spacer(),
                const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent)),
                const SizedBox(height: 20),
                TextButton(
                  onPressed: _navigateToHome,
                  child: Text(LanguageService.tr('skip_to_start'), style: const TextStyle(color: Colors.white70, fontSize: 16)),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
