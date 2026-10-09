import 'package:flutter/material.dart';
import '../../../core/models/solar_project.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/pill.dart';

class Progress extends StatefulWidget {
  const Progress({super.key, this.project});

  final SolarProject? project;

  @override
  State<Progress> createState() => _ProgressState();
}

class _ProgressState extends State<Progress> {
  bool expanded = false;

  @override
  Widget build(BuildContext context) {
    final p = widget.project;
    final milestones = p?.milestones ?? [];
    final total = milestones.length;
    final completed = milestones.where((m) => m.isCompleted).length;
    final currentMilestone = milestones.firstWhere(
      (m) => m.isCurrent,
      orElse: () => milestones.isNotEmpty ? milestones.last : const ProjectMilestone(
        title: 'Project Initialized',
        department: 'Operations',
        status: 'PENDING',
        description: 'Initial customer consultation in progress.',
        isCompleted: false,
        isCurrent: true,
      ),
    );
    final status = p?.status ?? 'PENDING';
    final progressVal = total > 0 ? (completed / total).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '$completed of $total milestones verified',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
            Pill(p?.isCommissioned == true ? 'OPERATIONAL' : status, greenText: true),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(10)),
          child: LinearProgressIndicator(
            value: progressVal,
            minHeight: 8,
            color: AppColors.green,
            backgroundColor: AppColors.softGreen,
          ),
        ),
        const SizedBox(height: 15),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.engineering_outlined,
                color: AppColors.deepGreen, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    currentMilestone.title,
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${currentMilestone.department} • ${currentMilestone.description}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.3),
                  ),
                  if (currentMilestone.customerAction != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Action required: ${currentMilestone.customerAction}',
                        style: const TextStyle(color: Color(0xFF92400E), fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (expanded) ...[
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 14),
          for (var i = 0; i < milestones.length; i++)
            _MilestoneStepTile(
              milestone: milestones[i],
              index: i + 1,
              last: i == milestones.length - 1,
            ),
        ],
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () => setState(() => expanded = !expanded),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.deepGreen,
              padding: const EdgeInsets.only(top: 8),
              visualDensity: VisualDensity.compact,
            ),
            icon: Icon(
              expanded ? Icons.expand_less_rounded : Icons.expand_more_rounded,
              size: 20,
            ),
            label: Text(expanded ? 'Hide full work listing' : 'View all $total milestones'),
          ),
        ),
      ],
    );
  }
}

class _MilestoneStepTile extends StatelessWidget {
  const _MilestoneStepTile({
    required this.milestone,
    required this.index,
    required this.last,
  });

  final ProjectMilestone milestone;
  final int index;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final done = milestone.isCompleted;
    final active = milestone.isCurrent;

    return Padding(
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
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '$index. ${milestone.title}',
                        style: TextStyle(
                          color: done || active ? AppColors.ink : AppColors.muted,
                          fontWeight: active ? FontWeight.w900 : FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (active)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.softGreen,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'IN PROGRESS',
                          style: TextStyle(
                            color: AppColors.deepGreen,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      )
                    else if (done)
                      Text(
                        milestone.status,
                        style: const TextStyle(
                          color: AppColors.green,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  milestone.description,
                  style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.3),
                ),
                if (milestone.requiredEvidence != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Evidence: ${milestone.requiredEvidence}',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
