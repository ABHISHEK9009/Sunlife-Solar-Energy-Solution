import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher_string.dart';
import '../../core/models/agent_lead.dart';
import '../../core/models/field_visit.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/pill.dart';
import '../visits/agent_visit_detail_page.dart';

class AgentDashboard extends StatefulWidget {
  const AgentDashboard({super.key, required this.onOpenTab});

  final ValueChanged<int> onOpenTab;

  @override
  State<AgentDashboard> createState() => _AgentDashboardState();
}

class _AgentDashboardState extends State<AgentDashboard> {
  late List<AgentLead> _leads = AgentRepository.instance.currentLeads;
  late List<FieldVisit> _visits = AgentRepository.instance.currentVisits;
  bool _isFetching = false;
  bool _isPunching = false;

  @override
  void initState() {
    super.initState();
    AgentRepository.instance.addListener(_onRepoChanged);
    _loadData(force: true);
  }

  @override
  void dispose() {
    AgentRepository.instance.removeListener(_onRepoChanged);
    super.dispose();
  }

  void _onRepoChanged() {
    if (mounted) {
      setState(() {
        _leads = AgentRepository.instance.currentLeads;
        _visits = AgentRepository.instance.currentVisits;
      });
    }
  }

  Future<void> _punchAttendance(String action) async {
    if (_isPunching) return;
    setState(() => _isPunching = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled. Please enable GPS on your device.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permission is required for attendance.');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied. Please allow in app settings.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      final result = await AgentRepository.instance.punchAttendance(
        action: action,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (mounted) {
        final label = action == 'punch-in' ? 'Punch-in' : 'Punch-out';
        final checkTime = result['record']?['checkIn'] ?? result['record']?['checkOut'] ?? '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.deepGreen,
            content: Text('$label recorded successfully at $checkTime!'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final message = e.toString().replaceAll('Exception:', '').trim();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade700,
            content: Text(message.isNotEmpty ? message : 'Attendance failed.'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPunching = false);
      }
    }
  }

  Future<void> _loadData({bool force = false}) async {
    if (_isFetching) return;
    _isFetching = true;
    try {
      // Parallelize independent CRM requests for zero-latency dashboard loading
      final results = await Future.wait([
        AgentRepository.instance.getAssignedLeads(forceRefresh: force),
        AgentRepository.instance.getTodayVisits(forceRefresh: force),
      ]);
      if (mounted) {
        setState(() {
          _leads = results[0] as List<AgentLead>;
          _visits = results[1] as List<FieldVisit>;
        });
      }
    } finally {
      _isFetching = false;
    }
  }

  Future<void> _callLead(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\s+'), '');
    final uri = 'tel:$cleanPhone';
    try {
      if (await canLaunchUrlString(uri)) {
        await launchUrlString(uri);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Dialing $phone…')),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open dialer for $phone')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthRepository.instance.currentUser;
    final firstName = user?.name.trim().split(' ').first;
    final greetingName = (firstName != null && firstName.isNotEmpty) ? firstName : 'Partner';
    final initials = (user?.name != null && user!.name.trim().isNotEmpty)
        ? user.name.trim().split(' ').where((e) => e.isNotEmpty).map((e) => e[0]).take(2).join().toUpperCase()
        : 'FP';

    final pendingVisits = _visits.where((v) => !v.isCompleted).toList();
    final completedVisitsCount = _visits.where((v) => v.isCompleted).length;
    final followUpsDueCount = _leads
        .where((l) =>
            l.stage.toLowerCase().contains('quotation') ||
            l.stage.toLowerCase().contains('follow') ||
            l.stage.toLowerCase().contains('new') ||
            l.stage.toLowerCase().contains('pending'))
        .length;
    final pendingDocsCount =
        _leads.where((l) => l.stage.toLowerCase().contains('document')).length;

    // Follow-up lead to feature in priority card
    final priorityLead = _leads.where(
      (l) => l.stage.toLowerCase().contains('quotation') || l.stage.toLowerCase().contains('follow'),
    ).firstOrNull ?? (_leads.isNotEmpty ? _leads.first : null);

    return Frame(
      'Good morning, $greetingName',
      onRefresh: () => _loadData(force: true),
      [
        CardBox(
          color: AppColors.deepGreen,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'TODAY · ${_formattedToday()}',
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const Pill('ON DUTY', greenText: true),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '${_visits.length} customer visits',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 27,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                pendingVisits.isNotEmpty
                    ? 'First visit at ${pendingVisits.first.time} · ${pendingVisits.first.location.split(',').first.trim()}'
                    : (_visits.isNotEmpty
                        ? 'All $_visits.length visits completed for today! 🎉'
                        : 'No field visits scheduled today'),
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => widget.onOpenTab(2),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white30),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      icon: const Icon(Icons.route_rounded, size: 16),
                      label: const Text('Route', style: TextStyle(fontSize: 12)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isPunching ? null : () => _punchAttendance('punch-in'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      icon: _isPunching
                          ? const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white),
                            )
                          : const Icon(Icons.login_rounded, size: 16),
                      label: const Text('Punch In', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isPunching ? null : () => _punchAttendance('punch-out'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white70,
                        side: const BorderSide(color: Colors.white30),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      icon: const Icon(Icons.logout_rounded, size: 16),
                      label: const Text('Punch Out', style: TextStyle(fontSize: 12)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.55,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            AgentMetric(
              icon: Icons.person_add_alt_rounded,
              value: '${_leads.length}',
              label: 'Assigned leads',
              onTap: () => widget.onOpenTab(1),
            ),
            AgentMetric(
              icon: Icons.phone_callback_rounded,
              value: '$followUpsDueCount',
              label: 'Follow-ups due',
              onTap: () => widget.onOpenTab(3),
            ),
            AgentMetric(
              icon: Icons.folder_copy_outlined,
              value: '$pendingDocsCount',
              label: 'Pending documents',
              onTap: () => widget.onOpenTab(1),
            ),
            AgentMetric(
              icon: Icons.task_alt_rounded,
              value: '$completedVisitsCount',
              label: 'Completed visits',
              onTap: () => widget.onOpenTab(2),
            ),
          ],
        ),
        const SizedBox(height: 22),
        Heading(
          'Today’s schedule',
          action: 'View all',
          onAction: () => widget.onOpenTab(2),
        ),
        const SizedBox(height: 12),
        CardBox(
          padding: EdgeInsets.zero,
          child: _visits.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(
                    child: Text('No scheduled visits for today'),
                  ),
                )
              : Column(
                  children: [
                    for (int i = 0; i < _visits.length; i++) ...[
                      if (i > 0) const Divider(height: 1, indent: 74, endIndent: 16),
                      AgentVisitRow(
                        time: _visits[i].time.replaceAll(' AM', '').replaceAll(' PM', ''),
                        name: _visits[i].customerName,
                        purpose: '${_visits[i].purpose} · ${_visits[i].location.split(',').first.trim()}',
                        isCompleted: _visits[i].isCompleted,
                        onTap: () => openPage(
                          context,
                          AgentVisitDetailPage(customer: _visits[i].customerName),
                        ),
                      ),
                    ],
                  ],
                ),
        ),
        const SizedBox(height: 18),
        if (priorityLead != null)
          CardBox(
            color: AppColors.softGreen,
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.green,
                  child: Icon(Icons.priority_high_rounded, color: Colors.white),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Follow-up: ${priorityLead.name}',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Stage: ${priorityLead.stage} · ${priorityLead.location}',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Call ${priorityLead.name}',
                  onPressed: () => _callLead(priorityLead.phone),
                  icon: const Icon(
                    Icons.call_rounded,
                    color: AppColors.deepGreen,
                  ),
                ),
              ],
            ),
          ),
      ],
      action: CircleAvatar(
        radius: 19,
        backgroundColor: AppColors.deepGreen,
        child: Text(
          initials.isNotEmpty ? initials : 'FP',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }

  String _formattedToday() {
    final now = DateTime.now();
    final months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    final dayStr = now.day.toString().padLeft(2, '0');
    final monthStr = months[now.month - 1];
    return '$dayStr $monthStr';
  }
}

class AgentMetric extends StatelessWidget {
  const AgentMetric({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String value, label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => CardBox(
        padding: EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 19,
                  backgroundColor: AppColors.softGreen,
                  child: Icon(icon, color: AppColors.deepGreen, size: 20),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        value,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 22,
                          height: 1,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        label,
                        maxLines: 2,
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

class AgentVisitRow extends StatelessWidget {
  const AgentVisitRow({
    super.key,
    required this.time,
    required this.name,
    required this.purpose,
    required this.onTap,
    this.isCompleted = false,
  });

  final String time, name, purpose;
  final VoidCallback onTap;
  final bool isCompleted;

  @override
  Widget build(BuildContext context) => ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        leading: Container(
          width: 47,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isCompleted ? AppColors.canvas : AppColors.softGreen,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            time,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isCompleted ? AppColors.muted : AppColors.deepGreen,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                name,
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                  color: isCompleted ? AppColors.muted : AppColors.ink,
                ),
              ),
            ),
            if (isCompleted)
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.green,
                size: 16,
              ),
          ],
        ),
        subtitle: Text(
          purpose,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: isCompleted ? AppColors.muted.withValues(alpha: 0.7) : AppColors.muted,
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
      );
}
