import 'package:flutter/material.dart';
import '../../models/admin_dashboard.dart';
import '../../services/api_service.dart';
import '../../services/language_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  AdminDashboard? _dashboard;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _isLoading = true);
    try {
      final dashboard = await ApiService.getAdminDashboard();
      if (mounted) {
        setState(() {
          _dashboard = dashboard;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${LanguageService.tr('failed_load_dashboard')}: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_dashboard == null) {
      return Center(
        child: ElevatedButton(
          onPressed: _loadDashboard,
          child: Text(LanguageService.tr('retry')),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStatCard(LanguageService.tr('active_students'), _dashboard!.activeStudents.toString(), Icons.people, Colors.blue),
          const SizedBox(height: 16),
          _buildStatCard(LanguageService.tr('active_apartments'), _dashboard!.activeApartments.toString(), Icons.apartment, Colors.orange),
          const SizedBox(height: 16),
          _buildStatCard(LanguageService.tr('active_services'), _dashboard!.activeServices.toString(), Icons.miscellaneous_services, Colors.purple),
          const SizedBox(height: 16),
          _buildStatCard(LanguageService.tr('service_requests'), _dashboard!.serviceRequests.toString(), Icons.receipt, Colors.red),
          const SizedBox(height: 16),
          _buildStatCard(LanguageService.tr('total_transactions'), _dashboard!.totalTransactions.toString(), Icons.swap_horiz, Colors.teal),
          const SizedBox(height: 16),
          _buildStatCard(LanguageService.tr('total_points_spent'), _dashboard!.totalPointsSpent.toString(), Icons.monetization_on, Colors.green),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.1),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(color: Colors.grey)),
        trailing: Text(
          value,
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
        ),
      ),
    );
  }
}
