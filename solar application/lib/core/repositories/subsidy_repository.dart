import 'package:flutter/foundation.dart';
import '../models/subsidy_status.dart';
import '../network/api_client.dart';
import 'project_repository.dart';

class SubsidyRepository extends ChangeNotifier {
  SubsidyRepository._internal();
  static final SubsidyRepository instance = SubsidyRepository._internal();

  SubsidyStatus _status = SubsidyStatus.notInitiated();
  bool _isLoading = false;
  String? _lastError;

  SubsidyStatus get currentStatus => _status;
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  void reset() {
    _status = SubsidyStatus.notInitiated();
    _isLoading = false;
    _lastError = null;
    notifyListeners();
  }

  Future<SubsidyStatus> getSubsidyStatus({bool forceRefresh = false}) async {
    if (!forceRefresh && _status.isInitiated) {
      return _status;
    }

    final activeProject = ProjectRepository.instance.activeProject ??
        await ProjectRepository.instance.getCurrentProject();

    if (activeProject == null || activeProject.id.isEmpty) {
      _status = SubsidyStatus.notInitiated();
      notifyListeners();
      return _status;
    }

    _isLoading = true;
    _lastError = null;

    try {
      final res = await ApiClient.instance.get('/projects/${activeProject.id}/subsidy');
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['subsidy'] == null) {
          _status = SubsidyStatus.notInitiated();
        } else {
          _status = SubsidyStatus.fromJson(data);
        }
      }
    } catch (err) {
      _lastError = err.toString();
      // Keep existing status if available; do not synthesize fake subsidy data
    } finally {
      _isLoading = false;
      notifyListeners();
    }

    return _status;
  }
}
