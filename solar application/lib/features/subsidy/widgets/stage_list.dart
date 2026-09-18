import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class StageList extends StatelessWidget {
  const StageList({super.key, required this.items, required this.completed});

  final List<String> items;
  final int completed;

  @override
  Widget build(BuildContext context) => Column(
        children: List.generate(
          items.length,
          (i) => Padding(
            padding: EdgeInsets.only(bottom: i == items.length - 1 ? 0 : 14),
            child: Row(
              children: [
                Icon(
                  i < completed
                      ? Icons.check_circle
                      : i == completed
                          ? Icons.hourglass_bottom
                          : Icons.circle_outlined,
                  color: i < completed
                      ? AppColors.green
                      : i == completed
                          ? AppColors.orange
                          : AppColors.muted,
                  size: 21,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    items[i],
                    style: TextStyle(
                      fontWeight: i == completed
                          ? FontWeight.w900
                          : FontWeight.w600,
                      color: i <= completed ? AppColors.ink : AppColors.muted,
                    ),
                  ),
                ),
                if (i == completed)
                  const Text(
                    'CURRENT',
                    style: TextStyle(
                      color: AppColors.orange,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
}
