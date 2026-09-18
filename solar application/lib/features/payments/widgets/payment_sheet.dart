import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class PaymentSheet extends StatelessWidget {
  const PaymentSheet({super.key});

  @override
  Widget build(BuildContext context) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose payment method',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 12),
              for (final method in [
                ('UPI', Icons.qr_code),
                ('Card', Icons.credit_card),
                ('Net banking', Icons.account_balance),
              ])
                ListTile(
                  onTap: () => Navigator.pop(context, method.$1),
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: AppColors.softGreen,
                    child: Icon(method.$2, color: AppColors.orange),
                  ),
                  title: Text(
                    method.$1,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                ),
            ],
          ),
        ),
      );
}
