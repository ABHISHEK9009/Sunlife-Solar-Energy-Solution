import 'package:flutter/material.dart';
import '../../core/models/solar_project.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/pill.dart';
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
    final p = _project ??
        const SolarProject(
          id: 'SS-2026-00452',
          capacityKw: 5,
          projectType: 'Residential',
          systemType: 'On-grid',
          status: 'IN PROGRESS',
          currentStage: 'Net metering',
          expectedUpdateDays: '5–7 days',
          address: 'Vaishali Nagar, Jaipur',
          discom: 'JVVNL',
          panels: 'Adani Solar 540W',
          inverter: 'Sungrow 5 kW',
          engineerName: 'Amit Sharma',
          salesExecutive: 'Priya Verma',
          completedStages: 4,
          totalStages: 6,
          stages: [
            'Site survey',
            'Quotation approved',
            'Documents submitted',
            'Installation',
            'Net metering',
            'Subsidy credit',
          ],
        );

    return Frame(
      'My project',
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
        const Heading('Current progress'),
        const SizedBox(height: 12),
        CardBox(child: Progress(project: p)),
        const SizedBox(height: 22),
        const Heading('System details'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              Info('Installation address', p.address),
              Info('Assigned engineer', p.engineerName),
              Info('Sales executive', p.salesExecutive),
              Info('DISCOM', p.discom),
              Info('Panels', p.panels),
              Info('Inverter', p.inverter, last: true),
            ],
          ),
        ),
        const SizedBox(height: 22),
        const Heading('Recent updates'),
        const SizedBox(height: 12),
        const CardBox(
          child: Column(
            children: [
              UpdateTile(
                '09 Sep',
                'Installation completed',
                'System tested successfully',
              ),
              UpdateTile(
                '07 Sep',
                'Material dispatched',
                'Reached Jaipur warehouse',
              ),
              UpdateTile(
                '05 Sep',
                'Advance payment received',
                '₹50,000 confirmed',
                last: true,
              ),
            ],
          ),
        ),
      ],
      onRefresh: () => _loadProject(forceRefresh: true),
    );
  }
}

