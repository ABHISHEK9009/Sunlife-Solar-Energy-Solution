class ProjectDocument {
  const ProjectDocument({
    required this.id,
    required this.title,
    required this.size,
    required this.type,
    this.url,
    this.localPath,
    this.isUploaded = true,
    this.uploadedAt,
    this.isRequired = false,
    this.category,
    this.verificationStatus = 'PENDING',
  });

  final String id;
  final String title;
  final String size;
  final String type; // 'pdf', 'image'
  final String? url;
  final String? localPath;
  final bool isUploaded;
  final DateTime? uploadedAt;
  final bool isRequired;
  final String? category;
  final String verificationStatus;

  String get name => title;
  bool get isApproved => verificationStatus.toUpperCase() == 'APPROVED';
  bool get isPending => verificationStatus.toUpperCase().contains('PENDING');

  static String _formatBytes(num? bytes) {
    if (bytes == null || bytes <= 0) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  factory ProjectDocument.fromJson(Map<String, dynamic> json) {
    final title = json['documentName'] as String? ??
        json['title'] as String? ??
        json['documentCategory'] as String? ??
        'Document';

    final mime = json['mimeType'] as String? ?? json['type'] as String? ?? 'pdf';
    final isPdf = mime.toLowerCase().contains('pdf');

    final sizeStr = json['size'] as String? ?? _formatBytes(json['fileSizeBytes'] as num?);

    final uploadedStr = json['uploadedDate'] ??
        json['uploaded_at'] ??
        json['createdAt'];

    return ProjectDocument(
      id: json['id'] as String? ?? json['documentId'] as String? ?? '',
      title: title,
      size: sizeStr,
      type: isPdf ? 'pdf' : 'image',
      url: json['fileLocation'] as String? ?? json['url'] as String?,
      localPath: json['local_path'] as String?,
      isUploaded: json['is_uploaded'] as bool? ?? true,
      uploadedAt: uploadedStr != null ? DateTime.tryParse(uploadedStr.toString()) : null,
      isRequired: json['is_required'] as bool? ?? false,
      category: json['documentCategory'] as String?,
      verificationStatus: json['verificationStatus'] as String? ?? 'PENDING',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'size': size,
        'type': type,
        'url': url,
        'local_path': localPath,
        'is_uploaded': isUploaded,
        'uploaded_at': uploadedAt?.toIso8601String(),
        'is_required': isRequired,
        'category': category,
        'verificationStatus': verificationStatus,
      };

  ProjectDocument copyWith({
    String? id,
    String? title,
    String? size,
    String? type,
    String? url,
    String? localPath,
    bool? isUploaded,
    DateTime? uploadedAt,
    bool? isRequired,
    String? category,
    String? verificationStatus,
  }) =>
      ProjectDocument(
        id: id ?? this.id,
        title: title ?? this.title,
        size: size ?? this.size,
        type: type ?? this.type,
        url: url ?? this.url,
        localPath: localPath ?? this.localPath,
        isUploaded: isUploaded ?? this.isUploaded,
        uploadedAt: uploadedAt ?? this.uploadedAt,
        isRequired: isRequired ?? this.isRequired,
        category: category ?? this.category,
        verificationStatus: verificationStatus ?? this.verificationStatus,
      );
}
