
class ProjectTimelineEvent {
  const ProjectTimelineEvent({
    required this.id,
    required this.eventType,
    required this.eventTitle,
    required this.customerDescription,
    required this.eventDateTime,
    this.status,
  });

  final String id;
  final String eventType;
  final String eventTitle;
  final String customerDescription;
  final DateTime eventDateTime;
  final String? status;

  factory ProjectTimelineEvent.fromJson(Map<String, dynamic> json) {
    return ProjectTimelineEvent(
      id: json['id'] as String? ?? '',
      eventType: json['eventType'] as String? ?? 'STATUS_UPDATE',
      eventTitle: json['eventTitle'] as String? ?? 'Status Update',
      customerDescription: json['customerDescription'] as String? ?? '',
      eventDateTime: json['eventDateTime'] != null
          ? DateTime.tryParse(json['eventDateTime'].toString()) ?? DateTime.now()
          : DateTime.now(),
      status: json['status'] as String?,
    );
  }
}

class ProjectMilestone {
  const ProjectMilestone({
    required this.title,
    required this.department,
    required this.status, // COMPLETED, VERIFIED, IN_PROGRESS, PENDING, WAITING_ON_CUSTOMER
    required this.description,
    this.requiredEvidence,
    this.customerAction,
    this.plannedDate,
    this.actualCompletionDate,
    required this.isCompleted,
    required this.isCurrent,
  });

  final String title;
  final String department;
  final String status;
  final String description;
  final String? requiredEvidence;
  final String? customerAction;
  final DateTime? plannedDate;
  final DateTime? actualCompletionDate;
  final bool isCompleted;
  final bool isCurrent;
}

class SolarProject {
  const SolarProject({
    required this.id,
    required this.capacityKw,
    required this.projectType,
    required this.systemType,
    required this.status,
    required this.currentStage,
    required this.expectedUpdateDays,
    required this.address,
    required this.discom,
    required this.panels,
    required this.inverter,
    required this.engineerName,
    required this.salesExecutive,
    required this.completedStages,
    required this.totalStages,
    required this.stages,
    this.projectIdCode,
    this.projectName,
    this.commissioningDate,
    this.installationDate,
    this.panelQuantity,
    this.inverterSerialNumber,
    this.warrantyStartDate,
    this.warrantyEndDate,
    this.consumerNumber,
    this.customerActionRequired,
    this.timelineEvents = const [],
    this.monitoringData,
  });

  final String id;
  final String? projectIdCode;
  final String? projectName;
  final double capacityKw; // Support fractional capacity like 3.5 kW without cast exceptions
  final String projectType;
  final String systemType;
  final String status;
  final String currentStage;
  final String expectedUpdateDays;
  final String address;
  final String discom;
  final String panels;
  final String inverter;
  final String engineerName;
  final String salesExecutive;
  final int completedStages;
  final int totalStages;
  final List<String> stages;
  final DateTime? commissioningDate;
  final DateTime? installationDate;
  final int? panelQuantity;
  final String? inverterSerialNumber;
  final DateTime? warrantyStartDate;
  final DateTime? warrantyEndDate;
  final String? consumerNumber;
  final String? customerActionRequired;
  final List<ProjectTimelineEvent> timelineEvents;
  final Map<String, dynamic>? monitoringData;

  bool get isCommissioned =>
      status == 'ACTIVE' || status == 'COMMISSIONED' || commissioningDate != null;

  bool get isInstallationInProgress =>
      !isCommissioned &&
      status != 'CANCELLED' &&
      status != 'ON_HOLD' &&
      status != 'ENQUIRY';

  bool get isPreInstallation =>
      status == 'ENQUIRY' ||
      status == 'SURVEY_SCHEDULED' ||
      status == 'SURVEY_COMPLETED' ||
      status == 'QUOTATION_PENDING';

  bool get isOnGrid =>
      systemType.toUpperCase().contains('ON_GRID') ||
      systemType.toUpperCase().contains('ON-GRID');

  bool get isOffGrid =>
      systemType.toUpperCase().contains('OFF_GRID') ||
      systemType.toUpperCase().contains('OFF-GRID');

  bool get isHybrid =>
      systemType.toUpperCase().contains('HYBRID');

