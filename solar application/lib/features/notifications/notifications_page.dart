import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/models/notification_item.dart';
import '../../core/repositories/notification_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/sub_page.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  String _selectedCategory = 'All';

  String _formatTimestamp(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24 && now.day == time.day) {
      return 'Today, ${DateFormat.jm().format(time)}';
    } else if (difference.inDays <= 1) {
      return 'Yesterday, ${DateFormat.jm().format(time)}';
    } else {
      return DateFormat('dd MMM, h:mm a').format(time);
    }
  }

  IconData _iconForCategory(String category) {
    switch (category) {
      case 'Project':
        return Icons.route_rounded;
      case 'Documents':
        return Icons.description_rounded;
      case 'Payments':
        return Icons.account_balance_wallet_rounded;
      case 'Support':
        return Icons.support_agent_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<List<NotificationItem>>(
        valueListenable: NotificationRepository.instance.notificationsNotifier,
        builder: (context, notifications, _) {
          final filtered = _selectedCategory == 'All'
              ? notifications
              : notifications.where((n) => n.category == _selectedCategory).toList();

          return SubPage(
            title: 'Notifications',
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${notifications.where((n) => !n.isRead).length} unread updates',
                    style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700),
                  ),
                  TextButton.icon(
                    onPressed: () => NotificationRepository.instance.markAllAsRead(),
                    icon: const Icon(Icons.done_all, size: 18),
                    label: const Text('Mark all read'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final cat in ['All', 'Project', 'Documents', 'Payments', 'Support'])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat),
                          selected: _selectedCategory == cat,
                          onSelected: (_) => setState(() => _selectedCategory = cat),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (filtered.isEmpty)
                const CardBox(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('No notifications in this category.'),
                    ),
                  ),
                )
              else
                for (final item in filtered)
                  InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      NotificationRepository.instance.markAsRead(item.id);
                    },
                    child: NotificationTile(
                      icon: _iconForCategory(item.category),
                      title: item.title,
                      message: item.message,
                      time: _formatTimestamp(item.timestamp),
                      unread: !item.isRead,
                    ),
                  ),
            ],
          );
        },
      );
}

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    required this.time,
    this.unread = false,
  });

  final IconData icon;
  final String title, message, time;
  final bool unread;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: unread ? AppColors.softGreen : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: unread ? Border.all(color: AppColors.green.withValues(alpha: 0.3)) : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: AppColors.softGreen,
              child: Icon(icon, color: AppColors.orange),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text(message,
                      style: const TextStyle(
                          color: AppColors.muted, height: 1.35)),
                  const SizedBox(height: 8),
                  Text(time,
                      style: const TextStyle(
                          color: AppColors.muted, fontSize: 11)),
                ],
              ),
            ),
            if (unread)
              const CircleAvatar(radius: 4, backgroundColor: AppColors.orange),
          ],
        ),
      );
}

