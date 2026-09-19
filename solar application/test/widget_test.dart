import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sunlife_solar/agent/dashboard/agent_shell.dart';
import 'package:sunlife_solar/core/network/api_client.dart';
import 'package:sunlife_solar/core/repositories/agent_repository.dart';
import 'package:sunlife_solar/core/storage/secure_storage_service.dart';
import 'package:sunlife_solar/features/dashboard/app_shell.dart';
import 'package:sunlife_solar/main.dart';
import 'package:sunlife_solar/main_agent.dart';

class _WidgetTestHttpAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (options.path.contains('/auth/agent/login') || options.path.contains('/auth/otp/send')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'maskedEmail': 'a***@company.com',
          'message': 'OTP sent',
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }
    if (options.path.contains('/auth/agent/verify')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'accessToken': 'test_agent_token',
          'agent': {
            'id': 'SA-54504',
            'employeeId': 'SA-54504',
            'name': 'Abhishek Verma',
            'phone': '8839707135',
            'email': 'abhishekverma9920@gmail.com',
            'role': 'Field Operations Partner',
            'territory': 'Jaipur Central',
            'department': 'Operations',
          },
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }
    if (options.path.contains('/auth/otp/verify')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'accessToken': 'test_customer_token',
          'customer': {
            'id': 'SL-10452',
            'fullName': 'Rajesh Sharma',
            'primaryMobile': '9876543210',
            'email': 'rajesh@example.com',
            'plantId': 'SP-JPR-00452',
            'discomConsumerNo': 'JVVNL-182943',
          },
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }
    if (options.path.contains('/agent/leads')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'leads': [
            {
              'id': 'lead_1',
              'name': 'Amit Kumar',
              'phone': '9876543210',
              'location': 'Jaipur',
              'stage': 'Survey Scheduled',
              'monthlyBill': '₹5,000/month',
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }
    if (options.path.contains('/agent/visits')) {
      return ResponseBody.fromString(
        jsonEncode({
          'success': true,
          'visits': [
            {
              'id': 'visit_1',
              'time': '10:30 AM',
              'customerName': 'Amit Kumar',
              'purpose': 'Site survey',
              'location': 'Mansarovar, Jaipur',
              'checklist': [true, false, false, false],
              'isCompleted': false,
            }
          ],
        }),
        200,
        headers: {Headers.contentTypeHeader: [Headers.jsonContentType]},
      );
    }
    return ResponseBody.fromString('{}', 200, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    await SecureStorageService.clearSession();
    ApiClient.instance.dio.httpClientAdapter = _WidgetTestHttpAdapter();
  });

  testWidgets('opens customer dashboard with phone entry', (tester) async {
    await tester.pumpWidget(const SunlifeCustomerApp());
    expect(find.text('Power your home\nwith sunshine.'), findsOneWidget);

    // Enter valid 10-digit phone number
    await tester.enterText(find.byType(TextField), '9876543210');
    await tester.tap(find.text('Continue with OTP'));
    await tester.pumpAndSettle();

    expect(find.text('Verify your number'), findsOneWidget);
    await tester.enterText(find.byType(TextField), '654321');
    await tester.tap(find.text('Verify & continue'));
    await tester.pumpAndSettle();

    expect(find.text('Good morning, Rajesh'), findsOneWidget);
    expect(find.text('Project progress'), findsOneWidget);
  });

  testWidgets('profile provides a confirmed logout flow', (tester) async {
    await tester.pumpWidget(
      MaterialApp(theme: ThemeData(useMaterial3: true), home: const AppShell()),
    );
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.dragUntilVisible(
      find.text('Log out'),
      find.byType(Scrollable),
      const Offset(0, -300),
    );
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    expect(find.text('Log out?'), findsOneWidget);
  });

  testWidgets('login remains usable on a short mobile screen', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const SunlifeCustomerApp());
    await tester.dragUntilVisible(
      find.byType(TextField),
      find.byType(Scrollable),
      const Offset(0, -200),
    );
    await tester.showKeyboard(find.byType(TextField));
    await tester.pump();

    expect(find.text('Continue with OTP'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('agent can sign in directly via dedicated SunlifeAgentApp',
      (tester) async {
    await tester.pumpWidget(const SunlifeAgentApp());

    expect(find.text('Agent Portal\nSign In'), findsOneWidget);
    await tester.enterText(find.byType(TextField), '8839707135');
    await tester.tap(find.text('Continue / Send OTP'));
    await tester.pumpAndSettle();

    expect(find.text('Verify Login OTP'), findsOneWidget);
    await tester.enterText(find.byType(TextField), '654321');
    await tester.tap(find.text('Verify & Sign In'));
    await tester.pumpAndSettle();

    expect(find.text('Good morning, Abhishek'), findsOneWidget);
    expect(find.text('Assigned leads'), findsOneWidget);
  });

  testWidgets('agent can open an assigned lead', (tester) async {
    await AgentRepository.instance.getAssignedLeads(forceRefresh: true);

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(useMaterial3: true),
        home: const AgentShell(),
      ),
    );
    await tester.tap(find.text('Leads'));
    await tester.pumpAndSettle();
    expect(find.text('Amit Kumar'), findsOneWidget);
    await tester.tap(find.text('Amit Kumar'));
    await tester.pumpAndSettle();

    expect(find.text('Customer requirement'), findsOneWidget);
    expect(find.text('Update lead stage'), findsOneWidget);
    expect(find.text('Save to CRM'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
