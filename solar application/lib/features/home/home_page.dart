import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/models/payment_record.dart';
import '../../core/models/solar_project.dart';
import '../../core/models/subsidy_status.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/document_repository.dart';
import '../../core/repositories/notification_repository.dart';
import '../../core/repositories/payment_repository.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/repositories/subsidy_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/pill.dart';
import '../documents/documents_page.dart';
import '../notifications/notifications_page.dart';
import '../payments/payments_page.dart';
import '../project/project_detail_page.dart';
import '../project/widgets/progress_tracker.dart';
import '../project/widgets/update_tile.dart';
import '../subsidy/subsidy_page.dart';
import '../support/support_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  SolarProject? _project;
  PaymentSummary? _paymentSummary;
  int _documentCount = 0;
  String _subsidyStage = 'Processing';
  final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _loadData();
    DocumentRepository.instance.addListener(_handleRepoChange);
    PaymentRepository.instance.addListener(_handleRepoChange);
  }

  @override
  void dispose() {
    DocumentRepository.instance.removeListener(_handleRepoChange);
    PaymentRepository.instance.removeListener(_handleRepoChange);
    super.dispose();
  }

  void _handleRepoChange() {
    if (mounted) {
      setState(() {
        _documentCount = DocumentRepository.instance.documents.length;
        _paymentSummary = PaymentRepository.instance.currentSummary;
        _subsidyStage = SubsidyRepository.instance.currentStatus.statusLabel;
      });
    }
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ProjectRepository.instance.getCurrentProject(),
        PaymentRepository.instance.getPaymentSummary(),
        DocumentRepository.instance.getDocuments(),
        SubsidyRepository.instance.getSubsidyStatus(),
      ]);

      if (mounted) {
        setState(() {
          _project = results[0] as SolarProject?;
          _paymentSummary = results[1] as PaymentSummary?;
          _documentCount = (results[2] as List).length;
          _subsidyStage = (results[3] as SubsidyStatus).statusLabel;
        });
      }
    } catch (_) {}
  }

  String get _greeting {
    final user = AuthRepository.instance.currentUser;
    final name = (user?.name.isNotEmpty == true)
        ? user!.name.split(' ').first
        : (user?.phone.isNotEmpty == true ? user!.phone : 'Valued Customer');
    return 'Good morning, $name';
  }

  @override
  Widget build(BuildContext context) {
    final project = _project;
    final payment = _paymentSummary;
    final user = AuthRepository.instance.currentUser;
    final isChequeUploaded = DocumentRepository.instance.requiredCheque?.isUploaded ?? false;

    return Frame(
      _greeting,
      [
        if (project != null) ...[
          CardBox(
            color: AppColors.ink,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'YOUR SOLAR PROJECT',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Pill(project.status, greenText: true),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  '${project.capacityKw} kW Rooftop Solar',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  'Project ${project.id} • ${project.projectType}',
                  style: const TextStyle(color: Colors.white60),
                ),
                const SizedBox(height: 18),
                const Divider(color: Colors.white12),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ProjectStat(
                        'CURRENT STAGE',
                        project.currentStage,
                      ),
                    ),
                    Expanded(
                      child: ProjectStat(
                        'EXPECTED UPDATE',
                        project.expectedUpdateDays,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Heading(
            'Project progress',
            action: 'View details',
            onAction: () => openPage(context, const ProjectDetailPage()),
          ),
          const SizedBox(height: 12),
          CardBox(child: Progress(project: project)),
        ] else ...[
          CardBox(
            color: AppColors.ink,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'SOLAR PLANT STATUS',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Pill('ENQUIRY PENDING', greenText: true),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'No Active Solar Plant Linked Yet',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  user?.city != null
                      ? 'Your solar enquiry for ${user!.city} is registered in our database. Live project tracking will activate here upon installation confirmation.'
                      : 'Your enquiry is registered in our database. Live project tracking will activate here upon installation confirmation.',
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 16),
                const Divider(color: Colors.white12),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Expanded(
                      child: ProjectStat('CURRENT STATUS', 'Site Survey Pending'),
                    ),
                    Expanded(
                      child: ProjectStat('DATABASE SYNC', 'Real-Time Connected'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Heading('Next steps'),
          const SizedBox(height: 12),
          CardBox(
            color: AppColors.softGreen,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.calendar_month_rounded, color: AppColors.deepGreen, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Free Rooftop Site Survey',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.ink),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'A certified Sunlife solar engineer will evaluate your roof orientation, shadow patterns, and structural feasibility.',
                  style: TextStyle(color: AppColors.muted, fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => openPage(context, const SupportPage()),
                    icon: const Icon(Icons.support_agent_rounded, size: 18),
                    label: const Text('Contact Solar Advisor', style: TextStyle(fontWeight: FontWeight.w800)),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.deepGreen,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        const Heading('Quick access'),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.38,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          children: [
            HomeQuickAction(
              icon: Icons.folder_outlined,
              title: 'Documents',
              subtitle: '$_documentCount files',
              onTap: () => openPage(context, const DocumentsPage()),
            ),
            HomeQuickAction(
              icon: Icons.account_balance_wallet_outlined,
              title: 'Payments',
              subtitle: payment != null && payment.remainingBalance > 0
                  ? '${_currencyFormat.format(payment.remainingBalance)} due'
                  : 'All cleared',
              onTap: () => openPage(context, const PaymentsPage()),
            ),
            HomeQuickAction(
              icon: Icons.account_balance_outlined,
              title: 'Subsidy',
              subtitle: _subsidyStage.toUpperCase(),
              onTap: () => openPage(context, const SubsidyPage()),
            ),
            HomeQuickAction(
              icon: Icons.support_agent_outlined,
              title: 'Get help',
              subtitle: 'Raise a query',
              onTap: () => openPage(context, const SupportPage()),
            ),
          ],
        ),
        if (project != null) ...[
          const SizedBox(height: 16),
          CardBox(
            color: isChequeUploaded ? AppColors.softGreen : const Color(0xFFFFFBEB),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: isChequeUploaded ? AppColors.green : AppColors.yellow,
                  child: Icon(
                    isChequeUploaded ? Icons.verified_rounded : Icons.upload_file_rounded,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isChequeUploaded ? 'Cheque uploaded' : 'Action needed',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isChequeUploaded
                            ? 'Cancelled cheque submitted · Under review for subsidy credit'
                            : 'Upload cancelled cheque for subsidy',
                        style: const TextStyle(color: AppColors.muted, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => openPage(context, const DocumentsPage()),
                  icon: const Icon(Icons.arrow_forward),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 22),
        const Heading('Live status update'),
        const SizedBox(height: 12),
        CardBox(
          child: UpdateTile(
            DateFormat('dd MMM').format(DateTime.now()),
            project != null ? 'Project status: ${project.status}' : 'Connected with Database',
            project != null
                ? 'Current stage is ${project.currentStage}.'
                : 'Your profile is authenticated and connected in real-time with Sunlife Solar CRM.',
            last: true,
          ),
        ),
      ],
      onRefresh: _loadData,
      action: ValueListenableBuilder<int>(
        valueListenable: NotificationRepository.instance.unreadCountNotifier,
        builder: (context, unreadCount, _) => Stack(
          alignment: Alignment.topRight,
          children: [
            IconButton.filledTonal(
              onPressed: () => openPage(context, const NotificationsPage()),
              icon: const Icon(Icons.notifications_none, color: AppColors.ink),
            ),
            if (unreadCount > 0)
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.orange,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}


class ProjectStat extends StatelessWidget {
  const ProjectStat(this.label, this.value, {super.key});
  final String label, value;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white38,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      );
}

class HomeQuickAction extends StatelessWidget {
  const HomeQuickAction({
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
  Widget build(BuildContext context) => CardBox(
        padding: EdgeInsets.zero,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CircleAvatar(
                  radius: 17,
                  backgroundColor: AppColors.softGreen,
                  child: Icon(icon, color: AppColors.orange, size: 19),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
}
