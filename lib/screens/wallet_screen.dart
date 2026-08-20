import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../models/student.dart';
import '../models/wallet_transaction.dart';
import '../core/loading_state_widget.dart';
import '../core/error_state_widget.dart';
import '../core/empty_state_widget.dart';

class WalletScreen extends StatefulWidget {
  final Student? user;
  const WalletScreen({super.key, required this.user});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  int _points = 0;
  List<WalletTransaction> _transactions = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadWalletData();
  }

  Future<void> _loadWalletData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      // Fetch balance (uses existing getWallet endpoint which doesn't need change)
      final walletResult = await ApiService.getWallet(widget.user?.id ?? 0);
      final points = (walletResult['points'] as num?)?.toInt() ?? 0;

      // Fetch real transaction history from wallet_transactions table
      final transactions = await ApiService.getWalletTransactions();

      if (mounted) {
        setState(() {
          _points = points;
          _transactions = transactions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = LanguageService.tr('failed_load_transactions');
          _isLoading = false;
        });
      }
    }
  }

  String _localizeDescription(String? desc) {
    if (desc == null || desc.isEmpty) return '';
    if (LanguageService.currentLang.value != 'en') return desc;

    var s = desc;
    s = s.replaceAll('خصم لطلب خدمة:', 'Deduction for service:');
    s = s.replaceAll('خصم لطلب خدمة', 'Deduction for service:');
    s = s.replaceAll('Deduction for service request:', 'Deduction for service:');
    s = s.replaceAll('لطلب ملغي:', 'For cancelled request:');
    s = s.replaceAll('لطلب ملغي', 'For cancelled request:');
    s = s.replaceAll('تم استرجاع', 'refunded');
    s = s.replaceAll('استرجاع نقاط', 'Points Refund');
    s = s.replaceAll('السبب :', 'Reason:');
    s = s.replaceAll('السبب:', 'Reason:');
    s = s.replaceAll('خدمه توصيل', 'Delivery Service');
    s = s.replaceAll('خدمة توصيل', 'Delivery Service');
    s = s.replaceAll('خدمه تنظيف', 'Cleaning Service');
    s = s.replaceAll('خدمة تنظيف', 'Cleaning Service');
    s = s.replaceAll('خدمه استقبال', 'Airport Pickup Service');
    s = s.replaceAll('خدمة استقبال', 'Airport Pickup Service');
    s = s.replaceAll('خدمه شريحه', 'SIM Card Service');
    s = s.replaceAll('خدمة شريحة', 'SIM Card Service');
    s = s.replaceAll('خدمه ترجمه', 'Translation Service');
    s = s.replaceAll('خدمة ترجمة', 'Translation Service');
    s = s.replaceAll('طلب سكن', 'Housing Request');
    s = s.replaceAll('طلب شريك', 'Roommate Request');
    s = s.replaceAll('بعد خصم', 'after');
    s = s.replaceAll('نقطة', 'pts');
    s = s.replaceAll('نقاط', 'pts');
    s = s.replaceAll('شحن رصيد', 'Wallet Top-up');
    s = s.replaceAll('إضافة رصيد', 'Balance Added');
    s = s.replaceAll('مكافأة تسجيل', 'Registration Bonus');
    s = s.replaceAll('هدية', 'Gift');
    return s;
  }

  @override
  Widget build(BuildContext context) {
    final isRtl = LanguageService.isRtl;
    return Directionality(
      textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          title: Text(
            LanguageService.tr('wallet_points'),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          iconTheme: const IconThemeData(color: Colors.white),
          elevation: 0,
        ),
        body: _isLoading
            ? const LoadingStateWidget(messageKey: 'loading_transactions')
            : Column(
                children: [
                  // ── Balance Card ──────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.symmetric(
                        vertical: 28, horizontal: 20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                          colors: [AppColors.primaryDark, AppColors.primary]),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        )
                      ],
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.account_balance_wallet,
                            color: AppColors.accent, size: 54),
                        const SizedBox(height: 10),
                        Text(
                          LanguageService.tr('current_points_balance'),
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 15),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '$_points',
                              style: const TextStyle(
                                color: AppColors.accent,
                                fontSize: 42,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              LanguageService.tr('points_unit'),
                              style: const TextStyle(
                                  color: AppColors.accent, fontSize: 16),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          LanguageService.tr('points_usage_desc'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 12),
                        ),
                      ],
                    ),
                  ),

                  // ── Section title ─────────────────────────────────────────
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(
                        LanguageService.tr('transaction_history'),
                        style: const TextStyle(
                          color: AppColors.textDark,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  // ── List / empty / error ──────────────────────────────────
                  Expanded(child: _buildBody()),
                ],
              ),
      ),
    );
  }

  Widget _buildBody() {
    if (_errorMessage != null) {
      return ErrorStateWidget(
        message: _errorMessage!,
        onRetry: _loadWalletData,
      );
    }

    if (_transactions.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadWalletData,
        color: AppColors.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 60),
            EmptyStateWidget(
              titleKey: 'no_wallet_history_title',
              descriptionKey: 'no_wallet_history_desc',
              icon: Icons.receipt_long_outlined,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadWalletData,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        itemCount: _transactions.length,
        itemBuilder: (context, index) => _buildTransactionCard(index),
      ),
    );
  }

  Widget _buildTransactionCard(int index) {
    final tx = _transactions[index];
    final isCredit = tx.isCredit;

    // Localize the transaction type label using central transaction helper
    final typeLabel = LanguageService.getLocalizedTransactionType(tx.type);

    // Format the date
    String dateStr = '';
    if (tx.createdAt != null) {
      final d = tx.createdAt!;
      dateStr =
          '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } else if (tx.rawCreatedAt.isNotEmpty) {
      dateStr = tx.rawCreatedAt;
    }

    return Card(
      color: AppColors.cardBg,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            // Icon
            CircleAvatar(
              radius: 22,
              backgroundColor: isCredit
                  ? AppColors.success.withValues(alpha: 0.15)
                  : AppColors.error.withValues(alpha: 0.15),
              child: Icon(
                isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                color: isCredit ? AppColors.success : AppColors.error,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    typeLabel,
                    style: const TextStyle(
                      color: AppColors.textDark,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  if (tx.description != null && tx.description!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Text(
                        _localizeDescription(tx.description),
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 12),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  if (dateStr.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Directionality(
                        textDirection: TextDirection.ltr,
                        child: Text(
                          dateStr,
                          style: const TextStyle(
                              color: AppColors.textMuted, fontSize: 11),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Amount
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Text(
                    '${isCredit ? '+' : '-'}${tx.amount}',
                    style: TextStyle(
                      color: isCredit ? AppColors.success : AppColors.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  LanguageService.tr('points_unit'),
                  style: TextStyle(
                    color: isCredit ? AppColors.success : AppColors.error,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
