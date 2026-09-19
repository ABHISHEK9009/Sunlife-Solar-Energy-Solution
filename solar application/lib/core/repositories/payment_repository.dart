import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/payment_record.dart';
import '../network/api_client.dart';
import 'notification_repository.dart';

class PaymentRepository extends ChangeNotifier {
  PaymentRepository._internal();
  static final PaymentRepository instance = PaymentRepository._internal();

  PaymentSummary _summary = const PaymentSummary(
    totalProjectCost: 290000,
    subsidyAmount: 78000,
    netCustomerCost: 212000,
    paidAmount: 150000,
    remainingBalance: 62000,
    history: [
      PaymentMilestone(
        id: 'pay_1',
        title: 'Booking • 05 Sep',
        amount: 50000,
        date: '05 Sep',
        isPaid: true,
      ),
      PaymentMilestone(
        id: 'pay_2',
        title: 'Material • 07 Sep',
        amount: 100000,
        date: '07 Sep',
        isPaid: true,
      ),
    ],
  );

  PaymentSummary get currentSummary => _summary;

  Future<PaymentSummary> getPaymentSummary() async {
    try {
      final res = await ApiClient.instance.get('/projects/SS-2026-00452/payments');
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        _summary = PaymentSummary.fromJson(res.data as Map<String, dynamic>);
      }
    } catch (_) {
      // Fallback
    }
    return _summary;
  }

  Future<bool> processPayment({
    required int amount,
    required String method,
  }) async {
    final newHistory = List<PaymentMilestone>.from(_summary.history)
      ..insert(
        0,
        PaymentMilestone(
          id: 'pay_${DateTime.now().millisecondsSinceEpoch}',
          title: 'Balance ($method) • Today',
          amount: amount,
          date: 'Today',
          isPaid: true,
        ),
      );

    final newPaid = _summary.paidAmount + amount;
    final newRemaining = (_summary.remainingBalance - amount).clamp(0, _summary.netCustomerCost);

    _summary = PaymentSummary(
      totalProjectCost: _summary.totalProjectCost,
      subsidyAmount: _summary.subsidyAmount,
      netCustomerCost: _summary.netCustomerCost,
      paidAmount: newPaid,
      remainingBalance: newRemaining,
      history: newHistory,
    );

    NotificationRepository.instance.addNotification(
      title: 'Payment successful',
      message: 'Payment of ₹$amount via $method has been confirmed. Receipt generated.',
      category: 'Payments',
      actionRoute: 'payments',
    );

    notifyListeners();
    return true;
  }
}

