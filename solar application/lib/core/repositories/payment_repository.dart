import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/payment_record.dart';
import '../network/api_client.dart';
import 'project_repository.dart';

class PaymentRepository extends ChangeNotifier {
  PaymentRepository._internal();
  static final PaymentRepository instance = PaymentRepository._internal();

  PaymentSummary _summary = PaymentSummary.empty();
  bool _isLoading = false;
  String? _lastError;

  PaymentSummary get currentSummary => _summary;
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  void reset() {
    _summary = PaymentSummary.empty();
    _isLoading = false;
    _lastError = null;
    notifyListeners();
  }

  Future<PaymentSummary> getPaymentSummary({bool forceRefresh = false}) async {
    if (!forceRefresh && _summary.history.isNotEmpty) {
      return _summary;
    }

    // Resolve real project ID from ProjectRepository
    final activeProject = ProjectRepository.instance.activeProject ??
        await ProjectRepository.instance.getCurrentProject();

    if (activeProject == null || activeProject.id.isEmpty) {
      _summary = PaymentSummary.empty();
      notifyListeners();
      return _summary;
    }

    _isLoading = true;
    _lastError = null;

    try {
      final res = await ApiClient.instance.get('/projects/${activeProject.id}/payments');
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        _summary = PaymentSummary.fromJson(res.data as Map<String, dynamic>);
      }
    } catch (err) {
      _lastError = err.toString();
      // Keep existing confirmed summary if available, do not synthesize fake payments
    } finally {
      _isLoading = false;
      notifyListeners();
    }

    return _summary;
  }

  /// Online payment processor. Requires server-side gateway order creation & verification.
  /// Never mutates local balances optimistically without confirmed transaction.
  Future<bool> processPayment({
    required int amount,
    required String method,
  }) async {
    final activeProject = ProjectRepository.instance.activeProject;
    if (activeProject == null || activeProject.id.isEmpty) {
      throw Exception("No active project found to process payment.");
    }

    if (amount <= 0) {
      throw Exception("Please enter a valid payment amount.");
    }

    // In production without live PG credentials configured:
    // Safely reject client-side synthetic completion with honest explanation
    throw Exception(
      "Online payment gateway integration is currently in verification mode. "
      "Please complete payments directly via Bank Transfer / NEFT / RTGS to Sunlife Solar Energy Solution accounts."
    );
  }
}
