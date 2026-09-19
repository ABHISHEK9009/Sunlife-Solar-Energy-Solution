import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/menu_tile.dart';
import '../../core/widgets/sub_page.dart';
import '../documents/agent_documents_page.dart';
import '../visits/agent_visit_detail_page.dart';

import '../../core/models/agent_lead.dart';

class AgentLeadDetailPage extends StatefulWidget {
  const AgentLeadDetailPage({
    super.key,
    required this.name,
    required this.location,
    required this.phone,
    required this.bill,
    required this.initialStage,
    this.lead,
  });

  final String name, location, phone, bill, initialStage;
  final AgentLead? lead;

  @override
  State<AgentLeadDetailPage> createState() => _AgentLeadDetailPageState();
}

class _AgentLeadDetailPageState extends State<AgentLeadDetailPage> {
  late String stage = widget.initialStage;
  bool isSaving = false;

  String get _cleanPhone => widget.phone.replaceAll(RegExp(r'\D'), '');

  Future<void> _makeCall() async {
    final uri = Uri.parse('tel:+91$_cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open phone dialer')),
        );
      }
    }
  }

  Future<void> _sendWhatsApp() async {
    final message = Uri.encodeComponent(
      'Hello ${widget.name}, I am calling from Sunlife Solar regarding your solar enquiry.',
    );
    final uri = Uri.parse('https://wa.me/91$_cleanPhone?text=$message');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch WhatsApp')),
        );
      }
    }
  }

  Future<void> _saveStage() async {
    setState(() => isSaving = true);
    await AgentRepository.instance.updateLeadStage(widget.name, stage);
    if (mounted) {
      setState(() => isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.deepGreen,
          content: Text('${widget.name} updated to "$stage" in CRM'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) => SubPage(
        title: widget.name,
        bottom: SizedBox(
          width: double.infinity,
          height: 54,
          child: FilledButton.icon(
            onPressed: isSaving ? null : _saveStage,
            style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
            icon: isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Icon(Icons.cloud_done_outlined),
            label: const Text(
              'Save to CRM',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ),
        children: [
          CardBox(
            color: AppColors.deepGreen,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '${widget.location} · ${widget.phone}',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _makeCall,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white30),
                        ),
                        icon: const Icon(Icons.call_rounded, size: 18),
                        label: const Text('Call'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _sendWhatsApp,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white30),
                        ),
                        icon: const Icon(Icons.chat_rounded, size: 18),
                        label: const Text('WhatsApp'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Heading('Customer requirement'),
          const SizedBox(height: 10),
          CardBox(
            child: Column(
              children: [
                Info('Requirement Type', widget.lead?.propertyType ?? 'Residential'),
                Info('Solar Requirement', widget.lead?.solarRequirement ?? 'On-Grid'),
                Info('Approx Capacity', widget.lead?.approxCapacity ?? '5 kW'),
                Info('Lead Source', widget.lead?.leadSource ?? 'Field Visit'),
                if (widget.lead?.nextFollowUpDate != null)
                  Info(
                    'Next Follow-up',
                    '${widget.lead!.nextFollowUpDate!.day}/${widget.lead!.nextFollowUpDate!.month}/${widget.lead!.nextFollowUpDate!.year}',
                  ),
                if (widget.lead?.notes != null && widget.lead!.notes!.isNotEmpty)
                  Info('Remark / Notes', widget.lead!.notes!, last: true)
                else
                  Info('Monthly bill', widget.bill, last: true),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Heading('Update lead stage'),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: stage,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
            items: const [
              'New lead',
              'Contacted',
              'Survey scheduled',
              'Quotation sent',
              'Documents pending',
              'Installation',
              'Completed',
            ]
                .map((item) => DropdownMenuItem(value: item, child: Text(item)))
                .toList(),
            onChanged: (value) => setState(() => stage = value!),
          ),
          const SizedBox(height: 20),
          const Heading('Onboarding'),
          const SizedBox(height: 10),
          CardBox(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Column(
              children: [
                MenuTile(
                  Icons.fact_check_outlined,
                  'Site survey',
                  'Scheduled today',
                  onTap: () => openPage(
                    context,
                    AgentVisitDetailPage(customer: widget.name),
                  ),
                ),
                MenuTile(
                  Icons.folder_copy_outlined,
                  'Customer documents',
                  '3 of 5 received',
                  onTap: () => openPage(
                    context,
                    AgentDocumentsPage(customer: widget.name),
                  ),
                ),
                MenuTile(
                  Icons.event_outlined,
                  'Schedule follow-up',
                  'Set reminder',
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Follow-up scheduled in CRM')),
                  ),
                  last: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 76),
        ],
      );
}
