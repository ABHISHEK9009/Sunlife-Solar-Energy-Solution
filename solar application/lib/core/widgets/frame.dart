import 'package:flutter/material.dart';
import '../network/connectivity_service.dart';

class Frame extends StatelessWidget {
  const Frame(
    this.title,
    this.children, {
    super.key,
    this.action,
    this.onRefresh,
  });

  final String title;
  final List<Widget> children;
  final Widget? action;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    Widget scrollView = CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
          sliver: SliverList.list(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                  ?action,
                ],
              ),
              const SizedBox(height: 22),
              ...children,
            ],
          ),
        ),
      ],
    );

    if (onRefresh != null) {
      scrollView = RefreshIndicator(
        onRefresh: onRefresh!,
        child: scrollView,
      );
    }

    return SafeArea(
      child: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: scrollView),
        ],
      ),
    );
  }
}

