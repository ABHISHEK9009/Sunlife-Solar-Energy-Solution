import 'package:flutter/material.dart';
import '../errors/app_error.dart';

/// Used for read-only loads. Retrying this view never repeats a submission.
class DataState extends StatelessWidget {
  const DataState({super.key, this.message, this.onRetry});
  final String? message;
  final Future<void> Function()? onRetry;
  @override
  Widget build(BuildContext context) => SafeArea(
    child: Center(child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        if (message == null) const CircularProgressIndicator(),
        const SizedBox(height: 16),
        Text(message ?? AppMessages.loading, textAlign: TextAlign.center),
        if (message != null && onRetry != null)
          TextButton(onPressed: onRetry, child: const Text(AppMessages.retry)),
      ]),
    )),
  );
}
