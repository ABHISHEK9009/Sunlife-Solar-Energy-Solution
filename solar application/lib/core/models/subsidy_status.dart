class SubsidyStatus {
  const SubsidyStatus({
    required this.amount,
    required this.statusLabel,
    required this.bankAccountMasked,
    required this.completedStagesCount,
    required this.stages,
    required this.note,
    this.isInitiated = true,
    this.applicationNumber,
  });

  final int amount;
  final String statusLabel;
  final String bankAccountMasked;
  final int completedStagesCount;
  final List<String> stages;
  final String note;
  final bool isInitiated;
  final String? applicationNumber;

  int get eligibleAmount => amount;
  String? get claimNumber => applicationNumber;
  bool get isDiscomApproved =>
      statusLabel.toUpperCase().contains('DISCOM') ||
      statusLabel.toUpperCase().contains('APPROVED') ||
      isInitiated;

  static const List<String> standardStages = [
    'Portal registration',
    'DISCOM application',
    'Feasibility approval',
    'Installation',
    'Inspection',
    'Net meter installed',
    'Subsidy processing',
    'Subsidy credited',
  ];

  factory SubsidyStatus.notInitiated() => const SubsidyStatus(
        amount: 0,
        statusLabel: 'NOT INITIATED',
        bankAccountMasked: '—',
        completedStagesCount: 0,
        stages: standardStages,
        note: 'Subsidy application will be initiated after quotation approval.',
        isInitiated: false,
      );

  factory SubsidyStatus.fromJson(Map<String, dynamic> json) {
    // Handle nested subsidy object
    final data = json['subsidy'] is Map<String, dynamic>
        ? json['subsidy'] as Map<String, dynamic>
        : json;

    if (data.isEmpty) {
      return SubsidyStatus.notInitiated();
    }

    final rawAmount = data['approvedSubsidy'] ??
        data['expectedSubsidy'] ??
        data['amountEligible'] ??
        data['amount'] ??
        0;
    final int amount = (rawAmount is num) ? rawAmount.toInt() : int.tryParse(rawAmount.toString()) ?? 0;

    final status = (data['currentStatus'] ?? data['statusLabel'] ?? data['status_label'] ?? 'PROCESSING')
        .toString();

    final bankMasked = (data['bankAccountNumberMasked'] ??
            data['bank_account_masked'] ??
            data['bankAccount'] ??
            '—')
        .toString();

    final int completedCount = (data['currentStageIndex'] ??
            data['completed_stages_count'] ??
            data['completedStagesCount'] ??
            0) as int;

    final stagesList = (data['allStages'] ?? data['stages']) as List<dynamic>?;
    final formattedStages = stagesList != null && stagesList.isNotEmpty
        ? stagesList.map((e) => e.toString().replaceAll('_', ' ').toLowerCase()).map((s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}').toList()
        : standardStages;

    final note = data['note'] as String? ??
        (status == 'SUBSIDY_CREDITED'
            ? 'Subsidy has been successfully credited to your bank account.'
            : 'Central PM Surya Ghar subsidy is processed by MNRE & state DISCOM upon net-meter installation.');

    return SubsidyStatus(
      amount: amount,
      statusLabel: status.replaceAll('_', ' ').toUpperCase(),
      bankAccountMasked: bankMasked,
      completedStagesCount: completedCount,
      stages: formattedStages,
      note: note,
      isInitiated: true,
      applicationNumber: (data['applicationNumber'] ??
              data['application_number'] ??
              data['claimNumber'])
          ?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'status_label': statusLabel,
        'bank_account_masked': bankAccountMasked,
        'completed_stages_count': completedStagesCount,
        'stages': stages,
        'note': note,
        'is_initiated': isInitiated,
        'application_number': applicationNumber,
      };
}
