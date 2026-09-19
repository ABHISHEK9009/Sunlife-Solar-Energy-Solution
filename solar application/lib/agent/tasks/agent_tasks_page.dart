import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/models/agent_lead.dart';
import '../../core/models/agent_task.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../leads/agent_lead_detail_page.dart';
import '../visits/agent_visit_detail_page.dart';

class AgentTasksPage extends StatefulWidget {
  const AgentTasksPage({super.key});

  @override
  State<AgentTasksPage> createState() => _AgentTasksPageState();
}

class _AgentTasksPageState extends State<AgentTasksPage> {
  late List<AgentTask> _tasks = AgentRepository.instance.currentTasks;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    AgentRepository.instance.addListener(_onRepoChanged);
    _loadTasks(force: true);
  }

  @override
  void dispose() {
    AgentRepository.instance.removeListener(_onRepoChanged);
    super.dispose();
  }

  void _onRepoChanged() {
    if (mounted) {
      setState(() {
        _tasks = AgentRepository.instance.currentTasks;
      });
    }
  }

  Future<void> _loadTasks({bool force = false}) async {
    if (_tasks.isEmpty) {
      setState(() => _isLoading = true);
    }
    try {
      final tasks = await AgentRepository.instance.getTasks(forceRefresh: force);
      if (mounted) {
        setState(() {
          _tasks = tasks;
          _isLoading = false;
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _callPhone(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('tel:+91$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Calling $phone…')),
        );
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type.toLowerCase()) {
      case 'call':
        return Icons.phone_callback_rounded;
      case 'survey':
        return Icons.roofing_rounded;
      case 'document':
        return Icons.folder_shared_rounded;
      case 'followup':
      default:
        return Icons.contact_phone_rounded;
    }
  }

  void _onTaskTap(AgentTask task) {
    if (task.targetType == 'lead' && task.targetId != null) {
      final matchedLead = AgentRepository.instance.currentLeads
          .where((l) => l.id == task.targetId)
          .firstOrNull;

      final leadObj = matchedLead ??
          AgentLead(
            id: task.targetId!,
            name: task.targetName ?? 'Customer',
            phone: task.targetPhone ?? '',
            location: 'Assigned Territory',
            stage: 'Contacted',
            monthlyBill: '₹5,000/month',
          );

      openPage(
        context,
        AgentLeadDetailPage(
          name: leadObj.name,
          location: leadObj.location,
          phone: leadObj.phone,
          bill: leadObj.monthlyBill,
          initialStage: leadObj.stage,
          lead: leadObj,
        ),
      );
    } else if (task.targetType == 'survey' && task.targetName != null) {
      openPage(
        context,
        AgentVisitDetailPage(customer: task.targetName!),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final remainingCount = _tasks.where((t) => !t.isCompleted).length;

    return Frame(
      'My tasks',
      onRefresh: () => _loadTasks(force: true),
      [
        CardBox(
          color: remainingCount == 0 ? AppColors.softGreen : AppColors.softGreen,
          child: Row(
            children: [
              Icon(
                remainingCount == 0
                    ? Icons.check_circle_rounded
                    : Icons.task_alt_rounded,
                color: AppColors.green,
                size: 32,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      remainingCount == 0
                          ? 'All tasks completed! 🎉'
                          : '$remainingCount CRM tasks pending today',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Synced in real-time with your assigned leads',
                      style: TextStyle(
                        color: Colors.black.withValues(alpha: 0.6),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (_isLoading && _tasks.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          )
        else if (_tasks.isEmpty)
          CardBox(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Column(
                children: [
                  Icon(
                    Icons.assignment_turned_in_outlined,
                    size: 48,
                    color: AppColors.deepGreen.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'No pending tasks assigned to you in CRM',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'New customer leads and site visits assigned to your account will automatically appear here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.black54, fontSize: 12),
                  ),
                ],
              ),
            ),
          )
        else
          CardBox(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (var i = 0; i < _tasks.length; i++) ...[
                  ListTile(
                    onTap: () => _onTaskTap(_tasks[i]),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    leading: Checkbox(
                      value: _tasks[i].isCompleted,
                      activeColor: AppColors.green,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(5),
                      ),
                      onChanged: (_) {
                        AgentRepository.instance.toggleTaskCompletion(_tasks[i].id);
                      },
                    ),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            _tasks[i].title,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              decoration: _tasks[i].isCompleted
                                  ? TextDecoration.lineThrough
                                  : null,
                              color: _tasks[i].isCompleted
                                  ? Colors.black38
                                  : Colors.black87,
                            ),
                          ),
                        ),
                        if (_tasks[i].priority == 'HIGH' && !_tasks[i].isCompleted)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.amber.shade100,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Priority',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber.shade900,
                              ),
                            ),
                          ),
                      ],
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Text(
                        _tasks[i].subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: _tasks[i].isCompleted
                              ? Colors.black26
                              : Colors.black54,
                        ),
                      ),
                    ),
                    trailing: _tasks[i].targetPhone != null &&
                            _tasks[i].targetPhone!.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.phone_rounded,
                              color: AppColors.deepGreen,
                              size: 20,
                            ),
                            tooltip: 'Call ${_tasks[i].targetName ?? "Customer"}',
                            onPressed: () => _callPhone(_tasks[i].targetPhone),
                          )
                        : Icon(
                            _getIconForType(_tasks[i].iconType),
                            color: AppColors.deepGreen.withValues(alpha: 0.7),
                            size: 20,
                          ),
                  ),
                  if (i < _tasks.length - 1)
                    const Divider(height: 1, indent: 56, endIndent: 12),
                ],
              ],
            ),
          ),
      ],
    );
  }
}
