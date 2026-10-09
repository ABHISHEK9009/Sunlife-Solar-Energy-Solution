import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/api_constants.dart';
import '../../core/models/solar_project.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/pill.dart';
import '../support/service_request_page.dart';
import 'widgets/progress_tracker.dart';
import 'widgets/update_tile.dart';

class ProjectPage extends StatefulWidget {
  const ProjectPage({super.key});

  @override
  State<ProjectPage> createState() => _ProjectPageState();
}

class _ProjectPageState extends State<ProjectPage> {
  SolarProject? _project;

  @override
  void initState() {
    super.initState();
    _loadProject();
    ProjectRepository.instance.addListener(_onProjectRepoChange);
  }

  @override
  void dispose() {
    ProjectRepository.instance.removeListener(_onProjectRepoChange);
    super.dispose();
  }

  void _onProjectRepoChange() {
    if (mounted) {
      setState(() {
        _project = ProjectRepository.instance.activeProject;
      });
    }
  }

  Future<void> _loadProject({bool forceRefresh = false}) async {
    final project = await ProjectRepository.instance.getCurrentProject(forceRefresh: forceRefresh);
    if (mounted) {
      setState(() {
        _project = project;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _project;
    final user = AuthRepository.instance.currentUser;
    final isEnquiryContext = p == null || ProjectRepository.instance.isEnquirySelected;

    if (isEnquiryContext) {
      return _buildPreInstallationJourney(context, user);
    }

    if (p.isCommissioned) {
      return _buildCommissionedPlantView(context, p);
    }

    return _buildActiveInstallationView(context, p);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PRE-INSTALLATION JOURNEY (ENQUIRY VIEW)
  // ───────────────────────────────────────────────────────────────────────────
  Widget _buildPreInstallationJourney(BuildContext context, dynamic user) {
    final city = user?.city ?? 'your location';
    final leadStatus = user?.leadStatus ?? 'ENQUIRY_RECEIVED';
    final advisorName = user?.advisorName ?? 'Sunlife Solar Desk';
    final advisorPhone = user?.advisorPhone ?? ApiConstants.supportPhone;

    return Frame(
      'My solar project',
      [
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'PRE-INSTALLATION STAGE',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Pill(leadStatus.replaceAll('_', ' '), greenText: true),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Solar Assessment & Feasibility',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Proposed Site: $city • Technical Advisor: $advisorName',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Consultation & design milestones'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              _PreInstallStep(
                title: '1. Requirement & Bill Assessment',
                description: 'Evaluation of monthly consumption and rooftop capacity requirements.',
                done: true,
              ),
              _PreInstallStep(
                title: '2. On-Site Feasibility Survey',
                description: 'Physical inspection of roof structure, 3D shadow analysis, and electrical service entrance.',
                done: leadStatus == 'SURVEY_COMPLETED' || leadStatus == 'QUOTATION_SENT',
                active: leadStatus == 'SURVEY_SCHEDULED',
              ),
              _PreInstallStep(
                title: '3. Custom System Design & BOQ',
                description: 'Optimal module layout drawing, inverter configuration, and government subsidy calculation.',
                done: leadStatus == 'QUOTATION_SENT',
                active: leadStatus == 'SURVEY_COMPLETED',
              ),
              _PreInstallStep(
                title: '4. Agreement & Booking Confirmation',
                description: 'Contract execution and registration on DISCOM / National Portal.',
                done: false,
                last: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Assigned technical contact'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              Info('Advisor', advisorName),
              Info('Support contact', advisorPhone),
              Info('Location', city),
              Info('DISCOM jurisdiction', 'MPMKVVCL / Regional Discom', last: true),
            ],
          ),
        ),
        const SizedBox(height: 20),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton.icon(
            onPressed: () => _loadProject(forceRefresh: true),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Refresh from CRM Database'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.deepGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
      onRefresh: () => _loadProject(forceRefresh: true),
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ACTIVE INSTALLATION VIEW
  // ───────────────────────────────────────────────────────────────────────────
  Widget _buildActiveInstallationView(BuildContext context, SolarProject p) {
    return Frame(
      'My solar project',
      [
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(p.id, style: const TextStyle(color: AppColors.muted)),
                  Pill('${p.currentStage.toUpperCase()} PENDING'),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                '${p.capacityKw} kW Rooftop Solar',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 5),
              Text('${p.projectType} • ${p.systemType}',
                  style: const TextStyle(color: AppColors.muted)),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Installation work listing'),
        const SizedBox(height: 12),
        CardBox(child: Progress(project: p)),
        const SizedBox(height: 22),

        const Heading('System & team details'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              Info('Installation address', p.address.isNotEmpty ? p.address : 'Site Address Pending'),
              Info('Assigned engineer', p.engineerName.isNotEmpty ? p.engineerName : 'Operations Team'),
              Info('Sales executive', p.salesExecutive.isNotEmpty ? p.salesExecutive : 'Sunlife Desk'),
              Info('DISCOM', p.discom.isNotEmpty ? p.discom : 'Pending Registration'),
              Info('Panels', p.panels.isNotEmpty ? p.panels : 'Tier-1 High Efficiency'),
              Info('Inverter', p.inverter.isNotEmpty ? p.inverter : 'Smart Solar Inverter', last: true),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Recent updates'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              if (p.timelineEvents.isNotEmpty) ...[
                for (var i = 0; i < p.timelineEvents.take(3).length; i++)
                  UpdateTile(
                    DateFormat('dd MMM').format(p.timelineEvents[i].eventDateTime),
                    p.timelineEvents[i].eventTitle,
                    p.timelineEvents[i].customerDescription,
                    last: i == p.timelineEvents.take(3).length - 1,
                  ),
              ] else
                UpdateTile(
                  'Live',
                  'Current stage: ${p.currentStage}',
                  'Operations team actively working on the current milestone.',
                  last: true,
                ),
            ],
          ),
        ),
      ],
      onRefresh: () => _loadProject(forceRefresh: true),
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. COMMISSIONED SOLAR PLANT VIEW
  // ───────────────────────────────────────────────────────────────────────────
  Widget _buildCommissionedPlantView(BuildContext context, SolarProject p) {
    final commDateStr = p.commissioningDate != null
        ? DateFormat('dd MMM yyyy').format(p.commissioningDate!)
        : 'Operational';

    return Frame(
      'My solar plant',
      [
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'OPERATIONAL SOLAR ASSET',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Pill('COMMISSIONED', greenText: true),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                '${p.capacityKw} kW Rooftop Solar',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Plant ID: ${p.id} • ${p.systemType}',
                style: const TextStyle(color: Colors.white60),
              ),
              const SizedBox(height: 16),
              const Divider(color: Colors.white12),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ProjectStat('COMMISSIONED ON', commDateStr),
                  ),
                  Expanded(
                    child: ProjectStat('GRID SYNCHRONIZATION', 'VERIFIED'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Plant equipment specifications'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              Info('Installation address', p.address),
              Info('Solar panels', p.panels),
              Info('Inverter unit', p.inverter),
              Info('DISCOM', p.discom),
              Info('Consumer number', p.consumerNumber ?? 'Registered'),
              Info('Commissioning authority', 'Sunlife Solar Technical Bureau', last: true),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Warranty & handover status'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              Info('Handover certificate', 'Verified & Issued'),
              Info('Solar panel performance', '25-Year Manufacturer Warranty'),
              Info('Inverter product warranty', '5-Year Manufacturer Warranty'),
              Info('After-sales support', 'Active • Sunlife Priority Helpdesk', last: true),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Service & Maintenance Action
        CardBox(
          color: AppColors.softGreen,
          child: Row(
            children: [
              const Icon(Icons.handyman_outlined, color: AppColors.deepGreen, size: 24),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Routine Maintenance & Cleaning',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Schedule expert panel cleaning or an electrical inspection.',
                      style: TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              FilledButton(
                onPressed: () => openPage(context, const ServiceRequestPage()),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.deepGreen,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
                child: const Text('Book', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        const Heading('Installation history'),
        const SizedBox(height: 12),
        CardBox(child: Progress(project: p)),
      ],
      onRefresh: () => _loadProject(forceRefresh: true),
    );
  }
}

class _PreInstallStep extends StatelessWidget {
  const _PreInstallStep({
    required this.title,
    required this.description,
    this.done = false,
    this.active = false,
    this.last = false,
  });

  final String title;
  final String description;
  final bool done, active, last;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: last ? 0 : 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              done
                  ? Icons.check_circle_rounded
                  : active
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
              color: done
                  ? AppColors.green
                  : active
                      ? AppColors.deepGreen
                      : AppColors.muted,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: done || active ? AppColors.ink : AppColors.muted,
                      fontWeight: active ? FontWeight.w900 : FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
}
