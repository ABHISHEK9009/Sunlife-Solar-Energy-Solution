import '../../core/errors/app_error.dart';
import 'package:flutter/material.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/card_box.dart';
import '../../core/widgets/logo.dart';
import '../dashboard/app_shell.dart';

class EnquiryOnboardingPage extends StatefulWidget {
  const EnquiryOnboardingPage({super.key, required this.phoneNumber});

  final String phoneNumber;

  @override
  State<EnquiryOnboardingPage> createState() => _EnquiryOnboardingPageState();
}

class _EnquiryOnboardingPageState extends State<EnquiryOnboardingPage> {
  int _currentStep = 1; // Step 1: Personal Details, Step 2: Solar Requirement
  bool _isLoading = false;
  String? _errorMessage;

  // Step 1 Controllers
  final _nameController = TextEditingController();
  final _cityController = TextEditingController(text: 'Narmadapuram');
  final _pinController = TextEditingController();
  String _leadSource = 'Social Media / Web';

  final List<String> _leadSources = [
    'Social Media / Web',
    'Friend / Family Referral',
    'Saw Sunlife Solar Hoarding',
    'Local Solar Advisor',
    'PM Surya Ghar Portal',
  ];

  // Step 2 Selections
  String _propertyType = 'Residential';
  String _monthlyBill = '₹5,000–₹10,000';
  final _roofSizeController = TextEditingController(text: '500');

  final List<String> _propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
  final List<String> _billRanges = [
    'Under ₹2,000',
    '₹2,000–₹5,000',
    '₹5,000–₹10,000',
    '₹10,000+',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _pinController.dispose();
    _roofSizeController.dispose();
    super.dispose();
  }

  // Helper to calculate dynamic estimate based on bill
  Map<String, String> get _estimate {
    switch (_monthlyBill) {
      case 'Under ₹2,000':
        return {
          'kw': '2 kW',
          'subsidy': '₹60,000',
          'annualSavings': '₹24,000 / yr',
          'generation': '~8 units / day',
        };
      case '₹2,000–₹5,000':
        return {
          'kw': '3 kW',
          'subsidy': '₹78,000',
          'annualSavings': '₹45,000 / yr',
          'generation': '~12 units / day',
        };
      case '₹5,000–₹10,000':
        return {
          'kw': '5 kW',
          'subsidy': '₹78,000',
          'annualSavings': '₹75,000 / yr',
          'generation': '~20 units / day',
        };
      case '₹10,000+':
      default:
        return {
          'kw': '8–10 kW',
          'subsidy': '₹78,000',
          'annualSavings': '₹1,20,000+ / yr',
          'generation': '~35 units / day',
        };
    }
  }

