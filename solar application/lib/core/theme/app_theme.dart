import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.canvas,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.green,
          primary: AppColors.deepGreen,
          surface: AppColors.canvas,
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            fontWeight: FontWeight.w900,
            color: AppColors.ink,
          ),
          titleLarge: TextStyle(
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
          bodyMedium: TextStyle(color: AppColors.muted),
        ),
      );
}
