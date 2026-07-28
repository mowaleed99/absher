import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class MyReviewsScreen extends StatefulWidget {
  const MyReviewsScreen({super.key});

  @override
  State<MyReviewsScreen> createState() => _MyReviewsScreenState();
}

class _MyReviewsScreenState extends State<MyReviewsScreen> {
  List<Map<String, dynamic>> _reviews = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final list = await ApiService.getMyServiceReviews();
      if (mounted) {
        setState(() {
          _reviews = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading reviews: $e');
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception:', '').trim();
          _isLoading = false;
        });
      }
    }
  }

  String _getStatusLabel(String status) {
    final isAr = LanguageService.isRtl;
    if (status == 'approved') {
      return isAr ? 'مقبول' : 'Approved';
    } else if (status == 'rejected') {
      return isAr ? 'مرفوض' : 'Rejected';
    } else {
      return isAr ? 'قيد الانتظار' : 'Pending';
    }
  }

  Color _getStatusColor(String status) {
    if (status == 'approved') {
      return AppColors.success;
    } else if (status == 'rejected') {
      return AppColors.error;
    } else {
      return Colors.orange;
    }
  }

  void _showEditDialog(Map<String, dynamic> review) {
    int selectedRating = int.tryParse(review['rating']?.toString() ?? '5') ?? 5;
    final commentCtrl = TextEditingController(text: review['comment']?.toString() ?? '');
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.cardBg,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(
                LanguageService.tr('edit_review'),
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark),
                textAlign: TextAlign.center,
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      review['service_title'] ?? review['service_name'] ?? LanguageService.tr('service_requests'),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    // Star Rating selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final starValue = index + 1;
                        return IconButton(
                          icon: Icon(
                            starValue <= selectedRating ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                            size: 36,
                          ),
                          onPressed: isSaving
                              ? null
                              : () {
                                  setDialogState(() {
                                    selectedRating = starValue;
                                  });
                                },
                        );
                      }),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: commentCtrl,
                      maxLines: 3,
                      enabled: !isSaving,
                      decoration: InputDecoration(
                        hintText: LanguageService.tr('comment_optional'),
                        hintStyle: const TextStyle(color: AppColors.textMuted),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                      ),
                      style: const TextStyle(color: AppColors.textDark),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.pop(context),
                  child: Text(
                    LanguageService.tr('cancel'),
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                ),
                ElevatedButton(
                  onPressed: isSaving
                      ? null
                      : () async {
                          setDialogState(() {
                            isSaving = true;
                          });
                          final navigator = Navigator.of(context);
                          final messenger = ScaffoldMessenger.of(context);
                          final reviewId = int.tryParse(review['id']?.toString() ?? '0') ?? 0;
                          final res = await ApiService.updateServiceReview(
                            id: reviewId,
                            rating: selectedRating,
                            comment: commentCtrl.text.trim(),
                          );
                          if (res['success']) {
                            // Immediately update in-memory list to prevent layout flicker or delayed status refresh
                            final idx = _reviews.indexWhere((r) => r['id'].toString() == reviewId.toString());
                            if (idx != -1) {
                              setState(() {
                                _reviews[idx]['rating'] = selectedRating;
                                _reviews[idx]['comment'] = commentCtrl.text.trim();
                                _reviews[idx]['status'] = 'pending';
                              });
                            }
                            navigator.pop();
                            messenger.showSnackBar(
                              SnackBar(content: Text(res['message']), backgroundColor: AppColors.success),
                            );
                            _loadReviews();
                          } else {
                            setDialogState(() {
                              isSaving = false;
                            });
                            messenger.showSnackBar(
                              SnackBar(content: Text(res['message']), backgroundColor: AppColors.error),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          LanguageService.tr('save'),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _confirmDelete(Map<String, dynamic> review) {
    bool isDeleting = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.cardBg,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(
                LanguageService.tr('delete_confirm_title'),
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.error),
              ),
              content: Text(
                LanguageService.tr('delete_confirm_msg'),
                style: const TextStyle(color: AppColors.textDark),
              ),
              actions: [
                TextButton(
                  onPressed: isDeleting ? null : () => Navigator.pop(context),
                  child: Text(
                    LanguageService.tr('cancel'),
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                ),
                ElevatedButton(
                  onPressed: isDeleting
                      ? null
                      : () async {
                          setDialogState(() {
                            isDeleting = true;
                          });
                          final navigator = Navigator.of(context);
                          final messenger = ScaffoldMessenger.of(context);
                          final reviewId = int.tryParse(review['id']?.toString() ?? '0') ?? 0;
                          final res = await ApiService.deleteServiceReview(id: reviewId);
                          if (res['success']) {
                            navigator.pop();
                            messenger.showSnackBar(
                              SnackBar(content: Text(res['message']), backgroundColor: AppColors.success),
                            );
                            _loadReviews();
                          } else {
                            setDialogState(() {
                              isDeleting = false;
                            });
                            messenger.showSnackBar(
                              SnackBar(content: Text(res['message']), backgroundColor: AppColors.error),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.error,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isDeleting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          LanguageService.tr('delete_review'),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
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
            LanguageService.tr('my_reviews'),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: RefreshIndicator(
          onRefresh: _loadReviews,
          color: AppColors.primary,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
              : _errorMessage != null
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                                const SizedBox(height: 12),
                                Text(
                                  _errorMessage!,
                                  style: const TextStyle(color: AppColors.textDark, fontSize: 16),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: _loadReviews,
                                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                  child: Text(LanguageService.tr('retry')),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : _reviews.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                            Container(
                              margin: const EdgeInsets.symmetric(horizontal: 24),
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.cardBg,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  )
                                ],
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircleAvatar(
                                    radius: 36,
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.06),
                                    child: const Icon(Icons.rate_review_outlined, size: 36, color: AppColors.primary),
                                  ),
                                  const SizedBox(height: 20),
                                  Text(
                                    isRtl ? 'لا توجد تقييمات سابقة' : 'No previous reviews found',
                                    style: const TextStyle(color: AppColors.textDark, fontSize: 16, fontWeight: FontWeight.bold),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    isRtl
                                        ? 'شاركنا تقييماتك لمساعدتنا في تحسين جودة خدمات أبشر وتجربتك كطالب.'
                                        : 'Share your reviews to help us improve the quality of Absher services and your student experience.',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.4),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: _reviews.length,
                          itemBuilder: (context, index) {
                            final review = _reviews[index];
                            final serviceTitle = review['service_title'] ?? review['service_name'] ?? LanguageService.tr('service_requests');
                            final rating = int.tryParse(review['rating']?.toString() ?? '5') ?? 5;
                            final comment = review['comment']?.toString() ?? '';
                            final status = review['status']?.toString() ?? 'pending';
                            final date = review['date']?.toString() ?? review['created_at']?.toString() ?? '';

                            return Card(
                              color: AppColors.cardBg,
                              margin: const EdgeInsets.only(bottom: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 2,
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            serviceTitle,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                              color: AppColors.textDark,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(status).withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            _getStatusLabel(status),
                                            style: TextStyle(
                                              color: _getStatusColor(status),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: List.generate(5, (starIdx) {
                                        return Icon(
                                          starIdx < rating ? Icons.star : Icons.star_border,
                                          color: Colors.amber,
                                          size: 20,
                                        );
                                      }),
                                    ),
                                    if (comment.isNotEmpty) ...[
                                      const SizedBox(height: 12),
                                      Text(
                                        comment,
                                        style: const TextStyle(color: AppColors.textDark, fontSize: 14),
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    const Divider(),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          date,
                                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                        ),
                                        Row(
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.edit_outlined, color: AppColors.primary, size: 20),
                                              onPressed: () => _showEditDialog(review),
                                              tooltip: LanguageService.tr('edit_review'),
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                                              onPressed: () => _confirmDelete(review),
                                              tooltip: LanguageService.tr('delete_review'),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ),
    );
  }
}
