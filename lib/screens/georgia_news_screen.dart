import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../models/news.dart';

class GeorgiaNewsScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  const GeorgiaNewsScreen({super.key, this.user});

  @override
  State<GeorgiaNewsScreen> createState() => _GeorgiaNewsScreenState();
}

class _GeorgiaNewsScreenState extends State<GeorgiaNewsScreen> {
  List<News> _newsList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNews();
  }

  Future<void> _fetchNews() async {
    setState(() => _isLoading = true);
    final list = await ApiService.getNews();
    if (mounted) {
      setState(() {
        _newsList = list.map((n) => News.fromJson(n)).toList();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLang,
      builder: (context, lang, child) {
        return Directionality(
          textDirection: LanguageService.textDirection,
          child: Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              title: Text(LanguageService.tr('auto_trans_1047'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
              iconTheme: const IconThemeData(color: Colors.white),
              centerTitle: true,
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _fetchNews,
                  tooltip: LanguageService.tr('auto_trans_1048'),
                ),
              ],
            ),
            body: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _newsList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.newspaper_outlined, size: 80, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(LanguageService.tr('auto_trans_1049'), style: const TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchNews,
                        color: AppColors.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          itemCount: _newsList.length,
                          itemBuilder: (context, index) {
                            final news = _newsList[index];
                            final imgUrl = news.imageUrl ?? '';
                            const fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80';

                            return Card(
                              margin: const EdgeInsets.only(bottom: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              elevation: 4,
                              clipBehavior: Clip.antiAlias,
                              shadowColor: AppColors.primary.withValues(alpha: 0.08),
                              child: InkWell(
                                onTap: () => _showNewsDetail(context, news),
                                child: Stack(
                                  children: [
                                    Image.network(
                                      imgUrl.isNotEmpty ? imgUrl : fallbackImg,
                                      height: 200,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        height: 200,
                                        color: AppColors.primaryDark,
                                        child: const Icon(Icons.newspaper, size: 50, color: AppColors.accent),
                                      ),
                                    ),
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                            colors: [
                                              Colors.transparent,
                                              Colors.black.withValues(alpha: 0.15),
                                              Colors.black.withValues(alpha: 0.8),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 16,
                                      left: 16,
                                      right: 16,
                                      child: Text(
                                        news.title,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                          height: 1.3,
                                          shadows: [
                                            Shadow(
                                              offset: Offset(0, 1.5),
                                              blurRadius: 4,
                                              color: Colors.black54,
                                            ),
                                          ],
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
        );
      },
    );
  }

  void _showNewsDetail(BuildContext context, News news) {
    final imgUrl = news.imageUrl ?? '';
    const fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: Column(
            children: [
              // Top handle bar
              Container(
                height: 5,
                width: 50,
                margin: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
              ),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Image.network(
                        imgUrl.isNotEmpty ? imgUrl : fallbackImg,
                        height: 220,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 220,
                          color: AppColors.primaryDark,
                          child: const Icon(Icons.newspaper, size: 60, color: AppColors.accent),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.schedule, color: AppColors.accent, size: 18),
                                const SizedBox(width: 6),
                                Text(
                                  news.date ?? LanguageService.tr('auto_trans_1050'),
                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              news.title,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryDark, height: 1.4),
                            ),
                            const Divider(height: 24, thickness: 1.2),
                            Text(
                              news.content,
                              style: const TextStyle(fontSize: 14, color: AppColors.textDark, height: 1.6),
                            ),
                            const SizedBox(height: 20),
                          ],
                        ),
                      ),
                    ],
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
