import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/logo.dart';
import '../dashboard/app_shell.dart';
import '../enquiry/enquiry_onboarding_page.dart';

class OtpPage extends StatefulWidget {
  const OtpPage({super.key, this.phoneNumber = '98765 43210'});

  final String phoneNumber;

  @override
  State<OtpPage> createState() => _OtpPageState();
}

class _OtpPageState extends State<OtpPage> {
  final controller = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  int _secondsRemaining = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
  }

  void _startResendCountdown() {
    _timer?.cancel();
    _secondsRemaining = 30;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        if (mounted) setState(() => _secondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    controller.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final code = controller.text.trim();
    if (code.length != 6) {
      setState(() => _errorMessage = 'Please enter a 6-digit verification code');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await AuthRepository.instance.verifyOtp(
        identifier: widget.phoneNumber,
        otp: code,
        isAgent: false,
      );

      if (!mounted) return;

      // If user is a new customer / uncompleted Lead, route to the onboarding flow
      if (user.isLead && (!user.profileComplete || user.name.isEmpty)) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (_) => EnquiryOnboardingPage(phoneNumber: widget.phoneNumber),
          ),
          (_) => false,
        );
      } else {
        // Active customer or returning lead -> go straight to AppShell
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const AppShell()),
          (_) => false,
        );
      }
    } catch (e) {
      debugPrint('OtpPage verify error: $e');
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _resend() async {
    if (_secondsRemaining > 0) return;
    _startResendCountdown();
    final res = await AuthRepository.instance.requestOtp(identifier: widget.phoneNumber);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message ?? 'A new verification code has been dispatched'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: ListView(
              children: [
                const Logo(),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF25D366).withValues(alpha: .15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF25D366).withValues(alpha: .3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366), size: 14),
                          SizedBox(width: 6),
                          Text(
                            'WHATSAPP OTP DISPATCHED',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1E7E34),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Verify Mobile Number',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'We sent a 6-digit verification code to your WhatsApp at +91 ${widget.phoneNumber}. Please check your WhatsApp app to continue.',
                  style: const TextStyle(color: AppColors.muted, fontSize: 14, height: 1.45),
                ),
                const SizedBox(height: 28),
                CardBox(
                  child: Column(
                    children: [
                      TextField(
                        controller: controller,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 32,
                          letterSpacing: 12,
                          fontWeight: FontWeight.w900,
                        ),
                        decoration: InputDecoration(
                          counterText: '',
                          hintText: '• • • • • •',
                          errorText: _errorMessage,
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: AppColors.green, width: 2),
                          ),
                        ),
                        onSubmitted: (_) => _verify(),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: FilledButton(
                          onPressed: _isLoading ? null : _verify,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.ink,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                )
                              : const Text('Verify & Continue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: _secondsRemaining > 0 ? null : () => _resend(),
                    child: Text(
                      _secondsRemaining > 0
                          ? 'Resend code in 00:${_secondsRemaining.toString().padLeft(2, '0')}'
                          : 'Resend verification code',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: _secondsRemaining > 0 ? AppColors.muted : AppColors.deepGreen,
                      ),
                    ),
                  ),
                ),
                Center(
                  child: TextButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Change mobile number'),
                    style: TextButton.styleFrom(foregroundColor: AppColors.muted),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
