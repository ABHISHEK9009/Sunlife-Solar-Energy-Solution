import 'dart:async';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/service_ticket.dart';
import '../network/api_client.dart';
import 'notification_repository.dart';
import 'project_repository.dart';

class SupportRepository extends ChangeNotifier {
  SupportRepository._internal();
  static final SupportRepository instance = SupportRepository._internal();

  List<ServiceTicket> _tickets = [];
  bool _isLoading = false;
  String? _lastError;

  List<ServiceTicket> get tickets => List.unmodifiable(_tickets);
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  void reset() {
    _tickets = [];
    _isLoading = false;
    _lastError = null;
    notifyListeners();
  }

  Future<List<ServiceTicket>> getTickets({bool forceRefresh = false}) async {
    if (!forceRefresh && _tickets.isNotEmpty) {
      return List.unmodifiable(_tickets);
    }

    _isLoading = true;
    _lastError = null;

    try {
      final res = await ApiClient.instance.get(ApiConstants.serviceTickets);
      if (res.statusCode == 200 && res.data != null) {
        final rawList = res.data is Map && (res.data as Map).containsKey('tickets')
            ? res.data['tickets'] as List<dynamic>
            : (res.data is List ? res.data as List<dynamic> : []);

        _tickets = rawList
            .map((e) => ServiceTicket.fromJson(e as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (err) {
      _lastError = err.toString();
      // Keep real tickets; do not fabricate fake tickets
    } finally {
      _isLoading = false;
      notifyListeners();
    }

    return List.unmodifiable(_tickets);
  }

  /// Creates real support ticket on server. Awaits backend confirmation before updating UI state.
  Future<ServiceTicket> createTicket({
    required String category,
    required String description,
    String? attachmentPath,
  }) async {
    final activeProject = ProjectRepository.instance.activeProject;

    final payload = <String, dynamic>{
      'issueCategory': category,
      'description': description,
    };
    if (activeProject != null && activeProject.id.isNotEmpty) {
      payload['projectId'] = activeProject.id;
    }

    final res = await ApiClient.instance.post(
      ApiConstants.serviceTickets,
      data: payload,
    );

    if ((res.statusCode == 200 || res.statusCode == 201) &&
        res.data is Map &&
        (res.data as Map).containsKey('ticket')) {
      final newTicket = ServiceTicket.fromJson(res.data['ticket'] as Map<String, dynamic>);
      _tickets.insert(0, newTicket);

      NotificationRepository.instance.addNotification(
        title: 'Ticket #${newTicket.id} submitted',
        message: 'Your service request has been logged. Our engineering team will review it.',
        category: 'Support',
        actionRoute: 'service',
      );

      notifyListeners();
      return newTicket;
    }

    throw Exception("Server failed to create support ticket.");
  }
}
