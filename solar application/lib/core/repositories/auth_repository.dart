import 'dart:async';
import '../constants/api_constants.dart';
import '../models/user_profile.dart';
import '../network/api_client.dart';
import '../storage/secure_storage_service.dart';
import 'agent_repository.dart';

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

class AuthRepository {
  AuthRepository._internal();
  static final AuthRepository instance = AuthRepository._internal();

  UserProfile? _currentUser;

  UserProfile? get currentUser => _currentUser;

  Future<OtpRequestResult> requestOtp({
    required String identifier,
    bool isAgent = false,
  }) async {
    final cleanPhone = identifier.trim().replaceAll(RegExp(r'\s+'), '');
    try {
      final endpoint =
          isAgent ? ApiConstants.agentRequestOtp : ApiConstants.customerRequestOtp;
      final payload = {'phone': cleanPhone};

      final res = await ApiClient.instance.post(endpoint, data: payload);
      if ((res.statusCode == 200 || res.statusCode == 201) && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        return OtpRequestResult(
          success: true,
          maskedEmail: data['maskedEmail'] as String?,
          message: data['message'] as String?,
        );
      }
      final errorMsg = res.data is Map && (res.data as Map)['error'] != null
          ? (res.data as Map)['error'].toString()
          : 'Unable to complete the request right now. Please try again.';
      return OtpRequestResult(success: false, error: errorMsg);
    } on ApiException catch (e) {
      return OtpRequestResult(success: false, error: e.message);
    } catch (_) {
      return const OtpRequestResult(
        success: false,
        error: 'Unable to complete the request right now. Please try again.',
      );
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
      throw ApiException('Enter a valid 6-digit OTP');
    }

    final endpoint =
        isAgent ? ApiConstants.agentVerifyOtp : ApiConstants.customerVerifyOtp;
    final payload = {'phone': cleanPhone, 'otp': cleanOtp};

    final res = await ApiClient.instance.post(endpoint, data: payload);
    if ((res.statusCode == 200 || res.statusCode == 201) && res.data is Map<String, dynamic>) {
      final data = res.data as Map<String, dynamic>;
      final access = data['accessToken'] as String? ?? data['access_token'] as String?;
      if (access == null || access.isEmpty) {
        throw ApiException('Invalid session received from server.');
      }

      ApiClient.instance.setAuthToken(access);

      final agentData = data['agent'] as Map<String, dynamic>?;
      final customerData = data['customer'] as Map<String, dynamic>?;

      final user = isAgent
          ? UserProfile(
              id: agentData?['employeeId'] as String? ?? agentData?['id'] as String? ?? cleanPhone,
              name: agentData?['name'] as String? ?? 'Field Partner',
              phone: agentData?['phone'] as String? ?? cleanPhone,
              email: agentData?['email'] as String?,
              role: 'agent',
              territory: agentData?['territory'] as String? ?? 'Jaipur Central',
              managerName: agentData?['department'] as String? ?? 'Operations',
            )
          : UserProfile(
              id: customerData?['customerId'] as String? ?? customerData?['id'] as String? ?? cleanPhone,
              name: customerData?['fullName'] as String? ?? 'Customer',
              phone: customerData?['primaryMobile'] as String? ?? cleanPhone,
              email: customerData?['email'] as String?,
              role: 'customer',
              plantId: customerData?['plantId'] as String? ?? '',
              discomConsumerNo: customerData?['discomConsumerNo'] as String? ?? '',
            );

      await SecureStorageService.saveSession(
        accessToken: access,
        refreshToken: (data['refreshToken'] as String?) ?? '',
        role: isAgent ? 'agent' : 'customer',
        userId: user.id,
        userName: user.name,
      );

      _currentUser = user;
      return user;
    }

    final errorMsg = res.data is Map && (res.data as Map)['error'] != null
        ? (res.data as Map)['error'].toString()
        : 'Incorrect OTP. Please try again.';
    throw ApiException(errorMsg);
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

    _currentUser = role == 'agent'
        ? UserProfile(
            id: userId,
            name: userName ?? 'Field Partner',
            phone: '',
            role: 'agent',
            territory: 'Jaipur Central',
          )
        : UserProfile(
            id: userId,
            name: userName ?? 'Customer',
            phone: '',
            role: 'customer',
          );

    return _currentUser;
  }

  Future<void> logout() async {
    _currentUser = null;
    ApiClient.instance.setAuthToken(null);
    await SecureStorageService.clearSession();
    AgentRepository.instance.reset();
  }
}
