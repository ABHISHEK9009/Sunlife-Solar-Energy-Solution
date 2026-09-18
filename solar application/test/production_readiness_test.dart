import 'package:flutter_test/flutter_test.dart';
import 'package:sunlife_solar/core/repositories/agent_repository.dart';
import 'package:sunlife_solar/core/repositories/auth_repository.dart';
import 'package:sunlife_solar/core/repositories/document_repository.dart';
import 'package:sunlife_solar/core/repositories/notification_repository.dart';
import 'package:sunlife_solar/core/repositories/payment_repository.dart';
import 'package:sunlife_solar/core/repositories/project_repository.dart';
import 'package:sunlife_solar/core/repositories/support_repository.dart';
import 'package:sunlife_solar/core/storage/secure_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Production Readiness Core Verification', () {
    setUp(() async {
      await SecureStorageService.clearSession();
    });

    test('AuthRepository - Customer OTP request & verification with session persistence', () async {
      final otpSent = await AuthRepository.instance.requestOtp(identifier: '9876543210');
      expect(otpSent, isTrue);

      final user = await AuthRepository.instance.verifyOtp(
        identifier: '9876543210',
        otp: '123456',
        isAgent: false,
      );

      expect(user.role, 'customer');
      expect(user.name, 'Rajesh Sharma');
      expect(await SecureStorageService.isLoggedIn(), isTrue);
      expect(await SecureStorageService.getUserRole(), 'customer');

      await AuthRepository.instance.logout();
      expect(await SecureStorageService.isLoggedIn(), isFalse);
    });

    test('AuthRepository - Agent authentication with credentials', () async {
      final user = await AuthRepository.instance.verifyOtp(
        identifier: 'SL-A104',
        otp: '123456',
        isAgent: true,
      );

      expect(user.role, 'agent');
      expect(user.name, 'Rahul Kumar');
      expect(await SecureStorageService.getUserRole(), 'agent');
      expect(await SecureStorageService.isLoggedIn(), isTrue);
    });

    test('ProjectRepository - Loads current solar installation details', () async {
      final project = await ProjectRepository.instance.getCurrentProject();
      expect(project.id, 'SS-2026-00452');
      expect(project.capacityKw, 5);
      expect(project.currentStage, 'Net metering');
      expect(project.panels, contains('Adani Solar'));
      expect(project.inverter, contains('Sungrow'));
    });

    test('DocumentRepository - Document retrieval and upload pipeline', () async {
      final docs = await DocumentRepository.instance.getDocuments();
      expect(docs, isNotEmpty);
      final initialCount = docs.length;

      final uploaded = await DocumentRepository.instance.uploadDocument(
        title: 'Cancelled cheque',
        filePath: 'test_path/cheque.pdf',
        fileSize: '450 KB',
      );

      expect(uploaded.title, 'Cancelled cheque');
      expect(uploaded.isUploaded, isTrue);

      final updatedDocs = await DocumentRepository.instance.getDocuments();
      expect(updatedDocs.length, initialCount + 1);
      expect(DocumentRepository.instance.requiredCheque?.isUploaded, isTrue);
    });

    test('PaymentRepository - Payment balance and milestone processing', () async {
      final initial = await PaymentRepository.instance.getPaymentSummary();
      expect(initial.remainingBalance, greaterThan(0));

      final success = await PaymentRepository.instance.processPayment(
        amount: initial.remainingBalance,
        method: 'UPI',
      );
      expect(success, isTrue);

      final updated = await PaymentRepository.instance.getPaymentSummary();
      expect(updated.remainingBalance, 0);
      expect(updated.history.first.title, contains('UPI'));
    });

    test('AgentRepository - Lead capture, stage updating, and visit checklist', () async {
      final initialLeads = await AgentRepository.instance.getAssignedLeads();
      final count = initialLeads.length;

      final newLead = await AgentRepository.instance.addLead(
        name: 'Ramesh Patel',
        phone: '9829012345',
        location: 'C-Scheme, Jaipur',
        monthlyBill: '₹6,500/month',
        notes: 'Interested in 6kW system',
      );

      expect(newLead.name, 'Ramesh Patel');
      expect(newLead.stage, 'New lead');

      final afterAdd = await AgentRepository.instance.getAssignedLeads();
      expect(afterAdd.length, count + 1);

      await AgentRepository.instance.updateLeadStage('Ramesh Patel', 'Survey scheduled');
      final updatedLeads = await AgentRepository.instance.getAssignedLeads();
      final ramesh = updatedLeads.firstWhere((l) => l.name == 'Ramesh Patel');
      expect(ramesh.stage, 'Survey scheduled');

      // Visit tests
      final visits = await AgentRepository.instance.getTodayVisits();
      expect(visits, isNotEmpty);

      await AgentRepository.instance.updateVisitChecklist('Anita Meena', 0, true);
      await AgentRepository.instance.completeVisit(
        'Anita Meena',
        latitude: 26.9124,
        longitude: 75.7873,
        photoPaths: ['mock_photo_1.jpg'],
      );

      final visit = await AgentRepository.instance.getVisitForCustomer('Anita Meena');
      expect(visit?.isCompleted, isTrue);
      expect(visit?.latitude, 26.9124);
      expect(visit?.photoPaths, contains('mock_photo_1.jpg'));
    });

    test('SupportRepository - Ticket submission and tracking', () async {
      final ticket = await SupportRepository.instance.createTicket(
        category: 'Inverter query',
        description: 'Need assistance with Wi-Fi dongle setup.',
      );

      expect(ticket.id, startsWith('SS'));
      expect(ticket.category, 'Inverter query');
      expect(ticket.status, 'SUBMITTED');

      final allTickets = await SupportRepository.instance.getTickets();
      expect(allTickets, contains(ticket));
    });

    test('NotificationRepository - Add notifications, unread count, and mark as read', () {
      final initialUnread = NotificationRepository.instance.unreadCount;
      expect(initialUnread, greaterThanOrEqualTo(0));

      NotificationRepository.instance.addNotification(
        title: 'Project Update',
        message: 'Net meter installation team dispatched.',
        category: 'Project',
      );

      final latest = NotificationRepository.instance.notifications.first;
      expect(latest.title, 'Project Update');
      expect(latest.category, 'Project');
      expect(latest.isRead, isFalse);
      expect(NotificationRepository.instance.unreadCount, initialUnread + 1);

      NotificationRepository.instance.markAsRead(latest.id);
      expect(NotificationRepository.instance.unreadCount, initialUnread);

      NotificationRepository.instance.markAllAsRead();
      expect(NotificationRepository.instance.unreadCount, 0);
    });
  });
}