  /// CRM-driven installation work listing with conditional milestones based on solar system type
  List<ProjectMilestone> get milestones {
    final s = status.toUpperCase();
    final items = <ProjectMilestone>[];

    // Helper status checks
    final surveyDone = s != 'ENQUIRY' && s != 'NEW' && s != 'SURVEY_SCHEDULED';
    final quotationDone = surveyDone &&
        s != 'SURVEY_COMPLETED' &&
        s != 'DESIGN_PREPARED' &&
        s != 'QUOTATION_PENDING';
    final docsDone = quotationDone &&
        s != 'QUOTATION_APPROVED' &&
        s != 'ORDER_CONFIRMED' &&
        s != 'DOCUMENTS_PENDING';
    final feasibilityDone = docsDone && s != 'DOCUMENTS_SUBMITTED';
    final materialDone = feasibilityDone && s != 'MATERIAL_PENDING';
    final installDone = installationDate != null ||
        [
          'INSTALLATION_COMPLETED',
          'NET_METERING_PENDING',
          'NET_METER_INSTALLED',
          'SUBSIDY_PROCESSING',
          'ACTIVE',
          'COMMISSIONED',
        ].contains(s);
    final testingDone = [
      'NET_METERING_PENDING',
      'NET_METER_INSTALLED',
      'SUBSIDY_PROCESSING',
      'ACTIVE',
      'COMMISSIONED',
    ].contains(s);
    final netMeterDone = [
      'NET_METER_INSTALLED',
      'SUBSIDY_PROCESSING',
      'ACTIVE',
      'COMMISSIONED',
    ].contains(s);
    final fullyCommissioned = isCommissioned;

    // 1. Feasibility Survey
    items.add(ProjectMilestone(
      title: 'Site Feasibility Survey',
      department: 'Technical Survey',
      status: surveyDone ? 'COMPLETED' : (s == 'SURVEY_SCHEDULED' ? 'IN_PROGRESS' : 'PENDING'),
      description: 'On-site 3D shadow analysis, roof structure assessment, and distribution load check.',
      requiredEvidence: 'Rooftop photographs & 3D shadow report',
      isCompleted: surveyDone,
      isCurrent: s == 'SURVEY_SCHEDULED' || s == 'ENQUIRY',
    ));

    // 2. Engineering Design & Proposal
    items.add(ProjectMilestone(
      title: 'System Design & Quotation',
      department: 'Solar Engineering',
      status: quotationDone ? 'COMPLETED' : (surveyDone ? 'IN_PROGRESS' : 'PENDING'),
      description: 'Module layout optimization, string inverter sizing, and final subsidised proposal generation.',
      requiredEvidence: 'Approved CAD single-line drawing & Bill of Quantities',
      customerAction: s == 'QUOTATION_PENDING' ? 'Review & approve proposal' : null,
      isCompleted: quotationDone,
      isCurrent: s == 'SURVEY_COMPLETED' || s == 'QUOTATION_PENDING',
    ));

    // 3. Documentation & Permits
    items.add(ProjectMilestone(
      title: 'Customer KYC & Agreement',
      department: 'Operations Desk',
      status: docsDone ? 'COMPLETED' : (quotationDone ? 'IN_PROGRESS' : 'PENDING'),
      description: 'Submission of electricity bills, ID proof, and formal installation contract execution.',
      requiredEvidence: 'Signed installation contract & verified electricity bill',
      customerAction: s == 'DOCUMENTS_PENDING' ? 'Upload required KYC docs' : null,
      isCompleted: docsDone,
      isCurrent: s == 'QUOTATION_APPROVED' || s == 'ORDER_CONFIRMED' || s == 'DOCUMENTS_PENDING',
    ));

    // 4. Conditional: DISCOM Net Metering Application (On-grid & Hybrid only)
    if (!isOffGrid) {
      items.add(ProjectMilestone(
        title: 'DISCOM Net Metering Application',
        department: 'DISCOM Liaising',
        status: feasibilityDone ? 'COMPLETED' : (docsDone ? 'IN_PROGRESS' : 'PENDING'),
        description: 'Filing grid-interconnection application and transformer load feasibility with $discom.',
        requiredEvidence: 'DISCOM Acknowledgement receipt & Application registration ID',
        isCompleted: feasibilityDone,
        isCurrent: s == 'DOCUMENTS_SUBMITTED',
      ));
    }

    // 5. Conditional: Battery Bank Sizing (Off-grid & Hybrid only)
    if (isOffGrid || isHybrid) {
      items.add(ProjectMilestone(
        title: 'Battery Energy Storage Sizing',
        department: 'Storage Engineering',
        status: materialDone ? 'COMPLETED' : (docsDone ? 'IN_PROGRESS' : 'PENDING'),
        description: 'Autonomous backup duration calculation, battery chemistry configuration, and charge controller staging.',
        requiredEvidence: 'Battery bench test certificate & warranty serial mapping',
        isCompleted: materialDone,
        isCurrent: docsDone && !materialDone,
      ));
    }

    // 6. Procurement & Dispatch
    items.add(ProjectMilestone(
      title: 'Material Procurement & Dispatch',
      department: 'Logistics & Supply Chain',
      status: materialDone ? 'COMPLETED' : (docsDone ? 'IN_PROGRESS' : 'PENDING'),
      description: 'Tier-1 solar modules ($panels) and inverter dispatch from central warehouse.',
      requiredEvidence: 'Material dispatch receipt & component serial barcodes',
      isCompleted: materialDone,
      isCurrent: s == 'MATERIAL_PENDING' || s == 'MATERIAL_DISPATCHED',
    ));

    // 7. Physical Rooftop Installation
    items.add(ProjectMilestone(
      title: 'Physical Installation Work',
      department: 'Field Operations',
      status: installDone ? 'COMPLETED' : (materialDone ? 'IN_PROGRESS' : 'PENDING'),
      description: 'HDGI structure mounting, solar panel array clamping, inverter installation, and AC/DC cabling.',
      requiredEvidence: 'Work completion report & site installation photos',
      actualCompletionDate: installationDate,
      isCompleted: installDone,
      isCurrent: s == 'INSTALLATION_SCHEDULED' || s == 'INSTALLATION_IN_PROGRESS',
    ));

    // 8. Electrical Testing & Quality Inspection
    items.add(ProjectMilestone(
      title: 'Electrical Testing & Inspection',
      department: 'Quality & Safety Bureau',
      status: testingDone ? 'COMPLETED' : (installDone ? 'IN_PROGRESS' : 'PENDING'),
      description: 'Insulation resistance (Megger) test, earthing pit resistance measurement, and safety relay validation.',
      requiredEvidence: 'Joint Inspection Report (JIR) & earth resistance test log',
      isCompleted: testingDone,
      isCurrent: s == 'INSTALLATION_COMPLETED',
    ));

    // 9. Conditional: Bi-Directional Net Meter (On-grid & Hybrid only)
    if (!isOffGrid) {
      items.add(ProjectMilestone(
        title: 'DISCOM Net Meter Installation',
        department: 'DISCOM Operations',
        status: netMeterDone ? 'COMPLETED' : (testingDone ? 'IN_PROGRESS' : 'PENDING'),
        description: 'Replacement of unidirectional meter with bidirectional smart net meter and seal verification.',
        requiredEvidence: 'DISCOM meter installation sealing sheet & initial meter reading',
        isCompleted: netMeterDone,
        isCurrent: s == 'NET_METERING_PENDING',
      ));
    }

    // 10. Commissioning & Final Handover
    items.add(ProjectMilestone(
      title: 'Plant Commissioning & Handover',
      department: 'Sunlife Commissioning Authority',
      status: fullyCommissioned ? 'VERIFIED' : (netMeterDone || (isOffGrid && testingDone) ? 'IN_PROGRESS' : 'PENDING'),
      description: 'Plant grid synchronization, inverter energization, handover pack delivery, and warranty card issue.',
      requiredEvidence: 'Signed Handover Certificate & Equipment Warranty cards',
      actualCompletionDate: commissioningDate,
      isCompleted: fullyCommissioned,
      isCurrent: !fullyCommissioned && (netMeterDone || (isOffGrid && testingDone)),
    ));

    // 11. Subsidy Disbursement (PM Surya Ghar DBT)
    items.add(ProjectMilestone(
      title: 'Subsidy Disbursement (PM Surya Ghar DBT)',
      department: 'National Portal Liaising',
      status: fullyCommissioned ? 'IN_PROGRESS' : 'PENDING',
      description: 'Subsidy claim submission on National Portal and direct bank transfer credit verification.',
      requiredEvidence: 'National portal subsidy claim acknowledgment',
      customerAction: (customerActionRequired?.isNotEmpty == true) ? customerActionRequired : null,
      isCompleted: s == 'SUBSIDY_APPROVED' || s == 'SUBSIDY_CREDITED',
      isCurrent: fullyCommissioned,
    ));

    return items;
  }

