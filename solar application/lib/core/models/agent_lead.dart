class AgentLead {
  const AgentLead({
    required this.id,
    required this.name,
    required this.location,
    required this.stage,
    required this.phone,
    required this.monthlyBill,
    this.city,
    this.district,
    this.notes,
    this.propertyType = 'Residential',
    this.solarRequirement = 'On-Grid',
    this.preferredSystem = '5 kW on-grid',
    this.approxCapacity = '5 kW',
    this.leadSource = 'Field Visit',
    this.assignedAgent,
    this.nextFollowUpDate,
    this.createdAt,
  });

  final String id;
  final String name;
  final String location;
  final String? city;
  final String? district;
  final String stage;
  final String phone;
  final String monthlyBill;
  final String? notes;
  final String propertyType;
  final String solarRequirement;
  final String preferredSystem;
  final String approxCapacity;
  final String leadSource;
  final String? assignedAgent;
  final DateTime? nextFollowUpDate;
  final DateTime? createdAt;

  factory AgentLead.fromJson(Map<String, dynamic> json) {
    final rawLoc = json['location'] as String? ?? json['city'] as String? ?? '';
    final rawSolar = json['solar_requirement'] as String? ??
        json['solarRequirement'] as String? ??
        json['interestedSolution'] as String? ??
        'On-Grid';
    final rawCap = json['approx_capacity'] as String? ??
        json['approxCapacity'] as String? ??
        (json['requestedCapacity'] != null ? '${json['requestedCapacity']} kW' : null) ??
        '5 kW';

    return AgentLead(
      id: json['id'] as String? ?? json['leadId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      location: rawLoc,
      city: json['city'] as String?,
      district: json['district'] as String?,
      stage: json['stage'] as String? ?? json['status'] as String? ?? 'New lead',
      phone: json['phone'] as String? ?? '',
      monthlyBill: json['monthly_bill'] as String? ??
          json['monthlyBill'] as String? ??
          '₹5,000/month',
      notes: json['notes'] as String?,
      propertyType: json['property_type'] as String? ??
          json['propertyType'] as String? ??
          'Residential',
      solarRequirement: rawSolar,
      preferredSystem: json['preferred_system'] as String? ??
          json['preferredSystem'] as String? ??
          '$rawCap $rawSolar',
      approxCapacity: rawCap,
      leadSource: json['lead_source'] as String? ??
          json['leadSource'] as String? ??
          'Field Visit',
      assignedAgent: json['assigned_agent'] as String? ??
          json['assignedAgent'] as String?,
      nextFollowUpDate: json['next_follow_up_date'] != null
          ? DateTime.tryParse(json['next_follow_up_date'].toString())
          : json['nextFollowUpDate'] != null
              ? DateTime.tryParse(json['nextFollowUpDate'].toString())
              : json['surveyRequestedDate'] != null
                  ? DateTime.tryParse(json['surveyRequestedDate'].toString())
                  : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'location': location,
        'city': city,
        'district': district,
        'stage': stage,
        'phone': phone,
        'monthly_bill': monthlyBill,
        'notes': notes,
        'property_type': propertyType,
        'solar_requirement': solarRequirement,
        'preferred_system': preferredSystem,
        'approx_capacity': approxCapacity,
        'lead_source': leadSource,
        'assigned_agent': assignedAgent,
        'next_follow_up_date': nextFollowUpDate?.toIso8601String(),
        'created_at': createdAt?.toIso8601String(),
      };

  AgentLead copyWith({
    String? id,
    String? name,
    String? location,
    String? city,
    String? district,
    String? stage,
    String? phone,
    String? monthlyBill,
    String? notes,
    String? propertyType,
    String? solarRequirement,
    String? preferredSystem,
    String? approxCapacity,
    String? leadSource,
    String? assignedAgent,
    DateTime? nextFollowUpDate,
    DateTime? createdAt,
  }) =>
      AgentLead(
        id: id ?? this.id,
        name: name ?? this.name,
        location: location ?? this.location,
        city: city ?? this.city,
        district: district ?? this.district,
        stage: stage ?? this.stage,
        phone: phone ?? this.phone,
        monthlyBill: monthlyBill ?? this.monthlyBill,
        notes: notes ?? this.notes,
        propertyType: propertyType ?? this.propertyType,
        solarRequirement: solarRequirement ?? this.solarRequirement,
        preferredSystem: preferredSystem ?? this.preferredSystem,
        approxCapacity: approxCapacity ?? this.approxCapacity,
        leadSource: leadSource ?? this.leadSource,
        assignedAgent: assignedAgent ?? this.assignedAgent,
        nextFollowUpDate: nextFollowUpDate ?? this.nextFollowUpDate,
        createdAt: createdAt ?? this.createdAt,
      );
}
