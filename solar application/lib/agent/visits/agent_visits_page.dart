import 'package:flutter/material.dart';
import '../../core/models/field_visit.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/pill.dart';
import 'agent_visit_detail_page.dart';

class AgentVisitsPage extends StatefulWidget {
  const AgentVisitsPage({super.key});

  @override
  State<AgentVisitsPage> createState() => _AgentVisitsPageState();
}

class _AgentVisitsPageState extends State<AgentVisitsPage> {
  late List<FieldVisit> _visits = AgentRepository.instance.currentVisits;
  late bool _isLoading = _visits.isEmpty;

  @override
  void initState() {
    super.initState();
    AgentRepository.instance.addListener(_onRepoChanged);
    _loadData();
  }

  @override
  void dispose() {
    AgentRepository.instance.removeListener(_onRepoChanged);
    super.dispose();
  }

  void _onRepoChanged() {
    if (mounted) {
      setState(() {
        _visits = AgentRepository.instance.currentVisits;
      });
    }
  }

  Future<void> _loadData({bool force = false}) async {
    final visits = await AgentRepository.instance.getTodayVisits(forceRefresh: force);
    if (mounted) {
      setState(() {
        _visits = visits;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final completedCount = _visits.where((v) => v.isCompleted).length;
    final totalCount = _visits.length;
    final pendingCount = totalCount - completedCount;

    return Frame(
      'Field visits',
      onRefresh: () => _loadData(force: true),
      [
        Row(
          children: [
            Expanded(
              child: AgentVisitSummary(
                value: '$totalCount',
                label: 'Total',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: AgentVisitSummary(
                value: '$pendingCount',
                label: 'Pending',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: AgentVisitSummary(
                value: '$completedCount',
                label: 'Completed',
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        Heading(
          'Today’s route',
          action: 'Total: $totalCount',
        ),
        const SizedBox(height: 10),
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          )
        else if (_visits.isEmpty)
          CardBox(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.event_available_rounded, size: 40, color: AppColors.muted.withValues(alpha: 0.5)),
                    const SizedBox(height: 8),
                    const Text(
                      'No field visits scheduled for today',
                      style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
      sliverBody: (!_isLoading && _visits.isNotEmpty)
          ? SliverList.builder(
              itemCount: _visits.length,
              itemBuilder: (context, i) {
                final visit = _visits[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: CardBox(
                    padding: EdgeInsets.zero,
                    child: InkWell(
                      onTap: () => openPage(
                        context,
                        AgentVisitDetailPage(customer: visit.customerName),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(15),
                        child: Row(
                          children: [
                            Container(
                              width: 54,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: visit.isCompleted ? AppColors.canvas : AppColors.softGreen,
                                borderRadius: BorderRadius.circular(13),
                              ),
                              child: Text(
                                visit.time.replaceFirst(' ', '\n'),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: visit.isCompleted ? AppColors.muted : AppColors.deepGreen,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                            const SizedBox(width: 13),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          visit.customerName,
                                          style: TextStyle(
                                            fontWeight: FontWeight.w900,
                                            decoration: visit.isCompleted ? TextDecoration.lineThrough : null,
                                            color: visit.isCompleted ? AppColors.muted : AppColors.ink,
                                          ),
                                        ),
                                      ),
                                      if (visit.isCompleted)
                                        const Pill('COMPLETED', greenText: true),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '${visit.purpose} · ${visit.location}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.chevron_right_rounded),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            )
          : null,
    );
  }
}

class AgentVisitSummary extends StatelessWidget {
  const AgentVisitSummary({
    super.key,
    required this.value,
    required this.label,
  });

  final String value, label;

  @override
  Widget build(BuildContext context) => CardBox(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                color: AppColors.deepGreen,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(color: AppColors.muted, fontSize: 11),
            ),
          ],
        ),
      );
}
