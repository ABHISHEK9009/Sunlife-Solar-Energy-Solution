import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sunlife_solar/core/errors/app_error.dart';
import 'package:sunlife_solar/core/errors/error_feedback.dart';
import 'package:sunlife_solar/core/models/notification_item.dart';
import 'package:sunlife_solar/core/network/api_client.dart';
import 'package:sunlife_solar/core/network/connectivity_service.dart';
import 'package:sunlife_solar/core/repositories/auth_repository.dart';
import 'package:sunlife_solar/core/repositories/agent_repository.dart';
import 'package:sunlife_solar/core/repositories/document_repository.dart';
import 'package:sunlife_solar/core/repositories/project_repository.dart';
import 'package:sunlife_solar/core/storage/secure_storage_service.dart';
import 'package:sunlife_solar/core/widgets/data_state.dart';
import 'package:sunlife_solar/features/auth/login_page.dart';

const hostile = 'CRM Prisma SQL Exception HTTP 500 https://private.invalid?token=secret JWT password=secret';

class PolicyAdapter implements HttpClientAdapter {
  PolicyAdapter({this.status = 503, this.body, this.timeout = false});
  final int status;
  final Object? body;
  final bool timeout;
  int calls = 0;
  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream,
      Future<void>? cancelFuture) async {
    calls++;
    if (timeout) {
      throw DioException(requestOptions: options, type: DioExceptionType.receiveTimeout, message: hostile);
    }
    return ResponseBody.fromString(jsonEncode(body ?? {'error': hostile, 'message': hostile}), status,
      headers: {Headers.contentTypeHeader: [Headers.jsonContentType]});
  }
  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() async {
    SecureStorageService.useInMemoryOnly = true;
    SharedPreferences.setMockInitialValues({});
    await AuthRepository.instance.logout();
  });

  final cases = <int, FailureKind>{
    400: FailureKind.validation, 401: FailureKind.sessionExpired,
    403: FailureKind.permission, 404: FailureKind.notFound,
    408: FailureKind.timeout, 409: FailureKind.conflict,
    412: FailureKind.conflict, 422: FailureKind.validation,
    429: FailureKind.rateLimit, 500: FailureKind.unavailable,
    503: FailureKind.unavailable, 504: FailureKind.timeout,
  };
  for (final entry in cases.entries) {
    test('Hostile response ${entry.key} becomes ${entry.value.name}', () async {
      ApiClient.instance.dio.httpClientAdapter = PolicyAdapter(status: entry.key);
      await expectLater(ApiClient.instance.get('/policy-test'), throwsA(
        isA<AppFailure>().having((e) => e.kind, 'kind', entry.value)
          .having((e) => e.message, 'safe copy', AppMessages.failure(entry.value)),
      ));
    });
  }

  test('Connection, timeout, programming and location failures remain distinct', () {
    expect(ErrorMapper.map(const SocketException(hostile)).kind, FailureKind.connection);
    expect(ErrorMapper.map(TimeoutException(hostile)).kind, FailureKind.timeout);
    expect(ErrorMapper.map(StateError(hostile)).kind, FailureKind.unknown);
    expect(ErrorMapper.message(const AppFailure(FailureKind.locationPermission)), contains('location access'));
    expect(ErrorMapper.message(const AppFailure(FailureKind.locationDisabled)), contains('Turn on'));
    expect(ErrorMapper.map(ApiException(hostile)).message, isNot(contains(hostile)));
  });

  test('Successful status with rejected operation is not success', () async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter(status: 200, body: {'success': false, 'error': hostile});
    final result = await AuthRepository.instance.requestOtp(identifier: '9876543210');
    expect(result.success, isFalse);
    expect(result.error, AppMessages.failure(FailureKind.unknown));
  });

  test('OTP success text and notification content never relay service prose', () async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter(status: 200, body: {'success': true, 'message': hostile});
    final result = await AuthRepository.instance.requestOtp(identifier: '9876543210');
    expect(result.message, AppMessages.codeSent);
    final item = NotificationItem.fromJson({'id': 'internal', 'title': hostile, 'message': hostile});
    expect(item.title, AppMessages.notificationTitle);
    expect(item.message, AppMessages.notificationBody);
  });

  test('Failed onboarding does not fabricate confirmation or identity', () async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter();
    await expectLater(AuthRepository.instance.submitLeadEnquiryChunk({'name': 'Customer', 'step': 'PERSONAL'}), throwsA(isA<AppFailure>()));
    expect(AuthRepository.instance.currentUser, isNull);
    expect(await SecureStorageService.isLoggedIn(), isFalse);
  });

  test('Missing upload file cannot produce a metadata-only request', () async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter(status: 200, body: {
      'projects': [{'id': 'test-project', 'projectStatus': 'INSTALLATION'}],
    });
    await ProjectRepository.instance.getProjects(forceRefresh: true);
    final adapter = PolicyAdapter(status: 200, body: {'success': true});
    ApiClient.instance.dio.httpClientAdapter = adapter;
    await expectLater(DocumentRepository.instance.uploadDocument(title: 'Bill', filePath: 'nonexistent-policy-file.pdf'), throwsA(isA<AppFailure>()));
    expect(adapter.calls, 0);
    expect(DocumentRepository.instance.documents, isEmpty);
  });

  test('Shared failed reads are mapped for every waiter', () async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter();
    final futures = [ApiClient.instance.get('/same'), ApiClient.instance.get('/same')];
    await Future.wait(futures.map((f) => expectLater(f, throwsA(isA<AppFailure>()))));
  });

  test('Failed agent reads retain explicit failure state', () async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter();
    await AgentRepository.instance.getAssignedLeads(forceRefresh: true);
    expect(AgentRepository.instance.leadsError, AppMessages.failure(FailureKind.unavailable));
  });

  testWidgets('Failed login displays safe guidance and retains phone number', (tester) async {
    ApiClient.instance.dio.httpClientAdapter = PolicyAdapter();
    await tester.pumpWidget(const MaterialApp(home: LoginPage()));
    await tester.enterText(find.byType(TextField).first, '9876543210');
    await tester.tap(find.byType(FilledButton).first);
    await tester.pumpAndSettle();
    expect(find.textContaining('service is temporarily unavailable'), findsOneWidget);
    expect(find.text('9876543210'), findsOneWidget);
    expect(find.textContaining('Prisma'), findsNothing);
  });

  testWidgets('Startup error view never renders diagnostic text', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SafeErrorView()));
    expect(find.text('Sunlife Solar'), findsOneWidget);
    expect(find.textContaining('Close and reopen'), findsOneWidget);
    expect(find.textContaining('Exception'), findsNothing);
  });

  testWidgets('Offline state warns that information may not be current', (tester) async {
    ConnectivityService.instance.isOnlineNotifier.value = false;
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: OfflineBanner())));
    expect(find.textContaining('may not be current'), findsOneWidget);
    ConnectivityService.instance.isOnlineNotifier.value = true;
  });

  testWidgets('Read recovery offers a working Retry action', (tester) async {
    var retries = 0;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: DataState(
      message: AppMessages.failure(FailureKind.unavailable),
      onRetry: () async { retries++; },
    ))));
    await tester.tap(find.text(AppMessages.retry));
    expect(retries, 1);
  });

  test('UI source contains no known technical labels or raw exception sinks', () {
    final prohibited = RegExp(r'\b(CRM|database|backend|Prisma|Neon|JWT|Redis|Railway|Vercel)\b|Inverter API', caseSensitive: false);
    for (final directory in ['lib/features', 'lib/agent']) {
      for (final file in Directory(directory).listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'))) {
        final source = file.readAsStringSync();
        final withoutComments = source.split('\n').where((l) => !l.trimLeft().startsWith('//')).join('\n');
        expect(prohibited.hasMatch(withoutComments), isFalse, reason: file.path);
        expect(RegExp(r"(?:e|err)\.toString\(\)|Text\('[^']*\$(?:e|err)\b").hasMatch(withoutComments), isFalse, reason: file.path);
      }
    }
  });
}
