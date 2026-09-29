import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/pill.dart';
import '../calculator/calculator_page.dart';
import 'new_property_enquiry_sheet.dart';

class SolarServicesPage extends StatelessWidget {
  const SolarServicesPage({super.key, this.isStandalone = false});

  final bool isStandalone;

  Future<void> _callSupport() async {
    final clean = ApiConstants.supportPhone.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _chatWhatsApp(String serviceName) async {
    final uri = Uri.parse(
      'https://wa.me/${ApiConstants.whatsappPhone}?text=Hello%20Sunlife%20Solar,%20I%20am%20interested%20in%20learning%20more%20about%20your%20$serviceName%20services.',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _openEnquiry(BuildContext context, String propertyType) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const NewPropertyEnquirySheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final content = ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
      children: [
        // Hero Banner
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'SUNLIFE SOLAR SOLUTIONS',
                    style: TextStyle(
                      color: AppColors.green,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Pill('MNRE APPROVED', greenText: true),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Solar Power for\nEvery Rooftop ☀️',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  height: 1.15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Authorized Channel Partner for PM Surya Ghar Muft Bijli Yojana. We handle end-to-end site survey, net metering, subsidy sanction, and 25-year warranty.',
                style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.45),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _FeatureTag(Icons.verified_rounded, '25-Yr Panel Warranty'),
                  _FeatureTag(Icons.account_balance_rounded, 'Up to ₹78k Subsidy'),
                  _FeatureTag(Icons.engineering_rounded, 'Free 3D Site Survey'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Services Catalog
        const Heading('Our Solar Offerings'),
        const SizedBox(height: 12),

        // 1. Residential Rooftop
        _ServiceCard(
          title: 'Residential Rooftop Solar',
          subtitle: 'Zero electricity bills for your home with PM Surya Ghar Subsidy.',
          icon: Icons.home_rounded,
          badge: 'MOST POPULAR',
          highlights: const [
            'System Sizes: 1 kW to 10 kW',
            'Direct Bank Subsidy: Up to ₹78,000 into your account',
            'Bifacial Tier-1 Mono PERC Solar Panels',
            'DISCOM Net-Metering & Grid Synchronisation',
          ],
          onEnquire: () => _openEnquiry(context, 'Residential'),
          onWhatsApp: () => _chatWhatsApp('Residential Rooftop Solar'),
        ),
        const SizedBox(height: 16),

        // 2. Commercial & Industrial
        _ServiceCard(
          title: 'Commercial & Industrial Solar',
          subtitle: 'Slash operating expenses for factories, offices, schools & hospitals.',
          icon: Icons.business_rounded,
          badge: 'TAX BENEFIT 40%',
          highlights: const [
            'System Sizes: 10 kW to 500+ kW',
            '40% Accelerated Depreciation tax benefit',
            'Payback period under 3.5 years',
            'Custom engineered high-rise structural mounting',
          ],
          onEnquire: () => _openEnquiry(context, 'Commercial'),
          onWhatsApp: () => _chatWhatsApp('Commercial Solar'),
        ),
        const SizedBox(height: 16),

        // 3. Hybrid & Battery Storage
        _ServiceCard(
          title: 'Hybrid Solar with Battery Backup',
          subtitle: 'Uninterrupted clean power 24x7 even during grid power outages.',
          icon: Icons.battery_charging_full_rounded,
          badge: 'ZERO POWER CUTS',
          highlights: const [
            'Lithium-ion / Tubular energy storage systems',
            'Smart hybrid inverter with automated grid cut-off',
            'Ideal for areas with frequent power fluctuations',
            'Solar power day & night',
          ],
          onEnquire: () => _openEnquiry(context, 'Hybrid'),
          onWhatsApp: () => _chatWhatsApp('Hybrid Solar Storage'),
        ),
        const SizedBox(height: 16),

        // 4. Agricultural Solar Pumps
        _ServiceCard(
          title: 'Agricultural Solar Water Pumps',
          subtitle: 'Irrigation for farms & fields under PM-KUSUM scheme.',
          icon: Icons.water_drop_rounded,
          badge: 'PM-KUSUM',
          highlights: const [
            '3 HP to 10 HP AC/DC submersible & surface pumps',
            'Up to 60% Central + State Government subsidy',
            'Zero diesel / electricity costs for farmers',
            'Automated pump controller with remote monitoring',
          ],
          onEnquire: () => _openEnquiry(context, 'Agricultural'),
          onWhatsApp: () => _chatWhatsApp('Solar Water Pumps'),
        ),
        const SizedBox(height: 24),

        // Solar Calculator Callout
        CardBox(
          color: AppColors.softGreen,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.calculate_rounded, color: AppColors.deepGreen, size: 24),
                  SizedBox(width: 10),
                  Text(
                    'Estimate Your Solar Savings',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Find out exact system capacity needed, estimated monthly savings, and your PM Surya Ghar central government subsidy in 30 seconds.',
                style: TextStyle(color: AppColors.muted, fontSize: 13, height: 1.45),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => openPage(context, const CalculatorPage()),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                  label: const Text('Open Interactive Solar Calculator'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Contact / Consultation Help
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Need Expert Guidance?',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
              ),
              const SizedBox(height: 6),
              const Text(
                'Our certified solar technical team is available to assist with rooftop feasibility, DISCOM approvals, and custom system design.',
                style: TextStyle(color: AppColors.muted, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _callSupport,
                      icon: const Icon(Icons.phone_rounded, size: 18),
                      label: const Text('Call Us'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _chatWhatsApp('General Consultation'),
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
      ],
    );

    if (isStandalone) {
      return Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
          title: const Text(
            'Solar Services & Solutions',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.ink),
          ),
        ),
        body: content,
      );
    }

    return content;
  }
}

class _FeatureTag extends StatelessWidget {
  const _FeatureTag(this.icon, this.text);

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: .12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.green, size: 14),
            const SizedBox(width: 6),
            Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      );
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.badge,
    required this.highlights,
    required this.onEnquire,
    required this.onWhatsApp,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String badge;
  final List<String> highlights;
  final VoidCallback onEnquire;
  final VoidCallback onWhatsApp;

  @override
  Widget build(BuildContext context) => CardBox(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.softGreen,
                  radius: 20,
                  child: Icon(icon, color: AppColors.deepGreen, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Pill(badge, greenText: true),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              subtitle,
              style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: highlights
                    .map(
                      (h) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                h,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.ink),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: onEnquire,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.ink,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Request Survey', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton(
                  onPressed: onWhatsApp,
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366).withValues(alpha: .15),
                    foregroundColor: const Color(0xFF25D366),
                  ),
                  icon: const Icon(Icons.chat_bubble_outline_rounded),
                  tooltip: 'WhatsApp Inquiry',
                ),
              ],
            ),
          ],
        ),
      );
}
