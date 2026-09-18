import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'agent/dashboard/agent_shell.dart';
import 'core/repositories/auth_repository.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_page.dart';
import 'features/dashboard/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Production global error boundaries
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError caught: ${details.exceptionAsString()}');
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('PlatformDispatcher error: $error\n$stack');
    return true;
  };

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Check stored user session
  Widget homeWidget = const LoginPage();
  try {
    final user = await AuthRepository.instance.loadStoredSession();
    if (user != null) {
      homeWidget = user.role == 'agent' ? const AgentShell() : const AppShell();
    }
  } catch (_) {
    homeWidget = const LoginPage();
  }

  runApp(SunlifeCustomerApp(initialHome: homeWidget));
}

class SunlifeCustomerApp extends StatelessWidget {
  const SunlifeCustomerApp({super.key, this.initialHome = const LoginPage()});

  final Widget initialHome;

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Sunlife Solar',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: initialHome,
      );
}
