import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/theme/app_colors.dart';
import '../documents/documents_home_page.dart';
import '../enquiry/new_property_enquiry_sheet.dart';
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
  int _tabIndex = 0;

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
    final isEnquirySelected = ProjectRepository.instance.isEnquirySelected;

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
                'My Solar Properties & Enquiries',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.ink),
              ),
              const SizedBox(height: 6),
              const Text(
                'Switch between your installation sites or track new property consultations.',
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 18),

              // Linked Customer Projects
              for (final p in prjs)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: active?.id == p.id && !isEnquirySelected ? AppColors.green : AppColors.cardBorder,
                      width: active?.id == p.id && !isEnquirySelected ? 2 : 1,
                    ),
                  ),
                  leading: CircleAvatar(
                    backgroundColor: active?.id == p.id && !isEnquirySelected ? AppColors.softGreen : AppColors.canvas,
                    child: Icon(
                      Icons.solar_power_rounded,
                      color: active?.id == p.id && !isEnquirySelected ? AppColors.deepGreen : AppColors.muted,
                    ),
                  ),
                  title: Text(
                    (p.projectName?.isNotEmpty == true) ? p.projectName! : '${p.capacityKw} kW Solar',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  subtitle: Text(
                    '${p.address.isNotEmpty ? p.address : "Installed Site"} • ${p.isCommissioned ? "OPERATIONAL" : p.status}',
                  ),
                  trailing: active?.id == p.id && !isEnquirySelected
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.green)
                      : null,
                  onTap: () {
                    ProjectRepository.instance.setActiveProject(p);
                    Navigator.pop(sheetContext);
                  },
                ),

              // Open Enquiry / Consultation
              if (openEnquiry != null) ...[
                const SizedBox(height: 8),
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: isEnquirySelected ? AppColors.orange : AppColors.cardBorder,
                      width: isEnquirySelected ? 2 : 1,
                    ),
                  ),
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFFFEF3C7),
                    child: Icon(Icons.pending_actions_rounded,
                        color: isEnquirySelected ? AppColors.orange : AppColors.muted),
                  ),
                  title: Text(
                    '${openEnquiry['propertyType'] ?? 'Solar'} Consultation',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  subtitle: Text('${openEnquiry['city'] ?? "Site"} • ${openEnquiry['status'] ?? "Survey Pending"}'),
                  trailing: isEnquirySelected
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.orange)
                      : null,
                  onTap: () {
                    ProjectRepository.instance.selectEnquiry();
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
    final activeProject = ProjectRepository.instance.activeProject;
    final openEnquiry = ProjectRepository.instance.openEnquiry;
    final isEnquiry = ProjectRepository.instance.isEnquirySelected;

    // 5-Tab Consistent Client Portal Pages
    const portalPages = [
      HomePage(),
      ProjectPage(),
      ServicePage(),
      DocumentsHomePage(),
      ProfilePage(),
    ];

    // Dynamic top bar label
    String propertyLabel;
    if (activeProject != null && !isEnquiry) {
      propertyLabel = '${activeProject.capacityKw} kW • ${activeProject.projectName ?? activeProject.projectType}';
    } else if (openEnquiry != null) {
      propertyLabel = '${openEnquiry['propertyType'] ?? 'Solar'} Consultation';
    } else {
      propertyLabel = 'My Solar';
    }

    return PopScope(
      canPop: _tabIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _tabIndex != 0) {
          setState(() => _tabIndex = 0);
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
                  Icon(
                    isEnquiry ? Icons.pending_actions_rounded : Icons.home_outlined,
                    color: isEnquiry ? AppColors.orange : AppColors.deepGreen,
                    size: 16,
                  ),
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
        body: IndexedStack(index: _tabIndex, children: portalPages),
        bottomNavigationBar: NavigationBar(
          height: 70,
          selectedIndex: _tabIndex,
          indicatorColor: AppColors.green.withValues(alpha: .18),
          onDestinationSelected: (v) => setState(() => _tabIndex = v),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.solar_power_outlined),
              selectedIcon: Icon(Icons.solar_power),
              label: 'My Solar',
            ),
            NavigationDestination(
              icon: Icon(Icons.miscellaneous_services_outlined),
              selectedIcon: Icon(Icons.miscellaneous_services_rounded),
              label: 'Services',
            ),
            NavigationDestination(
              icon: Icon(Icons.folder_outlined),
              selectedIcon: Icon(Icons.folder),
              label: 'Documents',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }
}
