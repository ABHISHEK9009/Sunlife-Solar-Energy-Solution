import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/models/subsidy_status.dart';
import '../../core/repositories/subsidy_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/pill.dart';
import '../../core/widgets/sub_page.dart';
import 'widgets/stage_list.dart';

class SubsidyPage extends StatefulWidget {
  const SubsidyPage({super.key});

  @override
  State<SubsidyPage> createState() => _SubsidyPageState();
}

class _SubsidyPageState extends State<SubsidyPage> {
  SubsidyStatus? _status;
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    final status = await SubsidyRepository.instance.getSubsidyStatus();
    if (mounted) {
      setState(() => _status = status);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _status ??
        const SubsidyStatus(
          amount: 78000,
          statusLabel: 'PROCESSING',
          bankAccountMasked: 'XXXXXX2341',
          completedStagesCount: 6,
          stages: [
            'Portal registration',
            'DISCOM application',
            'Feasibility approval',
            'Installation',
            'Inspection',
            'Net meter installed',
            'Subsidy processing',
            'Subsidy credited',
          ],
          note: 'Processing usually takes 30–45 days after net-meter installation.',
        );

    return SubPage(
      title: 'PM Surya Ghar subsidy',
      onRefresh: _loadStatus,
      children: [
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Pill(s.statusLabel, greenText: true),
              const SizedBox(height: 16),
              Text(
                _currency.format(s.amount),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'Expected subsidy • Bank ${s.bankAccountMasked}',
                style: const TextStyle(color: Colors.white60),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        const Heading('Application progress'),
        const SizedBox(height: 12),
        CardBox(
          child: StageList(
            items: s.stages,
            completed: s.completedStagesCount,
          ),
        ),
        const SizedBox(height: 16),
        CardBox(
          color: AppColors.softGreen,
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: AppColors.orange),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  s.note,
                  style: const TextStyle(color: AppColors.muted, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

