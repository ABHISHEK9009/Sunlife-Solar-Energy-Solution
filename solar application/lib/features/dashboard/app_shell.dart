import 'package:flutter/material.dart';
import '../../core/models/user_profile.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/theme/app_colors.dart';
import '../calculator/calculator_page.dart';
import '../documents/documents_home_page.dart';
import '../enquiry/enquiry_dashboard_view.dart';
import '../enquiry/new_property_enquiry_sheet.dart';
import '../enquiry/solar_services_page.dart';
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
  int _customerIndex = 0;
  int _leadIndex = 0;

  @override
  void initState() {
    super.initState();
    AuthRepository.instance.addListener(_handleStateChange);
    ProjectRepository.instance.addListener(_handleStateChange);
    // Refresh identity & projects
    AuthRepository.instance.fetchMe();
    ProjectRepository.instance.getCurrentProject();
  }

  @override
  void dispose() {
    AuthRepository.instance.removeListener(_handleStateChange);
    ProjectRepository.instance.removeListener(_handleStateChange);
    super.dispose();
  }

  void _handleStateChange() {
    if (mounted) setState(() {});
  }

  void _showPropertySwitcher(BuildContext context) {
    final prjs = ProjectRepository.instance.allProjects;
    final active = ProjectRepository.instance.activeProject;
    final openEnquiry = ProjectRepository.instance.openEnquiry;

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'My Solar Properties',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.ink),
              ),
              const SizedBox(height: 6),
              const Text(
                'Switch between your installation sites or track new enquiries.',
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 18),

              // Linked Projects
              for (final p in prjs)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: active?.id == p.id ? AppColors.green : AppColors.cardBorder,
                      width: active?.id == p.id ? 2 : 1,
                    ),
                  ),
                  leading: CircleAvatar(
                    backgroundColor: active?.id == p.id ? AppColors.softGreen : AppColors.canvas,
                    child: Icon(Icons.solar_power_rounded, color: active?.id == p.id ? AppColors.deepGreen : AppColors.muted),
                  ),
                  title: Text(
                    (p.projectName?.isNotEmpty == true) ? p.projectName! : '${p.capacityKw} kW Solar',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  subtitle: Text('${p.address.isNotEmpty ? p.address : "Installed Site"} • ${p.status}'),
                  trailing: active?.id == p.id
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.green)
                      : null,
                  onTap: () {
                    ProjectRepository.instance.setActiveProject(p);
                    Navigator.pop(sheetContext);
                  },
                ),

              if (openEnquiry != null) ...[
                const SizedBox(height: 8),
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: const BorderSide(color: AppColors.orange, width: 1.5),
                  ),
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFEF3C7),
                    child: Icon(Icons.pending_actions_rounded, color: AppColors.orange),
                  ),
                  title: Text(
                    '${openEnquiry['propertyType'] ?? 'Commercial'} Solar Enquiry',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  subtitle: Text('${openEnquiry['city'] ?? "Site"} • ${openEnquiry['status'] ?? "Survey Pending"}'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                  },
                ),
              ],

              const SizedBox(height: 16),
              // + Add New Property Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    showModalBottomSheet<void>(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.white,
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                      ),
                      builder: (_) => const NewPropertyEnquirySheet(),
                    );
                  },
                  icon: const Icon(Icons.add_home_work_outlined, size: 20),
                  label: const Text('Add Another Property / Enquiry', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthRepository.instance.currentUser;
    final projects = ProjectRepository.instance.allProjects;
    final isExplicitLead = user?.isLead ?? true;
    final hasProjects = projects.isNotEmpty;
    // Real-time synchronization check:
    // If user is a lead or has no active solar plant installed in the CRM database,
    // present the New Customer Journey Hub.
    final isLead = isExplicitLead || (ProjectRepository.instance.hasFetched && !hasProjects);
    final activeProject = ProjectRepository.instance.activeProject;

    // ─── 1. LEAD EXPERIENCE (4-Tab Dynamic Shell) ──────────────────────
    if (isLead) {
      final leadPages = [
        EnquiryDashboardView(user: user ?? const UserProfile(id: '', name: 'Valued Customer', phone: '', role: 'customer')),
        const SolarServicesPage(),
        const CalculatorPage(),
        const ProfilePage(),
      ];

      return Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
          title: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => _showPropertySwitcher(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.softGreen,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.green.withValues(alpha: .3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.solar_power, color: AppColors.deepGreen, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    user?.city != null ? '${user!.city} Consultation' : 'Solar Consultation',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.deepGreen),
                  ),
                  const Icon(Icons.arrow_drop_down, color: AppColors.deepGreen, size: 18),
                ],
              ),
            ),
          ),
        ),
        body: IndexedStack(index: _leadIndex, children: leadPages),
        bottomNavigationBar: NavigationBar(
          height: 70,
          selectedIndex: _leadIndex,
          indicatorColor: AppColors.green.withValues(alpha: .18),
          onDestinationSelected: (v) => setState(() => _leadIndex = v),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.track_changes_outlined),
              selectedIcon: Icon(Icons.track_changes),
              label: 'My Journey',
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view_rounded),
              label: 'Services',
            ),
            NavigationDestination(
              icon: Icon(Icons.calculate_outlined),
              selectedIcon: Icon(Icons.calculate),
              label: 'Calculator',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      );
    }

    // ─── 2. ACTIVE CUSTOMER EXPERIENCE (5-Tab Standard Shell) ────────────
    const customerPages = [
      HomePage(),
      ProjectPage(),
      DocumentsHomePage(),
      ServicePage(),
      ProfilePage(),
    ];

    final propertyLabel = activeProject != null
        ? '${activeProject.capacityKw} kW • ${activeProject.projectType}'
        : 'My Solar Plant';

    return PopScope(
      canPop: _customerIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _customerIndex != 0) {
          setState(() => _customerIndex = 0);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
          title: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => _showPropertySwitcher(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.home_outlined, color: AppColors.deepGreen, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    propertyLabel,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.ink),
                  ),
                  const Icon(Icons.arrow_drop_down, color: AppColors.muted, size: 18),
                ],
              ),
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_home_outlined, color: AppColors.ink),
              tooltip: 'Add Property',
              onPressed: () => _showPropertySwitcher(context),
            ),
          ],
        ),
        body: IndexedStack(index: _customerIndex, children: customerPages),
        bottomNavigationBar: NavigationBar(
          height: 70,
          selectedIndex: _customerIndex,
          indicatorColor: AppColors.green.withValues(alpha: .18),
          onDestinationSelected: (v) => setState(() => _customerIndex = v),
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
}
