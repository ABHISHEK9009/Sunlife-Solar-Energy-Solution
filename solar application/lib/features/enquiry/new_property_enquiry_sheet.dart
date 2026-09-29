import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/project_repository.dart';
import '../../core/theme/app_colors.dart';

class NewPropertyEnquirySheet extends StatefulWidget {
  const NewPropertyEnquirySheet({super.key});

  @override
  State<NewPropertyEnquirySheet> createState() => _NewPropertyEnquirySheetState();
}

class _NewPropertyEnquirySheetState extends State<NewPropertyEnquirySheet> {
  final _cityController = TextEditingController(text: 'Narmadapuram');
  final _billController = TextEditingController(text: '₹10,000+');
  final _roofController = TextEditingController();
  String _propertyType = 'Commercial';
  bool _isSubmitting = false;
  String? _errorMessage;

  final List<String> _types = ['Commercial', 'Residential', 'Industrial', 'Agricultural'];

  @override
  void dispose() {
    _cityController.dispose();
    _billController.dispose();
    _roofController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final city = _cityController.text.trim();
    if (city.isEmpty) {
      setState(() => _errorMessage = 'Please enter installation city');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await AuthRepository.instance.submitLeadEnquiryChunk({
        'city': city,
        'propertyType': _propertyType,
        'monthlyBill': _billController.text.trim(),
        'roofSize': _roofController.text.trim(),
        'step': 'NEW_PROPERTY',
      });

      // Refresh /me to get updated multi-property tree
      await AuthRepository.instance.fetchMe();
      await ProjectRepository.instance.getCurrentProject(forceRefresh: true);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppColors.deepGreen,
            content: Text('New property enquiry registered! Our advisor will contact you.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = 'Failed to submit enquiry. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Add New Property',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.ink),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Explore rooftop solar for your factory, farm, or another residence.',
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 20),

              if (_errorMessage != null) ...[
                Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
              ],

              const Text('Property Type', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _types.map((type) {
                  final selected = _propertyType == type;
                  return ChoiceChip(
                    label: Text(type),
                    selected: selected,
                    selectedColor: AppColors.green,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : AppColors.ink,
                      fontWeight: FontWeight.w700,
                    ),
                    onSelected: (_) => setState(() => _propertyType = type),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              const Text('Location / City *', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 8),
              TextField(
                controller: _cityController,
                decoration: InputDecoration(
                  hintText: 'e.g. Itarsi, Bhopal',
                  prefixIcon: const Icon(Icons.location_on_outlined),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.cardBorder),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              const Text('Estimated Monthly Bill', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 8),
              TextField(
                controller: _billController,
                decoration: InputDecoration(
                  hintText: 'e.g. ₹15,000/month',
                  prefixIcon: const Icon(Icons.receipt_outlined),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.cardBorder),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.deepGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Start Solar Enquiry', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      );
}
