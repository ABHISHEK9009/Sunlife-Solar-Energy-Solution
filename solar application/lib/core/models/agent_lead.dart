class AgentLead {
  const AgentLead({
    required this.id,
    required this.name,
    required this.location,
    required this.stage,
    required this.phone,
    required this.monthlyBill,
    this.notes,
    this.propertyType = 'Residential rooftop',
    this.preferredSystem = '5 kW on-grid',
    this.createdAt,
  });

  final String id;
  final String name;
  final String location;
  final String stage;
  final String phone;
  final String monthlyBill;
  final String? notes;
  final String propertyType;
  final String preferredSystem;
  final DateTime? createdAt;

  factory AgentLead.fromJson(Map<String, dynamic> json) => AgentLead(
        id: json['id'] as String? ?? json['leadId'] as String? ?? '',
        name: json['name'] as String? ?? '',
        location: json['location'] as String? ?? json['city'] as String? ?? '',
        stage: json['stage'] as String? ?? json['status'] as String? ?? 'New lead',
        phone: json['phone'] as String? ?? '',
        monthlyBill: json['monthly_bill'] as String? ??
            json['monthlyBill'] as String? ??
            '₹5,000/month',
        notes: json['notes'] as String?,
        propertyType: json['property_type'] as String? ??
            json['propertyType'] as String? ??
            'Residential rooftop',
        preferredSystem: json['preferred_system'] as String? ??
            json['preferredSystem'] as String? ??
            '5 kW on-grid',
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'].toString())
            : json['createdAt'] != null
                ? DateTime.tryParse(json['createdAt'].toString())
                : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'location': location,
        'stage': stage,
        'phone': phone,
        'monthly_bill': monthlyBill,
        'notes': notes,
        'property_type': propertyType,
        'preferred_system': preferredSystem,
        'created_at': createdAt?.toIso8601String(),
      };

  AgentLead copyWith({
    String? id,
    String? name,
    String? location,
    String? stage,
    String? phone,
    String? monthlyBill,
    String? notes,
    String? propertyType,
    String? preferredSystem,
    DateTime? createdAt,
  }) =>
      AgentLead(
        id: id ?? this.id,
        name: name ?? this.name,
        location: location ?? this.location,
        stage: stage ?? this.stage,
        phone: phone ?? this.phone,
        monthlyBill: monthlyBill ?? this.monthlyBill,
        notes: notes ?? this.notes,
        propertyType: propertyType ?? this.propertyType,
        preferredSystem: preferredSystem ?? this.preferredSystem,
        createdAt: createdAt ?? this.createdAt,
      );
}
