import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'admin_login_screen.dart';
import 'admin_dashboard_screen.dart';
import 'admin_apartments_screen.dart';
import 'admin_services_screen.dart';
import 'admin_students_screen.dart';
import 'admin_chat_screen.dart';
import '../../theme/app_colors.dart';
import '../../services/language_service.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const AdminDashboardScreen(),
    const AdminApartmentsScreen(),
    const AdminServicesScreen(),
    const AdminStudentsScreen(),
    const AdminChatScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ApiService.adminToken == null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const AdminLoginScreen()),
        );
      }
    });
  }

  Future<void> _logout() async {
    await ApiService.adminLogout();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const AdminLoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (ApiService.adminToken == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(LanguageService.tr('admin_portal')),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Colors.grey,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.dashboard),
            label: LanguageService.tr('dashboard'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.apartment),
            label: LanguageService.tr('apartments'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.miscellaneous_services),
            label: LanguageService.tr('services'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.people),
            label: LanguageService.tr('students'),
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'Chats',
          ),
        ],
      ),
    );
  }
}
