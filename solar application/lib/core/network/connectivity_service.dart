import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

class ConnectivityService {
  ConnectivityService._internal() {
    _init();
  }

  static final ConnectivityService instance = ConnectivityService._internal();

  final ValueNotifier<bool> isOnlineNotifier = ValueNotifier<bool>(true);
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool get isOnline => isOnlineNotifier.value;

  void _init() {
    try {
      Connectivity().checkConnectivity().then(_updateStatus).catchError((_) {});
      _subscription = Connectivity().onConnectivityChanged.listen(_updateStatus);
    } catch (_) {
      // Fallback
    }
  }

  void _updateStatus(List<ConnectivityResult> results) {
    final online = results.any((r) => r != ConnectivityResult.none);
    if (isOnlineNotifier.value != online) {
      isOnlineNotifier.value = online;
    }
  }

  void dispose() {
    _subscription?.cancel();
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<bool>(
        valueListenable: ConnectivityService.instance.isOnlineNotifier,
        builder: (context, isOnline, _) {
          if (isOnline) return const SizedBox.shrink();
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            color: const Color(0xFFC2410C),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.wifi_off_rounded, color: Colors.white, size: 16),
                SizedBox(width: 8),
                Text(
                  'Working offline • Cached data displayed',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          );
        },
      );
}
