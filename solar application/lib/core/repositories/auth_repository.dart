import '../errors/error_feedback.dart';
import '../errors/app_error.dart';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/solar_project.dart';
import '../models/user_profile.dart';
import '../network/api_client.dart';
import '../storage/secure_storage_service.dart';
import 'agent_repository.dart';
import 'document_repository.dart';
import 'notification_repository.dart';
import 'payment_repository.dart';
import 'project_repository.dart';
import 'subsidy_repository.dart';
import 'support_repository.dart';

Map<String, dynamic>? _toMap(dynamic raw) {
  if (raw is Map) return Map<String, dynamic>.from(raw);
  if (raw is String) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {}
  }
  return null;
}

class OtpRequestResult {
  const OtpRequestResult({
    required this.success,
    this.maskedEmail,
    this.message,
    this.error,
  });

  final bool success;
  final String? maskedEmail;
  final String? message;
  final String? error;
}

class AuthRepository extends ChangeNotifier {
  AuthRepository._internal() {
    // Register global listener for expired sessions
    ApiClient.onSessionExpired = () {
      logout();
    };
  }
  static final AuthRepository instance = AuthRepository._internal();

  UserProfile? _currentUser;
  bool _isResolvingIdentity = false;

  UserProfile? get currentUser => _currentUser;
  bool get isResolvingIdentity => _isResolvingIdentity;
  bool get isLead => _currentUser?.isLead ?? false;
  bool get isCustomer => _currentUser?.isCustomer ?? true;

  Future<OtpRequestResult> requestOtp({
    required String identifier,
    bool isAgent = false,
  }) async {
    final cleanPhone = identifier.trim().replaceAll(RegExp(r'\s+'), '');
    if (cleanPhone.isEmpty) {
      return const OtpRequestResult(
        success: false,
        error: 'Please enter a valid mobile number.',
      );
    }

    if (isAgent) {
      try {
        final endpoint = ApiConstants.agentRequestOtp;
        final payload = {'phone': cleanPhone};
        final res = await ApiClient.instance.post(endpoint, data: payload);
        final data = _toMap(res.data);
        if ((res.statusCode == 200 || res.statusCode == 201) && data != null && data['success'] == true) {
          return OtpRequestResult(
            success: true,
            maskedEmail: (data['maskedEmail'] ?? data['maskedMobile']) as String?,
            message: AppMessages.codeSent,
          );
        }
        final errorMsg = AppMessages.failure(FailureKind.unknown);
        return OtpRequestResult(success: false, error: errorMsg);
      } catch (e) {
        if (e is ApiException) {
          return OtpRequestResult(success: false, error: e.message);
        }
        return OtpRequestResult(success: false, error: ErrorMapper.message(e));
      }
    }

    // Customer OTP Request via CRM Server (Server-side WhatsApp/SMS Dispatch)
    try {
      final endpoint = ApiConstants.customerRequestOtp;
      final payload = {'phone': cleanPhone};
      final res = await ApiClient.instance.post(endpoint, data: payload);
      final data = _toMap(res.data);
      if ((res.statusCode == 200 || res.statusCode == 201) && data != null && data['success'] == true) {
        final destination = (data['maskedMobile'] ?? data['maskedDestination']) as String?;
        const message = AppMessages.codeSent;
        return OtpRequestResult(
          success: true,
          maskedEmail: destination,
          message: message,
        );
      }
      final errorMsg = AppMessages.failure(FailureKind.unknown);
      return OtpRequestResult(success: false, error: errorMsg);
    } catch (e) {
      if (e is ApiException) {
        return OtpRequestResult(success: false, error: e.message);
      }
      return OtpRequestResult(success: false, error: ErrorMapper.message(e));
    }
  }

