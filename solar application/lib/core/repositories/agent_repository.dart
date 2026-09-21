import 'dart:async';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/agent_lead.dart';
import '../models/agent_task.dart';
import '../models/field_visit.dart';
import '../network/api_client.dart';
import 'auth_repository.dart';

class AgentRepository extends ChangeNotifier {
  AgentRepository._internal();
  static final AgentRepository instance = AgentRepository._internal();

  List<AgentLead> _leads = [];
  List<FieldVisit> _visits = [];
  List<AgentTask> _tasks = [];
  bool _hasFetchedLeads = false;
  bool _hasFetchedVisits = false;
  bool _hasFetchedTasks = false;

  final Set<int> _completedTaskIndices = {};

  List<AgentLead> get currentLeads => List.unmodifiable(_leads);
  List<FieldVisit> get currentVisits => List.unmodifiable(_visits);
  List<AgentTask> get currentTasks => List.unmodifiable(_tasks);

  void reset() {
    _leads = [];
    _visits = [];
    _tasks = [];
    _hasFetchedLeads = false;
    _hasFetchedVisits = false;
    _hasFetchedTasks = false;
    _completedTaskIndices.clear();
    notifyListeners();
  }

  Future<List<AgentLead>> getAssignedLeads({bool forceRefresh = false}) async {
    if (!forceRefresh && _hasFetchedLeads && _leads.isNotEmpty) {
      return List.unmodifiable(_leads);
    }

    try {
      final res = await ApiClient.instance.get(ApiConstants.agentLeads);
      if (res.statusCode == 200 && res.data != null) {
        final rawList = res.data is Map && (res.data as Map).containsKey('leads')
            ? res.data['leads'] as List<dynamic>
            : (res.data is List ? res.data as List<dynamic> : []);

        _leads = rawList
            .map((e) => AgentLead.fromJson(e as Map<String, dynamic>))
            .toList();
        _hasFetchedLeads = true;
        notifyListeners();
      }
    } catch (_) {
      // Retain confirmed list
    }

    return List.unmodifiable(_leads);
  }

  /// Adds new lead. Awaits real server confirmation; never fabricates local mock success.
  Future<AgentLead> addLead({
    required String name,
    required String phone,
    required String location,
    String? city,
    String? district,
    String? leadSource,
    String? requirementType,
    String? solarRequirement,
    String? approxCapacity,
    String? assignedAgent,
    String? leadStatus,
    DateTime? nextFollowUpDate,
    String? monthlyBill,
    String? notes,
  }) async {
    final payload = <String, dynamic>{
      'name': name.trim(),
      'phone': phone.trim(),
      'location': location.trim(),
      'leadSource': leadSource ?? 'Field Partner Visit',
      'propertyType': requirementType ?? 'Residential',
      'solarRequirement': solarRequirement ?? 'On-Grid',
      'approxCapacity': approxCapacity ?? '5 kW',
      'status': leadStatus ?? 'NEW',
      'monthlyBill': monthlyBill ?? '5000',
      'notes': notes,
    };
    if (city != null) payload['city'] = city;
    if (district != null) payload['district'] = district;
    if (assignedAgent != null) payload['assignedAgent'] = assignedAgent;
    if (nextFollowUpDate != null) {
      payload['nextFollowUpDate'] = nextFollowUpDate.toIso8601String();
    }

    final res = await ApiClient.instance.post(ApiConstants.agentLeads, data: payload);
    if (res.statusCode == 200 || res.statusCode == 201) {
      final leadData = res.data is Map && (res.data as Map).containsKey('lead')
          ? res.data['lead']
          : res.data;
      final lead = AgentLead.fromJson(Map<String, dynamic>.from(leadData as Map));
      _leads.insert(0, lead);
      notifyListeners();
      return lead;
    }

    throw Exception("Failed to save lead to CRM. Server rejected the request.");
  }

