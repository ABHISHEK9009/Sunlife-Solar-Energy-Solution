import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/models/payment_record.dart';
import '../../core/models/solar_project.dart';
import '../../core/models/subsidy_status.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/document_repository.dart';
import '../../core/repositories/payment_repository.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/repositories/subsidy_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/pill.dart';
import '../calculator/calculator_page.dart';
import '../documents/documents_page.dart';
import '../enquiry/solar_services_page.dart';
import '../payments/payments_page.dart';
import '../project/project_detail_page.dart';
import '../project/widgets/progress_tracker.dart';
import '../project/widgets/update_tile.dart';
import '../subsidy/subsidy_page.dart';
import '../support/service_request_page.dart';
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
    ProjectRepository.instance.addListener(_handleProjectRepoChange);
    AuthRepository.instance.addListener(_handleRepoChange);
  }

  @override
  void dispose() {
    DocumentRepository.instance.removeListener(_handleRepoChange);
    PaymentRepository.instance.removeListener(_handleRepoChange);
    ProjectRepository.instance.removeListener(_handleProjectRepoChange);
    AuthRepository.instance.removeListener(_handleRepoChange);
    super.dispose();
  }

  void _handleProjectRepoChange() {
    if (mounted) {
      setState(() {
        _project = ProjectRepository.instance.activeProject;
      });
    }
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

  Future<void> _callPhone(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _chatWhatsApp(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('https://wa.me/91$clean?text=Hello%20Sunlife%20Solar,%20I%20have%20an%20enquiry%20regarding%20my%20solar%20project.');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final project = _project;
    final user = AuthRepository.instance.currentUser;
    final isEnquiryContext = project == null || ProjectRepository.instance.isEnquirySelected;

    if (isEnquiryContext) {
      return _buildEnquiryDashboard(context, user);
    }

    if (project.isCommissioned) {
      return _buildCommissionedPlantDashboard(context, project, user);
    }

    return _buildActiveInstallationDashboard(context, project, user);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. NEW ENQUIRY CUSTOMER DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  Widget _buildEnquiryDashboard(BuildContext context, dynamic user) {
    final name = (user?.name.isNotEmpty == true) ? user!.name.split(' ').first : 'there';
    final advisorName = user?.advisorName ?? 'Sunlife Solar Desk';
    final advisorPhone = user?.advisorPhone ?? ApiConstants.supportPhone;
    final city = user?.city ?? 'your city';
    final bill = user?.monthlyBill ?? 'Not specified';
    final leadStatus = user?.leadStatus ?? 'ENQUIRY_RECEIVED';

    return Frame(
      _greeting,
      [
        // Enquiry Card
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'SOLAR CONSULTATION',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Pill(leadStatus.replaceAll('_', ' '), greenText: true),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Hello, $name 👋',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Your rooftop solar assessment for $city is registered in Sunlife CRM.',
                style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.35),
              ),
              const SizedBox(height: 14),
              const Divider(color: Colors.white12),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ProjectStat('PROPERTY', user?.propertyType ?? 'Residential'),
                  ),
                  Expanded(
                    child: ProjectStat('MONTHLY BILL', bill),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Assigned Advisor Card
        const Heading('Assigned solar advisor'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppColors.softGreen,
                    child: Icon(Icons.person_pin_rounded, color: AppColors.deepGreen),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          advisorName,
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                        ),
                        Text(
                          'Sunlife Operations • $advisorPhone',
                          style: const TextStyle(color: AppColors.muted, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _callPhone(advisorPhone),
                      icon: const Icon(Icons.phone_outlined, size: 18),
                      label: const Text('Call Advisor'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _chatWhatsApp(advisorPhone),
                      icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                      label: const Text('WhatsApp'),
                      style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Consultation & Survey Status
        const Heading('Consultation milestones'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              _EnquiryCheckTile('1. Contact & mobile number verified', done: true),
              _EnquiryCheckTile('2. Requirement assessment submitted', done: true),
              _EnquiryCheckTile('3. Technical advisor assigned ($advisorName)', done: true),
              _EnquiryCheckTile(
                '4. On-site 3D rooftop survey',
                done: leadStatus == 'SURVEY_COMPLETED' || leadStatus == 'QUOTATION_SENT',
                active: leadStatus == 'SURVEY_SCHEDULED',
              ),
              _EnquiryCheckTile(
                '5. Custom engineering proposal & subsidy calculation',
                done: leadStatus == 'QUOTATION_SENT',
                last: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Next Required Action Banner
        CardBox(
          color: const Color(0xFFFEF3C7),
          child: Row(
            children: [
              const Icon(Icons.info_outline_rounded, color: Color(0xFF92400E), size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Next Step in Your Journey',
                      style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF92400E)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      leadStatus == 'SURVEY_SCHEDULED'
                          ? 'Your on-site feasibility survey is scheduled. Engineer will evaluate shadow and roof area.'
                          : 'Our operations team will contact you within 24 hours to schedule your rooftop assessment.',
                      style: const TextStyle(color: Color(0xFF92400E), fontSize: 12, height: 1.3),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Quick Access Grid
        const Heading('Quick tools & assistance'),
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
              icon: Icons.calculate_outlined,
              title: 'Solar Calculator',
              subtitle: 'Estimate savings',
              onTap: () => openPage(context, const CalculatorPage()),
            ),
            HomeQuickAction(
              icon: Icons.grid_view_outlined,
              title: 'Solar Services',
              subtitle: 'On-grid & Hybrid',
              onTap: () => openPage(context, const SolarServicesPage()),
            ),
            HomeQuickAction(
              icon: Icons.folder_outlined,
              title: 'Documents',
              subtitle: 'Upload bill / KYC',
              onTap: () => openPage(context, const DocumentsPage()),
            ),
            HomeQuickAction(
              icon: Icons.support_agent_outlined,
              title: 'Get Help',
              subtitle: 'Ask a question',
              onTap: () => openPage(context, const SupportPage()),
            ),
          ],
        ),
        const SizedBox(height: 22),

        const Heading('CRM Connection'),
        const SizedBox(height: 12),
        CardBox(
          child: UpdateTile(
            DateFormat('dd MMM yyyy').format(DateTime.now()),
            'Authoritative CRM Connection Active',
            'Your enquiry records are synchronized in real-time with Sunlife Solar CRM.',
            last: true,
          ),
        ),
      ],
      onRefresh: () => AuthRepository.instance.fetchMe(),
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ACTIVE INSTALLATION DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  Widget _buildActiveInstallationDashboard(BuildContext context, SolarProject project, dynamic user) {
    final payment = _paymentSummary;
    final isChequeUploaded = DocumentRepository.instance.requiredCheque?.isUploaded ?? false;

    return Frame(
      _greeting,
      [
        // Project Summary Card
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'ACTIVE SOLAR INSTALLATION',
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
                'Project ${project.id} • ${project.projectType} • ${project.systemType}',
                style: const TextStyle(color: Colors.white60),
              ),
              const SizedBox(height: 18),
              const Divider(color: Colors.white12),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ProjectStat('CURRENT STAGE', project.currentStage),
                  ),
                  Expanded(
                    child: ProjectStat('DISCOM', project.discom),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Installation Work Progress
        const Heading('Project progress'),
        const SizedBox(height: 12),
        CardBox(child: Progress(project: project)),
        const SizedBox(height: 22),

        // Action Needed Card
        if (project.customerActionRequired != null || !isChequeUploaded) ...[
          CardBox(
            color: const Color(0xFFFFFBEB),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.yellow,
                  child: Icon(Icons.upload_file_rounded, color: Colors.white),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Customer Action Required',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        project.customerActionRequired ?? 'Upload cancelled cheque for Direct Benefit Transfer subsidy sanction.',
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
          const SizedBox(height: 20),
        ],

        // Payment Summary Card
        const Heading('Payment status'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Outstanding Balance', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                  Text(
                    payment != null && payment.remainingBalance > 0
                        ? _currencyFormat.format(payment.remainingBalance)
                        : 'Cleared',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      color: payment != null && payment.remainingBalance > 0 ? AppColors.orange : AppColors.green,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: payment != null && payment.totalContractValue > 0
                      ? (payment.totalPaid / payment.totalContractValue).clamp(0.0, 1.0)
                      : 0.0,
                  color: AppColors.green,
                  backgroundColor: AppColors.cardBorder,
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Paid: ${payment != null ? _currencyFormat.format(payment.totalPaid) : "₹0"}',
                      style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  Text('Total: ${payment != null ? _currencyFormat.format(payment.totalContractValue) : "₹0"}',
                      style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Quick Access
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
              subtitle: 'Contact Engineer',
              onTap: () => openPage(context, const SupportPage()),
            ),
          ],
        ),
        const SizedBox(height: 22),

        const Heading('Live status update'),
        const SizedBox(height: 12),
        CardBox(
          child: UpdateTile(
            DateFormat('dd MMM').format(DateTime.now()),
            'Project status: ${project.status}',
            'Current stage is ${project.currentStage}. Operations team working on next milestone.',
            last: true,
          ),
        ),
      ],
      onRefresh: () => _loadData(),
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. COMMISSIONED SOLAR PLANT DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  Widget _buildCommissionedPlantDashboard(BuildContext context, SolarProject project, dynamic user) {
    final monitoring = project.monitoringData;
    final hasMonitoring = monitoring != null && monitoring['totalGeneratedEnergyKwh'] != null;
    final totalEnergy = hasMonitoring
        ? '${(monitoring['totalGeneratedEnergyKwh'] as num).toDouble().toStringAsFixed(1)} kWh'
        : null;
    final systemHealth = monitoring?['systemHealth'] as String? ?? 'NORMAL';
    final commDateStr = project.commissioningDate != null
        ? DateFormat('dd MMM yyyy').format(project.commissioningDate!)
        : 'Commissioned';

    return Frame(
      _greeting,
      [
        // Commissioned Plant Header
        CardBox(
          color: AppColors.ink,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'COMMISSIONED SOLAR PLANT',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Pill('OPERATIONAL', greenText: true),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                '${project.capacityKw} kW Live Solar Plant',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'Commissioned $commDateStr • ${project.discom}',
                style: const TextStyle(color: Colors.white60),
              ),
              const SizedBox(height: 18),
              const Divider(color: Colors.white12),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ProjectStat('DISCOM CONSUMER NO', project.consumerNumber ?? 'Registered'),
                  ),
                  Expanded(
                    child: ProjectStat('GRID STATUS', 'SYNCHRONIZED'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Energy & System Health (Real Data Only!)
        const Heading('Plant performance & health'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (hasMonitoring) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('TOTAL GENERATED ENERGY', style: TextStyle(color: AppColors.muted, fontSize: 11, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(totalEnergy!, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.deepGreen)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.softGreen,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 16),
                          const SizedBox(width: 6),
                          Text(systemHealth, style: const TextStyle(color: AppColors.deepGreen, fontWeight: FontWeight.w900, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Data source: Live Inverter Telemetry / Inverter API', style: TextStyle(color: AppColors.muted, fontSize: 11)),
              ] else ...[
                Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: AppColors.softGreen,
                      child: Icon(Icons.solar_power_rounded, color: AppColors.deepGreen),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Active Generation Verified',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Inverter is grid-synchronized. Remote telemetry data logger link is being verified with your advisor.',
                            style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Equipment Specifications
        const Heading('Installed equipment & warranty'),
        const SizedBox(height: 12),
        CardBox(
          child: Column(
            children: [
              Info('Solar Panels', project.panels),
              Info('Inverter', project.inverter),
              Info('Panel Performance Warranty', '25-Year Manufacturer Warranty'),
              Info('Inverter Warranty', '5-Year Manufacturer Warranty', last: true),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Quick Access
        const Heading('Services & documents'),
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
              title: 'Document Vault',
              subtitle: 'Handover & warranties',
              onTap: () => openPage(context, const DocumentsPage()),
            ),
            HomeQuickAction(
              icon: Icons.cleaning_services_outlined,
              title: 'Maintenance',
              subtitle: 'Panel cleaning / check',
              onTap: () => openPage(context, const ServiceRequestPage()),
            ),
            HomeQuickAction(
              icon: Icons.account_balance_outlined,
              title: 'Subsidy Status',
              subtitle: _subsidyStage.toUpperCase(),
              onTap: () => openPage(context, const SubsidyPage()),
            ),
            HomeQuickAction(
              icon: Icons.support_agent_outlined,
              title: 'Helpdesk',
              subtitle: 'Raise a ticket',
              onTap: () => openPage(context, const SupportPage()),
            ),
          ],
        ),
        const SizedBox(height: 22),

        const Heading('Plant status'),
        const SizedBox(height: 12),
        CardBox(
          child: UpdateTile(
            DateFormat('dd MMM yyyy').format(DateTime.now()),
            'Operational & Connected',
            'Plant handover complete. Sunlife after-sales support active.',
            last: true,
          ),
        ),
      ],
      onRefresh: () => _loadData(),
    );
  }
}

class _EnquiryCheckTile extends StatelessWidget {
  const _EnquiryCheckTile(this.title, {this.done = false, this.active = false, this.last = false});

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
                  color: done || active ? AppColors.ink : AppColors.muted,
                  fontWeight: active ? FontWeight.w900 : FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
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
