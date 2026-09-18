import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class Heading extends StatelessWidget {
  const Heading(this.text, {super.key, this.action, this.onAction});

  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(text, style: Theme.of(context).textTheme.titleLarge),
          if (action != null)
            TextButton(
              onPressed: onAction,
              child: Text(
                action!,
                style: const TextStyle(
                  color: AppColors.orange,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
        ],
      );
}
