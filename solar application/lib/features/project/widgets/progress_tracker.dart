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

  static const defaultItems = [
    'Site survey',
    'Quotation approved',
    'Documents submitted',
    'Installation',
    'Net metering',
    'Subsidy credit',
  ];

  @override
  Widget build(BuildContext context) {
    final stages = widget.project?.stages ?? defaultItems;
    final total = stages.length;
    final completed = widget.project?.completedStages ?? 4;
    final currentStage = widget.project?.currentStage ?? 'Net metering';
    final expectedUpdate = widget.project?.expectedUpdateDays ?? '5–7 days';
    final status = widget.project?.status ?? 'IN PROGRESS';
    final progressVal = total > 0 ? (completed / total).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '$completed of $total stages completed',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
            Pill(status, greenText: true),
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
          children: [
            const Icon(Icons.pending_actions_rounded,
                color: AppColors.deepGreen, size: 20),
            const SizedBox(width: 9),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    currentStage,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  Text(
                    'Current stage • update in $expectedUpdate',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (expanded) ...[
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),
          for (var i = 0; i < stages.length; i++)
            _ProgressStep(
              title: stages[i],
              done: i < completed,
              active: i == completed,
              last: i == stages.length - 1,
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
            label: Text(expanded ? 'Hide stages' : 'View all stages'),
          ),
        ),
      ],
    );
  }
}


class _ProgressStep extends StatelessWidget {
  const _ProgressStep({
    required this.title,
    required this.done,
    required this.active,
    required this.last,
  });

  final String title;
  final bool done, active, last;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: last ? 0 : 10),
        child: Row(
          children: [
            Icon(
              done
                  ? Icons.check_circle_rounded
                  : active
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
              color: done || active ? AppColors.green : AppColors.muted,
              size: 19,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  color: done || active ? AppColors.ink : AppColors.muted,
                  fontWeight: active ? FontWeight.w900 : FontWeight.w600,
                ),
              ),
            ),
            if (active)
              const Text(
                'CURRENT',
                style: TextStyle(
                  color: AppColors.deepGreen,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                ),
              ),
          ],
        ),
      );
}
