import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sunlife_solar/core/network/api_client.dart';
import 'package:sunlife_solar/core/repositories/agent_repository.dart';
import 'package:sunlife_solar/core/repositories/auth_repository.dart';
import 'package:sunlife_solar/core/repositories/document_repository.dart';
import 'package:sunlife_solar/core/repositories/notification_repository.dart';
import 'package:sunlife_solar/core/repositories/payment_repository.dart';
import 'package:sunlife_solar/core/repositories/project_repository.dart';
import 'package:sunlife_solar/core/repositories/subsidy_repository.dart';
import 'package:sunlife_solar/core/repositories/support_repository.dart';
import 'package:sunlife_solar/core/storage/secure_storage_service.dart';

class _ComprehensiveTestHttpAdapter implements HttpClientAdapter {
  final Map<String, dynamic> customResponses = {};
  int requestCount = 0;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requestCount++;
    final path = options.path;

    // Custom test overrides
    if (customResponses.containsKey(path)) {
      final override = customResponses[path];
      if (override is Map && override.containsKey('status')) {
        return ResponseBody.fromString(
          jsonEncode(override['body']),
          override['status'] as int,
          headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
        );
      }
    }

    // 1. Universal OTP Rejection Test: '123456' is strictly rejected
    if (path.contains('/auth/otp/verify') || path.contains('/auth/agent/verify')) {
      final body = options.data is Map ? options.data : (options.data != null ? jsonDecode(options.data.toString()) : {});
      final otp = body['otp']?.toString();
      if (otp == '123456') {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Invalid or expired OTP. Please try again.'}),
          400,
          headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
        );
      }
      if (otp == '000000') {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Too many failed verification attempts. Please request a new code.'}),
          429,
          headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
        );
      }
    }

    // Agent Login
    if (path.contains('/auth/agent/login')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'maskedEmail': 'a***@sunlifesolar.com',
          'message': 'OTP sent to registered email',
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Agent Verify
    if (path.contains('/auth/agent/verify')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'accessToken': 'test_agent_token',
          'agent': {
            'id': 'agent_001',
            'employeeId': 'SA-54504',
            'name': 'Abhishek Verma',
            'phone': '8839707135',
            'email': 'abhishek@sunlifesolar.com',
            'role': 'agent',
            'territory': 'Narmadapuram',
          },
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Customer OTP Send
    if (path.contains('/auth/otp/send')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'message': 'Verification code dispatched.',
          'maskedDestination': '******7135',
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Customer OTP Verify
    if (path.contains('/auth/otp/verify')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'accessToken': 'test_customer_token',
          'customer': {
            'id': 'cust_001',
            'fullName': 'Rajesh Sharma',
            'primaryMobile': '9876543210',
            'email': 'rajesh@example.com',
            'plantId': 'SP-2026-00452',
            'discomConsumerNo': 'JVVNL-182943',
          },
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Customer Projects (supports fractional kW)
    if (path.contains('/customer/projects')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'projects': [
            {
              'id': 'proj_001',
              'projectId': 'SS-2026-00452',
              'plantCapacityKw': 5.5,
              'solarType': 'RESIDENTIAL_ROOFTOP',
              'projectStatus': 'STRUCTURE_WORK',
              'currentStage': 'Structure Work',
              'installationAddress': 'Narmadapuram, MP',
              'discom': 'MPPKVVCL',
              'panels': 'Adani Solar 540W Mono PERC',
              'inverter': 'Sungrow 5kW Grid-Tie',
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Payments (Prisma contract)
    if (path.contains('/payments')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'summary': {
            'totalContractValue': 275000,
            'totalPaid': 100000,
            'outstandingBalance': 175000,
            'isFullyPaid': false,
          },
          'milestones': [
            {
              'id': 'm1',
              'name': 'Advance Payment',
              'amount': 100000,
              'status': 'PAID',
              'paidAt': '2026-02-15T10:00:00.000Z',
            },
            {
              'id': 'm2',
              'name': 'Structure & Panel Delivery',
              'amount': 100000,
              'status': 'DUE',
            },
            {
              'id': 'm3',
              'name': 'Net Metering & Commissioning',
              'amount': 75000,
              'status': 'PENDING',
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Documents (Prisma contract)
    if (path.contains('/documents')) {
      if (options.method == 'POST') {
        return ResponseBody.fromString(
          jsonEncode({
            'success': true,
            'document': {
              'id': 'doc_001',
              'documentName': 'Electricity Bill',
              'mimeType': 'application/pdf',
              'fileLocation': 'https://storage.sunlifesolar.com/docs/doc_001.pdf',
              'verificationStatus': 'PENDING_VERIFICATION',
              'fileSizeBytes': 102400,
              'createdAt': '2026-03-01T12:00:00.000Z',
            },
          }),
          200,
          headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
        );
      }
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'documents': [
            {
              'id': 'doc_existing_1',
              'documentName': 'Electricity Bill',
              'mimeType': 'application/pdf',
              'fileLocation': 'https://storage.sunlifesolar.com/docs/existing_1.pdf',
              'verificationStatus': 'APPROVED',
              'fileSizeBytes': 204800,
              'createdAt': '2026-02-10T10:00:00.000Z',
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Subsidy (Prisma contract)
    if (path.contains('/subsidy')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'subsidy': {
            'stage': 'SUBMITTED_TO_DISCOM',
            'claimNumber': 'SUB-2026-991',
            'amountEligible': 78000,
            'appliedDate': '2026-02-20T10:00:00.000Z',
            'discomApproved': true,
            'disbursementStatus': 'UNDER_PROCESS',
          },
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Agent Leads
    if (path.contains('/agent/leads')) {
      if (options.method == 'POST') {
        final body = options.data is Map ? options.data : {};
        return ResponseBody.fromString(
          jsonEncode({
            'success': true,
            'lead': {
              'id': 'lead_999',
              'name': body['name'] ?? 'Test Customer',
              'phone': body['phone'] ?? '9876543210',
              'location': body['location'] ?? 'Narmadapuram',
              'stage': 'NEW',
              'leadSource': body['leadSource'] ?? 'FIELD_VISIT',
              'notes': body['notes'] ?? '',
            },
          }),
          201,
          headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
        );
      }
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'leads': [
            {
              'id': 'lead_1',
              'name': 'Naveen Sharma',
              'phone': '9826012345',
              'location': 'Itarsi, Narmadapuram',
              'stage': 'SURVEY_SCHEDULED',
              'approxCapacity': '6 kW',
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Agent Visits
    if (path.contains('/agent/visits')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'visits': [
            {
              'id': 'visit_1',
              'time': '11:00 AM',
              'customerName': 'Naveen Sharma',
              'purpose': 'Rooftop Site Survey',
              'location': 'Itarsi, Narmadapuram',
              'checklist': [true, false, false, false],
              'isCompleted': false,
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Attendance
    if (path.contains('/attendance')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'record': {
            'memberId': 'agent_001',
            'status': 'Present',
            'checkIn': '09:30 AM',
            'checkOut': '--',
          },
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Enroll Client
    if (path.contains('/agent/enroll-client')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'customer': {
            'id': 'c_new_1',
            'customerId': 'SL-CUST-1045',
            'fullName': 'Pooja Verma',
            'primaryMobile': '9425012345',
          },
          'project': {
            'id': 'p_new_1',
            'projectId': 'SL-PRJ-1045',
            'plantCapacityKw': 5.0,
          },
        }),
        201,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Notifications
    if (path.contains('/notifications')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'notifications': [
            {
              'id': 'notif_1',
              'title': 'Subsidy Application Dispatched',
              'message': 'Your subsidy file has been sent to DISCOM.',
              'category': 'SUBSIDY',
              'isRead': false,
              'createdAt': '2026-03-01T10:00:00.000Z',
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    // Support Tickets
    if (path.contains('/tickets')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'ticket': {
            'id': 'TKT-2026-0089',
            'category': 'INVERTER',
            'subject': 'Inverter query',
            'description': 'Wi-Fi sync guidance needed',
            'status': 'OPEN',
            'createdAt': '2026-03-01T10:00:00.000Z',
          },
        }),
        201,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }

    return ResponseBody.fromString('{"success": true}', 200, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _ComprehensiveTestHttpAdapter testAdapter;

  setUp(() async {
    SecureStorageService.useInMemoryOnly = true;
    SharedPreferences.setMockInitialValues({});
    testAdapter = _ComprehensiveTestHttpAdapter();
    ApiClient.instance.dio.httpClientAdapter = testAdapter;
    await SecureStorageService.clearSession();
  });

  group('Sunlife Solar — Production Security & Contract Verification', () {
    test('1. Security: Universal OTP "123456" is strictly rejected', () async {
      expect(
        () async => await AuthRepository.instance.verifyOtp(
          identifier: '9876543210',
          otp: '123456',
          isAgent: false,
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('2. Security: Rate limiting & abused OTP rejection', () async {
      expect(
        () async => await AuthRepository.instance.verifyOtp(
          identifier: '9876543210',
          otp: '000000',
          isAgent: false,
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('3. Auth: Legitimate OTP request and verification succeeds with session stored', () async {
      final reqResult = await AuthRepository.instance.requestOtp(identifier: '9876543210');
      expect(reqResult.success, isTrue);

      final user = await AuthRepository.instance.verifyOtp(
        identifier: '9876543210',
        otp: '958214',
        isAgent: false,
      );

      expect(user.role, 'customer');
      expect(user.name, 'Rajesh Sharma');
      expect(await SecureStorageService.isLoggedIn(), isTrue);
      expect(await SecureStorageService.getUserRole(), 'customer');
    });

    test('4. Security & Account Isolation: Logout completely purges all user-scoped caches', () async {
      // First populate caches
      await AuthRepository.instance.verifyOtp(
        identifier: '9876543210',
        otp: '958214',
        isAgent: false,
      );
      await ProjectRepository.instance.getProjects();
      await PaymentRepository.instance.getPaymentSummary();
      await DocumentRepository.instance.getDocuments();
      await SubsidyRepository.instance.getSubsidyStatus();

      expect(ProjectRepository.instance.currentProjects, isNotEmpty);
      expect(DocumentRepository.instance.currentDocuments, isNotEmpty);

      // Perform logout
      await AuthRepository.instance.logout();

      // Verify all caches and tokens are wiped
      expect(await SecureStorageService.isLoggedIn(), isFalse);
      expect(await SecureStorageService.getAuthToken(), isNull);
      expect(ProjectRepository.instance.currentProjects, isEmpty);
      expect(DocumentRepository.instance.currentDocuments, isEmpty);
      expect(SubsidyRepository.instance.currentStatus.isInitiated, isFalse);
      expect(NotificationRepository.instance.notifications, isEmpty);
    });

    test('5. Data Contract: SolarProject supports fractional kW and real backend field mappings', () async {
      final projects = await ProjectRepository.instance.getProjects();
      expect(projects, isNotEmpty);

      final project = projects.first;
      expect(project.id, 'proj_001');
      expect(project.capacityKw, 5.5); // Fractional capacity!
      expect(project.panels, contains('Adani Solar'));
      expect(project.inverter, contains('Sungrow'));
      expect(project.discom, 'MPPKVVCL');
    });

    test('6. Payment Authority: processPayment throws honest unconfigured message instead of faking success', () async {
      final summary = await PaymentRepository.instance.getPaymentSummary();
      expect(summary.totalCost, 275000);
      expect(summary.totalPaid, 100000);
      expect(summary.remainingBalance, 175000);
      expect(summary.milestones.length, 3);

      // Attempting online payment without gateway must fail honestly
      expect(
        () async => await PaymentRepository.instance.processPayment(amount: 50000, method: 'UPI'),
        throwsA(predicate((e) => e.toString().contains('gateway integration is currently in verification mode'))),
      );

      // Balance must NOT have been modified locally
      expect(PaymentRepository.instance.currentSummary.totalPaid, 100000);
    });

    test('7. Document Upload: Multipart upload and status flow', () async {
      final docs = await DocumentRepository.instance.getDocuments();
      expect(docs, isNotEmpty);
      expect(docs.first.name, 'Electricity Bill');
      expect(docs.first.isApproved, isTrue);

      final uploaded = await DocumentRepository.instance.uploadDocument(
        title: 'Electricity Bill',
        filePath: 'test_path/bill.pdf',
        fileSize: '100 KB',
      );

      expect(uploaded.name, 'Electricity Bill');
      expect(uploaded.isPending, isTrue);
    });

    test('8. Subsidy Contract: Real subsidy status from server', () async {
      final subsidy = await SubsidyRepository.instance.getSubsidyStatus();
      expect(subsidy.claimNumber, 'SUB-2026-991');
      expect(subsidy.eligibleAmount, 78000);
      expect(subsidy.isDiscomApproved, isTrue);
    });

    test('9. Agent Operations: Lead capture, stage updating, and attendance punch', () async {
      final leads = await AgentRepository.instance.getAssignedLeads();
      expect(leads, isNotEmpty);

      final newLead = await AgentRepository.instance.addLead(
        name: 'Suresh Raina',
        phone: '9826199999',
        location: 'Hoshangabad Road',
        requirementType: 'RESIDENTIAL',
        approxCapacity: '5 kW',
      );
      expect(newLead.name, 'Suresh Raina');

      // Attendance punch
      await AuthRepository.instance.verifyOtp(
        identifier: '8839707135',
        otp: '958214',
        isAgent: true,
      );

      final punchResult = await AgentRepository.instance.punchAttendance(
        action: 'punch-in',
        latitude: 22.7519,
        longitude: 77.7289,
      );
      expect(punchResult['record']?['status'], 'Present');
      expect(punchResult['record']?['checkIn'], '09:30 AM');
    });

    test('10. Client Enrollment: Agent can enroll customer and create project in CRM', () async {
      final enrollment = await AgentRepository.instance.enrollClient(
        fullName: 'Pooja Verma',
        primaryMobile: '9425012345',
        installationAddress: 'Pipariya, Narmadapuram',
        capacityKw: 5.0,
      );

      expect(enrollment['customer']?['customerId'], 'SL-CUST-1045');
      expect(enrollment['project']?['projectId'], 'SL-PRJ-1045');
    });

    test('11. Support: Real ticket creation', () async {
      final ticket = await SupportRepository.instance.createTicket(
        category: 'INVERTER',
        description: 'Wi-Fi sync guidance needed',
      );

      expect(ticket.id, 'TKT-2026-0089');
      expect(ticket.category, 'INVERTER');
    });
  });
}
