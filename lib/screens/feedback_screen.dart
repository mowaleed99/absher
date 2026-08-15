import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../core/loading_state_widget.dart';
import '../core/error_state_widget.dart';
import '../core/empty_state_widget.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _commentController = TextEditingController();
  String _selectedType = 'suggestion';
  bool _isSubmitting = false;
  bool _isLoadingHistory = true;
  List<Map<String, dynamic>> _feedbackHistory = [];
  String? _historyError;

  final List<Map<String, String>> _feedbackTypes = [
    {'value': 'suggestion', 'ar': 'مقترح', 'en': 'Suggestion'},
    {'value': 'bug', 'ar': 'بلاغ عن عطل', 'en': 'Bug Report'},
    {'value': 'ux', 'ar': 'تجربة المستخدم', 'en': 'UX Feedback'},
    {'value': 'feature', 'ar': 'طلب ميزة جديدة', 'en': 'Feature Request'},
  ];

  @override
  void initState() {
    super.initState();
    _loadFeedbackHistory();
  }

  Future<void> _loadFeedbackHistory() async {
    setState(() {
      _isLoadingHistory = true;
      _historyError = null;
    });
    try {
      final list = await ApiService.getMyFeedback();
      if (mounted) {
        setState(() {
          _feedbackHistory = list;
          _isLoadingHistory = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading feedback history: $e');
      if (mounted) {
        setState(() {
          _historyError = e.toString().replaceAll('Exception:', '').trim();
          _isLoadingHistory = false;
        });
      }
    }
  }

  Future<void> _submitFeedback() async {
    final comment = _commentController.text.trim();
    if (comment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            LanguageService.isRtl
                ? 'يرجى كتابة تفاصيل البلاغ أو المقترح أولاً'
                : 'Please write the details of your feedback first',
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final messenger = ScaffoldMessenger.of(context);
    final res = await ApiService.submitFeedback(
      feedbackType: _selectedType,
      comment: comment,
    );

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (res['success']) {
        _commentController.clear();
        setState(() {
          _selectedType = 'suggestion';
        });
        messenger.showSnackBar(
          SnackBar(
              content: Text(res['message']),
              backgroundColor: AppColors.success),
        );
        _loadFeedbackHistory();
      } else {
        messenger.showSnackBar(
          SnackBar(
              content: Text(res['message']), backgroundColor: AppColors.error),
        );
      }
    }
  }

  String _getTypeLabel(String type) {
    final match = _feedbackTypes.firstWhere((t) => t['value'] == type,
        orElse: () => {'ar': type, 'en': type});
    return LanguageService.isRtl ? match['ar']! : match['en']!;
  }

  // _getStatusLabel has been replaced by LanguageService.getLocalizedFeedbackStatus

  Color _getStatusColor(String status) {
    if (status == 'resolved') {
      return AppColors.success;
    } else if (status == 'reviewed') {
      return AppColors.primary;
    } else {
      return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRtl = LanguageService.isRtl;

    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          title: Text(
            LanguageService.tr('feedback_menu_option'),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: GestureDetector(
          onTap: () => FocusScope.of(context).unfocus(),
          child: Column(
            children: [
              // Submit form container
              Card(
                margin: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                elevation: 2,
                color: AppColors.cardBg,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        LanguageService.tr('feedback_form_title'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Dropdown type selector
                      DropdownButtonFormField<String>(
                        initialValue: _selectedType,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('feedback_type'),
                          labelStyle:
                              const TextStyle(color: AppColors.textMuted),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        dropdownColor: AppColors.cardBg,
                        style: const TextStyle(
                            color: AppColors.textDark, fontSize: 14),
                        items: _feedbackTypes.map((type) {
                          return DropdownMenuItem<String>(
                            value: type['value'],
                            child: Text(isRtl ? type['ar']! : type['en']!),
                          );
                        }).toList(),
                        onChanged: _isSubmitting
                            ? null
                            : (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedType = val;
                                  });
                                }
                              },
                      ),
                      const SizedBox(height: 16),
                      // Comment input field
                      TextField(
                        controller: _commentController,
                        maxLines: 4,
                        enabled: !_isSubmitting,
                        decoration: InputDecoration(
                          labelText: LanguageService.tr('feedback_comment'),
                          labelStyle:
                              const TextStyle(color: AppColors.textMuted),
                          hintText: isRtl
                              ? 'اكتب هنا تفاصيل المقترح أو البلاغ بالتفصيل...'
                              : 'Write detailed comments or bug reports here...',
                          hintStyle: const TextStyle(
                              color: AppColors.textMuted, fontSize: 13),
                          alignLabelWithHint: true,
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 1.5),
                          ),
                        ),
                        style: const TextStyle(color: AppColors.textDark),
                      ),
                      const SizedBox(height: 16),
                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _submitFeedback,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  LanguageService.tr('submit_feedback'),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Title for History section
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    LanguageService.tr('my_feedback'),
                    style: const TextStyle(
                      color: AppColors.textDark,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              // History list
              Expanded(
                child: _isLoadingHistory
                    ? const LoadingStateWidget(messageKey: 'loading_data')
                    : _historyError != null
                        ? ErrorStateWidget(
                            message: _historyError!,
                            onRetry: _loadFeedbackHistory,
                          )
                        : _feedbackHistory.isEmpty
                            ? RefreshIndicator(
                                onRefresh: _loadFeedbackHistory,
                                child: ListView(
                                  children: [
                                    SizedBox(
                                        height:
                                            MediaQuery.of(context).size.height *
                                                0.05),
                                    const EmptyStateWidget(
                                      titleKey:
                                          'no_search_results_title', // Translates to "No Search Results" / "لا توجد نتائج بحث"
                                      descriptionKey: 'no_search_results_desc',
                                      icon: Icons.history_toggle_off,
                                    ),
                                  ],
                                ),
                              )
                            : RefreshIndicator(
                                onRefresh: _loadFeedbackHistory,
                                child: ListView.builder(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 8),
                                  itemCount: _feedbackHistory.length,
                                  itemBuilder: (context, index) {
                                    final fb = _feedbackHistory[index];
                                    final type =
                                        fb['feedback_type']?.toString() ?? '';
                                    final comment =
                                        fb['comment']?.toString() ?? '';
                                    final status =
                                        fb['status']?.toString() ?? 'pending';
                                    final date = fb['date']?.toString() ??
                                        fb['created_at']?.toString() ??
                                        '';

                                    return Card(
                                      color: AppColors.cardBg,
                                      margin: const EdgeInsets.only(bottom: 12),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(14)),
                                      elevation: 1,
                                      child: Padding(
                                        padding: const EdgeInsets.all(12.0),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Text(
                                                  _getTypeLabel(type),
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: AppColors.primary,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                                Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 8,
                                                      vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color:
                                                        _getStatusColor(status)
                                                            .withValues(
                                                                alpha: 0.1),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            8),
                                                  ),
                                                  child: Text(
                                                    LanguageService
                                                        .getLocalizedFeedbackStatus(
                                                            status),
                                                    style: TextStyle(
                                                      color: _getStatusColor(
                                                          status),
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              comment,
                                              style: const TextStyle(
                                                  color: AppColors.textDark,
                                                  fontSize: 13),
                                            ),
                                            const SizedBox(height: 8),
                                            const Divider(),
                                            Align(
                                              alignment: AlignmentDirectional
                                                  .centerStart,
                                              child: Directionality(
                                                textDirection:
                                                    TextDirection.ltr,
                                                child: Text(
                                                  date,
                                                  style: const TextStyle(
                                                      color:
                                                          AppColors.textMuted,
                                                      fontSize: 11),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
