import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/project_document.dart';
import '../network/api_client.dart';
import 'notification_repository.dart';

class DocumentRepository extends ChangeNotifier {
  DocumentRepository._internal();
  static final DocumentRepository instance = DocumentRepository._internal();

  final List<ProjectDocument> _documents = [
    const ProjectDocument(
      id: 'doc_1',
      title: 'Installation certificate',
      size: '1.2 MB',
      type: 'pdf',
      isUploaded: true,
    ),
    const ProjectDocument(
      id: 'doc_2',
      title: 'Tax invoice',
      size: '840 KB',
      type: 'pdf',
      isUploaded: true,
    ),
    const ProjectDocument(
      id: 'doc_3',
      title: 'Approved quotation',
      size: '2.1 MB',
      type: 'pdf',
      isUploaded: true,
    ),
    const ProjectDocument(
      id: 'doc_4',
      title: 'Site survey report',
      size: '3.4 MB',
      type: 'pdf',
      isUploaded: true,
    ),
    const ProjectDocument(
      id: 'doc_5',
      title: 'Panel warranty',
      size: '920 KB',
      type: 'pdf',
      isUploaded: true,
    ),
    const ProjectDocument(
      id: 'doc_6',
      title: 'Inverter warranty',
      size: '760 KB',
      type: 'pdf',
      isUploaded: true,
    ),
  ];

  ProjectDocument? _requiredCheque = const ProjectDocument(
    id: 'req_cheque',
    title: 'Cancelled cheque',
    size: '',
    type: 'pdf',
    isUploaded: false,
    isRequired: true,
  );

  ProjectDocument? get requiredCheque => _requiredCheque;

  Future<List<ProjectDocument>> getDocuments() async {
    try {
      final res = await ApiClient.instance.get('/projects/SS-2026-00452/documents');
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List)
            .map((e) => ProjectDocument.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      // Local cache fallback
    }
    return List.unmodifiable(_documents);
  }

  Future<ProjectDocument> uploadDocument({
    required String title,
    required String filePath,
    required String fileSize,
  }) async {
    final newDoc = ProjectDocument(
      id: 'doc_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      size: fileSize,
      type: filePath.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
      localPath: filePath,
      isUploaded: true,
      uploadedAt: DateTime.now(),
    );

    if (title.toLowerCase().contains('cheque')) {
      _requiredCheque = newDoc;
    }

    _documents.insert(0, newDoc);

    NotificationRepository.instance.addNotification(
      title: '$title uploaded',
      message: 'Your document was received and queued for review.',
      category: 'Documents',
      actionRoute: 'documents',
    );

    notifyListeners();
    return newDoc;
  }
}