  Future<void> _handleStep1Next() async {
    if (_isLoading) return;
    final name = _nameController.text.trim();
    final city = _cityController.text.trim();

    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter your full name');
      return;
    }
    if (city.isEmpty) {
      setState(() => _errorMessage = 'Please enter your city / district');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await AuthRepository.instance.submitLeadEnquiryChunk({
        'name': name,
        'city': city,
        'pinCode': _pinController.text.trim(),
        'source': _leadSource,
        'step': 'PERSONAL',
      });

      if (mounted) {
        setState(() {
          _currentStep = 2;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = ErrorMapper.message(e);
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleStep2Submit() async {
    if (_isLoading) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await AuthRepository.instance.submitLeadEnquiryChunk({
        'propertyType': _propertyType,
        'monthlyBill': _monthlyBill,
        'roofSize': _roofSizeController.text.trim(),
        'step': 'REQUIREMENT',
      });
    } catch (e) {
      if (mounted) setState(() {
        _errorMessage = ErrorMapper.message(e);
        _isLoading = false;
      });
      return;
    }

    if (!mounted) return;

    final customerName = _nameController.text.trim().isNotEmpty
        ? _nameController.text.trim()
        : 'Valued Customer';
    final city = _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : 'your city';

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.green, size: 28),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Your enquiry has been received',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome to Sunlife Solar, $customerName!\n',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            Text(
              'Your enquiry for a ${_estimate['kw']} solar system in $city has been registered.\n\n'
              '• Estimated PM Surya Ghar Subsidy: ${_estimate['subsidy']}\n'
              '• Estimated Annual Savings: ${_estimate['annualSavings']}\n\n'
              'Our certified solar engineer will contact you shortly to schedule your free 3D rooftop survey.',
              style: const TextStyle(fontSize: 13, height: 1.45, color: AppColors.muted),
            ),
          ],
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.deepGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.pop(dialogCtx);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const AppShell()),
                (_) => false,
              );
            },
            child: const Text('Go to My Solar Hub', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  void _skipToDashboard() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const AppShell()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.canvas,
        appBar: AppBar(
          backgroundColor: AppColors.canvas,
          elevation: 0,
          leading: _currentStep == 2
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => setState(() => _currentStep = 1),
                )
              : null,
          actions: [
            TextButton(
              onPressed: _skipToDashboard,
              child: const Text(
                'Skip for now',
                style: TextStyle(
                  color: AppColors.muted,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            children: [
              const Logo(),
              const SizedBox(height: 20),

              // Progress Indicator
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: AppColors.green,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: _currentStep == 2 ? AppColors.green : AppColors.cardBorder,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              Text(
                _currentStep == 1
                    ? 'STEP 1 OF 2: YOUR CONTACT & LOCATION'
                    : 'STEP 2 OF 2: ROOFTOP & ELECTRICITY BILL',
                style: const TextStyle(
                  color: AppColors.deepGreen,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _currentStep == 1 ? 'Welcome to Sunlife Solar ☀️' : 'Tailor Your Solar System',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: AppColors.ink,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _currentStep == 1
                    ? 'Tell us your name and city so our certified local solar engineer can assist you with rooftop feasibility.'
                    : 'Select your property type and average bill to get your instant government subsidy & savings calculation.',
                style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.45),
              ),
              const SizedBox(height: 24),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // ─── STEP 1 CONTENT ──────────────────────────────────
              if (_currentStep == 1) ...[
                CardBox(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Your Full Name *', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _nameController,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          hintText: 'e.g. Priyanshu Thakur',
                          prefixIcon: const Icon(Icons.person_outline),
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text('City / District *', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _cityController,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          hintText: 'e.g. Narmadapuram, Bhopal, Itarsi',
                          prefixIcon: const Icon(Icons.location_city_outlined),
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text('PIN Code (Optional)', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _pinController,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: InputDecoration(
                          counterText: '',
                          hintText: 'e.g. 461001',
                          prefixIcon: const Icon(Icons.pin_drop_outlined),
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text('How did you find Sunlife Solar?', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: _leadSource,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                        items: _leadSources
                            .map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _leadSource = val);
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: FilledButton(
                    onPressed: _isLoading ? null : _handleStep1Next,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.ink,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Next: Solar Requirement', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward_rounded, size: 20),
                            ],
                          ),
                  ),
                ),
              ],

              // ─── STEP 2 CONTENT ──────────────────────────────────
              if (_currentStep == 2) ...[
                CardBox(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Property Type', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _propertyTypes.map((type) {
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
                      const SizedBox(height: 22),
                      const Text('Average Monthly Electricity Bill', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      Column(
                        children: _billRanges.map((range) {
                          final selected = _monthlyBill == range;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () => setState(() => _monthlyBill = range),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: selected ? AppColors.softGreen : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: selected ? AppColors.green : AppColors.cardBorder,
                                    width: selected ? 2 : 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      range,
                                      style: TextStyle(
                                        fontWeight: selected ? FontWeight.w900 : FontWeight.w600,
                                        color: selected ? AppColors.deepGreen : AppColors.ink,
                                      ),
                                    ),
                                    if (selected)
                                      const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 20),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 18),
                      const Text('Approximate Roof Area (Sq. Ft.)', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _roofSizeController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: 'e.g. 500 sq ft',
                          prefixIcon: const Icon(Icons.roofing_outlined),
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Instant Dynamic Savings Preview
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.softGreen,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.green.withValues(alpha: .3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.auto_awesome, color: AppColors.deepGreen, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Estimated Solar Capacity & Subsidy',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.deepGreen),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Recommended Size:', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                          Text(_estimate['kw']!, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('PM Surya Ghar Subsidy:', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                          Text(_estimate['subsidy']!, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.orange, fontSize: 14)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Estimated Savings:', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                          Text(_estimate['annualSavings']!, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.deepGreen, fontSize: 14)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: FilledButton(
                    onPressed: _isLoading ? null : _handleStep2Submit,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.deepGreen,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Book Free Rooftop Site Survey', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                  ),
                ),
              ],
            ],
          ),
        ),
      );
}
