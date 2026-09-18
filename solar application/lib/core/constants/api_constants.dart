import 'package:flutter/foundation.dart';

class ApiConstants {
  static const String domain = 'sunlifesolar.in';
  static const String websiteUrl = 'https://sunlifesolar.in';

  // Dynamic baseURL:
  // If explicitly overridden via --dart-define=API_URL=...
  // Else for web/desktop: http://localhost:3000/api/v1
  // Else for Android Emulator: http://10.0.2.2:3000/api/v1
  static String get baseUrl {
    const customUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (customUrl.isNotEmpty) return customUrl;
    if (kIsWeb) return 'http://localhost:3000/api/v1';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'https://sunlifesolar.in/api/v1';
    }
    return 'http://localhost:3000/api/v1';
  }

  // Support & Contact
  static const String supportEmail = 'support@sunlifesolar.in';
  static const String supportPhone = '+917722995100';
  static const String whatsappPhone = '917722995100';

  // Legal
  static const String privacyPolicyUrl = 'https://sunlifesolar.in/privacy-policy';
  static const String termsOfServiceUrl = 'https://sunlifesolar.in/terms';

  // Authentication Endpoints
  static const String customerRequestOtp = '/auth/otp/send';
  static const String customerVerifyOtp = '/auth/otp/verify';
  static const String agentRequestOtp = '/auth/agent/login';
  static const String agentVerifyOtp = '/auth/agent/verify';

  // Customer Project Endpoints
  static const String customerProjects = '/customer/projects';
  static const String projectDetail = '/projects'; // /projects/{id}
  static const String serviceTickets = '/tickets';

  // Agent Operations Endpoints
  static const String agentLeads = '/agent/leads';
  static const String agentVisits = '/agent/visits';
}
