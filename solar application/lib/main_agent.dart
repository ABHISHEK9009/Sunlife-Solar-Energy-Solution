import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'agent/auth/agent_login_page.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const SunlifeAgentApp());
}

class SunlifeAgentApp extends StatelessWidget {
  const SunlifeAgentApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Sunlife Field Partner',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme.copyWith(
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.deepGreen,
            primary: AppColors.deepGreen,
            surface: AppColors.canvas,
          ),
        ),
        home: const AgentLoginPage(),
      );
}