  static const List<String> standardStages = [
    'Site survey',
    'Quotation approved',
    'Documents submitted',
    'Installation',
    'Net metering',
    'Subsidy credit',
  ];

  static String _formatStageTitle(String status) {
    switch (status.toUpperCase()) {
      case 'ENQUIRY':
        return 'Enquiry registered';
      case 'SURVEY_SCHEDULED':
        return 'Site survey scheduled';
      case 'SURVEY_COMPLETED':
        return 'Site survey completed';
      case 'QUOTATION_APPROVED':
      case 'ORDER_CONFIRMED':
        return 'Quotation approved';
      case 'DOCUMENTS_SUBMITTED':
        return 'Documents submitted';
      case 'INSTALLATION_SCHEDULED':
      case 'INSTALLATION_IN_PROGRESS':
        return 'Installation in progress';
      case 'INSTALLATION_COMPLETED':
        return 'Installation completed';
      case 'NET_METERING_PENDING':
        return 'Net metering pending';
      case 'NET_METER_INSTALLED':
        return 'Net meter installed';
      case 'SUBSIDY_PROCESSING':
        return 'Subsidy processing';
      case 'ACTIVE':
      case 'COMMISSIONED':
        return 'Plant commissioned & generating';
      default:
        return status.replaceAll('_', ' ');
    }
  }

