import 'core/errors/error_feedback.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'agent/auth/agent_login_page.dart';
import 'agent/dashboard/agent_shell.dart';
import 'core/repositories/auth_repository.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  ErrorFeedback.install();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  Widget initialHome = const AgentLoginPage();
  try {
    final user = await AuthRepository.instance.loadStoredSession();
    if (user != null && user.role == 'agent') {
      initialHome = const AgentShell();
    }
  } catch (_) {
    initialHome = const AgentLoginPage();
  }

  runApp(SunlifeAgentApp(initialHome: initialHome));
}

class SunlifeAgentApp extends StatelessWidget {
  const SunlifeAgentApp({super.key, this.initialHome = const AgentLoginPage()});

  final Widget initialHome;

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Sunlife Field Partner',
        debugShowCheckedModeBanner: false,
        scaffoldMessengerKey: ErrorFeedback.messengerKey,
        theme: AppTheme.lightTheme.copyWith(
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.deepGreen,
            primary: AppColors.deepGreen,
            surface: AppColors.canvas,
          ),
        ),
        home: initialHome,
      );
}
