class PaymentMilestone {
  const PaymentMilestone({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.isPaid,
    this.amountPaid = 0,
    this.status = 'PENDING',
    this.paymentMethod,
    this.transactionReference,
    this.receiptDocumentId,
  });

  final String id;
  final String title;
  final int amount;
  final int amountPaid;
  final String date;
  final bool isPaid;
  final String status;
  final String? paymentMethod;
  final String? transactionReference;
  final String? receiptDocumentId;

  factory PaymentMilestone.fromJson(Map<String, dynamic> json) {
    final stage = json['stage'] as String? ?? json['title'] as String? ?? 'Payment';
    final due = (json['amountDue'] ?? json['amount'] ?? 0) as num;
    final paid = (json['amountPaid'] ?? (json['is_paid'] == true ? due : 0)) as num;
    final statusStr = json['status'] as String? ?? (json['is_paid'] == true ? 'CONFIRMED' : 'PENDING');
    final isConfirmed = statusStr.toUpperCase() == 'CONFIRMED' || json['is_paid'] == true || paid >= due;

    String dateStr = '';
    if (json['receivedDate'] != null) {
      dateStr = json['receivedDate'].toString().split('T').first;
    } else if (json['dueDate'] != null) {
      dateStr = json['dueDate'].toString().split('T').first;
    } else if (json['date'] != null) {
      dateStr = json['date'].toString();
    }

    return PaymentMilestone(
      id: json['id'] as String? ?? json['paymentId'] as String? ?? '',
      title: stage.replaceAll('_', ' '),
      amount: due.toInt(),
      amountPaid: paid.toInt(),
      date: dateStr,
      isPaid: isConfirmed,
      status: statusStr,
      paymentMethod: json['paymentMethod'] as String?,
      transactionReference: json['transactionReference'] as String?,
      receiptDocumentId: json['receiptDocumentId'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'amount_paid': amountPaid,
        'date': date,
        'is_paid': isPaid,
        'status': status,
        'payment_method': paymentMethod,
        'transaction_reference': transactionReference,
        'receipt_document_id': receiptDocumentId,
      };
}

class PaymentSummary {
  const PaymentSummary({
    required this.totalProjectCost,
    required this.subsidyAmount,
    required this.netCustomerCost,
    required this.paidAmount,
    required this.remainingBalance,
    required this.history,
    this.isFullyPaid = false,
  });

  final int totalProjectCost;
  final int subsidyAmount;
  final int netCustomerCost;
  final int paidAmount;
  final int remainingBalance;
  final bool isFullyPaid;
  final List<PaymentMilestone> history;

  int get totalCost => totalProjectCost;
  int get totalPaid => paidAmount;
  List<PaymentMilestone> get milestones => history;

  factory PaymentSummary.empty() => const PaymentSummary(
        totalProjectCost: 0,
        subsidyAmount: 0,
        netCustomerCost: 0,
        paidAmount: 0,
        remainingBalance: 0,
        isFullyPaid: false,
        history: [],
      );

  factory PaymentSummary.fromJson(Map<String, dynamic> json) {
    // Handle both top-level summary object and flat JSON
    final summaryObj = json['summary'] is Map<String, dynamic>
        ? json['summary'] as Map<String, dynamic>
        : json;

    final rawMilestones = (json['milestones'] ?? json['history']) as List<dynamic>? ?? [];
    final list = rawMilestones
        .map((e) => PaymentMilestone.fromJson(e as Map<String, dynamic>))
        .toList();

    final totalCost = (summaryObj['totalContractValue'] ??
            summaryObj['totalProjectCost'] ??
            summaryObj['total_project_cost'] ??
            0) as num;

    final subsidy = (summaryObj['subsidyAmount'] ??
            summaryObj['subsidy_amount'] ??
            0) as num;

    final paid = (summaryObj['totalPaid'] ??
            summaryObj['paidAmount'] ??
            summaryObj['paid_amount'] ??
            0) as num;

    final balance = (summaryObj['outstandingBalance'] ??
            summaryObj['remainingBalance'] ??
            summaryObj['remaining_balance'] ??
            (totalCost - paid)) as num;

    final netCost = (summaryObj['netCustomerCost'] ??
            summaryObj['net_customer_cost'] ??
            (totalCost - subsidy)) as num;

    final fullyPaid = summaryObj['isFullyPaid'] as bool? ??
        (balance <= 0 && totalCost > 0);

    return PaymentSummary(
      totalProjectCost: totalCost.toInt(),
      subsidyAmount: subsidy.toInt(),
      netCustomerCost: netCost.toInt(),
      paidAmount: paid.toInt(),
      remainingBalance: balance.toInt(),
      isFullyPaid: fullyPaid,
      history: list,
    );
  }

  Map<String, dynamic> toJson() => {
        'total_project_cost': totalProjectCost,
        'subsidy_amount': subsidyAmount,
        'net_customer_cost': netCustomerCost,
        'paid_amount': paidAmount,
        'remaining_balance': remainingBalance,
        'is_fully_paid': isFullyPaid,
        'history': history.map((e) => e.toJson()).toList(),
      };
}
