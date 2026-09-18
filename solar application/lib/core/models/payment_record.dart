class PaymentMilestone {
  const PaymentMilestone({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.isPaid,
  });

  final String id;
  final String title;
  final int amount;
  final String date;
  final bool isPaid;

  factory PaymentMilestone.fromJson(Map<String, dynamic> json) =>
      PaymentMilestone(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        amount: json['amount'] as int? ?? 0,
        date: json['date'] as String? ?? '',
        isPaid: json['is_paid'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'date': date,
        'is_paid': isPaid,
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
  });

  final int totalProjectCost;
  final int subsidyAmount;
  final int netCustomerCost;
  final int paidAmount;
  final int remainingBalance;
  final List<PaymentMilestone> history;

  factory PaymentSummary.fromJson(Map<String, dynamic> json) {
    final list = (json['history'] as List<dynamic>?)
            ?.map((e) => PaymentMilestone.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return PaymentSummary(
      totalProjectCost: json['total_project_cost'] as int? ?? 290000,
      subsidyAmount: json['subsidy_amount'] as int? ?? 78000,
      netCustomerCost: json['net_customer_cost'] as int? ?? 212000,
      paidAmount: json['paid_amount'] as int? ?? 150000,
      remainingBalance: json['remaining_balance'] as int? ?? 62000,
      history: list,
    );
  }

  Map<String, dynamic> toJson() => {
        'total_project_cost': totalProjectCost,
        'subsidy_amount': subsidyAmount,
        'net_customer_cost': netCustomerCost,
        'paid_amount': paidAmount,
        'remaining_balance': remainingBalance,
        'history': history.map((e) => e.toJson()).toList(),
      };
}
