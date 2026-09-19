import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/repositories/agent_repository.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/sub_page.dart';

class AgentLeadCapturePage extends StatefulWidget {
  const AgentLeadCapturePage({super.key});

  @override
  State<AgentLeadCapturePage> createState() => _AgentLeadCapturePageState();
}

class _AgentLeadCapturePageState extends State<AgentLeadCapturePage> {
  // Form controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();
  final _districtController = TextEditingController(text: 'Narmadapuram');
  final _customCapacityController = TextEditingController();
  final _assignedAgentController = TextEditingController();
  final _remarkController = TextEditingController();

  // Selection states
  String _leadSource = 'Field Visit';
  final List<String> _leadSources = [
    'Field Visit',
    'Call',
    'Referral',
    'Website',
    'Social Media',
    'Existing Customer',
    'Other',
  ];

  String _requirementType = 'Residential';
  final List<String> _requirementTypes = [
    'Residential',
    'Commercial',
    'Industrial',
    'Agriculture',
  ];

  String _solarRequirement = 'On-Grid';
  final List<String> _solarRequirements = [
    'On-Grid',
    'Off-Grid',
    'Hybrid',
    'Solar Pump',
    'Not Sure',
  ];

  String _capacitySelection = '5 kW';
  final List<String> _capacityPresets = [
    '3 kW',
    '5 kW',
    '10 kW',
    '15 kW',
    '25 kW',
    'Not Sure',
    'Custom',
  ];

  String _leadStatus = 'New';
  final List<String> _leadStatuses = [
    'New',
    'Contacted',
    'Qualified',
    'Site Visit Scheduled',
  ];

  DateTime _followUpDate = DateTime.now().add(const Duration(days: 1));

