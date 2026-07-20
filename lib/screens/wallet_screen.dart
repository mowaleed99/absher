import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class WalletScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const WalletScreen({super.key, required this.user});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  int _points = 0;
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    final data = await ApiService.getWallet(widget.user['id']);
    if (mounted) {
      setState(() {
        _points = data['points'] ?? 0;
        _notifications = data['notifications'] ?? [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: Text(LanguageService.tr('wallet_points'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 10, offset: const Offset(0, 5))],
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.account_balance_wallet, color: AppColors.accent, size: 60),
                      const SizedBox(height: 10),
                      Text(LanguageService.tr('current_points_balance'), style: const TextStyle(color: Colors.white70, fontSize: 16)),
                      Text(
                        '$_points',
                        style: const TextStyle(color: AppColors.accent, fontSize: 40, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 5),
                      Text(LanguageService.tr('points_usage_desc'), style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Align(
                    alignment: LanguageService.isRtl ? Alignment.centerRight : Alignment.centerLeft,
                    child: Text(LanguageService.tr('transaction_history'), style: const TextStyle(color: AppColors.textDark, fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ),
                Expanded(
                  child: _notifications.isEmpty
                      ? Center(child: Text(LanguageService.tr('no_previous_transactions'), style: const TextStyle(color: AppColors.textMuted)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          itemCount: _notifications.length,
                          itemBuilder: (context, index) {
                            final notif = _notifications[index];
                            final isAdd = notif['title'].toString().contains(LanguageService.tr('auto_trans_1291'));
                            return Card(
                              color: AppColors.cardBg,
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: isAdd ? AppColors.success.withValues(alpha: 0.2) : AppColors.error.withValues(alpha: 0.2),
                                  child: Icon(
                                    isAdd ? Icons.arrow_downward : Icons.arrow_upward,
                                    color: isAdd ? AppColors.success : AppColors.error,
                                  ),
                                ),
                                title: Text(notif['title'], style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold)),
                                subtitle: Text(notif['content'] + '\n' + (notif['created_at'] ?? ''), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                isThreeLine: true,
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
