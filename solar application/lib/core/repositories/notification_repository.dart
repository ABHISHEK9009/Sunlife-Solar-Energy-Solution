import '../errors/error_feedback.dart';
import '../errors/app_error.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/notification_item.dart';
import '../network/api_client.dart';

class NotificationRepository {
  NotificationRepository._internal() {
    _syncNotifiers();
  }

  static final NotificationRepository instance = NotificationRepository._internal();

  List<NotificationItem> _notifications = [];
  bool _isLoading = false;
  String? lastError;

  final ValueNotifier<int> _unreadCountNotifier = ValueNotifier<int>(0);
  final ValueNotifier<List<NotificationItem>> _notificationsNotifier =
      ValueNotifier<List<NotificationItem>>([]);

  ValueListenable<int> get unreadCountNotifier => _unreadCountNotifier;
  ValueListenable<List<NotificationItem>> get notificationsNotifier => _notificationsNotifier;

  int get unreadCount => _unreadCountNotifier.value;
  List<NotificationItem> get notifications => List.unmodifiable(_notifications);
  bool get isLoading => _isLoading;

  void reset() {
    lastError = null;
    _notifications = [];
    _isLoading = false;
    _syncNotifiers();
  }

  Future<List<NotificationItem>> getNotifications({bool forceRefresh = false}) async {
    if (!forceRefresh && _notifications.isNotEmpty) {
      return List.unmodifiable(_notifications);
    }

    _isLoading = true;
    lastError = null;
    try {
      final res = await ApiClient.instance.get(ApiConstants.notifications);
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        final rawList = data['notifications'] as List<dynamic>? ?? [];
        _notifications = rawList
            .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
            .toList();
        _syncNotifiers();
      }
    } catch (e) {
      lastError = ErrorMapper.message(e);
    } finally {
      _isLoading = false;
      _syncNotifiers();
    }

    return List.unmodifiable(_notifications);
  }

  Future<void> markAllAsRead() async {
    try {
      await ApiClient.instance.patch(ApiConstants.notifications, data: {'markAllRead': true});
      _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
      _syncNotifiers();
    } catch (e) {
      ErrorFeedback.show(e);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await ApiClient.instance.patch(ApiConstants.notifications, data: {'notificationId': id});
      _notifications = _notifications.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList();
      _syncNotifiers();
    } catch (e) {
      ErrorFeedback.show(e);
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
