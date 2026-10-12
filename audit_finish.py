from pathlib import Path
import re
lib=Path('solar application/lib')
def edit(p,f):
 p=lib/p;p.write_text(f(p.read_text(encoding='utf-8')),encoding='utf-8')
def imp(s,p):
 x=f"import '{p}';\n";return s if x in s else x+s
edit('core/errors/app_error.dart',lambda s:s.replace('switch (status) {','switch (status ?? 0) {').replace('if (error is DioException) {','if (error is DioException) {\n      if (error.error is AppFailure) return error.error as AppFailure;'))
# All unhandled repository mutation failures produce reviewed feedback.
def tasks(s):
 s=s.replace('      _tasks[index] = current.copyWith(isCompleted: newStatus);\n      notifyListeners();\n','')
 marker="            'isCompleted': newStatus,\n          },\n        );"
 s=s.replace(marker,marker+'\n        _tasks[index] = current.copyWith(isCompleted: newStatus);\n        notifyListeners();')
 s=s.replace('      } catch (_) {\n        // Rollback','      } catch (e) {\n        ErrorFeedback.show(e);\n        // Rollback')
 s=s.replace('    } catch (_) {}\n    return <String, dynamic>{};', '    } catch (e) {\n      throw ErrorMapper.map(e);\n    }\n    throw const AppFailure(FailureKind.notFound);')
 return s
edit('core/repositories/agent_repository.dart',tasks)
# Retryable page loads should not render placeholders as actual balances/progress.
for path,condition in [('features/payments/payments_page.dart','_isLoading'),('features/subsidy/subsidy_page.dart','_status == null'),('features/project/project_page.dart','!ProjectRepository.instance.hasFetched')]:
 edit(path,lambda s:s.replace('    final loadError =',f'    if ({condition} && '+('PaymentRepository' if 'payments/' in path else 'SubsidyRepository' if 'subsidy/' in path else 'ProjectRepository')+'.instance.lastError == null) {\n      return const Scaffold(body: DataState());\n    }\n    final loadError =',1))
def home(s):
 s=imp(s,'../../core/widgets/data_state.dart')
 s=s.replace('Widget build(BuildContext context) {', '''Widget build(BuildContext context) {
    final error = ProjectRepository.instance.lastError ?? PaymentRepository.instance.lastError ?? DocumentRepository.instance.lastError ?? SubsidyRepository.instance.lastError;
    if (error != null) return DataState(message: error, onRetry: () async {
      await ProjectRepository.instance.getCurrentProject(forceRefresh: true);
      await PaymentRepository.instance.getPaymentSummary(forceRefresh: true);
      await DocumentRepository.instance.getDocuments(forceRefresh: true);
      await SubsidyRepository.instance.getSubsidyStatus(forceRefresh: true);
      await _loadData();
    });
    if (!ProjectRepository.instance.hasFetched) return const DataState();''',1)
 s=s.replace('Data source: Live Inverter Telemetry / Inverter API','Latest available inverter readings').replace('Active Generation Verified','Performance information is not available yet').replace('Inverter is grid-synchronized. Remote telemetry data logger link is being verified with your advisor.','Contact your advisor for help with your plant performance information.')
 return s
edit('features/home/home_page.dart',home)
def dashboard(s):
 s=imp(s,'../../core/widgets/data_state.dart')
 s=s.replace('Widget build(BuildContext context) {','''Widget build(BuildContext context) {
    final error = AgentRepository.instance.leadsError ?? AgentRepository.instance.visitsError;
    if (error != null) return DataState(message: error, onRetry: () => _loadData(force: true));''',1)
 return s
