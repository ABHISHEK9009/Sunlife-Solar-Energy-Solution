import 'package:flutter/material.dart';
import '../network/connectivity_service.dart';
import '../theme/app_colors.dart';

class SubPage extends StatelessWidget {
  const SubPage({
    super.key,
    required this.title,
    required this.children,
    this.bottom,
    this.onRefresh,
  });

  final String title;
  final List<Widget> children;
  final Widget? bottom;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    Widget bodyContent = ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 30),
      children: children,
    );

    if (onRefresh != null) {
      bodyContent = RefreshIndicator(
        onRefresh: onRefresh!,
        child: bodyContent,
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        backgroundColor: AppColors.canvas,
      ),
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            Expanded(child: bodyContent),
          ],
        ),
      ),
      bottomNavigationBar: bottom == null
          ? null
          : SafeArea(
              minimum: const EdgeInsets.all(16),
              child: bottom!,
            ),
    );
  }
}

