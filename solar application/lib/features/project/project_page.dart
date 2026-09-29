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
    final p = _project;

    if (p == null) {
      return Frame(
        'My project',
        [
          CardBox(
            child: Column(
              children: [
                const SizedBox(height: 20),
                const Icon(Icons.solar_power_outlined, size: 56, color: AppColors.muted),
                const SizedBox(height: 16),
                const Text(
                  'No Active Solar Plant',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                const Text(
                  'You do not have an active solar installation commissioned in the CRM database yet.\n\nOnce your rooftop site survey and quotation are confirmed, your installation project will be tracked here in real-time.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted, height: 1.45),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    onPressed: () => _loadProject(forceRefresh: true),
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Refresh from Database'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.deepGreen,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
        onRefresh: () => _loadProject(forceRefresh: true),
      );
    }

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
              UpdateTile(
                'Live',
                'Current stage: ${p.currentStage}',
                'Expected update within ${p.expectedUpdateDays}',
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