edit('agent/dashboard/agent_dashboard.dart',dashboard)
# Notification reads/mutations expose failure and wait for confirmation.
def notifications(s):
 s=imp(imp(s,'../errors/app_error.dart'),'../errors/error_feedback.dart')
 s=s.replace('  bool _isLoading = false;','  bool _isLoading = false;\n  String? lastError;')
 s=s.replace('  void reset() {','  void reset() {\n    lastError = null;')
 s=s.replace('    _isLoading = true;','    _isLoading = true;\n    lastError = null;')
 s=s.replace('    } catch (_) {\n      // Keep real fetched list on error; do not fabricate fake notifications','    } catch (e) {\n      lastError = ErrorMapper.message(e);')
 s=s.replace('      _isLoading = false;\n    }','      _isLoading = false;\n      _syncNotifiers();\n    }',1)
 a=s.index('  Future<void> markAllAsRead()');b=s.index('  void addNotification',a)
 s=s[:a]+'''  Future<void> markAllAsRead() async {
    try {
      await ApiClient.instance.patch(ApiConstants.notifications, data: {'markAllRead': true});
      _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
      _syncNotifiers();
    } catch (e) {
      ErrorFeedback.show(e);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await ApiClient.instance.patch(ApiConstants.notifications, data: {'notificationId': id});
      _notifications = _notifications.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList();
      _syncNotifiers();
    } catch (e) {
      ErrorFeedback.show(e);
    }
  }

'''+s[b:]
 return s
edit('core/repositories/notification_repository.dart',notifications)
def notificationpage(s):
 s=imp(s,'../../core/widgets/data_state.dart')
 s=s.replace("  String _selectedCategory = 'All';", """  String _selectedCategory = 'All';
  @override
  void initState() {
    super.initState();
    NotificationRepository.instance.getNotifications(forceRefresh: true);
  }
""")
 s=s.replace('        builder: (context, notifications, _) {', '''        builder: (context, notifications, _) {
          final error = NotificationRepository.instance.lastError;
          if (error != null) return Scaffold(appBar: AppBar(title: const Text('Notifications')), body: DataState(message: error, onRetry: () async { await NotificationRepository.instance.getNotifications(forceRefresh: true); }));
          if (NotificationRepository.instance.isLoading) return const Scaffold(body: DataState());''')
 return s
edit('features/notifications/notifications_page.dart',notificationpage)
# Honest download, verification and document size labels.
def documents(s):
 s=imp(imp(s,'package:url_launcher/url_launcher.dart'),'../../core/errors/app_error.dart')
 s=s.replace("import '../../core/repositories/project_repository.dart';\n",'')
 s=s.replace('                        final activeProject = ProjectRepository.instance.activeProject;\n','')
 s=s.replace("const Pill('VERIFIED DOCUMENT', greenText: true)","Pill(doc.isApproved ? 'Approved' : 'Awaiting review', greenText: doc.isApproved)")
 s=s.replace('Digitally signed & encrypted for security','Your project document').replace('Verified record $prjCode','Document $prjCode')
 a=s.index('  void _handleDownload(');b=s.index('  @override',a)
 s=s[:a]+'''  Future<void> _handleDownload(ProjectDocument doc) async {
    try {
      final uri = Uri.tryParse(doc.url ?? '');
      if (uri == null || uri.scheme != 'https' || !uri.hasAuthority || uri.userInfo.isNotEmpty) {
        throw const AppFailure(FailureKind.notFound);
      }
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw const AppFailure(FailureKind.unknown);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorMapper.message(e))));
      }
    }
  }

'''+s[b:]
 return s.replace('"450 KB"','"Size unavailable"')
edit('features/documents/documents_page.dart',documents)
edit('features/documents/documents_home_page.dart',lambda s:s.replace('"450 KB"','"Size unavailable"'))
# Remove unused imports exposed by removing diagnostic print statements.
edit('core/models/solar_project.dart',lambda s:s.replace("import 'package:flutter/foundation.dart';\n",''))
edit('core/repositories/auth_repository.dart',lambda s:imp(s,'../errors/error_feedback.dart').replace("import 'package:dio/dio.dart';\n",'').replace('    } catch (err) {\n    } finally {','    } catch (err) {\n      ErrorFeedback.show(err);\n    } finally {'))
