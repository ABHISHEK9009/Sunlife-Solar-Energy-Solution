class SubsidyStatus {
  const SubsidyStatus({
    required this.amount,
    required this.statusLabel,
    required this.bankAccountMasked,
    required this.completedStagesCount,
    required this.stages,
    required this.note,
  });

  final int amount;
  final String statusLabel;
  final String bankAccountMasked;
  final int completedStagesCount;
  final List<String> stages;
  final String note;

  factory SubsidyStatus.fromJson(Map<String, dynamic> json) => SubsidyStatus(
        amount: json['amount'] as int? ?? 78000,
        statusLabel: json['status_label'] as String? ?? 'PROCESSING',
        bankAccountMasked:
            json['bank_account_masked'] as String? ?? 'XXXXXX2341',
        completedStagesCount: json['completed_stages_count'] as int? ?? 6,
        stages: (json['stages'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [
              'Portal registration',
              'DISCOM application',
              'Feasibility approval',
              'Installation',
              'Inspection',
              'Net meter installed',
              'Subsidy processing',
              'Subsidy credited',
            ],
        note: json['note'] as String? ??
            'Processing usually takes 30–45 days after net-meter installation.',
      );

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'status_label': statusLabel,
        'bank_account_masked': bankAccountMasked,
        'completed_stages_count': completedStagesCount,
        'stages': stages,
        'note': note,
      };
}
