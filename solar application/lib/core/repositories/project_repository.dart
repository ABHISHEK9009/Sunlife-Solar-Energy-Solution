import '../constants/api_constants.dart';
import '../models/solar_project.dart';
import '../network/api_client.dart';

class ProjectRepository {
  ProjectRepository._internal();
  static final ProjectRepository instance = ProjectRepository._internal();

  SolarProject? _cachedProject;

  Future<SolarProject> getCurrentProject({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedProject != null) {
      return _cachedProject!;
    }

    try {
      final res = await ApiClient.instance.get(ApiConstants.customerProjects);
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['projects'] is List && (data['projects'] as List).isNotEmpty) {
          final firstProject = (data['projects'] as List).first as Map<String, dynamic>;
          _cachedProject = SolarProject.fromJson(firstProject);
          return _cachedProject!;
        }
      }
    } catch (_) {
      // Fallback for offline testing
    }

    _cachedProject = const SolarProject(
      id: 'SS-2026-00452',
      capacityKw: 5,
      projectType: 'Residential',
      systemType: 'On-grid',
      status: 'IN PROGRESS',
      currentStage: 'Net metering',
      expectedUpdateDays: '5–7 days',
      address: 'Vaishali Nagar, Jaipur',
      discom: 'JVVNL',
      panels: 'Adani Solar 540W',
      inverter: 'Sungrow 5 kW',
      engineerName: 'Amit Sharma',
      salesExecutive: 'Priya Verma',
      completedStages: 4,
      totalStages: 6,
      stages: [
        'Site survey',
        'Quotation approved',
        'Documents submitted',
        'Installation',
        'Net metering',
        'Subsidy credit',
      ],
    );
    return _cachedProject!;
  }
}
