import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sunlife_solar/core/models/solar_project.dart';
import 'package:sunlife_solar/core/models/user_profile.dart';
import 'package:sunlife_solar/core/repositories/auth_repository.dart';
import 'package:sunlife_solar/core/repositories/project_repository.dart';
import 'package:sunlife_solar/core/storage/secure_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SecureStorageService.useInMemoryOnly = true;
    SharedPreferences.setMockInitialValues({});
    await SecureStorageService.clearSession();
    ProjectRepository.instance.reset();
  });

  group('Sunlife Solar — Customer Lifecycle & Milestone Verification', () {
    test('1. Lifecycle: Correct milestone ordering and progression for ON_GRID system', () {
      final onGridProject = SolarProject(
        id: 'prj_ongrid_001',
        capacityKw: 5.0,
        projectType: 'Residential',
        systemType: 'ON_GRID',
        status: 'INSTALLATION_IN_PROGRESS',
        currentStage: 'Installation in progress',
        expectedUpdateDays: '2–3 days',
        address: 'Bhopal, MP',
        discom: 'MPMKVVCL',
        panels: 'Adani 540W Mono PERC',
        inverter: 'Sungrow 5kW Grid-Tie',
        engineerName: 'Vikram Singh',
        salesExecutive: 'Anil Verma',
        completedStages: 4,
        totalStages: 6,
        stages: SolarProject.standardStages,
      );

      final milestones = onGridProject.milestones;
      expect(milestones.isNotEmpty, isTrue);

      // Verify ordering
      expect(milestones[0].title, 'Site Feasibility Survey');
      expect(milestones[0].isCompleted, isTrue);

      expect(milestones[1].title, 'System Design & Quotation');
      expect(milestones[1].isCompleted, isTrue);

      expect(milestones[2].title, 'Customer KYC & Agreement');
      expect(milestones[2].isCompleted, isTrue);

      // Check conditional checkpoint for ON_GRID: DISCOM Net Metering must be present!
      final hasDiscomFiling = milestones.any((m) => m.title.contains('DISCOM Net Metering Application'));
      expect(hasDiscomFiling, isTrue);

      // Check that Battery sizing is NOT present for standard ON_GRID!
      final hasBatterySizing = milestones.any((m) => m.title.contains('Battery Energy Storage Sizing'));
      expect(hasBatterySizing, isFalse);

      // Check Installation step
      final installStep = milestones.firstWhere((m) => m.title.contains('Physical Installation Work'));
      expect(installStep.isCurrent, isTrue);

      // Check Net meter installation step
      final hasNetMeter = milestones.any((m) => m.title.contains('DISCOM Net Meter Installation'));
      expect(hasNetMeter, isTrue);
    });

    test('2. Lifecycle: Conditional regulatory checkpoints for OFF_GRID system', () {
      final offGridProject = SolarProject(
        id: 'prj_offgrid_001',
        capacityKw: 3.0,
        projectType: 'Agricultural',
        systemType: 'OFF_GRID',
        status: 'MATERIAL_PENDING',
        currentStage: 'Material Pending',
        expectedUpdateDays: '3–5 days',
        address: 'Pipariya, MP',
        discom: 'MPMKVVCL',
        panels: 'Tata Power 400W Mono',
        inverter: 'Off-Grid 3kW Inverter',
        engineerName: 'Rajesh Sharma',
        salesExecutive: 'Sunlife Desk',
        completedStages: 3,
        totalStages: 6,
        stages: SolarProject.standardStages,
      );

      final milestones = offGridProject.milestones;

      // OFF_GRID must NOT include DISCOM Net Metering Application or Net Meter Installation!
      final hasDiscomFiling = milestones.any((m) => m.title.contains('DISCOM Net Metering Application'));
      expect(hasDiscomFiling, isFalse);

      final hasNetMeter = milestones.any((m) => m.title.contains('DISCOM Net Meter Installation'));
      expect(hasNetMeter, isFalse);

      // OFF_GRID MUST include Battery Energy Storage Sizing!
      final hasBatterySizing = milestones.any((m) => m.title.contains('Battery Energy Storage Sizing'));
      expect(hasBatterySizing, isTrue);
    });

    test('3. Lifecycle: Conditional checkpoints for HYBRID system includes both Grid and Storage', () {
      final hybridProject = SolarProject(
        id: 'prj_hybrid_001',
        capacityKw: 10.0,
        projectType: 'Commercial',
        systemType: 'HYBRID',
        status: 'DOCUMENTS_SUBMITTED',
        currentStage: 'Documents Submitted',
        expectedUpdateDays: '3 days',
        address: 'Hoshangabad, MP',
        discom: 'MPMKVVCL',
        panels: 'Waaree 540W Bifacial',
        inverter: 'Deye 10kW Hybrid Inverter',
        engineerName: 'Gaurav Patel',
        salesExecutive: 'Sunlife Desk',
        completedStages: 3,
        totalStages: 6,
        stages: SolarProject.standardStages,
      );

      final milestones = hybridProject.milestones;

      // HYBRID MUST have both Battery Storage and DISCOM Net Metering!
      final hasDiscomFiling = milestones.any((m) => m.title.contains('DISCOM Net Metering Application'));
      expect(hasDiscomFiling, isTrue);

      final hasBatterySizing = milestones.any((m) => m.title.contains('Battery Energy Storage Sizing'));
      expect(hasBatterySizing, isTrue);
    });

    test('4. State Resolution: Commissioned plant vs Active installation vs Pre-installation', () {
      final activeInstall = SolarProject(
        id: 'prj_act',
        capacityKw: 5.0,
        projectType: 'Residential',
        systemType: 'ON_GRID',
        status: 'INSTALLATION_IN_PROGRESS',
        currentStage: 'Installation',
        expectedUpdateDays: '2 days',
        address: 'Bhopal',
        discom: 'MPMKVVCL',
        panels: 'Adani',
        inverter: 'Sungrow',
        engineerName: 'Engineer',
        salesExecutive: 'Sales',
        completedStages: 4,
        totalStages: 6,
        stages: SolarProject.standardStages,
      );
      expect(activeInstall.isCommissioned, isFalse);
      expect(activeInstall.isInstallationInProgress, isTrue);
      expect(activeInstall.isPreInstallation, isFalse);

      final commissionedPlant = SolarProject(
        id: 'prj_comm',
        capacityKw: 5.0,
        projectType: 'Residential',
        systemType: 'ON_GRID',
        status: 'ACTIVE',
        currentStage: 'Operational',
        expectedUpdateDays: 'None',
        address: 'Bhopal',
        discom: 'MPMKVVCL',
        panels: 'Adani',
        inverter: 'Sungrow',
        engineerName: 'Engineer',
        salesExecutive: 'Sales',
        completedStages: 6,
        totalStages: 6,
        stages: SolarProject.standardStages,
        commissioningDate: DateTime(2026, 1, 15),
      );
      expect(commissionedPlant.isCommissioned, isTrue);
      expect(commissionedPlant.isInstallationInProgress, isFalse);
      expect(commissionedPlant.isPreInstallation, isFalse);

      final enquiryProject = SolarProject(
        id: 'prj_enq',
        capacityKw: 3.0,
        projectType: 'Residential',
        systemType: 'ON_GRID',
        status: 'ENQUIRY',
        currentStage: 'Enquiry',
        expectedUpdateDays: '1 day',
        address: 'Bhopal',
        discom: 'MPMKVVCL',
        panels: '',
        inverter: '',
        engineerName: '',
        salesExecutive: '',
        completedStages: 0,
        totalStages: 6,
        stages: SolarProject.standardStages,
      );
      expect(enquiryProject.isCommissioned, isFalse);
      expect(enquiryProject.isInstallationInProgress, isFalse);
      expect(enquiryProject.isPreInstallation, isTrue);
    });

    test('5. Multi-Property Switching: Customer switches seamlessly between multiple installations', () {
      final repo = ProjectRepository.instance;

      final p1 = SolarProject(
        id: 'p1_bhopal',
        capacityKw: 5.0,
        projectType: 'Residential',
        systemType: 'ON_GRID',
        status: 'ACTIVE',
        currentStage: 'Operational',
        expectedUpdateDays: '0',
        address: 'Bhopal Home',
        discom: 'MPMKVVCL',
        panels: 'Adani',
        inverter: 'Sungrow',
        engineerName: 'Engineer A',
        salesExecutive: 'Sales A',
        completedStages: 6,
        totalStages: 6,
        stages: SolarProject.standardStages,
        commissioningDate: DateTime(2025, 10, 1),
      );

      final p2 = SolarProject(
        id: 'p2_farm',
        capacityKw: 10.0,
        projectType: 'Commercial',
        systemType: 'HYBRID',
        status: 'INSTALLATION_IN_PROGRESS',
        currentStage: 'Structure Work',
        expectedUpdateDays: '3 days',
        address: 'Narmadapuram Farm',
        discom: 'MPMKVVCL',
        panels: 'Waaree',
        inverter: 'Deye',
        engineerName: 'Engineer B',
        salesExecutive: 'Sales A',
        completedStages: 4,
        totalStages: 6,
        stages: SolarProject.standardStages,
      );

      repo.setProjects([p1, p2]);
      repo.setOpenEnquiry({
        'propertyType': 'Warehouse',
        'city': 'Indore',
        'status': 'SURVEY_SCHEDULED',
      });

      expect(repo.allProjects.length, 2);
      expect(repo.hasMultipleProperties, isTrue);
      expect(repo.activeProject?.id, 'p1_bhopal');
      expect(repo.isEnquirySelected, isFalse);

      // Switch to Property 2
      repo.setActiveProject(p2);
      expect(repo.activeProject?.id, 'p2_farm');
      expect(repo.activeProject?.isCommissioned, isFalse);
      expect(repo.isEnquirySelected, isFalse);

      // Select Open Enquiry
      repo.selectEnquiry();
      expect(repo.activeProject, isNull);
      expect(repo.isEnquirySelected, isTrue);
      expect(repo.openEnquiry?['city'], 'Indore');

      // Switch back to Property 1
      repo.setActiveProject(p1);
      expect(repo.activeProject?.id, 'p1_bhopal');
      expect(repo.activeProject?.isCommissioned, isTrue);
      expect(repo.isEnquirySelected, isFalse);
    });
  });
}
