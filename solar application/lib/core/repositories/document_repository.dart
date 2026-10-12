import '../errors/app_error.dart';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/project_document.dart';
import '../network/api_client.dart';
import 'notification_repository.dart';
import 'project_repository.dart';

class DocumentRepository extends ChangeNotifier {
  DocumentRepository._internal();
  static final DocumentRepository instance = DocumentRepository._internal();

  List<ProjectDocument> _documents = [];
  bool _isLoading = false;
  String? _lastError;

  List<ProjectDocument> get documents => List.unmodifiable(_documents);
  List<ProjectDocument> get currentDocuments => documents;
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  ProjectDocument? get requiredCheque {
    try {
      return _documents.firstWhere(
        (d) => (d.category ?? d.title).toLowerCase().contains('cheque'),
      );
    } catch (_) {
      return null;
    }
  }

  bool _hasFetched = false;

  void reset() {
    _documents = [];
    _hasFetched = false;
    _isLoading = false;
    _lastError = null;
    notifyListeners();
  }

  Future<List<ProjectDocument>> getDocuments({bool forceRefresh = false}) async {
    if (!forceRefresh && _hasFetched) {
      return List.unmodifiable(_documents);
    }

    final activeProject = ProjectRepository.instance.activeProject ??
        await ProjectRepository.instance.getCurrentProject();

    _lastError = ProjectRepository.instance.lastError;
    if (activeProject == null || activeProject.id.isEmpty) {
      _documents = [];
      _hasFetched = _lastError == null;
      notifyListeners();
      return _documents;
    }

    _isLoading = true;
    _lastError = null;

    try {
      final res = await ApiClient.instance.get('/projects/${activeProject.id}/documents');
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        final rawList = data['documents'] as List<dynamic>? ?? [];
        _documents = rawList
            .map((e) => ProjectDocument.fromJson(e as Map<String, dynamic>))
            .toList();
      } else if (res.statusCode == 200 && res.data is List) {
        _documents = (res.data as List)
            .map((e) => ProjectDocument.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (err) {
      _lastError = ErrorMapper.message(err);
      // Keep existing real records on network failure; do not synthesize fake documents
    } finally {
      _hasFetched = _lastError == null;
      _isLoading = false;
      notifyListeners();
    }

    return List.unmodifiable(_documents);
  }

  /// Real multipart file upload to backend. Awaits server confirmation before updating state.
  Future<ProjectDocument> uploadDocument({
    required String title,
    required String filePath,
    Uint8List? fileBytes,
    String fileSize = '100 KB',
    String category = 'CUSTOMER_KYC',
  }) async {
    final activeProject = ProjectRepository.instance.activeProject ??
        await ProjectRepository.instance.getCurrentProject();

    _lastError = ProjectRepository.instance.lastError;
    if (activeProject == null || activeProject.id.isEmpty) {
      throw Exception("No active project found for document attachment.");
    }

    final fileName = filePath.split(RegExp(r'[\\/]')).last;

    FormData formData;
    try {
      final multipart = fileBytes != null
          ? MultipartFile.fromBytes(fileBytes, filename: fileName)
          : await MultipartFile.fromFile(filePath, filename: fileName);
      formData = FormData.fromMap({
        'file': multipart,
        'documentCategory': category,
        'documentName': title,
        'projectId': activeProject.id,
      });
    } catch (_) {
      throw const AppFailure(FailureKind.upload);
    }

    final res = await ApiClient.instance.post(
      '/projects/${activeProject.id}/documents',
      data: formData,
    );

    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception("Server failed to register document upload.");
    }

    final resData = res.data is Map<String, dynamic> ? res.data as Map<String, dynamic> : {};
    if (resData['document'] is! Map<String, dynamic> ||
        (resData['document']['id'] as String? ?? '').isEmpty) {
      throw const AppFailure(FailureKind.upload);
    }
    final docData = resData['document'] as Map<String, dynamic>;

    final savedDoc = ProjectDocument.fromJson(docData);
    _documents.insert(0, savedDoc);

    NotificationRepository.instance.addNotification(
      title: '$title uploaded',
      message: 'Your document was received and queued for review.',
      category: 'Documents',
      actionRoute: 'documents',
    );

    notifyListeners();
    return savedDoc;
  }
}
