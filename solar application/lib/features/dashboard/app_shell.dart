import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../documents/documents_home_page.dart';
import '../home/home_page.dart';
import '../profile/profile_page.dart';
import '../project/project_page.dart';
import '../support/service_page.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int index = 0;

  static const pages = [
    HomePage(),
    ProjectPage(),
    DocumentsHomePage(),
    ServicePage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: index == 0,
        onPopInvokedWithResult: (didPop, result) {
          if (!didPop && index != 0) {
            setState(() => index = 0);
          }
        },
        child: Scaffold(
          body: IndexedStack(index: index, children: pages),
          bottomNavigationBar: NavigationBar(
            height: 70,
            selectedIndex: index,
            indicatorColor: AppColors.green.withValues(alpha: .18),
            onDestinationSelected: (value) => setState(() => index = value),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: 'Home',
              ),
              NavigationDestination(
                icon: Icon(Icons.route_outlined),
                selectedIcon: Icon(Icons.route),
                label: 'Project',
              ),
              NavigationDestination(
                icon: Icon(Icons.folder_outlined),
                selectedIcon: Icon(Icons.folder),
                label: 'Documents',
              ),
              NavigationDestination(
                icon: Icon(Icons.support_agent_outlined),
                selectedIcon: Icon(Icons.support_agent),
                label: 'Service',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      );
}