  /// Updates lead stage with rollback on failure.
  Future<void> updateLeadStage(String leadId, String newStage) async {
    final index = _leads.indexWhere((l) => l.id == leadId || l.name == leadId);
    if (index == -1) return;

    final targetLead = _leads[index];
    final originalStage = targetLead.stage;

    // Optimistic local update
    _leads[index] = targetLead.copyWith(stage: newStage);
    notifyListeners();

    try {
      final res = await ApiClient.instance.dio.patch(
        '${ApiConstants.agentLeads}/${targetLead.id}',
        data: {'stage': newStage},
      );
      if (res.statusCode != 200) {
        throw Exception("Server returned ${res.statusCode}");
      }
    } catch (err) {
      // Roll back on failure
      _leads[index] = targetLead.copyWith(stage: originalStage);
      notifyListeners();
      throw Exception("Could not update lead status: ${err.toString()}");
    }
  }

  Future<List<FieldVisit>> getTodayVisits({bool forceRefresh = false}) async {
    if (!forceRefresh && _hasFetchedVisits && _visits.isNotEmpty) {
      return List.unmodifiable(_visits);
    }

    try {
      final res = await ApiClient.instance.get(ApiConstants.agentVisits);
      if (res.statusCode == 200 && res.data != null) {
        final rawList = res.data is Map && (res.data as Map).containsKey('visits')
            ? res.data['visits'] as List<dynamic>
            : (res.data is List ? res.data as List<dynamic> : []);

        _visits = rawList
            .map((e) => FieldVisit.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        _hasFetchedVisits = true;
        notifyListeners();
      }
    } catch (_) {
      // Retain confirmed list
    }

    return List.unmodifiable(_visits);
  }

  Future<FieldVisit?> getVisitForCustomer(String customerName) async {
    final visits = await getTodayVisits();
    final match = visits.where(
      (v) => v.customerName.toLowerCase() == customerName.toLowerCase(),
    );
    return match.isNotEmpty ? match.first : null;
  }

  Future<void> updateVisitChecklist(
    String customerName,
    int index,
    bool value,
  ) async {
    final i = _visits.indexWhere(
      (v) => v.customerName.toLowerCase() == customerName.toLowerCase(),
    );
    if (i != -1) {
      final updatedList = List<bool>.from(_visits[i].checklist);
      if (index < updatedList.length) {
        updatedList[index] = value;
        _visits[i] = _visits[i].copyWith(checklist: updatedList);
        notifyListeners();
      }
    }
  }

  /// Completes a visit with real server persistence and error rollback.
  Future<void> completeVisit(
    String visitIdOrCustomerName, {
    double? latitude,
    double? longitude,
    List<String>? photoPaths,
  }) async {
    final i = _visits.indexWhere(
      (v) => v.id == visitIdOrCustomerName || v.customerName.toLowerCase() == visitIdOrCustomerName.toLowerCase(),
    );
    if (i == -1) throw Exception("Visit record not found.");

    final visit = _visits[i];
    final originalCompleted = visit.isCompleted;

    // Optimistic UI
    _visits[i] = visit.copyWith(
      isCompleted: true,
      latitude: latitude ?? visit.latitude,
      longitude: longitude ?? visit.longitude,
      photoPaths: photoPaths ?? visit.photoPaths,
    );
    notifyListeners();

    try {
      final res = await ApiClient.instance.post(
        '${ApiConstants.agentVisits}/${visit.id}/complete',
        data: {
          'latitude': latitude,
          'longitude': longitude,
          'photoPaths': photoPaths,
        },
      );
      if (res.statusCode != 200 && res.statusCode != 201) {
        throw Exception("Server returned ${res.statusCode}");
      }
    } catch (err) {
      // Roll back
      _visits[i] = visit.copyWith(isCompleted: originalCompleted);
      notifyListeners();
      throw Exception("Failed to complete visit on server: ${err.toString()}");
    }
  }

  Set<int> get completedTaskIndices => Set.unmodifiable(_completedTaskIndices);

  void toggleTask(int index) {
    if (_completedTaskIndices.contains(index)) {
      _completedTaskIndices.remove(index);
    } else {
      _completedTaskIndices.add(index);
    }
    notifyListeners();
  }

  Future<List<AgentTask>> getTasks({bool forceRefresh = false}) async {
    if (!forceRefresh && _hasFetchedTasks && _tasks.isNotEmpty) {
      return List.unmodifiable(_tasks);
    }

    try {
      final res = await ApiClient.instance.get(ApiConstants.agentTasks);
      if (res.statusCode == 200 && res.data != null) {
        final rawList = res.data is Map && (res.data as Map).containsKey('tasks')
            ? res.data['tasks'] as List<dynamic>
            : (res.data is List ? res.data as List<dynamic> : []);

        _tasks = rawList
            .map((e) => AgentTask.fromJson(e as Map<String, dynamic>))
            .toList();
        _hasFetchedTasks = true;
        notifyListeners();
        return List.unmodifiable(_tasks);
      }
    } catch (_) {
      // Keep real fetched list
    }

    return List.unmodifiable(_tasks);
  }

  Future<void> toggleTaskCompletion(String taskId) async {
    final index = _tasks.indexWhere((t) => t.id == taskId);
    if (index != -1) {
      final current = _tasks[index];
      final newStatus = !current.isCompleted;
      _tasks[index] = current.copyWith(isCompleted: newStatus);
      notifyListeners();

      try {
        await ApiClient.instance.patch(
          ApiConstants.agentTasks,
          data: {
            'taskId': taskId,
            'isCompleted': newStatus,
          },
        );
      } catch (_) {
        // Rollback
        _tasks[index] = current;
        notifyListeners();
      }
    }
  }

  /// Enrolls client directly into CRM via /api/v1/agent/enroll-client
  Future<Map<String, dynamic>> enrollClient({
    required String fullName,
    required String primaryMobile,
    required String installationAddress,
    String? alternateMobile,
    String? email,
    String propertyType = "RESIDENTIAL",
    String monthlyBill = "5000",
    double capacityKw = 5.0,
    String? notes,
  }) async {
    final res = await ApiClient.instance.post(
      '/api/v1/agent/enroll-client',
      data: {
        'fullName': fullName.trim(),
        'primaryMobile': primaryMobile.trim(),
        'installationAddress': installationAddress.trim(),
        'alternateMobile': alternateMobile?.trim(),
        'email': email?.trim(),
        'propertyType': propertyType,
        'monthlyBill': monthlyBill,
        'capacityKw': capacityKw,
        'notes': notes?.trim(),
      },
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      final data = res.data is Map ? Map<String, dynamic>.from(res.data as Map) : <String, dynamic>{};
      await getAssignedLeads(forceRefresh: true);
      return data;
    }

    throw Exception(
      res.data is Map && (res.data as Map).containsKey('error')
          ? res.data['error'].toString()
          : "Failed to enroll client.",
    );
  }

  /// Punches attendance in/out via /api/attendance
  Future<Map<String, dynamic>> punchAttendance({
    required String action, // "punch-in" or "punch-out"
    double? latitude,
    double? longitude,
  }) async {
    final user = AuthRepository.instance.currentUser;
    if (user == null || user.id.isEmpty) {
      throw Exception("Agent must be logged in to record attendance.");
    }

    final res = await ApiClient.instance.post(
      '/api/attendance',
      data: {
        'memberId': user.id,
        'action': action,
        'latitude': latitude,
        'longitude': longitude,
      },
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return res.data is Map ? Map<String, dynamic>.from(res.data as Map) : <String, dynamic>{};
    }

    throw Exception(
      res.data is Map && (res.data as Map).containsKey('error')
          ? res.data['error'].toString()
          : "Failed to record attendance.",
    );
  }
}
