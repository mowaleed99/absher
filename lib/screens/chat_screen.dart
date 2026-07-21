import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../services/web_helper.dart';
import '../services/language_service.dart';
import '../models/student.dart';

class ChatScreen extends StatefulWidget {
  final Student? user;
  final String? initialMessage;
  final String? orderStatus;
  const ChatScreen({super.key, required this.user, this.initialMessage, this.orderStatus});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<Map<String, dynamic>> _messages = [];
  final _messageController = TextEditingController();
  Timer? _pollTimer;
  bool _isLoadingMessages = false;
  bool _isDisposed = false;
  int _currentChatId = 0;
  Map<String, dynamic>? _replyingToMsg;

  String _getAbsoluteUrl(String path) {
    if (path.isEmpty) return '';
    
    // Check if it is a standard web link and not local upload
    if ((path.startsWith('http') || path.startsWith('https')) && !path.contains('/uploads/')) {
      return path;
    }
    
    try {
      final uri = Uri.parse(path);
      if (uri.pathSegments.isNotEmpty) {
        final filename = uri.pathSegments.last;
        return '${ApiService.baseUrl}/media.php?file=$filename';
      }
    } catch (_) {}
    
    // Fallback if parsing fails
    if (path.contains('/')) {
      final parts = path.split('/');
      return '${ApiService.baseUrl}/media.php?file=${parts.last}';
    }
    
    return '${ApiService.baseUrl}/media.php?file=$path';
  }

  bool _isEmbeddableVideo(String url) {
    final lowerUrl = url.toLowerCase();
    return lowerUrl.contains('youtube.com') || lowerUrl.contains('youtu.be') || lowerUrl.contains('drive.google.com');
  }

  String _getEmbedUrl(String url) {
    if (url.contains('youtube.com') || url.contains('youtu.be')) {
      String videoId = '';
      if (url.contains('v=')) {
        final parts = url.split('v=');
        if (parts.length > 1) {
          videoId = parts[1].split('&')[0];
        }
      } else if (url.contains('youtu.be/')) {
        final parts = url.split('youtu.be/');
        if (parts.length > 1) {
          videoId = parts[1].split('?')[0];
        }
      } else if (url.contains('embed/')) {
        final parts = url.split('embed/');
        if (parts.length > 1) {
          videoId = parts[1].split('?')[0];
        }
      }
      if (videoId.isNotEmpty) {
        return 'https://www.youtube.com/embed/$videoId';
      }
    } else if (url.contains('drive.google.com')) {
      String driveId = '';
      if (url.contains('/d/')) {
        final parts = url.split('/d/');
        if (parts.length > 1) {
          driveId = parts[1].split('/')[0];
        }
      } else if (url.contains('id=')) {
        final parts = url.split('id=');
        if (parts.length > 1) {
          driveId = parts[1].split('&')[0];
        }
      }
      if (driveId.isNotEmpty) {
        return 'https://drive.google.com/file/d/$driveId/preview';
      }
    }
    return url;
  }

