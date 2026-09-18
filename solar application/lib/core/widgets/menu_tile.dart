import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class MenuTile extends StatelessWidget {
  const MenuTile(
    this.icon,
    this.label,
    this.detail, {
    super.key,
    this.last = false,
    this.onTap,
  });

  final IconData icon;
  final String label, detail;
  final bool last;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          border: last
              ? null
              : const Border(bottom: BorderSide(color: AppColors.cardBorder)),
        ),
        child: ListTile(
          onTap: onTap,
          leading: Icon(icon, color: AppColors.ink),
          title: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          subtitle: detail.isEmpty ? null : Text(detail),
          trailing: const Icon(Icons.chevron_right),
        ),
      );
}
