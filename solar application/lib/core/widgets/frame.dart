import 'package:flutter/material.dart';
import '../network/connectivity_service.dart';

class Frame extends StatelessWidget {
  const Frame(
    this.title,
    this.children, {
    super.key,
    this.action,
    this.onRefresh,
    this.sliverBody,
  });

  final String title;
  final List<Widget> children;
  final Widget? action;
  final Future<void> Function()? onRefresh;
  final Widget? sliverBody;

  @override
  Widget build(BuildContext context) {
    Widget scrollView = CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, sliverBody != null ? 12 : 30),
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
        if (sliverBody != null)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
            sliver: sliverBody!,
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

