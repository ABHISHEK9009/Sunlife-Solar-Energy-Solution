import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/frame.dart';
import '../../core/widgets/heading.dart';
import '../../core/widgets/info_row.dart';
import '../../core/widgets/menu_tile.dart';
import '../../core/widgets/pill.dart';
import '../auth/agent_login_page.dart';
import '../visits/agent_visits_page.dart';

class AgentProfilePage extends StatelessWidget {
  const AgentProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthRepository.instance.currentUser;
    final name = user?.name.isNotEmpty == true ? user!.name : 'Rahul Kumar';
    final agentId = user?.id.isNotEmpty == true ? user!.id : 'SL-A104';
    final territory = user?.territory ?? 'Jaipur West';
    final manager = user?.managerName ?? 'Priya Verma';
    final phone = user?.phone ?? '+91 98765 00000';
    final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join();

    return Frame('Agent profile', [
      CardBox(
        color: AppColors.deepGreen,
        child: Row(
          children: [
            CircleAvatar(
              radius: 29,
              backgroundColor: Colors.white,
              child: Text(
                initials.isNotEmpty ? initials : 'RK',
                style: const TextStyle(
                  color: AppColors.deepGreen,
                  fontSize: 17,
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
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    'Field Sales Agent · $agentId',
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
            const Pill('ACTIVE', greenText: true),
          ],
        ),
      ),
      const SizedBox(height: 18),
      CardBox(
        child: Column(
          children: [
            Info('Territory', territory),
            Info('Team manager', manager),
            Info('Mobile', phone),
            const Info('CRM access', 'Connected', last: true),
          ],
        ),
      ),
      const SizedBox(height: 20),
      const Heading('This month'),
      const SizedBox(height: 10),
      const Row(
        children: [
          Expanded(
            child: AgentVisitSummary(value: '42', label: 'Visits'),
          ),
          SizedBox(width: 10),
          Expanded(
            child: AgentVisitSummary(value: '18', label: 'Converted'),
          ),
          SizedBox(width: 10),
          Expanded(
            child: AgentVisitSummary(value: '91%', label: 'Tasks done'),
          ),
        ],
      ),
      const SizedBox(height: 20),
      CardBox(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Column(
          children: [
            MenuTile(
              Icons.sync_rounded,
              'CRM sync',
              'Last synced just now',
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: AppColors.deepGreen,
                  content: Text('CRM offline cache synced with server'),
                ),
              ),
            ),
            MenuTile(
              Icons.help_outline_rounded,
              'Agent help desk',
              'Training and technical support',
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Opening agent help desk support…')),
              ),
              last: true,
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      SizedBox(
        width: double.infinity,
        height: 52,
        child: OutlinedButton.icon(
          onPressed: () => showDialog<void>(
            context: context,
            builder: (dialogContext) => AlertDialog(
              title: const Text('Log out of agent portal?'),
              content: const Text(
                'Any unsynced field updates should be saved before logging out.',
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
                        MaterialPageRoute(builder: (_) => const AgentLoginPage()),
                        (_) => false,
                      );
                    }
                  },
                  child: const Text('Log out'),
                ),
              ],
            ),
          ),
          icon: const Icon(Icons.logout_rounded),
          label: const Text(
            'Log out',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
      ),
      const SizedBox(height: 24),
      const Center(
        child: Text(
          'Sunlife Solar Agent App v1.0.0+1 · Production',
          style: TextStyle(
            color: AppColors.muted,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      const SizedBox(height: 20),
    ]);
  }
}
