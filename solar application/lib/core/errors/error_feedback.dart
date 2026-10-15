import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'app_error.dart';

/// Contains no exception text, request data, identifiers or credentials.
abstract final class ErrorFeedback {
  static final messengerKey = GlobalKey<ScaffoldMessengerState>();

  static void show(Object error) {
    final failure = ErrorMapper.map(error);
    if (kDebugMode) debugPrint('Sunlife operation failed: ${failure.kind.name} | details: $error');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final messenger = messengerKey.currentState;
      if (messenger == null) return;
      messenger.hideCurrentSnackBar();
      messenger.showSnackBar(SnackBar(content: Text(failure.message)));
    });
  }

  static void install() {
    ErrorWidget.builder = (_) => const SafeErrorView();
    FlutterError.onError = (details) {
      final msg = details.exceptionAsString();
      if (msg.contains('overflowed') || msg.contains('RenderFlex')) {
        FlutterError.presentError(details);
        return;
      }
      show(details.exception);
    };
    PlatformDispatcher.instance.onError = (error, stack) {
      show(error);
      return true;
    };
  }
}

class SafeErrorView extends StatelessWidget {
  const SafeErrorView({super.key, this.onRetry});
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    child: Center(child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Sunlife Solar', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Text(AppMessages.failure(FailureKind.unknown), textAlign: TextAlign.center),
        const SizedBox(height: 12),
        if (onRetry != null)
          TextButton(onPressed: onRetry, child: const Text(AppMessages.retry))
        else
          const Text('Close and reopen the app. If the problem continues, contact Sunlife Solar.', textAlign: TextAlign.center),
      ]),
    )),
  );
}
