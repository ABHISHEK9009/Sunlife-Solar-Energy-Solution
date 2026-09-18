import '../models/subsidy_status.dart';
import '../network/api_client.dart';

class SubsidyRepository {
  SubsidyRepository._internal();
  static final SubsidyRepository instance = SubsidyRepository._internal();

  SubsidyStatus _status = const SubsidyStatus(
    amount: 78000,
    statusLabel: 'PROCESSING',
    bankAccountMasked: 'XXXXXX2341',
    completedStagesCount: 6,
    stages: [
      'Portal registration',
      'DISCOM application',
      'Feasibility approval',
      'Installation',
      'Inspection',
      'Net meter installed',
      'Subsidy processing',
      'Subsidy credited',
    ],
    note: 'Processing usually takes 30–45 days after net-meter installation.',
  );

  Future<SubsidyStatus> getSubsidyStatus() async {
    try {
      final res = await ApiClient.instance.get('/projects/SS-2026-00452/subsidy');
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        _status = SubsidyStatus.fromJson(res.data as Map<String, dynamic>);
      }
    } catch (_) {
      // Fallback
    }
    return _status;
  }
}
