class ServiceTicket {
  const ServiceTicket({
    required this.id,
    required this.category,
    required this.description,
    required this.status,
    required this.createdAt,
    this.advisorName = 'Neha Verma',
    this.expectedResponse = 'Within 1 working day',
    this.attachmentPath,
  });

  final String id;
  final String category;
  final String description;
  final String status;
  final DateTime createdAt;
  final String advisorName;
  final String expectedResponse;
  final String? attachmentPath;

  factory ServiceTicket.fromJson(Map<String, dynamic> json) {
    final tech = json['assignedTechnician'] is Map
        ? json['assignedTechnician'] as Map<String, dynamic>
        : null;
    return ServiceTicket(
      id: json['ticketId'] as String? ?? json['id'] as String? ?? 'SS2842',
      category: json['issueCategory'] as String? ??
          json['category'] as String? ??
          'Subsidy query',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'UNDER REVIEW',
      createdAt: json['submittedDate'] != null
          ? DateTime.tryParse(json['submittedDate'].toString()) ?? DateTime.now()
          : json['created_at'] != null
              ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
              : DateTime.now(),
      advisorName: tech?['name'] as String? ??
          json['advisor_name'] as String? ??
          'Neha Verma',
      expectedResponse:
          json['expected_response'] as String? ?? 'Within 1 working day',
      attachmentPath: json['attachment_path'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'category': category,
        'description': description,
        'status': status,
        'created_at': createdAt.toIso8601String(),
        'advisor_name': advisorName,
        'expected_response': expectedResponse,
        'attachment_path': attachmentPath,
      };
}
