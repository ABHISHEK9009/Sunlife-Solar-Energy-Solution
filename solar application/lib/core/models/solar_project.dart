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
  });

  final String id;
  final String? projectIdCode;
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

  static const List<String> standardStages = [
    'Site survey',
    'Quotation approved',
    'Documents submitted',
    'Installation',
    'Net metering',
    'Subsidy credit',
  ];

  static int _calculateCompletedStages(String status) {
    switch (status.toUpperCase()) {
      case 'ENQUIRY':
      case 'NEW':
        return 0;
      case 'SURVEY_SCHEDULED':
      case 'SURVEY_COMPLETED':
        return 1;
      case 'QUOTATION_PENDING':
      case 'QUOTATION_APPROVED':
      case 'ORDER_CONFIRMED':
        return 2;
      case 'DOCUMENTS_PENDING':
      case 'DOCUMENTS_SUBMITTED':
      case 'MATERIAL_PENDING':
      case 'MATERIAL_DISPATCHED':
        return 3;
      case 'INSTALLATION_SCHEDULED':
      case 'INSTALLATION_IN_PROGRESS':
      case 'INSTALLATION_COMPLETED':
        return 4;
      case 'NET_METERING_PENDING':
      case 'NET_METER_INSTALLED':
      case 'SUBSIDY_PROCESSING':
        return 5;
      case 'ACTIVE':
        return 6;
      default:
        return 1;
    }
  }

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
        return 'System active & generating';
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

    final completed = (json['completed_stages'] ?? json['completedStages']) as int? ??
        _calculateCompletedStages(projectStatus);

    return SolarProject(
      id: json['id'] as String? ?? json['projectId'] as String? ?? '',
      projectIdCode: json['projectId'] as String? ?? json['projectCode'] as String?,
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
      completedStages: completed,
      totalStages: (json['total_stages'] ?? json['totalStages']) as int? ?? 6,
      stages: stagesList,
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
      };
}
