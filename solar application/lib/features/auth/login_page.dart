import 'package:flutter/material.dart';
import '../../agent/auth/agent_login_page.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/navigation.dart';
import '../../core/widgets/logo.dart';
import '../../core/widgets/pill.dart';
import 'otp_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phone = _phoneController.text.trim().replaceAll(' ', '');
    if (phone.isEmpty) {
      setState(() => _errorMessage = 'Please enter your mobile number');
      return;
    }
    // Indian mobile number validation (10 digits starting with 6-9)
    final regex = RegExp(r'^[6-9]\d{9}$');
    if (!regex.hasMatch(phone)) {
      setState(() => _errorMessage = 'Enter a valid 10-digit mobile number');
      return;
    }

    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    try {
      final success = await AuthRepository.instance.requestOtp(identifier: phone);
      if (!mounted) return;
      if (success) {
        openPage(context, OtpPage(phoneNumber: phone));
      } else {
        setState(() => _errorMessage = 'Could not send OTP. Please check your number.');
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
        body: SafeArea(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(28),
              children: [
                const SizedBox(height: 18),
                const Logo(),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => openPage(context, const AgentLoginPage()),
                    child: const Pill('AGENT LOGIN', greenText: true),
                  ),
                ),
                const SizedBox(height: 30),
                const Text(
                  'Power your home\nwith sunshine.',
                  style: TextStyle(
                    fontSize: 36,
                    height: 1.08,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Track your project, documents and support—all in one place.',
                  style: TextStyle(
                    fontSize: 16,
                    height: 1.45,
                    color: AppColors.muted,
                  ),
                ),
                const SizedBox(height: 48),
                const Text(
                  'Mobile number',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  onChanged: (_) {
                    if (_errorMessage != null) {
                      setState(() => _errorMessage = null);
                    }
                  },
                  decoration: InputDecoration(
                    counterText: '',
                    prefixText: '+91  ',
                    hintText: '98765 43210',
                    prefixIcon: const Icon(Icons.phone_rounded),
                    errorText: _errorMessage,
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
                  width: double.infinity,
                  height: 56,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.ink,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    onPressed: _isLoading ? null : _submit,
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
                            'Continue with OTP',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                  ),
                ),
                const SizedBox(height: 14),
                const Center(
                  child: Text(
                    'Use your CRM-registered mobile number',
                    style: TextStyle(fontSize: 12, color: AppColors.muted),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
