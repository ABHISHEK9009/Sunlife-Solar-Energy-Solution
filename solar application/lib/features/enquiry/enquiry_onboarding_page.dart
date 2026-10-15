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
  int _currentStep = 1; // Step 1: Contact & Location, Step 2: Solar Requirement
  bool _isLoading = false;
  String? _errorMessage;

  // ─── Step 1: Contact & Location ──────────────────────────────────────────
  final _nameController = TextEditingController();
  final _localAreaController = TextEditingController();
  final _customDistrictController = TextEditingController();
  final _pinController = TextEditingController();

  static const List<String> _districts = [
    'Bhopal',
    'Narmadapuram',
    'Itarsi',
    'Sehore',
    'Raisen',
    'Betul',
    'Harda',
    'Pipariya',
    'Indore',
    'Jabalpur',
    'Dewas',
    'Vidisha',
    'Other District',
  ];

  String _selectedDistrict = 'Bhopal';
  String _leadSource = 'Social Media / Web';

  final List<String> _leadSources = [
    'Social Media / Web',
    'Friend / Family Referral',
    'Saw Sunlife Solar Hoarding',
    'Local Solar Advisor',
    'PM Surya Ghar Portal',
  ];

  // ─── Step 2: Solar Engineering & Requirements ─────────────────────────────
  String _propertyType = 'Residential';
  String _roofType = 'Flat Concrete (RCC)';
  String _monthlyBill = '₹2,000–₹5,000';
  String _solarSystemType = 'On-Grid (Net-Metering + Subsidy)';
  String _discom = 'MPPKVVCL (Madhya Kshetra)';
  final _roofSizeController = TextEditingController(text: '500');

  final List<Map<String, dynamic>> _propertyOptions = [
    {
      'title': 'Residential',
      'label': 'Residential Home',
      'icon': Icons.home_rounded,
      'badge': 'Up to ₹78,000 Subsidy',
    },
    {
      'title': 'Commercial',
      'label': 'Commercial / Office',
      'icon': Icons.business_rounded,
      'badge': 'High ROI',
    },
    {
      'title': 'Industrial',
      'label': 'Industrial / Factory',
      'icon': Icons.factory_rounded,
      'badge': '25 kW+ EPC',
    },
    {
      'title': 'Agricultural',
      'label': 'Agricultural / Farm',
      'icon': Icons.agriculture_rounded,
      'badge': 'Solar Pumping',
    },
  ];

  final List<Map<String, dynamic>> _roofTypeOptions = [
    {
      'title': 'Flat Concrete (RCC)',
      'icon': Icons.apartment_rounded,
      'desc': 'Standard RCC Terrace',
    },
    {
      'title': 'Tin / Metal Shed',
      'icon': Icons.warehouse_rounded,
      'desc': 'Industrial or Warehouse Shed',
    },
    {
      'title': 'Slanted / Tiled Roof',
      'icon': Icons.roofing_rounded,
      'desc': 'Sloped Surface Installation',
    },
    {
      'title': 'Open Ground / Terrace',
      'icon': Icons.landscape_rounded,
      'desc': 'Ground-Mount Elevated Structure',
    },
  ];

  final List<String> _billRanges = [
    'Under ₹2,000',
    '₹2,000–₹5,000',
    '₹5,000–₹10,000',
    '₹10,000–₹20,000',
    '₹20,000+',
  ];

  final List<Map<String, dynamic>> _systemTypeOptions = [
    {
      'title': 'On-Grid (Net-Metering + Subsidy)',
      'icon': Icons.grid_view_rounded,
      'tag': 'Most Popular',
      'desc': 'Export surplus power to DISCOM grid & claim central subsidy',
    },
    {
      'title': 'Hybrid (Solar + Battery Backup)',
      'icon': Icons.battery_charging_full_rounded,
      'tag': '24/7 Power',
      'desc': 'Battery backup during grid outages plus net-metering export',
    },
    {
      'title': 'Off-Grid (Standalone Battery)',
      'icon': Icons.wb_sunny_rounded,
      'tag': 'Remote Areas',
      'desc': 'Independent solar battery system without grid dependency',
    },
  ];

  final List<String> _discomList = [
    'MPPKVVCL (Madhya Kshetra - Bhopal / Narmadapuram)',
    'MPWZ (Paschim Kshetra - Indore / Ujjain)',
    'MPEZ (Poorv Kshetra - Jabalpur / Sagar)',
    'Other Electricity Board',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _localAreaController.dispose();
    _customDistrictController.dispose();
    _pinController.dispose();
    _roofSizeController.dispose();
    super.dispose();
  }

  String get _effectiveDistrict {
    if (_selectedDistrict == 'Other District') {
      final custom = _customDistrictController.text.trim();
      return custom.isNotEmpty ? custom : 'Madhya Pradesh';
    }
    return _selectedDistrict;
  }

  // Dynamic estimate calculation based on bill & roof
  Map<String, String> get _estimate {
    switch (_monthlyBill) {
      case 'Under ₹2,000':
        return {
          'kw': '2.0 kW',
          'subsidy': '₹60,000',
          'annualSavings': '₹24,000 / yr',
          'generation': '~8–9 units / day',
          'lifetimeSavings': '₹6,00,000+',
          'payback': '2.5 Years',
        };
      case '₹2,000–₹5,000':
        return {
          'kw': '3.3 kW',
          'subsidy': '₹78,000',
          'annualSavings': '₹48,000 / yr',
          'generation': '~13–15 units / day',
          'lifetimeSavings': '₹12,00,000+',
          'payback': '2.8 Years',
        };
      case '₹5,000–₹10,000':
        return {
          'kw': '5.0 kW',
          'subsidy': '₹78,000',
          'annualSavings': '₹76,000 / yr',
          'generation': '~20–22 units / day',
          'lifetimeSavings': '₹19,00,000+',
          'payback': '3.1 Years',
        };
      case '₹10,000–₹20,000':
        return {
          'kw': '8–10 kW',
          'subsidy': '₹78,000',
          'annualSavings': '₹1,45,000 / yr',
          'generation': '~35–40 units / day',
          'lifetimeSavings': '₹36,00,000+',
          'payback': '3.2 Years',
        };
      case '₹20,000+':
      default:
        return {
          'kw': '15–25 kW+',
          'subsidy': 'Tax Depreciation',
          'annualSavings': '₹3,20,000+ / yr',
          'generation': '~75–100+ units / day',
          'lifetimeSavings': '₹80,00,000+',
          'payback': '2.9 Years',
        };
    }
  }

  Future<void> _handleStep1Next() async {
    if (_isLoading) return;
    final name = _nameController.text.trim();
    final district = _effectiveDistrict;

    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter your full name');
      return;
    }
    if (_selectedDistrict == 'Other District' && _customDistrictController.text.trim().isEmpty) {
      setState(() => _errorMessage = 'Please specify your district or city name');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await AuthRepository.instance.submitLeadEnquiryChunk({
        'name': name,
        'city': district,
        'localArea': _localAreaController.text.trim(),
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
        'roofType': _roofType,
        'monthlyBill': _monthlyBill,
        'roofSize': _roofSizeController.text.trim(),
        'solarSystemType': _solarSystemType,
        'discom': _discom,
        'step': 'REQUIREMENT',
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = ErrorMapper.message(e);
          _isLoading = false;
        });
      }
      return;
    }

    if (!mounted) return;

    final customerName = _nameController.text.trim().isNotEmpty
        ? _nameController.text.trim()
        : 'Valued Customer';
    final district = _effectiveDistrict;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.green, size: 28),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Solar Proposal Ready',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome, $customerName!',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.ink),
              ),
              const SizedBox(height: 8),
              Text(
                'Your custom proposal for a ${_estimate['kw']} solar plant in $district has been registered.',
                style: const TextStyle(fontSize: 13, height: 1.4, color: AppColors.muted),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.softGreen,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.green.withValues(alpha: .3)),
                ),
                child: Column(
                  children: [
                    _buildSummaryRow('Recommended Size', _estimate['kw']!),
                    const Divider(height: 12, color: Color(0xFFD1FAE5)),
                    _buildSummaryRow('PM Surya Ghar Subsidy', _estimate['subsidy']!, highlight: true),
                    const Divider(height: 12, color: Color(0xFFD1FAE5)),
                    _buildSummaryRow('Est. Annual Savings', _estimate['annualSavings']!),
                    const Divider(height: 12, color: Color(0xFFD1FAE5)),
                    _buildSummaryRow('Est. Payback Period', _estimate['payback']!),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Our certified district solar engineer will reach out to conduct your free 3D rooftop shadow analysis.',
                style: TextStyle(fontSize: 12, height: 1.4, color: AppColors.muted),
              ),
            ],
          ),
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.deepGreen,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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

  static Widget _buildSummaryRow(String label, String value, {bool highlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.ink)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: highlight ? AppColors.orange : AppColors.deepGreen,
          ),
        ),
      ],
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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: AppColors.canvas,
        elevation: 0,
        leading: _currentStep == 2
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: AppColors.ink),
                onPressed: () => setState(() => _currentStep = 1),
              )
            : null,
        title: const Logo(),
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          children: [
            const SizedBox(height: 6),

            // Modern Animated Progress Indicator
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _currentStep == 1
                          ? 'STEP 1 OF 2: CONTACT & DISTRICT'
                          : 'STEP 2 OF 2: SOLAR SYSTEM & ROOFTOP',
                      style: const TextStyle(
                        color: AppColors.deepGreen,
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                        letterSpacing: 1.1,
                      ),
                    ),
                    Text(
                      _currentStep == 1 ? '50% Complete' : '100% Complete',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.muted,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: _currentStep == 1 ? 0.5 : 1.0,
                    minHeight: 6,
                    backgroundColor: AppColors.cardBorder,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.green),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Header Title
            Text(
              _currentStep == 1 ? 'Welcome to Sunlife Solar ☀️' : 'Tailor Your Rooftop System',
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: AppColors.ink,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _currentStep == 1
                  ? 'Tell us your name and district so we can connect you with your certified local solar engineer.'
                  : 'Share your property details to customize your 3D solar design and claim PM Surya Ghar subsidy.',
              style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.45),
            ),
            const SizedBox(height: 20),

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Color(0xFFB91C1C), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ═══════════════════════════════════════════════════════════════
            // STEP 1 CONTENT: CONTACT & DISTRICT (Clean, Quick & Basic)
            // ═══════════════════════════════════════════════════════════════
            if (_currentStep == 1) ...[
              CardBox(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Full Name *',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      decoration: InputDecoration(
                        hintText: 'e.g. Abhishek Sharma',
                        prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.deepGreen),
                        filled: true,
                        fillColor: AppColors.canvas,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.green, width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // District Dropdown Picker
                    const Text(
                      'City / District *',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedDistrict,
                      isExpanded: true,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppColors.canvas,
                        prefixIcon: const Icon(Icons.location_city_rounded, color: AppColors.deepGreen),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.green, width: 2),
                        ),
                      ),
                      items: _districts.map((d) {
                        return DropdownMenuItem(
                          value: d,
                          child: Text(
                            d,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedDistrict = val);
                      },
                    ),

                    // Popular District Quick Selection Chips
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: ['Bhopal', 'Narmadapuram', 'Itarsi', 'Sehore', 'Indore'].map((quickCity) {
                        final isSelected = _selectedDistrict == quickCity;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedDistrict = quickCity),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.softGreen : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? AppColors.green : const Color(0xFFE5E7EB),
                              ),
                            ),
                            child: Text(
                              quickCity,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                color: isSelected ? AppColors.deepGreen : AppColors.muted,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    if (_selectedDistrict == 'Other District') ...[
                      const SizedBox(height: 14),
                      TextField(
                        controller: _customDistrictController,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          hintText: 'Enter your district or city name',
                          prefixIcon: const Icon(Icons.edit_location_outlined),
                          filled: true,
                          fillColor: AppColors.canvas,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 18),
                    const Text(
                      'Local Area / Colony / Tehsil (Optional)',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.ink),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Helps our engineer locate your site faster',
                      style: TextStyle(fontSize: 11, color: AppColors.muted),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _localAreaController,
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        hintText: 'e.g. Kolar Road, MP Nagar, Budhni, Babai',
                        prefixIcon: const Icon(Icons.home_work_outlined),
                        filled: true,
                        fillColor: AppColors.canvas,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),
                    const Text(
                      'PIN Code (Optional)',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: InputDecoration(
                        counterText: '',
                        hintText: 'e.g. 462001',
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
                    const Text(
                      'How did you discover Sunlife Solar?',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _leadSource,
                      isExpanded: true,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppColors.canvas,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                      ),
                      items: _leadSources
                          .map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))))
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
                            Text(
                              'Next: Solar Requirement',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ),
                ),
              ),
            ],

            // ═══════════════════════════════════════════════════════════════
            // STEP 2 CONTENT: SOLAR ENGINEERING & REQUIREMENTS (Rich & Detailed)
            // ═══════════════════════════════════════════════════════════════
            if (_currentStep == 2) ...[
              // 1. Property Type
              CardBox(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.domain_rounded, color: AppColors.deepGreen, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Property Type',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.ink),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Select the site category for correct structural engineering',
                      style: TextStyle(fontSize: 12, color: AppColors.muted),
                    ),
                    const SizedBox(height: 14),

                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _propertyOptions.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.35,
                      ),
                      itemBuilder: (context, index) {
                        final opt = _propertyOptions[index];
                        final isSelected = _propertyType == opt['title'];
                        return GestureDetector(
                          onTap: () => setState(() => _propertyType = opt['title'] as String),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.softGreen : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected ? AppColors.green : AppColors.cardBorder,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Icon(
                                      opt['icon'] as IconData,
                                      color: isSelected ? AppColors.deepGreen : AppColors.muted,
                                      size: 24,
                                    ),
                                    if (isSelected)
                                      const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 18),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      opt['label'] as String,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                        color: isSelected ? AppColors.deepGreen : AppColors.ink,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      opt['badge'] as String,
                                      style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 20),
                    const Divider(height: 1, color: AppColors.cardBorder),
                    const SizedBox(height: 18),

                    // 2. Roof Surface / Structure
                    const Row(
                      children: [
                        Icon(Icons.roofing_rounded, color: AppColors.deepGreen, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Rooftop Surface Type',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.ink),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Determines module mounting structure & tilt angle',
                      style: TextStyle(fontSize: 12, color: AppColors.muted),
                    ),
                    const SizedBox(height: 12),

                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _roofTypeOptions.map((roof) {
                        final isSelected = _roofType == roof['title'];
                        return GestureDetector(
                          onTap: () => setState(() => _roofType = roof['title'] as String),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.softGreen : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? AppColors.green : AppColors.cardBorder,
                                width: isSelected ? 1.8 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  roof['icon'] as IconData,
                                  size: 16,
                                  color: isSelected ? AppColors.deepGreen : AppColors.muted,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  roof['title'] as String,
                                  style: TextStyle(
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                    fontSize: 12,
                                    color: isSelected ? AppColors.deepGreen : AppColors.ink,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 20),
                    const Divider(height: 1, color: AppColors.cardBorder),
                    const SizedBox(height: 18),

                    // 3. Approximate Roof Area (Sq. Ft.)
                    const Row(
                      children: [
                        Icon(Icons.straighten_rounded, color: AppColors.deepGreen, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Estimated Shadow-Free Area (Sq. Ft.)',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.ink),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _roofSizeController,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: 'e.g. 500',
                        suffixText: 'sq. ft.',
                        prefixIcon: const Icon(Icons.aspect_ratio_rounded),
                        filled: true,
                        fillColor: AppColors.canvas,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['300 sq ft', '500 sq ft', '1,000 sq ft', '2,500+ sq ft'].map((areaText) {
                        final val = areaText.split(' ')[0].replaceAll(',', '').replaceAll('+', '');
                        return ActionChip(
                          label: Text(areaText, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                          onPressed: () => setState(() => _roofSizeController.text = val),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Card 2: Electricity Bill & Grid Connection
              CardBox(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.electric_bolt_rounded, color: AppColors.orange, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Average Monthly Electricity Bill',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.ink),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Used to calculate your optimal kW capacity & payback',
                      style: TextStyle(fontSize: 12, color: AppColors.muted),
                    ),
                    const SizedBox(height: 14),

                    Column(
                      children: _billRanges.map((range) {
                        final isSelected = _monthlyBill == range;
                        String helperText = '';
                        if (range == 'Under ₹2,000') helperText = '2 kW • Fits small home';
                        if (range == '₹2,000–₹5,000') helperText = '3.3 kW • Max PM Surya Ghar Subsidy (₹78k)';
                        if (range == '₹5,000–₹10,000') helperText = '5 kW • High air-conditioning usage';
                        if (range == '₹10,000–₹20,000') helperText = '8–10 kW • Joint families / Duplex';
                        if (range == '₹20,000+') helperText = 'Commercial / Industrial EPC';

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () => setState(() => _monthlyBill = range),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.softGreen : Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected ? AppColors.green : AppColors.cardBorder,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        range,
                                        style: TextStyle(
                                          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                                          fontSize: 14,
                                          color: isSelected ? AppColors.deepGreen : AppColors.ink,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        helperText,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isSelected ? AppColors.deepGreen.withValues(alpha: .8) : AppColors.muted,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (isSelected)
                                    const Icon(Icons.check_circle_rounded, color: AppColors.green, size: 22)
                                  else
                                    const Icon(Icons.radio_button_unchecked_rounded, color: AppColors.cardBorder, size: 20),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 20),
                    const Divider(height: 1, color: AppColors.cardBorder),
                    const SizedBox(height: 18),

                    // Preferred Solar System Type
                    const Row(
                      children: [
                        Icon(Icons.solar_power_rounded, color: AppColors.deepGreen, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Preferred Solar Solution',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.ink),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Column(
                      children: _systemTypeOptions.map((sys) {
                        final isSelected = _solarSystemType == sys['title'];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () => setState(() => _solarSystemType = sys['title'] as String),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.softGreen : Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected ? AppColors.green : AppColors.cardBorder,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: isSelected ? Colors.white : AppColors.canvas,
                                    child: Icon(
                                      sys['icon'] as IconData,
                                      size: 18,
                                      color: isSelected ? AppColors.deepGreen : AppColors.muted,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              (sys['title'] as String).split(' (')[0],
                                              style: TextStyle(
                                                fontWeight: FontWeight.w800,
                                                fontSize: 13,
                                                color: isSelected ? AppColors.deepGreen : AppColors.ink,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isSelected ? AppColors.green : AppColors.canvas,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                sys['tag'] as String,
                                                style: TextStyle(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w800,
                                                  color: isSelected ? Colors.white : AppColors.muted,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          sys['desc'] as String,
                                          style: const TextStyle(fontSize: 11, color: AppColors.muted, height: 1.3),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 18),
                    const Text(
                      'Electricity Board / DISCOM',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.ink),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _discom,
                      isExpanded: true,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppColors.canvas,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                      ),
                      items: _discomList
                          .map((d) => DropdownMenuItem(
                                value: d,
                                child: Text(d, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _discom = val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // ═══════════════════════════════════════════════════════════════
              // LIVE ESTIMATE & PM SURYA GHAR SUBSIDY PROJECTION CARD
              // ═══════════════════════════════════════════════════════════════
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF064E3B),
                      const Color(0xFF047857),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF064E3B).withValues(alpha: .25),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: Color(0xFFFBBF24), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Instant Solar Projection',
                              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Colors.white),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: .18),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _estimate['kw']!,
                            style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            'Central Subsidy',
                            _estimate['subsidy']!,
                            const Color(0xFFFBBF24),
                            subtitle: 'PM Surya Ghar Direct Credit',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricTile(
                            'Annual Savings',
                            _estimate['annualSavings']!,
                            const Color(0xFF6EE7B7),
                            subtitle: 'Est. Bill Reduction',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            'Daily Units',
                            _estimate['generation']!,
                            Colors.white,
                            subtitle: 'Clean Solar Energy',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricTile(
                            'Payback Time',
                            _estimate['payback']!,
                            Colors.white,
                            subtitle: 'Complete ROI',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Final Submission Action
              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton(
                  onPressed: _isLoading ? null : _handleStep2Submit,
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
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.calendar_month_rounded, size: 20),
                            SizedBox(width: 10),
                            Text(
                              'Book Free 3D Rooftop Survey ✨',
                              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(String title, String value, Color valueColor, {required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: .15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: .8))),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: valueColor),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(fontSize: 9, color: Colors.white.withValues(alpha: .6)),
          ),
        ],
      ),
    );
  }
}
