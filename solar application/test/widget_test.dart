import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sunlife_solar/agent/dashboard/agent_shell.dart';
import 'package:sunlife_solar/features/dashboard/app_shell.dart';
import 'package:sunlife_solar/main.dart';
import 'package:sunlife_solar/main_agent.dart';

void main() {
  testWidgets('opens customer dashboard with phone entry', (tester) async {
    await tester.pumpWidget(const SunlifeCustomerApp());
    expect(find.text('Power your home\nwith sunshine.'), findsOneWidget);

    // Enter valid 10-digit phone number
    await tester.enterText(find.byType(TextField), '9876543210');
    await tester.tap(find.text('Continue with OTP'));
    await tester.pumpAndSettle();

    expect(find.text('Verify your number'), findsOneWidget);
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

  testWidgets('support category opens a query form', (tester) async {
    await tester.pumpWidget(
      MaterialApp(theme: ThemeData(useMaterial3: true), home: const AppShell()),
    );
    await tester.tap(find.text('Service'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Raise query or request'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Document help').last);
    await tester.pumpAndSettle();

    expect(find.text('Describe your query or request'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('agent can sign in directly via dedicated SunlifeAgentApp',
      (tester) async {
    await tester.pumpWidget(const SunlifeAgentApp());

    expect(find.text('Manage your day\nin the field.'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'SL-A104');
    await tester.tap(find.text('Continue securely'));
    await tester.pumpAndSettle();

    expect(find.text('Verify agent access'), findsOneWidget);
    await tester.tap(find.text('Open workspace'));
    await tester.pumpAndSettle();

    expect(find.text('Good morning, Rahul'), findsOneWidget);
    expect(find.text('Assigned leads'), findsOneWidget);
  });

  testWidgets('agent can open an assigned lead', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(useMaterial3: true),
        home: const AgentShell(),
      ),
    );
    await tester.tap(find.text('Leads'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Anita Meena'));
    await tester.pumpAndSettle();

    expect(find.text('Customer requirement'), findsOneWidget);
    expect(find.text('Update lead stage'), findsOneWidget);
    expect(find.text('Save to CRM'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
