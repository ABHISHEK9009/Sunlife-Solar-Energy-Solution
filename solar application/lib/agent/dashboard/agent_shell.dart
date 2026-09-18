import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../leads/agent_leads_page.dart';
import '../profile/agent_profile_page.dart';
import '../tasks/agent_tasks_page.dart';
import '../visits/agent_visits_page.dart';
import 'agent_dashboard.dart';

class AgentShell extends StatefulWidget {
  const AgentShell({super.key});

  @override
  State<AgentShell> createState() => _AgentShellState();
}

class _AgentShellState extends State<AgentShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      AgentDashboard(onOpenTab: (value) => setState(() => index = value)),
      const AgentLeadsPage(),
      const AgentVisitsPage(),
      const AgentTasksPage(),
      const AgentProfilePage(),
    ];
    return PopScope(
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
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard_rounded),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.people_outline_rounded),
              selectedIcon: Icon(Icons.people_rounded),
              label: 'Leads',
            ),
            NavigationDestination(
              icon: Icon(Icons.location_on_outlined),
              selectedIcon: Icon(Icons.location_on_rounded),
              label: 'Visits',
            ),
            NavigationDestination(
              icon: Icon(Icons.task_alt_outlined),
              selectedIcon: Icon(Icons.task_alt_rounded),
              label: 'Tasks',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
