import 'dart:async';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/agent_lead.dart';
import '../models/field_visit.dart';
import '../network/api_client.dart';

class AgentRepository extends ChangeNotifier {
  AgentRepository._internal();
  static final AgentRepository instance = AgentRepository._internal();

  List<AgentLead> _leads = [];
  List<FieldVisit> _visits = [];
  bool _hasFetchedLeads = false;
  bool _hasFetchedVisits = false;

  final Set<int> _completedTaskIndices = {};

  List<AgentLead> get currentLeads => List.unmodifiable(_leads);
  List<FieldVisit> get currentVisits => List.unmodifiable(_visits);

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
      // Keep real fetched list
    }

    return List.unmodifiable(_leads);
  }

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
      'name': name,
      'phone': phone,
      'location': location,
      'leadSource': leadSource ?? 'Field Visit',
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

    try {
      final res = await ApiClient.instance.post(
        ApiConstants.agentLeads,
        data: payload,
      );

      if ((res.statusCode == 200 || res.statusCode == 201) &&
          res.data is Map &&
          (res.data as Map).containsKey('lead')) {
        final savedLead = AgentLead.fromJson(res.data['lead'] as Map<String, dynamic>);
        _leads.insert(0, savedLead);
        notifyListeners();
        return savedLead;
      }
    } catch (_) {
      // Fallback
    }

    final fallbackLead = AgentLead(
      id: 'lead_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      phone: phone,
      location: location,
      city: city,
      district: district,
      stage: leadStatus ?? 'New lead',
      monthlyBill: monthlyBill != null ? '₹$monthlyBill/month' : '₹5,000/month',
      propertyType: requirementType ?? 'Residential',
      solarRequirement: solarRequirement ?? 'On-Grid',
      approxCapacity: approxCapacity ?? '5 kW',
      preferredSystem: '${approxCapacity ?? "5 kW"} ${solarRequirement ?? "On-Grid"}',
      leadSource: leadSource ?? 'Field Visit',
      assignedAgent: assignedAgent,
      nextFollowUpDate: nextFollowUpDate,
      notes: notes,
      createdAt: DateTime.now(),
    );
    _leads.insert(0, fallbackLead);
    notifyListeners();
    return fallbackLead;
  }

  Future<void> updateLeadStage(String leadId, String newStage) async {
    final index = _leads.indexWhere((l) => l.id == leadId || l.name == leadId);
    if (index != -1) {
      final targetLead = _leads[index];
      _leads[index] = targetLead.copyWith(stage: newStage);
      notifyListeners();

      try {
        await ApiClient.instance.patch(
          '${ApiConstants.agentLeads}/${targetLead.id}',
          data: {'stage': newStage},
        );
      } catch (_) {}
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
            .map((e) => FieldVisit.fromJson(e as Map<String, dynamic>))
            .toList();
        _hasFetchedVisits = true;
        notifyListeners();
      }
    } catch (_) {
      // Keep real fetched visits
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

  Future<void> completeVisit(
    String customerName, {
    double? latitude,
    double? longitude,
    List<String>? photoPaths,
  }) async {
    final i = _visits.indexWhere(
      (v) => v.customerName.toLowerCase() == customerName.toLowerCase(),
    );
    if (i != -1) {
      final visit = _visits[i];
      _visits[i] = visit.copyWith(
        isCompleted: true,
        latitude: latitude ?? visit.latitude,
        longitude: longitude ?? visit.longitude,
        photoPaths: photoPaths ?? visit.photoPaths,
      );
      notifyListeners();

      try {
        await ApiClient.instance.post(
          '${ApiConstants.agentVisits}/${visit.id}/complete',
          data: {
            'latitude': latitude,
            'longitude': longitude,
            'photoPaths': photoPaths,
          },
        );
      } catch (_) {}
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
}
