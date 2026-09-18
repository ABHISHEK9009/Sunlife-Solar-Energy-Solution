import 'dart:async';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/service_ticket.dart';
import '../network/api_client.dart';
import 'notification_repository.dart';

class SupportRepository extends ChangeNotifier {
  SupportRepository._internal();
  static final SupportRepository instance = SupportRepository._internal();

  List<ServiceTicket> _tickets = [];
  bool _hasFetched = false;

  Future<List<ServiceTicket>> getTickets({bool forceRefresh = false}) async {
    if (!forceRefresh && _hasFetched && _tickets.isNotEmpty) {
      return List.unmodifiable(_tickets);
    }

    try {
      final res = await ApiClient.instance.get(ApiConstants.serviceTickets);
      if (res.statusCode == 200 && res.data != null) {
        final rawList = res.data is Map && (res.data as Map).containsKey('tickets')
            ? res.data['tickets'] as List<dynamic>
            : (res.data is List ? res.data as List<dynamic> : []);

        _tickets = rawList
            .map((e) => ServiceTicket.fromJson(e as Map<String, dynamic>))
            .toList();
        _hasFetched = true;
        notifyListeners();
        return List.unmodifiable(_tickets);
      }
    } catch (_) {
      // Fallback
    }

    if (_tickets.isEmpty) {
      _tickets = [
        ServiceTicket(
          id: 'SS2842',
          category: 'Subsidy document verification',
          description: 'Submitted cancelled cheque for subsidy processing approval.',
          status: 'UNDER REVIEW',
          createdAt: DateTime.now().subtract(const Duration(hours: 18)),
          advisorName: 'Neha Verma',
          expectedResponse: 'Within 1 working day',
        ),
      ];
      _hasFetched = true;
    }

    return List.unmodifiable(_tickets);
  }

  Future<ServiceTicket> createTicket({
    required String category,
    required String description,
    String? attachmentPath,
  }) async {
    try {
      final res = await ApiClient.instance.post(
        ApiConstants.serviceTickets,
        data: {
          'issueCategory': category,
          'description': description,
        },
      );

      if ((res.statusCode == 200 || res.statusCode == 201) &&
          res.data is Map &&
          (res.data as Map).containsKey('ticket')) {
        final newTicket = ServiceTicket.fromJson(res.data['ticket'] as Map<String, dynamic>);
        _tickets.insert(0, newTicket);

        NotificationRepository.instance.addNotification(
          title: 'Ticket #${newTicket.id} created',
          message: 'Query regarding "$category" submitted. Our advisor will respond soon.',
          category: 'Support',
          actionRoute: 'service',
        );

        notifyListeners();
        return newTicket;
      }
    } catch (_) {
      // Fallback
    }

    final newTicket = ServiceTicket(
      id: 'SS${2900 + _tickets.length + 1}',
      category: category,
      description: description,
      status: 'SUBMITTED',
      createdAt: DateTime.now(),
      attachmentPath: attachmentPath,
    );

    _tickets.insert(0, newTicket);

    NotificationRepository.instance.addNotification(
      title: 'Ticket #${newTicket.id} created',
      message: 'Query regarding "$category" submitted. Our advisor will respond soon.',
      category: 'Support',
      actionRoute: 'service',
    );

    notifyListeners();
    return newTicket;
  }
}
