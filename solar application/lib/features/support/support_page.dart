import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/sub_page.dart';
import 'faq_page.dart';
import 'service_request_page.dart';

class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  Future<void> _callSupport(BuildContext context) async {
    final uri = Uri.parse('tel:${ApiConstants.supportPhone}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open phone dialer')),
        );
      }
    }
  }

  Future<void> _openWhatsApp(BuildContext context) async {
    final uri = Uri.parse(
      'https://wa.me/${ApiConstants.whatsappPhone}?text=Hello%20Sunlife%20Solar%20Support,%20I%20need%20help%20with%20my%20project',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open WhatsApp')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => SubPage(
        title: 'Help & support',
        children: [
          const Text(
            'We are here to help with your solar journey.',
            style: TextStyle(color: AppColors.muted),
          ),
          const SizedBox(height: 18),
          SupportAction(
            icon: Icons.call,
            title: 'Call support',
            subtitle: 'Mon–Sat • 9 AM–6 PM',
            onTap: () => _callSupport(context),
          ),
          SupportAction(
            icon: Icons.chat,
            title: 'WhatsApp Sunlife',
            subtitle: 'Usually replies within 10 minutes',
            onTap: () => _openWhatsApp(context),
          ),
          SupportAction(
            icon: Icons.build_outlined,
            title: 'Raise a query or request',
            subtitle: 'Ask a question and track the response',
            onTap: () => openPage(context, const ServiceRequestPage()),
          ),
          SupportAction(
            icon: Icons.help_outline_rounded,
            title: 'Frequently asked questions',
            subtitle: 'Quick answers about subsidy, metering & bills',
            onTap: () => openPage(context, const FaqPage()),
          ),
          const SizedBox(height: 18),
          const CardBox(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sunlife Solar Support',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
                SizedBox(height: 7),
                Text(
                  'support@sunlifesolar.in\n+91 98765 00000',
                  style: TextStyle(color: AppColors.muted, height: 1.6),
                ),
              ],
            ),
          ),
        ],
      );
}


class SupportAction extends StatelessWidget {
  const SupportAction({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: CardBox(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: ListTile(
            onTap: onTap,
            leading: CircleAvatar(
              backgroundColor: AppColors.softGreen,
              child: Icon(icon, color: AppColors.orange),
            ),
            title:
                Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
            subtitle: Text(subtitle),
            trailing: const Icon(Icons.chevron_right),
          ),
        ),
      );
}