  // Validation errors
  String? _nameError;
  String? _phoneError;
  String? _locationError;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final currentAgent = AuthRepository.instance.currentUser?.name;
    if (currentAgent != null && currentAgent.isNotEmpty) {
      _assignedAgentController.text = currentAgent;
    } else {
      _assignedAgentController.text = 'Assigned Field Agent';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _districtController.dispose();
    _customCapacityController.dispose();
    _assignedAgentController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  bool _validate() {
    bool valid = true;

    if (_nameController.text.trim().isEmpty) {
      _nameError = 'Please enter customer name';
      valid = false;
    } else {
      _nameError = null;
    }

    final cleanPhone = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    if (!phoneRegex.hasMatch(cleanPhone)) {
      _phoneError = 'Enter a valid 10-digit mobile number';
      valid = false;
    } else {
      _phoneError = null;
    }

    if (_cityController.text.trim().isEmpty && _districtController.text.trim().isEmpty) {
      _locationError = 'Please enter city or village';
      valid = false;
    } else {
      _locationError = null;
    }

    setState(() {});
    return valid;
  }

  Future<void> _pickFollowUpDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _followUpDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.deepGreen,
            onPrimary: Colors.white,
            onSurface: AppColors.ink,
          ),
        ),
        child: child!,
      ),
    );

    if (picked != null) {
      setState(() => _followUpDate = picked);
    }
  }

  Future<void> _save() async {
    if (!_validate()) return;

    setState(() => _isSaving = true);

    try {
      final cityText = _cityController.text.trim();
      final districtText = _districtController.text.trim();
      final locationString = cityText.isNotEmpty && districtText.isNotEmpty
          ? '$cityText, $districtText'
          : (cityText.isNotEmpty ? cityText : districtText);

      final capacityValue = _capacitySelection == 'Custom'
          ? '${_customCapacityController.text.trim()} kW'
          : _capacitySelection;

      final savedLead = await AgentRepository.instance.addLead(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim().replaceAll(RegExp(r'\D'), ''),
        location: locationString,
        city: cityText,
        district: districtText,
        leadSource: _leadSource,
        requirementType: _requirementType,
        solarRequirement: _solarRequirement,
        approxCapacity: capacityValue,
        assignedAgent: _assignedAgentController.text.trim(),
        leadStatus: _leadStatus,
        nextFollowUpDate: _followUpDate,
        notes: _remarkController.text.trim(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.deepGreen,
          content: Text('Lead for ${savedLead.name} created successfully!'),
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving lead: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => SubPage(
        title: 'New Lead Creation',
        bottom: SafeArea(
          top: false,
          child: SizedBox(
            width: double.infinity,
            height: 54,
            child: FilledButton(
              onPressed: _isSaving ? null : _save,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.deepGreen,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isSaving
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Text(
                      'Save Lead to CRM',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
            ),
          ),
        ),
        children: [
          const Text(
            'Capture complete customer requirement for solar site survey and proposal.',
            style: TextStyle(color: AppColors.muted, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 18),

          // ─── SECTION 1: CUSTOMER DETAILS ───────────────────────
          _buildSectionHeader('1. CUSTOMER DETAILS', Icons.person_rounded),
          const SizedBox(height: 10),
          _buildCard([
            _buildTextField(
              controller: _nameController,
              label: 'Customer Name *',
              hint: 'e.g. Ramesh Chandra Verma',
              icon: Icons.badge_outlined,
              errorText: _nameError,
              onChanged: (_) {
                if (_nameError != null) setState(() => _nameError = null);
              },
            ),
            const SizedBox(height: 12),
            _buildTextField(
              controller: _phoneController,
              label: 'Mobile Number *',
              hint: '98765 43210',
              icon: Icons.phone_android_rounded,
              keyboardType: TextInputType.phone,
              prefixText: '+91 ',
              maxLength: 10,
              errorText: _phoneError,
              onChanged: (_) {
                if (_phoneError != null) setState(() => _phoneError = null);
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _cityController,
                    label: 'City / Village *',
                    hint: 'e.g. Itarsi / Babai',
                    icon: Icons.location_city_rounded,
                    errorText: _locationError,
                    onChanged: (_) {
                      if (_locationError != null) {
                        setState(() => _locationError = null);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildTextField(
                    controller: _districtController,
                    label: 'District',
                    hint: 'e.g. Narmadapuram',
                    icon: Icons.map_outlined,
                  ),
                ),
              ],
            ),
          ]),

          const SizedBox(height: 22),

          // ─── SECTION 2: SOLAR REQUIREMENT ──────────────────────
          _buildSectionHeader('2. SOLAR REQUIREMENT', Icons.solar_power_rounded),
          const SizedBox(height: 10),
          _buildCard([
            const Text(
              'Requirement Type',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _buildChipSelector(
              options: _requirementTypes,
              selected: _requirementType,
              onSelected: (val) => setState(() => _requirementType = val),
            ),
            const Divider(height: 24),
            const Text(
              'Solar Requirement / System Type',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _buildChipSelector(
              options: _solarRequirements,
              selected: _solarRequirement,
              onSelected: (val) => setState(() => _solarRequirement = val),
            ),
            const Divider(height: 24),
            const Text(
              'Approx. Capacity',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _buildChipSelector(
              options: _capacityPresets,
              selected: _capacitySelection,
              onSelected: (val) => setState(() => _capacitySelection = val),
            ),
            if (_capacitySelection == 'Custom') ...[
              const SizedBox(height: 10),
              _buildTextField(
                controller: _customCapacityController,
                label: 'Specify Capacity (kW)',
                hint: 'e.g. 7.5',
                icon: Icons.electric_bolt_rounded,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                suffixText: 'kW',
              ),
            ],
          ]),

          const SizedBox(height: 22),

          // ─── SECTION 3: LEAD & ASSIGNMENT ──────────────────────
          _buildSectionHeader('3. LEAD & ASSIGNMENT', Icons.assignment_ind_rounded),
          const SizedBox(height: 10),
          _buildCard([
            const Text(
              'Lead Source',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _buildChipSelector(
              options: _leadSources,
              selected: _leadSource,
              onSelected: (val) => setState(() => _leadSource = val),
            ),
            const Divider(height: 24),
            const Text(
              'Lead Status',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _buildChipSelector(
              options: _leadStatuses,
              selected: _leadStatus,
              onSelected: (val) => setState(() => _leadStatus = val),
            ),
            const Divider(height: 24),
            _buildTextField(
              controller: _assignedAgentController,
              label: 'Assigned Agent / Sales Person',
              hint: 'Field Partner Name',
              icon: Icons.person_pin_circle_outlined,
            ),
            const SizedBox(height: 16),
            const Text(
              'Next Follow-up Date',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: _pickFollowUpDate,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.black12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_rounded,
                      size: 20,
                      color: AppColors.deepGreen,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        DateFormat('EEE, dd MMM yyyy').format(_followUpDate),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                    const Text(
                      'Change',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.deepGreen,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildDateShortcut('Tomorrow', 1),
                const SizedBox(width: 8),
                _buildDateShortcut('In 3 Days', 3),
                const SizedBox(width: 8),
                _buildDateShortcut('Next Week', 7),
              ],
            ),
          ]),

          const SizedBox(height: 22),

          // ─── SECTION 4: REMARKS & REQUIREMENTS ─────────────────
          _buildSectionHeader('4. REMARK / REQUIREMENT', Icons.notes_rounded),
          const SizedBox(height: 10),
          _buildCard([
            TextField(
              controller: _remarkController,
              minLines: 3,
              maxLines: 6,
              decoration: InputDecoration(
                hintText:
                    'Enter rooftop details (RCC/Tin shed), monthly electricity bill, phase requirement (1-Phase/3-Phase), or customer preferences...',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.muted),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
              ),
            ),
          ]),

          const SizedBox(height: 80),
        ],
      );

  Widget _buildSectionHeader(String title, IconData icon) => Row(
        children: [
          Icon(icon, size: 18, color: AppColors.deepGreen),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: AppColors.ink,
            ),
          ),
        ],
      );

  Widget _buildCard(List<Widget> children) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        ),
      );

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    String? prefixText,
    String? suffixText,
    int? maxLength,
    String? errorText,
    void Function(String)? onChanged,
  }) =>
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: controller,
            keyboardType: keyboardType,
            maxLength: maxLength,
            onChanged: onChanged,
            decoration: InputDecoration(
              counterText: '',
              hintText: hint,
              hintStyle: const TextStyle(fontSize: 13, color: AppColors.muted),
              prefixText: prefixText,
              suffixText: suffixText,
              errorText: errorText,
              prefixIcon: Icon(icon, size: 20, color: AppColors.muted),
              filled: true,
              fillColor: const Color(0xFFF9FAFB),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: AppColors.deepGreen, width: 1.5),
              ),
            ),
          ),
        ],
      );

  Widget _buildChipSelector({
    required List<String> options,
    required String selected,
    required ValueChanged<String> onSelected,
  }) =>
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: options.map((option) {
          final isSelected = option == selected;
          return ChoiceChip(
            label: Text(
              option,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                color: isSelected ? Colors.white : AppColors.ink,
              ),
            ),
            selected: isSelected,
            onSelected: (_) => onSelected(option),
            selectedColor: AppColors.deepGreen,
            backgroundColor: const Color(0xFFF3F4F6),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(
                color: isSelected ? AppColors.deepGreen : Colors.transparent,
              ),
            ),
            showCheckmark: false,
          );
        }).toList(),
      );

  Widget _buildDateShortcut(String label, int daysFromNow) => Expanded(
        child: OutlinedButton(
          onPressed: () {
            setState(() {
              _followUpDate = DateTime.now().add(Duration(days: daysFromNow));
            });
          },
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 8),
            side: const BorderSide(color: Color(0xFFE5E7EB)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.muted,
            ),
          ),
        ),
      );
}