  @override
  void initState() {
    super.initState();
    // رسالة ترحيبية آلية من الإدارة
    _messages.add({
      'text': LanguageService.tr('welcome_chat_msg'),
      'isMe': false,
      'time': LanguageService.tr('auto_trans_1022'),
    });

    // تحميل الرسائل المباشرة السابقة
    _loadMessages();

    // بدء مؤقت جلب الرسائل الجديدة كل 3 ثوانٍ
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!_isDisposed) _loadMessages();
    });

    _initChat();
  }

  Future<void> _initChat() async {
    if (widget.user != null) {
      int? chatId = await ApiService.createChat(widget.user!.id);
      if (chatId != null && mounted) {
        setState(() => _currentChatId = chatId);
        _loadMessages();
      }
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _pollTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    if (_isLoadingMessages) return;
    _isLoadingMessages = true;

    try {
      if (_currentChatId == 0) return;

      final serverMessages = await ApiService.getMessages(_currentChatId);
      
      if (serverMessages.isNotEmpty) {
        final List<Map<String, dynamic>> newMessages = [];
        newMessages.add({
          'text': LanguageService.tr('welcome_chat_msg'),
          'isMe': false,
          'time': LanguageService.tr('auto_trans_1023'),
        });

        for (var m in serverMessages) {
          newMessages.add({
            'text': m.content,
            'type': m.messageType,
            'imageUrl': m.imageUrl ?? '',
            'quoteText': '',
            'quoteSender': '',
            'isMe': m.senderType == 'student',
            'time': m.createdAt ?? LanguageService.tr('auto_trans_1024'),
          });
        }

        // تحديث الواجهة فقط في حالة وجود اختلاف
        if (newMessages.length != _messages.length || 
            _messages.last['text'] != newMessages.last['text'] ||
            _messages.last['imageUrl'] != newMessages.last['imageUrl'] ||
            _messages.last['quoteText'] != newMessages.last['quoteText']) {
          if (mounted) {
            setState(() {
              _messages.clear();
              _messages.addAll(newMessages);
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading messages periodically: $e');
    } finally {
      _isLoadingMessages = false;
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;
    final text = _messageController.text.trim();
    final quoteText = _replyingToMsg != null ? _replyingToMsg!['text']?.toString() ?? '' : '';
    final quoteSender = _replyingToMsg != null ? _replyingToMsg!['sender']?.toString() ?? '' : '';

    setState(() {
      _messages.add({
        'text': text,
        'isMe': true,
        'time': LanguageService.tr('auto_trans_1025'),
        'quoteText': quoteText,
        'quoteSender': quoteSender,
      });
      _replyingToMsg = null;
    });
    _messageController.clear();

    // إرسال الرسالة لقاعدة البيانات في سيرفر الباك اند
    ApiService.sendChatMessage(
      chatId: _currentChatId,
      text: text,
      quoteText: quoteText,
      quoteSender: quoteSender,
    );
  }

  void _showRatingDialog() {
    int rating = 5;
    final commentController = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(LanguageService.tr('rate_customer_service'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(LanguageService.tr('rate_customer_service_desc')),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: AppColors.accent,
                      size: 32,
                    ),
                    onPressed: () => setDialogState(() => rating = index + 1),
                  );
                }),
              ),
              TextField(
                controller: commentController,
                decoration: InputDecoration(
                  hintText: LanguageService.tr('additional_comments_hint'),
                  border: const OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(LanguageService.tr('cancel'), style: const TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: () {
                Navigator.pop(context);
                ApiService.submitReview(
                  studentName: widget.user?.fullName ?? '',
                  uni: widget.user?.universityId?.toString() ?? '',
                  rating: rating,
                  comment: commentController.text.trim().isNotEmpty ? commentController.text.trim() : LanguageService.tr('auto_trans_1030'),
                );
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(LanguageService.tr('rating_success_msg'))));
              },
              child: Text(LanguageService.tr('submit_rating'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _sendMediaMessage(String type, String url, String text) {
    final quoteText = _replyingToMsg != null ? _replyingToMsg!['text']?.toString() ?? '' : '';
    final quoteSender = _replyingToMsg != null ? _replyingToMsg!['sender']?.toString() ?? '' : '';

    setState(() {
      _messages.add({
        'text': text,
        'type': type,
        'imageUrl': url,
        'isMe': true,
        'time': LanguageService.tr('auto_trans_1031'),
        'quoteText': quoteText,
        'quoteSender': quoteSender,
      });
      _replyingToMsg = null;
    });

    ApiService.sendChatMessage(
      chatId: _currentChatId,
      text: text,
      type: type,
      imageUrl: url,
    );
  }

  void _showAttachMediaDialog() {
    final urlCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.link, color: AppColors.primary, size: 28),
            const SizedBox(width: 8),
            Text(LanguageService.tr('attach_link'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(LanguageService.tr('enter_or_paste_link'), style: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontFamily: 'Cairo')),
            const SizedBox(height: 14),
            TextField(
              controller: urlCtrl,
              decoration: InputDecoration(
                labelText: LanguageService.tr('url_label'),
                hintText: 'https://example.com',
                hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.link, color: AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(LanguageService.tr('auto_trans_1034'), style: const TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () {
              final url = urlCtrl.text.trim();
              if (url.isNotEmpty) {
                String detectedType = 'text';
                String msgText = url;
                
                if (_isEmbeddableVideo(url)) {
                  detectedType = 'video';
                  msgText = 'فيديو مرفق: $url';
                } else if (url.toLowerCase().contains('.mp4') || url.toLowerCase().contains('.mov')) {
                  detectedType = 'video';
                  msgText = 'فيديو مرفق: $url';
                } else if (url.toLowerCase().contains('.png') || url.toLowerCase().contains('.jpg') || url.toLowerCase().contains('.jpeg')) {
                  detectedType = 'image';
                  msgText = 'صورة مرفقة: $url';
                }
                
                Navigator.pop(context);
                _sendMediaMessage(
                  detectedType,
                  url,
                  msgText,
                );
              }
            },
            child: Text(LanguageService.tr('send_now'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showAttachVideoLinkDialog() {
    final urlCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.video_library, color: AppColors.primary, size: 28),
            const SizedBox(width: 8),
            Text(LanguageService.tr('attach_youtube_drive'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(LanguageService.tr('enter_youtube_drive_link'), style: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontFamily: 'Cairo')),
            const SizedBox(height: 14),
            TextField(
              controller: urlCtrl,
              decoration: InputDecoration(
                labelText: LanguageService.tr('video_url_label'),
                hintText: 'https://youtube.com/watch?v=...',
                hintStyle: const TextStyle(fontSize: 11, color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.videocam, color: AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(LanguageService.tr('auto_trans_1035'), style: const TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () {
              final url = urlCtrl.text.trim();
              if (url.isNotEmpty) {
                Navigator.pop(context);
                _sendMediaMessage(
                  'video',
                  url,
                  'فيديو مرفق: $url',
                );
              }
            },
            child: Text(LanguageService.tr('send_now'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndUploadMedia(bool isVideo) async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? file = isVideo 
          ? await picker.pickVideo(source: ImageSource.gallery)
          : await picker.pickImage(source: ImageSource.gallery);

      if (file == null) return;

      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          content: Row(
            children: [
              const CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(width: 20),
              Expanded(child: Text(LanguageService.tr('uploading_file_loading'))),
            ],
          ),
        ),
      );

      final bytes = await file.readAsBytes();
      final String? uploadedUrl = await ApiService.uploadFile(file.path, file.name, fileBytes: bytes);

      if (!context.mounted) return;
      Navigator.pop(context);

      if (uploadedUrl != null) {
        _sendMediaMessage(
          isVideo ? 'video' : 'image',
          uploadedUrl,
          isVideo ? LanguageService.tr('auto_trans_1036') : LanguageService.tr('auto_trans_1037'),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(LanguageService.tr('file_upload_success'))),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(LanguageService.tr('file_upload_fail'))),
        );
      }
    } catch (e) {
      debugPrint('Error picking/uploading media: $e');
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${LanguageService.tr('error_occurred')}: $e')),
      );
    }
  }

  void _showAttachMediaOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return Directionality(
          textDirection: LanguageService.textDirection,
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    LanguageService.tr('attach_media_chat'),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.image, color: AppColors.primary),
                  title: Text(LanguageService.tr('choose_image_gallery')),
                  onTap: () {
                    Navigator.pop(context);
                    _pickAndUploadMedia(false);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.video_library, color: AppColors.primary),
                  title: Text(LanguageService.tr('choose_video_gallery')),
                  onTap: () {
                    Navigator.pop(context);
                    _pickAndUploadMedia(true);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.link, color: AppColors.primary),
                  title: Text(LanguageService.tr('manual_link_input')),
                  onTap: () {
                    Navigator.pop(context);
                    _showAttachMediaDialog();
                  },
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showMediaPreview(BuildContext context, String url, String type) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(color: AppColors.primaryDark, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(type == 'video' ? LanguageService.tr('preview_video_attachment') : LanguageService.tr('preview_image_attachment'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: type == 'video'
                  ? Column(
                      children: [
                        Container(
                          height: 180,
                          width: double.infinity,
                          decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(12)),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.play_circle_fill, color: AppColors.accent, size: 60),
                              const SizedBox(height: 8),
                              Text(LanguageService.tr('video_player_active'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        SelectableText(url, style: const TextStyle(fontSize: 12, color: AppColors.primary)),
                      ],
                    )
                  : Image.network(
                      url,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, size: 80, color: Colors.grey),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: LanguageService.textDirection,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 1,
          title: Row(
            children: [
              CircleAvatar(
                backgroundColor: AppColors.accent,
                radius: 18,
                child: Image.asset('assets/images/logo.png', width: 22, errorBuilder: (_, __, ___) => const Icon(Icons.support_agent, color: AppColors.primary)),
              ),
              const SizedBox(width: 10),
              Text(LanguageService.tr('absher_support_chat_title'), style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
          actions: [
            TextButton.icon(
              onPressed: _showRatingDialog,
              icon: const Icon(Icons.star, color: AppColors.accent, size: 18),
              label: Text(LanguageService.tr('rate_button'), style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
            ),
            IconButton(
              icon: const Icon(Icons.phone, color: AppColors.accent),
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(LanguageService.tr('direct_call_snackbar')))),
            ),
          ],
        ),
        body: Column(
          children: [
            // Removed order status and cash warning banners as requested

            // قائمة الرسائل
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  final isMe = msg['isMe'] as bool;
                  final type = msg['type']?.toString() ?? 'text';
                  final mediaUrl = msg['imageUrl']?.toString() ?? '';

                  return Align(
                    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: GestureDetector(
                      onDoubleTap: () {
                        setState(() {
                          _replyingToMsg = {
                            'text': msg['text']?.toString() ?? '',
                            'sender': isMe ? 'student' : 'admin',
                          };
                        });
                      },
                      onLongPress: () {
                        setState(() {
                          _replyingToMsg = {
                            'text': msg['text']?.toString() ?? '',
                            'sender': isMe ? 'student' : 'admin',
                          };
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(LanguageService.tr('reply_to_message_selected')), duration: const Duration(seconds: 1)),
                        );
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                        decoration: BoxDecoration(
                          color: isMe ? AppColors.primary : Colors.white,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                            bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                          ),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 5, offset: const Offset(0, 2))],
                          border: isMe ? null : Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (msg['quoteText'] != null && msg['quoteText'].toString().isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isMe ? Colors.white.withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border(
                                    right: BorderSide(
                                      color: isMe ? AppColors.accent : AppColors.primary,
                                      width: 4,
                                    ),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      msg['quoteSender'] == 'student' ? LanguageService.tr('you') : LanguageService.tr('tech_support'),
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                        color: isMe ? AppColors.accent : AppColors.primary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      msg['quoteText'].toString(),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isMe ? Colors.white70 : AppColors.textDark,
                                      ),
                                    ),                                  ],
                                ),
                              ),
                            if (type == 'video' || (mediaUrl.isNotEmpty && (mediaUrl.contains('.mp4') || mediaUrl.contains('.mov') || _isEmbeddableVideo(mediaUrl)))) ...[
                              if (_isEmbeddableVideo(mediaUrl))
                                Container(
                                  height: 180,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.accent, width: 1.5),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: buildEmbedVideo(_getEmbedUrl(mediaUrl)),
                                  ),
                                )
                              else
                                GestureDetector(
                                  onTap: () => _showMediaPreview(context, _getAbsoluteUrl(mediaUrl), 'video'),
                                  child: Container(
                                    height: 130,
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color: Colors.black87,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.accent, width: 1.5),
                                    ),
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        const Icon(Icons.play_circle_fill, color: AppColors.accent, size: 50),
                                        Positioned(
                                          bottom: 8,
                                          right: 8,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(8)),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.videocam, color: Colors.white, size: 14),
                                                const SizedBox(width: 4),
                                                Text(LanguageService.tr('click_to_play_video'), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 8),
                            ] else if (type == 'image' || (mediaUrl.isNotEmpty && (mediaUrl.contains('.png') || mediaUrl.contains('.jpg') || mediaUrl.contains('http')))) ...[
                              GestureDetector(
                                onTap: () => _showMediaPreview(context, _getAbsoluteUrl(mediaUrl), 'image'),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    _getAbsoluteUrl(mediaUrl),
                                    height: 150,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(height: 100, color: Colors.grey.shade300, child: const Icon(Icons.image, size: 40)),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                            ],
                            if (type != 'image' && type != 'video') ...[
                              Text(
                                msg['text'] as String,
                                style: TextStyle(color: isMe ? Colors.white : AppColors.textDark, fontSize: 14, height: 1.4),
                              ),
                              const SizedBox(height: 4),
                            ],
                            Text(
                              msg['time'] as String,
                              style: TextStyle(color: isMe ? Colors.white70 : AppColors.textMuted, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // مربع كتابة الرسالة والإرفاق
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -2))],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_replyingToMsg != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: const Border(right: BorderSide(color: AppColors.primary, width: 4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.reply, size: 16, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _replyingToMsg!['sender'] == 'student' ? LanguageService.tr('reply_to_yourself') : LanguageService.tr('reply_to_support'),
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.primary),
                                ),
                                Text(
                                  _replyingToMsg!['text'] as String,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textDark),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 16, color: Colors.grey),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () {
                              setState(() {
                                _replyingToMsg = null;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  Row(
                    children: [
                      IconButton(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.image, color: AppColors.primary, size: 22),
                        tooltip: LanguageService.tr('attach_image_tooltip'),
                        onPressed: () => _pickAndUploadMedia(false),
                      ),
                      IconButton(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.videocam, color: AppColors.primary, size: 22),
                        tooltip: LanguageService.tr('attach_video_tooltip'),
                        onPressed: _showAttachVideoLinkDialog,
                      ),
                      IconButton(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.link, color: AppColors.primary, size: 22),
                        tooltip: LanguageService.tr('attach_link_tooltip'),
                        onPressed: _showAttachMediaDialog,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          decoration: InputDecoration(
                            hintText: LanguageService.tr('type_message_hint'),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                            filled: true,
                            fillColor: AppColors.background,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      CircleAvatar(
                        backgroundColor: AppColors.accent,
                        radius: 22,
                        child: IconButton(
                          icon: const Icon(Icons.send, color: AppColors.textDark, size: 20),
                          onPressed: _sendMessage,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
