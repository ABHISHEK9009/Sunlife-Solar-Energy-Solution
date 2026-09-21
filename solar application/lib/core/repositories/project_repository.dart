import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/solar_project.dart';
import '../network/api_client.dart';

class ProjectRepository extends ChangeNotifier {
  ProjectRepository._internal();
  static final ProjectRepository instance = ProjectRepository._internal();

  List<SolarProject> _projects = [];
  SolarProject? _activeProject;
  bool _hasFetched = false;
  String? _lastError;

  List<SolarProject> get allProjects => List.unmodifiable(_projects);
  List<SolarProject> get currentProjects => allProjects;
  SolarProject? get activeProject => _activeProject;
  bool get hasFetched => _hasFetched;
  String? get lastError => _lastError;

  Future<List<SolarProject>> getProjects({bool forceRefresh = false}) async {
    await getCurrentProject(forceRefresh: forceRefresh);
    return allProjects;
  }

  void reset() {
    _projects = [];
    _activeProject = null;
    _hasFetched = false;
    _lastError = null;
    notifyListeners();
  }

  void setActiveProject(SolarProject project) {
    _activeProject = project;
    notifyListeners();
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
          // If activeProject is set, retain selection, else select first
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
      _lastError = e.toString();
      // If we already have a cached project from the current session, keep it
      if (_activeProject != null) {
        return _activeProject;
      }
      rethrow;
    }

    return _activeProject;
  }
}
