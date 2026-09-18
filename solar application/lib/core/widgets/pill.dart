import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class Pill extends StatelessWidget {
  const Pill(this.label, {super.key, this.greenText = false});

  final String label;
  final bool greenText;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.softGreen,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: greenText ? AppColors.deepGreen : AppColors.ink,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: .8,
          ),
        ),
      );
}
