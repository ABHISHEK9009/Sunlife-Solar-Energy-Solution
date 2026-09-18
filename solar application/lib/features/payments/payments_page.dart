import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/models/payment_record.dart';
import '../../core/repositories/payment_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/sub_page.dart';
import 'widgets/payment_sheet.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});

  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  PaymentSummary? _summary;
  bool _isLoading = true;
  bool _isPaying = false;
  final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    final summary = await PaymentRepository.instance.getPaymentSummary();
    if (mounted) {
      setState(() {
        _summary = summary;
        _isLoading = false;
      });
    }
  }

  Future<void> _handlePayment() async {
    final summary = _summary;
    if (summary == null || summary.remainingBalance <= 0) return;

    final method = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const PaymentSheet(),
    );

    if (method != null && mounted) {
      setState(() => _isPaying = true);

      final success = await PaymentRepository.instance.processPayment(
        amount: summary.remainingBalance,
        method: method,
      );

      if (mounted) {
        setState(() => _isPaying = false);
        if (success) {
          await _loadPayments();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: AppColors.deepGreen,
                content: Text('Payment via $method confirmed. Receipt generated!'),
              ),
            );
          }
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = _summary ??
        const PaymentSummary(
          totalProjectCost: 290000,
          subsidyAmount: 78000,
          netCustomerCost: 212000,
          paidAmount: 150000,
          remainingBalance: 62000,
          history: [],
        );

    final progress = summary.netCustomerCost > 0
        ? (summary.paidAmount / summary.netCustomerCost).clamp(0.0, 1.0)
        : 1.0;

    return SubPage(
      title: 'Payments',
      onRefresh: _loadPayments,
      bottom: summary.remainingBalance > 0
          ? SizedBox(
              width: double.infinity,
              height: 54,
              child: FilledButton(
                onPressed: _isPaying ? null : _handlePayment,
                style: FilledButton.styleFrom(backgroundColor: AppColors.ink),
                child: _isPaying
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : Text(
                        'Pay ${_currencyFormat.format(summary.remainingBalance)}',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
              ),
            )
          : null,
      children: [
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          )
        else ...[
          CardBox(
            color: AppColors.ink,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'REMAINING BALANCE',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  _currencyFormat.format(summary.remainingBalance),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                LinearProgressIndicator(
                  value: progress,
                  color: AppColors.sunGold,
                  backgroundColor: Colors.white24,
                  minHeight: 9,
                  borderRadius: const BorderRadius.all(Radius.circular(10)),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_currencyFormat.format(summary.paidAmount)} of ${_currencyFormat.format(summary.netCustomerCost)} paid',
                  style: const TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Heading('Cost summary'),
          const SizedBox(height: 12),
          CardBox(
            child: Column(
              children: [
                Info('Project cost', _currencyFormat.format(summary.totalProjectCost)),
                Info('Government subsidy', '− ${_currencyFormat.format(summary.subsidyAmount)}'),
                Info('Your net cost', _currencyFormat.format(summary.netCustomerCost), last: true),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Heading('Payment history'),
          const SizedBox(height: 12),
          CardBox(
            child: Column(
              children: [
                for (var i = 0; i < summary.history.length; i++)
                  InkWell(
                    onTap: () {
                      final item = summary.history[i];
                      showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        showDragHandle: true,
                        builder: (_) => SafeArea(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Receipt Details',
                                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.softGreen,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text('CONFIRMED',
                                          style: TextStyle(
                                              color: AppColors.deepGreen,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w900)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Text(item.title,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                                const SizedBox(height: 8),
                                Text('Amount: ${_currencyFormat.format(item.amount)}',
                                    style: const TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.deepGreen)),
                                const SizedBox(height: 14),
                                Info('Transaction ID', 'TXN-${item.id}'),
                                Info('Date', item.date),
                                Info('Payment status', 'Success', last: true),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                    child: Info(
                      summary.history[i].title,
                      _currencyFormat.format(summary.history[i].amount),
                      last: i == summary.history.length - 1,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

