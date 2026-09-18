import 'package:flutter/material.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/notification_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/sub_page.dart';

class CalculatorPage extends StatefulWidget {
  const CalculatorPage({super.key});

  @override
  State<CalculatorPage> createState() => _CalculatorPageState();
}

class _CalculatorPageState extends State<CalculatorPage> {
  double bill = 5000;
  bool _isSubmitting = false;

  Future<void> _handleSurveyRequest(int capacity, int cost, int subsidy) async {
    final user = AuthRepository.instance.currentUser;
    final name = user?.name.isNotEmpty == true ? user!.name : 'Customer';
    final phone = user?.phone.isNotEmpty == true ? user!.phone : '98765 43210';

    setState(() => _isSubmitting = true);

    await AgentRepository.instance.addLead(
      name: name,
      phone: phone,
      location: 'Jaipur Rooftop Site',
      monthlyBill: '₹${bill.round()}/month',
      notes: 'Requested via Solar Calculator: $capacity kW system estimate (Subsidy: ₹$subsidy)',
    );

    NotificationRepository.instance.addNotification(
      title: 'Site survey requested',
      message: 'Your $capacity kW rooftop survey request is scheduled. An engineer will visit soon.',
      category: 'Project',
      actionRoute: 'project',
    );

    if (mounted) {
      setState(() => _isSubmitting = false);
      showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Survey Request Confirmed!'),
          content: Text(
            'We have scheduled a free site assessment for a $capacity kW system.\n\n'
            'Estimated system cost: ₹$cost\n'
            'Government subsidy: ₹$subsidy\n\n'
            'A Sunlife solar engineer will contact you shortly.',
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final capacity = (bill / 1000).clamp(1, 10).round();
    final cost = capacity * 58000;
    final subsidy = capacity >= 3 ? 78000 : capacity * 30000;
    final saving = (capacity * 1150).round();

    return SubPage(
      title: 'Solar calculator',
      children: [
        const Text(
          'Estimate the right system for your home.',
          style: TextStyle(color: AppColors.muted),
        ),
        const SizedBox(height: 20),
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Monthly electricity bill',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                '₹${bill.round()}',
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Slider(
                value: bill,
                min: 1000,
                max: 12000,
                divisions: 22,
                activeColor: AppColors.orange,
                onChanged: (value) => setState(() => bill = value),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'RECOMMENDED SYSTEM',
                style: TextStyle(
                  color: Colors.white54,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$capacity kW',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 38,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 18),
              InfoLight('Estimated cost', '₹$cost'),
              InfoLight('Government subsidy', '₹$subsidy'),
              InfoLight('Monthly savings', '₹$saving', last: true),
            ],
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 54,
          child: FilledButton(
            onPressed: _isSubmitting ? null : () => _handleSurveyRequest(capacity, cost, subsidy),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.yellow,
              foregroundColor: AppColors.ink,
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Request free site survey',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
          ),
        ),
      ],
    );
  }
}