  factory SolarProject.fromJson(Map<String, dynamic> json) {
    final stagesList = (json['stages'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        standardStages;

    final engineer = json['assignedEngineer'] is Map
        ? json['assignedEngineer'] as Map<String, dynamic>
        : null;
    final sales = json['assignedSalesExecutive'] is Map
        ? json['assignedSalesExecutive'] as Map<String, dynamic>
        : null;

    final rawCapacity = json['plantCapacityKw'] ??
        json['capacityKw'] ??
        json['capacity_kw'] ??
        0.0;
    final double capacity = rawCapacity is num
        ? rawCapacity.toDouble()
        : double.tryParse(rawCapacity.toString()) ?? 0.0;

    final projectStatus = json['projectStatus'] as String? ??
        json['status'] as String? ??
        'ENQUIRY';

    final commDate = json['commissioningDate'] != null
        ? DateTime.tryParse(json['commissioningDate'].toString())
        : null;
    final instDate = json['installationDate'] != null
        ? DateTime.tryParse(json['installationDate'].toString())
        : null;
    final wStart = json['warrantyStartDate'] != null
        ? DateTime.tryParse(json['warrantyStartDate'].toString())
        : null;
    final wEnd = json['warrantyEndDate'] != null
        ? DateTime.tryParse(json['warrantyEndDate'].toString())
        : null;

    final rawTimeline = json['timeline'] as List<dynamic>? ?? [];
    final timelineList = rawTimeline
        .map((e) => ProjectTimelineEvent.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    final rawMonitoring = json['monitoring'] is Map
        ? Map<String, dynamic>.from(json['monitoring'] as Map)
        : null;

    return SolarProject(
      id: json['id'] as String? ?? json['projectId'] as String? ?? '',
      projectIdCode: json['projectId'] as String? ?? json['projectCode'] as String?,
      projectName: json['projectName'] as String? ?? json['project_name'] as String?,
      capacityKw: capacity,
      projectType: json['propertyType'] as String? ??
          json['projectType'] as String? ??
          json['project_type'] as String? ??
          'Residential',
      systemType: json['solarType'] as String? ??
          json['systemType'] as String? ??
          json['system_type'] as String? ??
          'On-grid',
      status: projectStatus,
      currentStage: json['currentStage'] as String? ??
          json['current_stage'] as String? ??
          _formatStageTitle(projectStatus),
      expectedUpdateDays: json['expected_update_days'] as String? ??
          json['expectedUpdateDays'] as String? ??
          '3–5 business days',
      address: json['installationAddress'] as String? ??
          json['address'] as String? ??
          '',
      discom: json['discom'] as String? ?? 'MPMKVVCL',
      panels: json['panelBrandModel'] as String? ??
          json['panels'] as String? ??
          'Tier-1 Monocrystalline Solar Panels',
      inverter: json['inverterBrandModel'] as String? ??
          json['inverter'] as String? ??
          'High-Efficiency Grid-Tie Inverter',
      engineerName: engineer?['name'] as String? ??
          json['engineer_name'] as String? ??
          'Assigned Sunlife Engineer',
      salesExecutive: sales?['name'] as String? ??
          json['sales_executive'] as String? ??
          'Sunlife Solar Advisor',
      completedStages: (json['completed_stages'] ?? json['completedStages']) as int? ?? 0,
      totalStages: (json['total_stages'] ?? json['totalStages']) as int? ?? stagesList.length,
      stages: stagesList,
      commissioningDate: commDate,
      installationDate: instDate,
      panelQuantity: json['panelQuantity'] as int?,
      inverterSerialNumber: json['inverterSerialNumber'] as String?,
      warrantyStartDate: wStart,
      warrantyEndDate: wEnd,
      consumerNumber: json['consumerNumber'] as String?,
      customerActionRequired: json['customerActionRequired'] as String?,
      timelineEvents: timelineList,
      monitoringData: rawMonitoring,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'projectId': projectIdCode ?? id,
        'capacity_kw': capacityKw,
        'project_type': projectType,
        'system_type': systemType,
        'status': status,
        'current_stage': currentStage,
        'expected_update_days': expectedUpdateDays,
        'address': address,
        'discom': discom,
        'panels': panels,
        'inverter': inverter,
        'engineer_name': engineerName,
        'sales_executive': salesExecutive,
        'completed_stages': completedStages,
        'total_stages': totalStages,
        'stages': stages,
        'commissioningDate': commissioningDate?.toIso8601String(),
        'installationDate': installationDate?.toIso8601String(),
        'panelQuantity': panelQuantity,
        'inverterSerialNumber': inverterSerialNumber,
        'consumerNumber': consumerNumber,
        'customerActionRequired': customerActionRequired,
      };
}
