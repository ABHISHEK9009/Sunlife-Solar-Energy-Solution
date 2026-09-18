import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/document_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/menu_tile.dart';
import '../auth/login_page.dart';
import '../documents/documents_page.dart';
import '../payments/payments_page.dart';
import '../referral/referral_page.dart';
import '../subsidy/subsidy_page.dart';
import '../support/faq_page.dart';
import '../support/support_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthRepository.instance.currentUser;
    final name = user?.name.isNotEmpty == true ? user!.name : 'Rajesh Sharma';
    final customerId = user?.id.isNotEmpty == true ? user!.id : 'SL-10452';
    final phone = user?.phone.isNotEmpty == true ? user!.phone : '+91 98765 43210';
    final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join();

    return Frame('Profile', [
      CardBox(
        child: Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: AppColors.ink,
              child: Text(
                initials.isNotEmpty ? initials : 'RS',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
                  ),
                  Text(
                    'Customer ID: $customerId',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppColors.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      CardBox(
        child: Column(
          children: [
            Info('Mobile', phone.startsWith('+91') ? phone : '+91 $phone'),
            Info('Email', user?.email ?? 'rajesh@example.com'),
            Info('Solar plant ID', user?.plantId ?? 'SP-JPR-00452'),
            Info('DISCOM consumer no.', user?.discomConsumerNo ?? 'JVVNL-182943'),
            Info('Subsidy bank', user?.subsidyBankMasked ?? 'XXXXXX2341', last: true),
          ],
        ),
      ),
      const SizedBox(height: 22),
      const Heading('More'),
      const SizedBox(height: 12),
      CardBox(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          children: [
            MenuTile(
              Icons.description_outlined,
              'My documents',
              DocumentRepository.instance.requiredCheque != null
                  ? 'Approved & submitted'
                  : 'Project records',
              onTap: () => openPage(context, const DocumentsPage()),
            ),
            MenuTile(
              Icons.account_balance_wallet_outlined,
              'Payments',
              'Remaining balance & history',
              onTap: () => openPage(context, const PaymentsPage()),
            ),
            MenuTile(
              Icons.account_balance_outlined,
              'Subsidy tracker',
              'PM Surya Ghar subsidy status',
              onTap: () => openPage(context, const SubsidyPage()),
            ),
            MenuTile(
              Icons.help_outline_rounded,
              'Frequently asked questions',
              'Quick answers',
              onTap: () => openPage(context, const FaqPage()),
            ),
            MenuTile(
              Icons.card_giftcard_outlined,
              'Refer & earn',
              'Earn ₹3,000 per installation',
              onTap: () => openPage(context, const ReferralPage()),
            ),
            MenuTile(
              Icons.support_agent_outlined,
              'Help & support',
              'Call or WhatsApp us',
              onTap: () => openPage(context, const SupportPage()),
              last: true,
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      SizedBox(
        width: double.infinity,
        height: 52,
        child: OutlinedButton.icon(
          onPressed: () => showDialog<void>(
            context: context,
            builder: (dialogContext) => AlertDialog(
              title: const Text('Log out?'),
              content: const Text(
                'You will need to verify your mobile number to sign in again.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () async {
                    Navigator.pop(dialogContext);
                    await AuthRepository.instance.logout();
                    if (context.mounted) {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginPage()),
                        (_) => false,
                      );
                    }
                  },
                  child: const Text('Log out'),
                ),
              ],
            ),
          ),
          icon: const Icon(Icons.logout),
          label: const Text(
            'Log out',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ),
    ]);

  }
}
