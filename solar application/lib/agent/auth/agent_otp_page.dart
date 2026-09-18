import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../dashboard/agent_shell.dart';

class AgentOtpPage extends StatefulWidget {
  const AgentOtpPage({super.key, this.agentId = 'SL-A104'});

  final String agentId;

  @override
  State<AgentOtpPage> createState() => _AgentOtpPageState();
}

class _AgentOtpPageState extends State<AgentOtpPage> {
  final controller = TextEditingController(text: '123456');
  bool _isLoading = false;
  String? _errorMessage;
  int _secondsRemaining = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
  }

  void _startTimer() {
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
      setState(() => _errorMessage = 'Enter a valid 6-digit OTP');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await AuthRepository.instance.verifyOtp(
        identifier: widget.agentId,
        otp: code,
        isAgent: true,
      );
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const AgentShell()),
        (_) => false,
      );
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

  Future<void> _resend() async {
    if (_secondsRemaining > 0) return;
    _startTimer();
    await AuthRepository.instance.requestOtp(
      identifier: widget.agentId,
      isAgent: true,
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A new agent OTP has been sent')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(backgroundColor: AppColors.canvas),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(28),
            children: [
              const Icon(
                Icons.verified_user_rounded,
                color: AppColors.green,
                size: 62,
              ),
              const SizedBox(height: 22),
              const Text(
                'Verify agent access',
                style: TextStyle(
                  color: AppColors.ink,
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 9),
              Text(
                'Enter the OTP sent to the mobile number registered with your employee account (${widget.agentId}).',
                style: const TextStyle(color: AppColors.muted, height: 1.45),
              ),
              const SizedBox(height: 26),
              TextField(
                controller: controller,
                maxLength: 6,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 26,
                  letterSpacing: 12,
                  fontWeight: FontWeight.w900,
                ),
                onChanged: (_) {
                  if (_errorMessage != null) {
                    setState(() => _errorMessage = null);
                  }
                },
                decoration: InputDecoration(
                  counterText: '',
                  errorText: _errorMessage,
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                height: 56,
                child: FilledButton(
                  onPressed: _isLoading ? null : _verify,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text(
                          'Open workspace',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                ),
              ),
              TextButton(
                onPressed: _secondsRemaining > 0 ? null : _resend,
                child: Text(
                  _secondsRemaining > 0
                      ? 'Resend OTP in ${_secondsRemaining}s'
                      : 'Resend OTP',
                ),
              ),
              const Center(
                child: Text(
                  'Demo OTP: 123456',
                  style: TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      );
}
