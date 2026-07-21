class News {
  final int id;
  final String title;
  final String content;
  final String? imageUrl;
  final String? date;

  News({
    required this.id,
    required this.title,
    required this.content,
    this.imageUrl,
    this.date,
  });

  factory News.fromJson(Map<String, dynamic> json) {
    return News(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      imageUrl: json['image_url'],
      date: json['date'] ?? json['created_at'],
    );
  }
}
