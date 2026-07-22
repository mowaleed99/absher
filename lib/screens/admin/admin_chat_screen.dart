import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class AdminChatScreen extends StatefulWidget {
  const AdminChatScreen({super.key});

  @override
  State<AdminChatScreen> createState() => _AdminChatScreenState();
}

class _AdminChatScreenState extends State<AdminChatScreen> {
  List<Map<String, dynamic>> _chats = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadChats();
  }

  Future<void> _loadChats() async {
    setState(() => _isLoading = true);
    try {
      final chats = await ApiService.getAdminChats();
      if (mounted) {
        setState(() => _chats = chats);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load chats: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    if (_chats.isEmpty) {
      return const Center(child: Text('No conversations yet'));
    }

    return RefreshIndicator(
      onRefresh: _loadChats,
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: _chats.length,
        itemBuilder: (context, index) {
          final chat = _chats[index];
          final name = chat['student_name']?.toString() ?? 'Student';
          final lastMsg = chat['last_msg']?.toString() ?? '';
          final status = chat['status']?.toString() ?? '';
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.primary),
                ),
              ),
              title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (status.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: status.contains('جديد') || status.contains('new')
                            ? Colors.red.withValues(alpha: 0.15)
                            : Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          fontSize: 10,
                          color: status.contains('جديد') || status.contains('new')
                              ? Colors.red
                              : Colors.grey,
                        ),
                      ),
                    ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              onTap: () => _openChat(chat),
            ),
          );
        },
      ),
    );
  }

  void _openChat(Map<String, dynamic> chat) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AdminChatDetailScreen(chat: chat),
      ),
    ).then((_) => _loadChats()); // refresh list after returning
  }
}

class AdminChatDetailScreen extends StatefulWidget {
  final Map<String, dynamic> chat;

  const AdminChatDetailScreen({super.key, required this.chat});

  @override
  State<AdminChatDetailScreen> createState() => _AdminChatDetailScreenState();
}

class _AdminChatDetailScreenState extends State<AdminChatDetailScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    // Load initial messages from the embedded messages in the chat object
    final raw = widget.chat['messages'];
    if (raw is List) {
      _messages = raw.cast<Map<String, dynamic>>();
    }
    // Also fetch latest just in case
    _loadMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    final chatId = widget.chat['id'] is int
        ? widget.chat['id'] as int
        : int.tryParse(widget.chat['id'].toString()) ?? 0;

    if (chatId == 0) return;

    try {
      final serverMessages = await ApiService.getMessages(chatId);
      if (serverMessages.isNotEmpty && mounted) {
        final List<Map<String, dynamic>> newMessages = [];
        for (var m in serverMessages) {
          newMessages.add({
            'sender': m.senderType,
            'text': m.content,
            'type': m.messageType,
            'image_url': m.imageUrl ?? '',
            'quote_text': '',
            'quote_sender': '',
            'time': m.createdAt ?? '',
          });
        }
        setState(() {
          _messages = newMessages;
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Error reloading messages: $e');
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendReply() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final chatId = widget.chat['id'] is int
        ? widget.chat['id'] as int
        : int.tryParse(widget.chat['id'].toString()) ?? 0;

    setState(() => _isSending = true);

    final success = await ApiService.adminSendMessage(chatId: chatId, text: text);

    if (mounted) {
      if (success) {
        _messageController.clear();
        await _loadMessages();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send message')),
        );
      }
      setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.chat['student_name']?.toString() ?? 'Student';

    return Scaffold(
      appBar: AppBar(
        title: Text(name),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isAdmin = msg['sender']?.toString() == 'admin';
                final isDeleted = msg['deleted'] == true || msg['is_deleted'] == 1;
                final text = isDeleted ? '[Deleted]' : (msg['text']?.toString() ?? '');
                final time = msg['time']?.toString() ?? '';

                return Align(
                  alignment: isAdmin ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    decoration: BoxDecoration(
                      color: isAdmin
                          ? AppColors.primary.withValues(alpha: 0.15)
                          : Colors.grey[200],
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(12),
                        topRight: const Radius.circular(12),
                        bottomLeft: isAdmin ? Radius.zero : const Radius.circular(12),
                        bottomRight: isAdmin ? const Radius.circular(12) : Radius.zero,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          isAdmin ? '🛡 Admin' : '👤 Student',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (msg['image_url'] != null && msg['image_url'].toString().isNotEmpty)
                          Image.network(
                            ApiService.resolveImageUrl(msg['image_url'].toString()),
                            height: 150,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
                          ),
                        if (text.isNotEmpty)
                          Text(text, style: const TextStyle(fontSize: 14)),
                        if (time.isNotEmpty)
                          Text(time, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // Reply input bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            color: Colors.white,
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: 'Type admin reply...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                      maxLines: null,
                      onSubmitted: (_) => _sendReply(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : IconButton(
                            icon: const Icon(Icons.send, color: Colors.white),
                            onPressed: _sendReply,
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
