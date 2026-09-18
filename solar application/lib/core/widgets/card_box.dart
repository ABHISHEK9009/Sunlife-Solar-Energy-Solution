import 'package:flutter/material.dart';

class CardBox extends StatelessWidget {
  const CardBox({
    super.key,
    required this.child,
    this.color = Colors.white,
    this.padding = const EdgeInsets.all(18),
  });

  final Widget child;
  final Color color;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Material(
        color: color,
        borderRadius: BorderRadius.circular(24),
        elevation: 1,
        shadowColor: const Color(0x18000000),
        clipBehavior: Clip.antiAlias,
        child: Padding(padding: padding, child: child),
      );
}
