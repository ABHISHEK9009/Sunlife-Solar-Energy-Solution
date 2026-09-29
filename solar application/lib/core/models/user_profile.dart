class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.role, // 'customer' or 'agent'
    this.accountState = 'CUSTOMER', // 'CUSTOMER' or 'LEAD'
    this.isNewUser = false,
    this.profileComplete = true,
    this.plantId,
    this.discomConsumerNo,
    this.subsidyBankMasked,
    this.territory,
    this.managerName,
    this.city,
    this.propertyType,
    this.monthlyBill,
    this.leadStatus,
    this.advisorName,
    this.advisorPhone,
  });

  final String id;
  final String name;
  final String phone;
  final String? email;
  final String role; // 'customer' or 'agent'
  final String accountState; // 'CUSTOMER' or 'LEAD'
  final bool isNewUser;
  final bool profileComplete;
  final String? plantId;
  final String? discomConsumerNo;
  final String? subsidyBankMasked;
  final String? territory;
  final String? managerName;
  final String? city;
  final String? propertyType;
  final String? monthlyBill;
  final String? leadStatus;
  final String? advisorName;
  final String? advisorPhone;

  bool get isLead => accountState == 'LEAD';
  bool get isCustomer => accountState == 'CUSTOMER';

  UserProfile copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? role,
    String? accountState,
    bool? isNewUser,
    bool? profileComplete,
    String? plantId,
    String? discomConsumerNo,
    String? subsidyBankMasked,
    String? territory,
    String? managerName,
    String? city,
    String? propertyType,
    String? monthlyBill,
    String? leadStatus,
    String? advisorName,
    String? advisorPhone,
  }) =>
      UserProfile(
        id: id ?? this.id,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        role: role ?? this.role,
        accountState: accountState ?? this.accountState,
        isNewUser: isNewUser ?? this.isNewUser,
        profileComplete: profileComplete ?? this.profileComplete,
        plantId: plantId ?? this.plantId,
        discomConsumerNo: discomConsumerNo ?? this.discomConsumerNo,
        subsidyBankMasked: subsidyBankMasked ?? this.subsidyBankMasked,
        territory: territory ?? this.territory,
        managerName: managerName ?? this.managerName,
        city: city ?? this.city,
        propertyType: propertyType ?? this.propertyType,
        monthlyBill: monthlyBill ?? this.monthlyBill,
        leadStatus: leadStatus ?? this.leadStatus,
        advisorName: advisorName ?? this.advisorName,
        advisorPhone: advisorPhone ?? this.advisorPhone,
      );

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final state = (json['accountState'] ?? json['account_state'] ?? 'CUSTOMER').toString().toUpperCase();
    return UserProfile(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? json['fullName'] as String? ?? '',
      phone: json['phone'] as String? ?? json['primaryMobile'] as String? ?? '',
      email: json['email'] as String?,
      role: json['role'] as String? ?? (state == 'LEAD' ? 'customer' : 'customer'),
      accountState: state,
      isNewUser: json['isNewUser'] as bool? ?? false,
      profileComplete: json['profileComplete'] as bool? ?? true,
      plantId: json['plant_id'] as String? ?? json['plantId'] as String?,
      discomConsumerNo: json['discom_consumer_no'] as String? ?? json['discomConsumerNo'] as String?,
      subsidyBankMasked: json['subsidy_bank_masked'] as String? ?? json['subsidyBankMasked'] as String?,
      territory: json['territory'] as String?,
      managerName: json['manager_name'] as String?,
      city: json['city'] as String?,
      propertyType: json['propertyType'] as String? ?? json['property_type'] as String?,
      monthlyBill: json['monthlyBill'] as String? ?? json['monthly_bill'] as String?,
      leadStatus: json['status'] as String? ?? json['leadStatus'] as String?,
      advisorName: json['advisorName'] as String?,
      advisorPhone: json['advisorPhone'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'role': role,
        'accountState': accountState,
        'isNewUser': isNewUser,
        'profileComplete': profileComplete,
        'plant_id': plantId,
        'discom_consumer_no': discomConsumerNo,
        'subsidy_bank_masked': subsidyBankMasked,
        'territory': territory,
        'manager_name': managerName,
        'city': city,
        'propertyType': propertyType,
        'monthlyBill': monthlyBill,
        'leadStatus': leadStatus,
        'advisorName': advisorName,
        'advisorPhone': advisorPhone,
      };
}
