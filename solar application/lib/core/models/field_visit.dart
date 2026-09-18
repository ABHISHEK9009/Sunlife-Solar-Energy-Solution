class FieldVisit {
  const FieldVisit({
    required this.id,
    required this.customerName,
    required this.time,
    required this.purpose,
    required this.location,
    required this.checklist,
    this.isCompleted = false,
    this.latitude,
    this.longitude,
    this.photoPaths = const [],
    this.directionsUrl,
  });

  final String id;
  final String customerName;
  final String time;
  final String purpose;
  final String location;
  final List<bool> checklist;
  final bool isCompleted;
  final double? latitude;
  final double? longitude;
  final List<String> photoPaths;
  final String? directionsUrl;

  factory FieldVisit.fromJson(Map<String, dynamic> json) => FieldVisit(
        id: json['id'] as String? ?? '',
        customerName: json['customer_name'] as String? ??
            json['customerName'] as String? ??
            '',
        time: json['time'] as String? ?? '10:30 AM',
        purpose: json['purpose'] as String? ?? 'Site survey',
        location: json['location'] as String? ?? 'Jaipur',
        checklist: (json['checklist'] as List<dynamic>?)
                ?.map((e) => e == true)
                .toList() ??
            [false, false, false, false],
        isCompleted: json['is_completed'] as bool? ??
            json['isCompleted'] as bool? ??
            false,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        photoPaths: ((json['photo_paths'] ?? json['photoPaths']) as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        directionsUrl: json['directions_url'] as String? ??
            json['directionsUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'customer_name': customerName,
        'time': time,
        'purpose': purpose,
        'location': location,
        'checklist': checklist,
        'is_completed': isCompleted,
        'latitude': latitude,
        'longitude': longitude,
        'photo_paths': photoPaths,
        'directions_url': directionsUrl,
      };

  FieldVisit copyWith({
    String? id,
    String? customerName,
    String? time,
    String? purpose,
    String? location,
    List<bool>? checklist,
    bool? isCompleted,
    double? latitude,
    double? longitude,
    List<String>? photoPaths,
    String? directionsUrl,
  }) =>
      FieldVisit(
        id: id ?? this.id,
        customerName: customerName ?? this.customerName,
        time: time ?? this.time,
        purpose: purpose ?? this.purpose,
        location: location ?? this.location,
        checklist: checklist ?? this.checklist,
        isCompleted: isCompleted ?? this.isCompleted,
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        photoPaths: photoPaths ?? this.photoPaths,
        directionsUrl: directionsUrl ?? this.directionsUrl,
      );
}
