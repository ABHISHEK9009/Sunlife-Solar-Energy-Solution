import 'package:flutter/material.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';

class AgentTasksPage extends StatefulWidget {
  const AgentTasksPage({super.key});

  @override
  State<AgentTasksPage> createState() => _AgentTasksPageState();
}

class _AgentTasksPageState extends State<AgentTasksPage> {
  static const tasks = [
    (
      title: 'Call Suresh Kumar',
      subtitle: 'Quotation follow-up · 11:30 AM',
      icon: Icons.call_outlined,
    ),
    (
      title: 'Verify Vikas Sharma’s cheque',
      subtitle: 'Document review · Due today',
      icon: Icons.fact_check_outlined,
    ),
    (
      title: 'Update Anita Meena survey',
      subtitle: 'Upload roof dimensions · 2:00 PM',
      icon: Icons.roofing_outlined,
    ),
    (
      title: 'Reply to subsidy query',
      subtitle: 'Customer: Rajesh Sharma',
      icon: Icons.support_agent_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final completed = AgentRepository.instance.completedTaskIndices;

    return Frame('My tasks', [
      CardBox(
        color: AppColors.softGreen,
        child: Row(
          children: [
            const Icon(Icons.task_alt_rounded, color: AppColors.green, size: 30),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '${tasks.length - completed.length} tasks remaining today',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      CardBox(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            for (var i = 0; i < tasks.length; i++) ...[
              CheckboxListTile(
                value: completed.contains(i),
                onChanged: (_) {
                  setState(() {
                    AgentRepository.instance.toggleTask(i);
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
                secondary: Icon(tasks[i].icon, color: AppColors.deepGreen),
                title: Text(
                  tasks[i].title,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    decoration: completed.contains(i) ? TextDecoration.lineThrough : null,
                  ),
                ),
                subtitle: Text(tasks[i].subtitle),
              ),
              if (i < tasks.length - 1)
                const Divider(height: 1, indent: 54, endIndent: 14),
            ],
          ],
        ),
      ),
    ]);
  }
}
