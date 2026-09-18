import 'package:flutter/foundation.dart';
import '../models/notification_item.dart';

class NotificationRepository {
  NotificationRepository._internal() {
    _unreadCountNotifier.value = _notifications.where((n) => !n.isRead).length;
    _notificationsNotifier.value = List.unmodifiable(_notifications);
  }

  static final NotificationRepository instance = NotificationRepository._internal();

  final List<NotificationItem> _notifications = [
    NotificationItem(
      id: 'notif_1',
      title: 'Net-meter application submitted',
      message: 'Your application was submitted to JVVNL for meter inspection.',
      timestamp: DateTime.now().subtract(const Duration(hours: 3)),
      isRead: false,
      category: 'Project',
      actionRoute: 'project',
    ),
    NotificationItem(
      id: 'notif_2',
      title: 'Installation completed',
      message: 'Your 5 kW system was installed and tested successfully.',
      timestamp: DateTime.now().subtract(const Duration(days: 1)),
      isRead: true,
      category: 'Project',
      actionRoute: 'project',
    ),
    NotificationItem(
      id: 'notif_3',
      title: 'Installation certificate ready',
      message: 'Your approved installation certificate is available in Documents.',
      timestamp: DateTime.now().subtract(const Duration(days: 3)),
      isRead: true,
      category: 'Documents',
      actionRoute: 'documents',
    ),
  ];

  final ValueNotifier<int> _unreadCountNotifier = ValueNotifier<int>(0);
  final ValueNotifier<List<NotificationItem>> _notificationsNotifier =
      ValueNotifier<List<NotificationItem>>([]);

  ValueListenable<int> get unreadCountNotifier => _unreadCountNotifier;
  ValueListenable<List<NotificationItem>> get notificationsNotifier => _notificationsNotifier;

  int get unreadCount => _unreadCountNotifier.value;

  List<NotificationItem> get notifications => List.unmodifiable(_notifications);

  Future<List<NotificationItem>> getNotifications() async {
    return List.unmodifiable(_notifications);
  }

  void markAllAsRead() {
    for (var i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].copyWith(isRead: true);
    }
    _syncNotifiers();
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      _syncNotifiers();
    }
  }

  void addNotification({
    required String title,
    required String message,
    String category = 'Project',
    String? actionRoute,
  }) {
    final item = NotificationItem(
      id: 'notif_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      message: message,
      timestamp: DateTime.now(),
      isRead: false,
      category: category,
      actionRoute: actionRoute,
    );
    _notifications.insert(0, item);
    _syncNotifiers();
  }

  void _syncNotifiers() {
    _unreadCountNotifier.value = _notifications.where((n) => !n.isRead).length;
    _notificationsNotifier.value = List.unmodifiable(_notifications);
  }
}
