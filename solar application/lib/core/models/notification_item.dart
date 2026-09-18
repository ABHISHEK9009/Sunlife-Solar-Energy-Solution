class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    this.isRead = false,
    this.category = 'Project',
    this.actionRoute,
  });

  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final bool isRead;
  final String category;
  final String? actionRoute;

  NotificationItem copyWith({
    String? id,
    String? title,
    String? message,
    DateTime? timestamp,
    bool? isRead,
    String? category,
    String? actionRoute,
  }) =>
      NotificationItem(
        id: id ?? this.id,
        title: title ?? this.title,
        message: message ?? this.message,
        timestamp: timestamp ?? this.timestamp,
        isRead: isRead ?? this.isRead,
        category: category ?? this.category,
        actionRoute: actionRoute ?? this.actionRoute,
      );

  factory NotificationItem.fromJson(Map<String, dynamic> json) =>
      NotificationItem(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        timestamp: json['timestamp'] != null
            ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
            : DateTime.now(),
        isRead: json['is_read'] as bool? ?? false,
        category: json['category'] as String? ?? 'Project',
        actionRoute: json['action_route'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'message': message,
        'timestamp': timestamp.toIso8601String(),
        'is_read': isRead,
        'category': category,
        'action_route': actionRoute,
      };
}
