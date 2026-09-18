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

  factory ProjectDocument.fromJson(Map<String, dynamic> json) => ProjectDocument(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        size: json['size'] as String? ?? '1.0 MB',
        type: json['type'] as String? ?? 'pdf',
        url: json['url'] as String?,
        localPath: json['local_path'] as String?,
        isUploaded: json['is_uploaded'] as bool? ?? true,
        uploadedAt: json['uploaded_at'] != null
            ? DateTime.tryParse(json['uploaded_at'].toString())
            : null,
        isRequired: json['is_required'] as bool? ?? false,
      );

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
      );
}
