import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/logo.dart';
import '../../core/widgets/pill.dart';
import '../../features/auth/login_page.dart';
import 'agent_otp_page.dart';

class AgentLoginPage extends StatefulWidget {
  const AgentLoginPage({super.key});

  @override
  State<AgentLoginPage> createState() => _AgentLoginPageState();
}

class _AgentLoginPageState extends State<AgentLoginPage> {
  final _idController = TextEditingController();
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void dispose() {
    _idController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _idController.text.trim();
    if (text.isEmpty) {
      setState(() => _errorMessage = 'Please enter your Employee ID or Mobile');
      return;
    }

    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    try {
      final success = await AuthRepository.instance.requestOtp(
        identifier: text,
        isAgent: true,
      );
      if (!mounted) return;
      if (success) {
        openPage(context, AgentOtpPage(agentId: text));
      } else {
        setState(() => _errorMessage = 'Invalid agent credentials or inactive account.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          actions: [
            TextButton.icon(
              onPressed: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginPage()),
              ),
              icon: const Icon(Icons.person_outline, size: 18),
              label: const Text('Customer App'),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(28, 8, 28, 30),
            children: [
              const Logo(),
              const SizedBox(height: 22),
              const Align(
                alignment: Alignment.centerLeft,
                child: Pill('AGENT PORTAL'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Manage your day\nin the field.',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 34,
                  height: 1.08,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Access assigned customers, visits, documents and follow-ups.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 15,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 34),
              const Text(
                'Employee ID or mobile number',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _idController,
                onChanged: (_) {
                  if (_errorMessage != null) {
                    setState(() => _errorMessage = null);
                  }
                },
                decoration: InputDecoration(
                  hintText: 'SL-A104 or 98765 43210',
                  errorText: _errorMessage,
                  prefixIcon: const Icon(Icons.badge_outlined),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 56,
                child: FilledButton(
                  onPressed: _isLoading ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.deepGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text(
                          'Continue securely',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              const Center(
                child: Text(
                  'Only active CRM team accounts can sign in',
                  style: TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      );
}
