import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  final _mobileController = TextEditingController();
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void dispose() {
    _mobileController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final rawText = _mobileController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (rawText.length < 10) {
      setState(() {
        _errorMessage = 'Please enter your registered 10-digit mobile number.';
      });
      return;
    }

    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    try {
      final result = await AuthRepository.instance.requestOtp(
        identifier: rawText,
        isAgent: true,
      );

      if (!mounted) return;

      if (result.success) {
        openPage(
          context,
          AgentOtpPage(
            mobile: rawText,
            maskedEmail: result.maskedEmail,
          ),
        );
      } else {
        setState(() {
          _errorMessage = result.error ??
              'We could not verify this account. Please check your mobile number or contact your administrator.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorMessage =
              'We could not verify this account. Please check your mobile number or contact your administrator.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
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
              const SizedBox(height: 24),
              const Align(
                alignment: Alignment.centerLeft,
                child: Pill('AGENT PORTAL'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Agent Portal\nSign In',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 34,
                  height: 1.1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Enter your registered 10-digit mobile number to receive your login OTP on your official email.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 15,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 36),
              const Text(
                'Mobile Number',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                onChanged: (_) {
                  if (_errorMessage != null) {
                    setState(() => _errorMessage = null);
                  }
                },
                decoration: InputDecoration(
                  counterText: '',
                  hintText: 'Enter 10-digit mobile number',
                  prefixIcon: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.phone_outlined, size: 20, color: AppColors.muted),
                        SizedBox(width: 8),
                        Text(
                          '+91',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                            fontSize: 15,
                          ),
                        ),
                        SizedBox(width: 8),
                        Text('|', style: TextStyle(color: Colors.black26)),
                      ],
                    ),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, size: 18, color: Colors.red.shade700),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(
                            color: Colors.red.shade700,
                            fontSize: 13,
                            height: 1.3,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
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
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Continue / Send OTP',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 18),
              const Center(
                child: Text(
                  'Only active employees registered in CRM can sign in',
                  style: TextStyle(
                    color: AppColors.muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
