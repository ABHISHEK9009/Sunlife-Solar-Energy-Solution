import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/sub_page.dart';
import 'service_request_page.dart';

class FaqPage extends StatelessWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context) {
    const faqs = <(String, String)>[
      (
        'Where can I see my project status?',
        'Open the Home or Project tab. The current stage, completed steps and next expected update are shown there.',
      ),
      (
        'Which documents do I need to upload?',
        'Any document still needed from you appears under Required from you on the Documents tab.',
      ),
      (
        'How do I download an invoice or certificate?',
        'Open Documents, select the file and use the download button beside it.',
      ),
      (
        'Where can I track subsidy progress?',
        'Open Subsidy tracker from Home or Profile to see the application stage and pending requirements.',
      ),
      (
        'How do I ask a question after installation?',
        'Open Help & service, choose the relevant category and submit your query. Its response status will remain visible in the app.',
      ),
    ];

    return SubPage(
      title: 'Frequently asked questions',
      children: [
        const Text(
          'Quick answers about your project, documents, payments and support.',
          style: TextStyle(color: AppColors.muted, height: 1.4),
        ),
        const SizedBox(height: 18),
        for (final faq in faqs) ...[
          CardBox(
            padding: EdgeInsets.zero,
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(horizontal: 18),
              childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
              shape: const Border(),
              collapsedShape: const Border(),
              title: Text(
                faq.$1,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    faq.$2,
                    style: const TextStyle(
                        color: AppColors.muted, height: 1.45),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 6),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: AppColors.ink),
            onPressed: () => openPage(context, const ServiceRequestPage()),
            icon: const Icon(Icons.support_agent_outlined),
            label: const Text(
              'Ask another question',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ),
      ],
    );
  }
}
