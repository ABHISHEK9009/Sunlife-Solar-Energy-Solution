import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/models/user_profile.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/pill.dart';
import '../calculator/calculator_page.dart';

class EnquiryDashboardView extends StatelessWidget {
  const EnquiryDashboardView({super.key, required this.user});

  final UserProfile user;

  Future<void> _callAdvisor(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _chatWhatsApp(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('https://wa.me/91$clean?text=Hello%20Sunlife%20Solar,%20I%20have%20an%20enquiry%20regarding%20my%20solar%20assessment.');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = user.name.isNotEmpty ? user.name.split(' ').first : 'there';
    final advisorName = user.advisorName ?? 'Sunlife Solar Desk';
    final advisorPhone = user.advisorPhone ?? ApiConstants.supportPhone;
    final city = user.city ?? 'your location';
    final bill = user.monthlyBill ?? '₹5,000–₹10,000';

    return RefreshIndicator(
      onRefresh: () => AuthRepository.instance.fetchMe(),
      color: AppColors.deepGreen,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          // Greeting Banner
          CardBox(
            color: AppColors.ink,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'SOLAR ENQUIRY',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Pill(user.leadStatus ?? 'ENQUIRY RECEIVED', greenText: true),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'Hello, $name 👋',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your solar enquiry for $city is registered.',
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Journey Checklist
          const Heading('Enquiry progress'),
          const SizedBox(height: 12),
          CardBox(
            child: Column(
              children: [
                _ChecklistStep('Mobile number verified', done: true),
                _ChecklistStep('Solar requirement submitted ($bill)', done: true),
                _ChecklistStep(
                  'Solar advisor assigned ($advisorName)',
                  done: user.advisorName != null,
                  active: user.advisorName == null,
                ),
                _ChecklistStep(
                  'On-site 3D rooftop survey',
                  done: user.leadStatus == 'SURVEY_SCHEDULED' || user.leadStatus == 'SURVEY_COMPLETED',
                  active: user.leadStatus == 'SURVEY_SCHEDULED',
                ),
                _ChecklistStep(
                  'Custom proposal & subsidy estimate',
                  done: user.leadStatus == 'QUOTATION_SENT',
                  last: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Next Step Card
          const Heading('What happens next?'),
          const SizedBox(height: 12),
          CardBox(
            color: AppColors.softGreen,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.calendar_month_rounded, color: AppColors.deepGreen, size: 22),
                    SizedBox(width: 10),
                    Text(
                      'Site Survey Scheduling',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Our solar engineer will contact you shortly to schedule an on-site feasibility assessment of your rooftop in $city.',
                  style: const TextStyle(color: AppColors.muted, height: 1.45, fontSize: 13),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _callAdvisor(advisorPhone),
                        icon: const Icon(Icons.phone_rounded, size: 18),
                        label: const Text('Call Advisor'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => _chatWhatsApp(advisorPhone),
                        style: FilledButton.styleFrom(backgroundColor: const Color(0xFF25D366)),
                        icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                        label: const Text('WhatsApp'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Solar Savings Estimate
          const Heading('Estimated requirement'),
          const SizedBox(height: 12),
          CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Monthly Electricity Bill', style: TextStyle(color: AppColors.muted)),
                    Text(bill, style: const TextStyle(fontWeight: FontWeight.w900)),
                  ],
                ),
                const SizedBox(height: 10),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recommended Plant Capacity', style: TextStyle(color: AppColors.muted)),
                    Text('Approx. 5 kW', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.deepGreen)),
                  ],
                ),
                const SizedBox(height: 10),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Central PM Surya Ghar Subsidy', style: TextStyle(color: AppColors.muted)),
                    Text('Up to ₹78,000', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.orange)),
                  ],
                ),
                const Divider(height: 24),
                Center(
                  child: TextButton.icon(
                    onPressed: () => openPage(context, const CalculatorPage()),
                    icon: const Icon(Icons.calculate_outlined),
                    label: const Text('Open Interactive Solar Calculator'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChecklistStep extends StatelessWidget {
  const _ChecklistStep(this.title, {this.done = false, this.active = false, this.last = false});

  final String title;
  final bool done, active, last;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: last ? 0 : 12),
        child: Row(
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
              child: Text(
                title,
                style: TextStyle(
                  fontWeight: done || active ? FontWeight.w800 : FontWeight.w500,
                  color: done || active ? AppColors.ink : AppColors.muted,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      );
}
