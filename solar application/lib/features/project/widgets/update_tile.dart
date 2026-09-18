import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class UpdateTile extends StatelessWidget {
  const UpdateTile(
    this.date,
    this.title,
    this.subtitle, {
    super.key,
    this.last = false,
  });

  final String date, title, subtitle;
  final bool last;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: last ? 0 : 20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 52,
              child: Text(
                date,
                style: const TextStyle(
                  color: AppColors.orange,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const Icon(Icons.check_circle, color: AppColors.green, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                        color: AppColors.muted, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
}
