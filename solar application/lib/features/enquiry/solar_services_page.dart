import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../support/service_page.dart';

class SolarServicesPage extends StatelessWidget {
  const SolarServicesPage({super.key, this.isStandalone = true});

  final bool isStandalone;

  @override
  Widget build(BuildContext context) {
    if (isStandalone) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppColors.ink),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Solar Consultancy & Solutions',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 18,
              color: AppColors.ink,
            ),
          ),
        ),
        body: const ServicePage(),
      );
    }

    return const ServicePage();
  }
}
