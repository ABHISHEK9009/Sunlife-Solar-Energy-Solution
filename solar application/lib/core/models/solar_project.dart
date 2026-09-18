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
  });

  final String id;
  final int capacityKw;
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

  factory SolarProject.fromJson(Map<String, dynamic> json) {
    final stagesList = (json['stages'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [
          'Site survey',
          'Quotation approved',
          'Documents submitted',
          'Installation',
          'Net metering',
          'Subsidy credit',
        ];
    final engineer = json['assignedEngineer'] is Map ? json['assignedEngineer'] as Map<String, dynamic> : null;
    final sales = json['assignedSalesExecutive'] is Map ? json['assignedSalesExecutive'] as Map<String, dynamic> : null;

    return SolarProject(
      id: json['projectCode'] as String? ?? json['id'] as String? ?? 'SS-2026-00452',
      capacityKw: (json['capacityKw'] ?? json['capacity_kw']) as int? ?? 5,
      projectType: json['projectType'] as String? ?? json['project_type'] as String? ?? 'Residential',
      systemType: json['systemType'] as String? ?? json['system_type'] as String? ?? 'On-grid',
      status: json['status'] as String? ?? 'IN PROGRESS',
      currentStage: json['currentStage'] as String? ?? json['current_stage'] as String? ?? 'Net metering',
      expectedUpdateDays: json['expected_update_days'] as String? ?? '5–7 days',
      address: json['installationAddress'] as String? ?? json['address'] as String? ?? 'Vaishali Nagar, Jaipur',
      discom: json['discom'] as String? ?? 'JVVNL',
      panels: json['panels'] as String? ?? 'Adani Solar 540W',
      inverter: json['inverter'] as String? ?? 'Sungrow 5 kW',
      engineerName: engineer?['name'] as String? ?? json['engineer_name'] as String? ?? 'Amit Sharma',
      salesExecutive: sales?['name'] as String? ?? json['sales_executive'] as String? ?? 'Priya Verma',
      completedStages: (json['completed_stages'] ?? json['completedStages']) as int? ?? 4,
      totalStages: (json['total_stages'] ?? json['totalStages']) as int? ?? 6,
      stages: stagesList,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
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
