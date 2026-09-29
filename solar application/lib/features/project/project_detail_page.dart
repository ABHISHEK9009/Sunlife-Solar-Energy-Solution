import 'package:flutter/material.dart';
import '../../core/models/solar_project.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/pill.dart';
import '../../core/widgets/sub_page.dart';
import 'widgets/progress_tracker.dart';

class ProjectDetailPage extends StatefulWidget {
  const ProjectDetailPage({super.key});

  @override
  State<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends State<ProjectDetailPage> {
  SolarProject? _project;

  @override
  void initState() {
    super.initState();
    _loadProject();
  }

  Future<void> _loadProject() async {
    final project = await ProjectRepository.instance.getCurrentProject();
    if (mounted) {
      setState(() => _project = project);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _project;

    if (p == null) {
      return SubPage(
        title: 'Project details',
        onRefresh: _loadProject,
        children: const [
          CardBox(
            child: Column(
              children: [
                SizedBox(height: 20),
                Icon(Icons.solar_power_outlined, size: 52, color: AppColors.muted),
                SizedBox(height: 16),
                Text(
                  'No Active Project',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
                ),
                SizedBox(height: 8),
                Text(
                  'There is no active installation record for your account yet. Real-time project milestones will appear here after site survey approval.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted, height: 1.45),
                ),
                SizedBox(height: 20),
              ],
            ),
          ),
        ],
      );
    }

    return SubPage(
      title: 'Project details',
      onRefresh: _loadProject,
      children: [
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Pill('${p.currentStage.toUpperCase()} PENDING'),
              const SizedBox(height: 14),
              Text(
                '${p.capacityKw} kW Rooftop Solar',
                style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 5),
              Text('Project ${p.id} • ${p.address.isNotEmpty ? p.address : "Site Address"}',
                  style: const TextStyle(color: AppColors.muted)),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Heading('Complete journey'),
        const SizedBox(height: 12),
        CardBox(child: Progress(project: p)),
        const SizedBox(height: 20),
        const Heading('What happens next?'),
        const SizedBox(height: 12),
        CardBox(
          color: AppColors.softGreen,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${p.currentStage} review',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
              ),
              const SizedBox(height: 6),
              const Text(
                'Your application is under active processing. Our team is coordinating with DISCOM for meter synchronization.',
                style: TextStyle(color: AppColors.muted, height: 1.4),
              ),
              const SizedBox(height: 12),
              Info('Expected update', 'Within ${p.expectedUpdateDays}', last: true),
            ],
          ),
        ),
      ],
    );
  }
}

