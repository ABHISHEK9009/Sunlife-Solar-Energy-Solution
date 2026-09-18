import 'package:flutter/material.dart';
import '../../core/models/service_ticket.dart';
import '../../core/repositories/support_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/pill.dart';
import 'service_request_page.dart';

class ServicePage extends StatefulWidget {
  const ServicePage({super.key});

  @override
  State<ServicePage> createState() => _ServicePageState();
}

class _ServicePageState extends State<ServicePage> {
  List<ServiceTicket> _tickets = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTickets();
    SupportRepository.instance.addListener(_loadTickets);
  }

  @override
  void dispose() {
    SupportRepository.instance.removeListener(_loadTickets);
    super.dispose();
  }

  Future<void> _loadTickets() async {
    final list = await SupportRepository.instance.getTickets();
    if (mounted) {
      setState(() {
        _tickets = list;
        _isLoading = false;
      });
    }
  }

  void _showTicketDetails(ServiceTicket ticket) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('#${ticket.id}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  Pill(ticket.status),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                ticket.category,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text(
                ticket.description,
                style: const TextStyle(color: AppColors.muted, height: 1.45),
              ),
              const SizedBox(height: 18),
              Info('Support advisor', ticket.advisorName),
              Info('Expected response', ticket.expectedResponse),
              Info('Status', ticket.status, last: true),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Frame(
        'Help & service',
        [
          const CardBox(
            color: AppColors.softGreen,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor: AppColors.green,
                  child: Icon(Icons.support_agent, color: Colors.white),
                ),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'How can we help?',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Ask a question or request assistance',
                        style: TextStyle(color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          const CardBox(
            child: Column(
              children: [
                Info('Project assistance', 'Available'),
                Info('Document support', 'Available'),
                Info('Payment & subsidy help', 'Available'),
                Info('Support hours', 'Mon–Sat, 9 AM–6 PM', last: true),
              ],
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.ink,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              onPressed: () async {
                final category = await showModalBottomSheet<String>(
                  context: context,
                  isScrollControlled: true,
                  showDragHandle: true,
                  builder: (_) => const ServiceMenu(),
                );
                if (category != null && context.mounted) {
                  await openPage(
                    context,
                    ServiceRequestPage(initialCategory: category),
                  );
                  _loadTickets();
                }
              },
              icon: const Icon(Icons.add),
              label: const Text(
                'Raise query or request',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
          const SizedBox(height: 22),
          Heading(
            'Active queries',
            action: '${_tickets.length} total',
          ),
          const SizedBox(height: 12),
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_tickets.isEmpty)
            const CardBox(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No active queries or requests.'),
                ),
              ),
            )
          else
            for (final ticket in _tickets) ...[
              CardBox(
                child: InkWell(
                  onTap: () => _showTicketDetails(ticket),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('#${ticket.id}', style: const TextStyle(color: AppColors.muted)),
                          Pill(ticket.status),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        ticket.category,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        ticket.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.muted, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      Info('Support advisor', ticket.advisorName),
                      Info('Expected response', ticket.expectedResponse, last: true),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
        ],
        onRefresh: _loadTickets,
      );
}


class ServiceMenu extends StatelessWidget {
  const ServiceMenu({super.key});

  @override
  Widget build(BuildContext context) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'What can we help with?',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 10),
              for (final item in [
                'Project status query',
                'Document help',
                'Payment query',
                'Subsidy query',
                'Installation issue',
                'Warranty or service',
              ])
                ListTile(
                  onTap: () => Navigator.pop(context, item),
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.softGreen,
                    child: Icon(Icons.solar_power, color: AppColors.orange),
                  ),
                  title: Text(
                    item,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                ),
            ],
          ),
        ),
      );
}
