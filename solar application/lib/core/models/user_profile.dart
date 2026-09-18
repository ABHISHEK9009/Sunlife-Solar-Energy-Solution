class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.role,
    this.plantId,
    this.discomConsumerNo,
    this.subsidyBankMasked,
    this.territory,
    this.managerName,
  });

  final String id;
  final String name;
  final String phone;
  final String? email;
  final String role; // 'customer' or 'agent'
  final String? plantId;
  final String? discomConsumerNo;
  final String? subsidyBankMasked;
  final String? territory;
  final String? managerName;

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        email: json['email'] as String?,
        role: json['role'] as String? ?? 'customer',
        plantId: json['plant_id'] as String?,
        discomConsumerNo: json['discom_consumer_no'] as String?,
        subsidyBankMasked: json['subsidy_bank_masked'] as String?,
        territory: json['territory'] as String?,
        managerName: json['manager_name'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'role': role,
        'plant_id': plantId,
        'discom_consumer_no': discomConsumerNo,
        'subsidy_bank_masked': subsidyBankMasked,
        'territory': territory,
        'manager_name': managerName,
      };
}
