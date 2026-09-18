import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/sub_page.dart';

class ReferralPage extends StatelessWidget {
  const ReferralPage({super.key});

  String get _referralCode {
    final user = AuthRepository.instance.currentUser;
    final name = (user?.name.isNotEmpty == true) ? user!.name.split(' ').first.toUpperCase() : 'RAJESH';
    return '${name}3000';
  }

  void _shareReferral(BuildContext context) {
    final code = _referralCode;
    SharePlus.instance.share(
      ShareParams(
        text: 'Go solar with Sunlife Solar! Use my referral code $code to save up to ₹78,000 with government subsidy: https://sunlifesolar.in/referral/$code',
        subject: 'Switch to Solar with Sunlife',
      ),
    );
  }

  void _copyCode(BuildContext context) {
    Clipboard.setData(ClipboardData(text: _referralCode));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.deepGreen,
        content: Text('Referral code $_referralCode copied to clipboard!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final code = _referralCode;

    return SubPage(
      title: 'Refer & earn',
      children: [
        const CardBox(
          color: AppColors.softGreen,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.card_giftcard, color: AppColors.orange, size: 42),
              SizedBox(height: 20),
              Text(
                'Earn ₹3,000',
                style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
              ),
              SizedBox(height: 6),
              Text(
                'For every referral that completes a solar installation.',
                style: TextStyle(color: AppColors.muted, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        CardBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your referral code', style: TextStyle(color: AppColors.muted)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    code,
                    style: const TextStyle(
                      fontSize: 26,
                      letterSpacing: 2,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _copyCode(context),
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    label: const Text('Copy'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => _shareReferral(context),
                  icon: const Icon(Icons.share),
                  label: const Text('Share referral link'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Heading('Your referrals'),
        const SizedBox(height: 12),
        const CardBox(
          child: Column(
            children: [
              Info('Sunil Verma', 'Site surveyed'),
              Info('Rakesh Mehta', 'Lead contacted'),
              Info('Neha Sharma', '₹3,000 earned', last: true),
            ],
          ),
        ),
      ],
    );
  }
}

