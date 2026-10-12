import '../errors/app_error.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/solar_project.dart';
import '../network/api_client.dart';

class ProjectRepository extends ChangeNotifier {
  ProjectRepository._internal();
  static final ProjectRepository instance = ProjectRepository._internal();

  List<SolarProject> _projects = [];
  SolarProject? _activeProject;
  Map<String, dynamic>? _openEnquiry;
  bool _hasFetched = false;
  String? _lastError;

  List<SolarProject> get allProjects => List.unmodifiable(_projects);
  List<SolarProject> get currentProjects => allProjects;
  SolarProject? get activeProject => _activeProject;
  Map<String, dynamic>? get openEnquiry => _openEnquiry;
  bool get hasFetched => _hasFetched;
  String? get lastError => _lastError;
  bool get hasMultipleProperties => _projects.length > 1 || (_projects.isNotEmpty && _openEnquiry != null);
  bool get isEnquirySelected => _activeProject == null && (_openEnquiry != null || _projects.isEmpty);
  bool get hasCommissionedPlant => _projects.any((p) => p.isCommissioned);
  bool get hasActiveInstallation => _projects.any((p) => p.isInstallationInProgress);

  void selectEnquiry() {
    _activeProject = null;
    notifyListeners();
  }

  void setProjects(List<SolarProject> projects) {
    _projects = projects;
    if (_projects.isNotEmpty) {
      if (_activeProject == null || !_projects.any((p) => p.id == _activeProject!.id)) {
        _activeProject = _projects.first;
      } else {
        _activeProject = _projects.firstWhere((p) => p.id == _activeProject!.id);
      }
    } else {
      _activeProject = null;
    }
    _hasFetched = true;
    notifyListeners();
  }

  void setOpenEnquiry(Map<String, dynamic>? enquiry) {
    _openEnquiry = enquiry;
    notifyListeners();
  }

  void reset() {
    _projects = [];
    _activeProject = null;
    _openEnquiry = null;
    _hasFetched = false;
    _lastError = null;
    notifyListeners();
  }

  void setActiveProject(SolarProject project) {
    _activeProject = project;
    notifyListeners();
  }

  Future<List<SolarProject>> getProjects({bool forceRefresh = false}) async {
    await getCurrentProject(forceRefresh: forceRefresh);
    return allProjects;
  }

  Future<SolarProject?> getCurrentProject({bool forceRefresh = false}) async {
    if (!forceRefresh && _activeProject != null) {
      return _activeProject;
    }

    _lastError = null;
    try {
      final res = await ApiClient.instance.get(ApiConstants.customerProjects);
      if (res.statusCode == 200 && res.data is Map) {
        final data = Map<String, dynamic>.from(res.data as Map);
        final rawList = data['projects'] as List<dynamic>? ?? [];

        _projects = rawList
            .map((e) => SolarProject.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();

        if (_projects.isNotEmpty) {
          final activeId = data['activeProjectId'] as String?;
          _activeProject = _projects.firstWhere(
            (p) => p.id == activeId || p.projectIdCode == activeId,
            orElse: () => _projects.first,
          );
        } else {
          _activeProject = null;
        }

        _hasFetched = true;
        notifyListeners();
        return _activeProject;
      }
    } catch (e) {
      _lastError = ErrorMapper.message(e);
      if (_activeProject != null) {
        return _activeProject;
      }
      notifyListeners();
      return null;
    }

    return _activeProject;
  }
}