  Future<UserProfile> verifyOtp({
    required String identifier,
    required String otp,
    bool isAgent = false,
  }) async {
    final cleanPhone = identifier.trim().replaceAll(RegExp(r'\s+'), '');
    final cleanOtp = otp.trim();

    if (cleanOtp.length != 6 || !RegExp(r'^\d{6}$').hasMatch(cleanOtp)) {
      throw const AppFailure(FailureKind.validation);
    }

    try {
      final endpoint =
          isAgent ? ApiConstants.agentVerifyOtp : ApiConstants.customerVerifyOtp;
      final payload = {'phone': cleanPhone, 'otp': cleanOtp};

      final res = await ApiClient.instance.post(endpoint, data: payload);
      final data = _toMap(res.data);
      if ((res.statusCode == 200 || res.statusCode == 201) && data != null && data['success'] == true) {
        final access = data['accessToken'] as String? ?? data['access_token'] as String?;
        if (access == null || access.isEmpty) {
          throw ApiException('Invalid session received from server.');
        }

        ApiClient.instance.setAuthToken(access);

        if (isAgent) {
          final agentData = data['agent'] is Map ? Map<String, dynamic>.from(data['agent'] as Map) : null;
          final user = UserProfile(
            id: agentData?['id'] as String? ?? agentData?['employeeId'] as String? ?? cleanPhone,
            name: agentData?['name'] as String? ?? 'Field Partner',
            phone: agentData?['phone'] as String? ?? cleanPhone,
            email: agentData?['email'] as String?,
            role: 'agent',
            territory: agentData?['territory'] as String? ?? '',
            managerName: agentData?['department'] as String? ?? 'Operations',
          );

          await SecureStorageService.saveSession(
            accessToken: access,
            refreshToken: (data['refreshToken'] as String?) ?? '',
            role: 'agent',
            userId: user.id,
            userName: user.name,
          );

          _currentUser = user;
          notifyListeners();
          return user;
        }

        // Customer or Lead Identity
        final accountState = (data['accountState'] as String? ?? 'CUSTOMER').toUpperCase();
        final userData = data['user'] is Map
            ? Map<String, dynamic>.from(data['user'] as Map)
            : (data['customer'] is Map ? Map<String, dynamic>.from(data['customer'] as Map) : null);

        final isNew = data['isNewUser'] as bool? ?? false;
        final profileComplete = data['profileComplete'] as bool? ?? true;

        final user = UserProfile(
          id: userData?['id'] as String? ?? cleanPhone,
          name: userData?['name'] as String? ?? userData?['fullName'] as String? ?? (accountState == 'LEAD' ? '' : 'Customer'),
          phone: userData?['phone'] as String? ?? userData?['primaryMobile'] as String? ?? cleanPhone,
          email: userData?['email'] as String?,
          role: 'customer',
          accountState: accountState,
          isNewUser: isNew,
          profileComplete: profileComplete,
          city: userData?['city'] as String?,
          propertyType: userData?['propertyType'] as String?,
          monthlyBill: userData?['monthlyBill'] as String?,
          leadStatus: userData?['status'] as String?,
        );

        await SecureStorageService.saveSession(
          accessToken: access,
          refreshToken: (data['refreshToken'] as String?) ?? '',
          role: 'customer',
          userId: user.id,
          userName: user.name,
          accountState: user.accountState,
          userPhone: user.phone,
          userCity: user.city,
        );

        // Populate projects if returned
        if (data['projects'] is List) {
          final rawPrjs = data['projects'] as List;
          final prjs = rawPrjs
              .map((e) => SolarProject.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
          ProjectRepository.instance.setProjects(prjs);
        }

        _currentUser = user;
        notifyListeners();
        return user;
      }

      throw const AppFailure(FailureKind.validation);
    } catch (e) {
      if (e is AppFailure) rethrow;
      throw ApiException('Unable to verify OTP. Please check your connection and try again.');
    }
  }

  /// Live State Resolution (/api/v1/me):
  /// Fetches authoritative identity, auto-upgrades Lead -> Customer seamlessly,
  /// and synchronizes multi-property project trees.
  Future<UserProfile?> fetchMe() async {
    _isResolvingIdentity = true;
    try {
      final res = await ApiClient.instance.get(ApiConstants.me);
      final data = _toMap(res.data);
      if (res.statusCode == 200 && data != null) {
        final accountState = (data['accountState'] as String? ?? 'CUSTOMER').toUpperCase();
        final userData = data['user'] as Map<String, dynamic>?;

        final isNew = data['isNewUser'] as bool? ?? false;
        final profileComplete = data['profileComplete'] as bool? ?? true;

        final advisor = data['assignedAdvisor'] as Map<String, dynamic>?;

        final updatedUser = UserProfile(
          id: userData?['id'] as String? ?? _currentUser?.id ?? '',
          name: userData?['name'] as String? ?? _currentUser?.name ?? '',
          phone: userData?['phone'] as String? ?? _currentUser?.phone ?? '',
          email: userData?['email'] as String? ?? _currentUser?.email,
          role: 'customer',
          accountState: accountState,
          isNewUser: isNew,
          profileComplete: profileComplete,
          city: userData?['city'] as String?,
          propertyType: userData?['propertyType'] as String?,
          monthlyBill: userData?['monthlyBill'] as String?,
          leadStatus: userData?['status'] as String?,
          advisorName: advisor?['name'] as String?,
          advisorPhone: advisor?['phone'] as String?,
        );

        // Synchronize projects tree for property switcher
        if (data['projects'] is List) {
          final rawPrjs = data['projects'] as List;
          final prjs = rawPrjs
              .map((e) => SolarProject.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
          ProjectRepository.instance.setProjects(prjs);
        }

        if (data.containsKey('openEnquiry')) {
          final rawEnquiry = data['openEnquiry'] is Map
              ? Map<String, dynamic>.from(data['openEnquiry'] as Map)
              : null;
          ProjectRepository.instance.setOpenEnquiry(rawEnquiry);
        }

        _currentUser = updatedUser;
        final currentAccess = await SecureStorageService.getAccessToken();
        final currentRefresh = await SecureStorageService.getRefreshToken();
        if (currentAccess != null && currentAccess.isNotEmpty) {
          await SecureStorageService.saveSession(
            accessToken: currentAccess,
            refreshToken: currentRefresh ?? '',
            role: 'customer',
            userId: updatedUser.id,
            userName: updatedUser.name,
            accountState: updatedUser.accountState,
            userPhone: updatedUser.phone,
            userCity: updatedUser.city,
          );
        }
        notifyListeners();
        return updatedUser;
      }
    } catch (err) {

    } finally {
      _isResolvingIdentity = false;
      notifyListeners();
    }
    return _currentUser;
  }

  /// Submits onboarding chunks (Chunk 1: Name + City / Chunk 2: Requirement)
  Future<bool> submitLeadEnquiryChunk(Map<String, dynamic> chunkData) async {
    try {
      final res = await ApiClient.instance.post(
        ApiConstants.leadEnquiry,
        data: chunkData,
      );

      final data = _toMap(res.data);
      if (res.statusCode == 200 && data != null) {
        final leadData = data['lead'] is Map ? Map<String, dynamic>.from(data['lead'] as Map) : null;

        if (leadData != null && _currentUser != null) {
          _currentUser = _currentUser!.copyWith(
            name: leadData['name'] as String?,
            city: leadData['city'] as String?,
            propertyType: leadData['propertyType'] as String?,
            monthlyBill: leadData['monthlyBill'] as String?,
            profileComplete: data['profileComplete'] as bool? ?? true,
          );
          notifyListeners();
        }
        return true;
      }
    } catch (err) {
      throw ErrorMapper.map(err);
    }
    throw const AppFailure(FailureKind.save);
  }

  Future<UserProfile?> loadStoredSession() async {
    final loggedIn = await SecureStorageService.isLoggedIn();
    if (!loggedIn) return null;

    final token = await SecureStorageService.getAccessToken();
    if (token != null && token.isNotEmpty) {
      ApiClient.instance.setAuthToken(token);
    }

    final role = await SecureStorageService.getUserRole() ?? 'customer';
    final userId = await SecureStorageService.getUserId() ?? '';
    final userName = await SecureStorageService.getUserName();
    final accountState = await SecureStorageService.getAccountState() ?? 'LEAD';
    final userPhone = await SecureStorageService.getUserPhone() ?? '';
    final userCity = await SecureStorageService.getUserCity();

    _currentUser = role == 'agent'
        ? UserProfile(
            id: userId,
            name: userName ?? 'Field Partner',
            phone: userPhone,
            role: 'agent',
            territory: '',
          )
        : UserProfile(
            id: userId,
            name: userName ?? '',
            phone: userPhone,
            role: 'customer',
            accountState: accountState,
            city: userCity,
          );

    notifyListeners();

    // Silently refresh current identity from backend
    if (role == 'customer') {
      fetchMe();
    }

    return _currentUser;
  }

  /// Complete logout: Purges auth tokens and resets ALL user-scoped repository caches
  Future<void> logout() async {
    _currentUser = null;
    ApiClient.instance.setAuthToken(null);
    await SecureStorageService.clearSession();

    // Purge all customer and agent state to ensure absolute account isolation
    ProjectRepository.instance.reset();
    PaymentRepository.instance.reset();
    DocumentRepository.instance.reset();
    SubsidyRepository.instance.reset();
    NotificationRepository.instance.reset();
    SupportRepository.instance.reset();
    AgentRepository.instance.reset();
    notifyListeners();
  }
}
