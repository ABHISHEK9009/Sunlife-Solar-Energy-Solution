import '../../core/errors/app_error.dart';
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
  static const _validStages = [
    'New lead',
    'Contacted',
    'Survey scheduled',
    'Quotation sent',
    'Documents pending',
    'Installation',
    'Completed',
  ];

  static String _normalizeStage(String raw) {
    for (final s in _validStages) {
      if (s.toLowerCase() == raw.trim().toLowerCase()) return s;
    }
    final lower = raw.toLowerCase();
    if (lower.contains('survey')) return 'Survey scheduled';
    if (lower.contains('quote') || lower.contains('quotation')) return 'Quotation sent';
    if (lower.contains('doc')) return 'Documents pending';
    if (lower.contains('install')) return 'Installation';
    if (lower.contains('contact')) return 'Contacted';
    if (lower.contains('complet') || lower.contains('won')) return 'Completed';
    return 'New lead';
  }

  late String stage = _normalizeStage(widget.initialStage);
  bool isSaving = false;
  bool _isEnrolling = false;

  String get _cleanPhone => widget.phone.replaceAll(RegExp(r'\D'), '');

  Future<void> _enrollAsCustomer() async {
    if (_isEnrolling) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Enroll as a customer?'),
        content: Text(
          'This will register ${widget.name} (${widget.phone}) as a Sunlife Solar customer and create their project.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.deepGreen),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm Enrollment', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isEnrolling = true);

    try {
      final capacityVal = double.tryParse(
        (widget.lead?.approxCapacity ?? '5').replaceAll(RegExp(r'[^\d.]'), ''),
      ) ?? 5.0;

      await AgentRepository.instance.enrollClient(
        fullName: widget.name,
        primaryMobile: _cleanPhone,
        installationAddress: widget.location,
        propertyType: widget.lead?.propertyType ?? 'RESIDENTIAL',
        monthlyBill: widget.bill.replaceAll(RegExp(r'[^\d]'), '').isEmpty ? '5000' : widget.bill.replaceAll(RegExp(r'[^\d]'), ''),
        capacityKw: capacityVal,
        notes: widget.lead?.notes,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.deepGreen,
            content: Text('Customer enrolled successfully.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final message = ErrorMapper.message(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade700,
            content: Text(message.isNotEmpty ? message : 'Enrollment failed.'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isEnrolling = false);
      }
    }
  }

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
    if (isSaving) return;
    setState(() => isSaving = true);
    try {
      await AgentRepository.instance.updateLeadStage(widget.lead?.id ?? widget.name, stage);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(AppMessages.saved)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorMapper.message(e))),
        );
      }
    } finally {
      if (mounted) {
        setState(() => isSaving = false);
      }
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
              'Save changes',
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
                if (widget.lead?.assignedAgent != null && widget.lead!.assignedAgent!.isNotEmpty)
                  Info('Assigned Agent', widget.lead!.assignedAgent!),
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
            items: _validStages
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
                    const SnackBar(content: Text('To arrange a follow-up, contact your team manager.')),
                  ),
                ),
                MenuTile(
                  Icons.how_to_reg_rounded,
                  'Enroll as a customer',
                  'Register customer and create project',
                  onTap: _enrollAsCustomer,
                  last: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 76),
        ],
      );
}
