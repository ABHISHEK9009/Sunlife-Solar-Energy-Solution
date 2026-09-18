import 'package:flutter/material.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/sub_page.dart';

class AgentLeadCapturePage extends StatefulWidget {
  const AgentLeadCapturePage({super.key});

  @override
  State<AgentLeadCapturePage> createState() => _AgentLeadCapturePageState();
}

class _AgentLeadCapturePageState extends State<AgentLeadCapturePage> {
  final name = TextEditingController();
  final phone = TextEditingController();
  final location = TextEditingController();
  final notes = TextEditingController();
  final bill = TextEditingController(text: '5000');

  String? nameError;
  String? phoneError;
  String? locationError;
  bool isSaving = false;

  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    location.dispose();
    notes.dispose();
    bill.dispose();
    super.dispose();
  }

  bool _validate() {
    bool valid = true;
    if (name.text.trim().isEmpty) {
      nameError = 'Please enter customer name';
      valid = false;
    } else {
      nameError = null;
    }

    final cleanPhone = phone.text.trim().replaceAll(' ', '');
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    if (!phoneRegex.hasMatch(cleanPhone)) {
      phoneError = 'Enter a valid 10-digit mobile number';
      valid = false;
    } else {
      phoneError = null;
    }

    if (location.text.trim().isEmpty) {
      locationError = 'Please enter location';
      valid = false;
    } else {
      locationError = null;
    }

    setState(() {});
    return valid;
  }

  Future<void> _save() async {
    if (!_validate()) return;

    setState(() => isSaving = true);

    try {
      final savedLead = await AgentRepository.instance.addLead(
        name: name.text.trim(),
        phone: phone.text.trim(),
        location: location.text.trim(),
        monthlyBill: '₹${bill.text.trim()}/month',
        notes: notes.text.trim(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.deepGreen,
          content: Text('New lead for ${savedLead.name} saved to CRM'),
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving lead: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => SubPage(
        title: 'Capture new lead',
        bottom: SizedBox(
          width: double.infinity,
          height: 54,
          child: FilledButton(
            onPressed: isSaving ? null : _save,
            style: FilledButton.styleFrom(backgroundColor: AppColors.deepGreen),
            child: isSaving
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text(
                    'Save lead to CRM',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
          ),
        ),
        children: [
          const Text(
            'Add a customer enquiry collected during a call or field visit.',
            style: TextStyle(color: AppColors.muted),
          ),
          const SizedBox(height: 18),
          _agentField(
            name,
            'Customer name',
            Icons.person_outline_rounded,
            errorText: nameError,
          ),
          const SizedBox(height: 12),
          _agentField(
            phone,
            'Mobile number',
            Icons.phone_outlined,
            keyboard: TextInputType.phone,
            prefixText: '+91 ',
            errorText: phoneError,
          ),
          const SizedBox(height: 12),
          _agentField(
            location,
            'Location (Colony, City)',
            Icons.location_on_outlined,
            errorText: locationError,
          ),
          const SizedBox(height: 12),
          _agentField(
            bill,
            'Approx. monthly electricity bill (₹)',
            Icons.currency_rupee_rounded,
            keyboard: TextInputType.number,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: notes,
            minLines: 3,
            maxLines: 5,
            decoration: _agentDecoration(
              'Customer requirement or rooftop notes',
              Icons.notes_rounded,
            ),
          ),
          const SizedBox(height: 70),
        ],
      );

  Widget _agentField(
    TextEditingController controller,
    String hint,
    IconData icon, {
    TextInputType? keyboard,
    String? prefixText,
    String? errorText,
  }) =>
      TextField(
        controller: controller,
        keyboardType: keyboard,
        onChanged: (_) {
          if (errorText != null) {
            setState(() {
              if (controller == name) nameError = null;
              if (controller == phone) phoneError = null;
              if (controller == location) locationError = null;
            });
          }
        },
        decoration: _agentDecoration(hint, icon, prefixText: prefixText, errorText: errorText),
      );

  InputDecoration _agentDecoration(
    String hint,
    IconData icon, {
    String? prefixText,
    String? errorText,
  }) =>
      InputDecoration(
        hintText: hint,
        prefixText: prefixText,
        errorText: errorText,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
      );
}
