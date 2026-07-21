class ChatMessage {
  final int id;
  final int chatId;
  final String senderType; 
  final String messageType; 
  final String content;
  final String? imageUrl;
  final String? createdAt;

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.senderType,
    required this.messageType,
    required this.content,
    this.imageUrl,
    this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      chatId: json['chat_id'] is int ? json['chat_id'] : int.tryParse(json['chat_id']?.toString() ?? '0') ?? 0,
      senderType: (json['sender_type'] ?? json['sender'] ?? 'student').toString(),
      messageType: (json['message_type'] ?? json['type'] ?? 'text').toString(),
      content: (json['content'] ?? json['text'] ?? '').toString(),
      imageUrl: (json['image_url'] ?? json['imageUrl'])?.toString(),
      createdAt: (json['created_at'] ?? json['time'])?.toString(),
    );
  }
}
