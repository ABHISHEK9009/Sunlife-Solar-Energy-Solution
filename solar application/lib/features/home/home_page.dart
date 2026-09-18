import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/models/payment_record.dart';
import '../../core/models/solar_project.dart';
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
  int _documentCount = 6;
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
      _loadData();
    }
  }

  Future<void> _loadData() async {
    final project = await ProjectRepository.instance.getCurrentProject();
    final payment = await PaymentRepository.instance.getPaymentSummary();
    final docs = await DocumentRepository.instance.getDocuments();
    final subsidy = await SubsidyRepository.instance.getSubsidyStatus();

    if (mounted) {
      setState(() {
        _project = project;
        _paymentSummary = payment;
        _documentCount = docs.length;
        _subsidyStage = subsidy.statusLabel;
      });
    }
  }

  String get _greeting {
    final user = AuthRepository.instance.currentUser;
    final name = (user?.name.isNotEmpty == true) ? user!.name.split(' ').first : 'Rajesh';
    return 'Good morning, $name';
  }

  @override
  Widget build(BuildContext context) {
    final project = _project;
    final payment = _paymentSummary;
    final isChequeUploaded = DocumentRepository.instance.requiredCheque?.isUploaded ?? false;

    return Frame(
      _greeting,
      [
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
                  Pill(project?.status ?? 'IN PROGRESS', greenText: true),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                '${project?.capacityKw ?? 5} kW Rooftop Solar',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'Project ${project?.id ?? 'SS-2026-00452'} • ${project?.projectType ?? 'Residential'}',
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
                      project?.currentStage ?? 'Net metering',
                    ),
                  ),
                  Expanded(
                    child: ProjectStat(
                      'EXPECTED UPDATE',
                      project?.expectedUpdateDays ?? '5–7 days',
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
        const SizedBox(height: 22),
        const Heading('Latest update'),
        const SizedBox(height: 12),
        const CardBox(
          child: UpdateTile(
            '09 Sep',
            'Installation completed',
            'Your installation certificate is ready in Documents.',
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
