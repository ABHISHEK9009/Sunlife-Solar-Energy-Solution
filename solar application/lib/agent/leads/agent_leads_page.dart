import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/models/agent_lead.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import 'agent_lead_capture_page.dart';
import 'agent_lead_detail_page.dart';

class AgentLeadsPage extends StatefulWidget {
  const AgentLeadsPage({super.key});

  @override
  State<AgentLeadsPage> createState() => _AgentLeadsPageState();
}

class _AgentLeadsPageState extends State<AgentLeadsPage> {
  String filter = 'All';
  String query = '';
  Timer? _debounceTimer;
  late List<AgentLead> _leads = AgentRepository.instance.currentLeads;
  late bool _isLoading = _leads.isEmpty;

  @override
  void initState() {
    super.initState();
    AgentRepository.instance.addListener(_onRepoChanged);
    _loadLeads(force: true);
  }

  @override
  void dispose() {
    AgentRepository.instance.removeListener(_onRepoChanged);
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onRepoChanged() {
    if (mounted) {
      setState(() {
        _leads = AgentRepository.instance.currentLeads;
      });
    }
  }

  Future<void> _loadLeads({bool force = false}) async {
    final list = await AgentRepository.instance.getAssignedLeads(forceRefresh: force);
    if (mounted) {
      setState(() {
        _leads = list;
        _isLoading = false;
      });
    }
  }

  void _onSearchChanged(String val) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 200), () {
      if (mounted) {
        setState(() => query = val);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final visible = _leads.where((lead) {
      final matchesQuery = query.isEmpty ||
          lead.name.toLowerCase().contains(query.toLowerCase()) ||
          lead.location.toLowerCase().contains(query.toLowerCase());
      final matchesFilter = filter == 'All' || lead.stage.contains(filter);
      return matchesQuery && matchesFilter;
    }).toList();

    return Frame(
      'Assigned leads',
      onRefresh: () => _loadLeads(force: true),
      [
        TextField(
          onChanged: _onSearchChanged,
          decoration: InputDecoration(
            hintText: 'Search customer or location',
            prefixIcon: const Icon(Icons.search_rounded),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final item in ['All', 'Survey', 'Quotation', 'Documents', 'Installation'])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(item),
                    selected: filter == item,
                    onSelected: (_) => setState(() => filter = item),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          )
        else if (visible.isEmpty)
          const CardBox(
            child: Center(child: Text('No leads match this filter.')),
          ),
      ],
      sliverBody: (!_isLoading && visible.isNotEmpty)
          ? SliverList.builder(
              itemCount: visible.length,
              itemBuilder: (context, i) {
                final lead = visible[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AgentLeadCard(
                    name: lead.name,
                    location: lead.location,
                    stage: lead.stage,
                    phone: lead.phone,
                    onTap: () async {
                      await openPage(
                        context,
                        AgentLeadDetailPage(
                          name: lead.name,
                          location: lead.location,
                          phone: lead.phone,
                          bill: lead.monthlyBill,
                          initialStage: lead.stage,
                          lead: lead,
                        ),
                      );
                      _loadLeads();
                    },
                  ),
                );
              },
            )
          : null,
      action: IconButton.filledTonal(
        tooltip: 'Capture new lead',
        onPressed: () async {
          final added = await openPage<bool>(context, const AgentLeadCapturePage());
          if (added == true) {
            _loadLeads(force: true);
          }
        },
        icon: const Icon(Icons.person_add_alt_1_rounded),
      ),
    );
  }
}

class AgentLeadCard extends StatelessWidget {
  const AgentLeadCard({
    super.key,
    required this.name,
    required this.location,
    required this.stage,
    required this.phone,
    required this.onTap,
  });

  final String name, location, stage, phone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => CardBox(
        padding: EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.softGreen,
                      child: Text(
                        name.isNotEmpty ? name.substring(0, 1) : '?',
                        style: const TextStyle(
                          color: AppColors.deepGreen,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            '$location · $phone',
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.softGreen,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    stage,
                    style: const TextStyle(
                      color: AppColors.deepGreen,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
