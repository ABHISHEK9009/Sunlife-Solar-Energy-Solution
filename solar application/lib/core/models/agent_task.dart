class AgentTask {
  final String id;
  final String title;
  final String subtitle;
  final String iconType;
  final bool isCompleted;
  final String? targetId;
  final String? targetName;
  final String? targetPhone;
  final String? targetType;
  final String? priority;
  final String? dueText;

  const AgentTask({
    required this.id,
    required this.title,
    required this.subtitle,
    this.iconType = 'call',
    this.isCompleted = false,
    this.targetId,
    this.targetName,
    this.targetPhone,
    this.targetType,
    this.priority,
    this.dueText,
  });

  factory AgentTask.fromJson(Map<String, dynamic> json) {
    return AgentTask(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      iconType: json['iconType'] as String? ?? 'call',
      isCompleted: json['isCompleted'] as bool? ?? false,
      targetId: json['targetId'] as String?,
      targetName: json['targetName'] as String?,
      targetPhone: json['targetPhone'] as String?,
      targetType: json['targetType'] as String?,
      priority: json['priority'] as String?,
      dueText: json['dueText'] as String?,
    );
  }

  AgentTask copyWith({
    String? id,
    String? title,
    String? subtitle,
    String? iconType,
    bool? isCompleted,
    String? targetId,
    String? targetName,
    String? targetPhone,
    String? targetType,
    String? priority,
    String? dueText,
  }) {
    return AgentTask(
      id: id ?? this.id,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      iconType: iconType ?? this.iconType,
      isCompleted: isCompleted ?? this.isCompleted,
      targetId: targetId ?? this.targetId,
      targetName: targetName ?? this.targetName,
      targetPhone: targetPhone ?? this.targetPhone,
      targetType: targetType ?? this.targetType,
      priority: priority ?? this.priority,
      dueText: dueText ?? this.dueText,
    );
  }
}
