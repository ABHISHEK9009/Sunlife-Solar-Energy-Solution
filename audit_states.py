from pathlib import Path
import re
lib=Path('solar application/lib')
def edit(path,fn):
 p=lib/path;p.write_text(fn(p.read_text(encoding='utf-8')),encoding='utf-8')
def imp(s,p):
 l=f"import '{p}';\n";return s if l in s else l+s
# Keep failure state observable and retryable without throwing through unawaited UI loads.
def project(s):
 s=s.replace('      rethrow;', '      notifyListeners();\n      return null;')
 return s
edit('core/repositories/project_repository.dart',project)
for name in ['document','payment','subsidy','support']:
 def repo(s):
  s=s.replace('_hasFetched = true;\n      _isLoading = false;', '_hasFetched = _lastError == null;\n      _isLoading = false;')
  if name!='support':
   marker='    if (activeProject == null || activeProject.id.isEmpty) {'
   s=s.replace(marker,"    _lastError = ProjectRepository.instance.lastError;\n"+marker)
   s=s.replace('_hasFetched = true;\n      notifyListeners();', '_hasFetched = _lastError == null;\n      notifyListeners();')
  return s
 edit(f'core/repositories/{name}_repository.dart',repo)
# Agent list failure states and attendance safety.
def agent(s):
 s=imp(s,'../errors/error_feedback.dart')
 s=s.replace('  List<AgentLead> _leads = [];','''  String? leadsError, visitsError, tasksError;
  bool get hasLoadError => leadsError != null || visitsError != null || tasksError != null;
  List<AgentLead> _leads = [];''')
 s=s.replace('  void reset() {','  void reset() {\n    leadsError = visitsError = tasksError = null;')
 for method,field,flag,nextmethod in [('getAssignedLeads','leadsError','_hasFetchedLeads','  /// Adds new lead'),('getTodayVisits','visitsError','_hasFetchedVisits','  Future<FieldVisit?>'),('getTasks','tasksError','_hasFetchedTasks','  Future<void> toggleTaskCompletion')]:
  a=s.index('  Future<List<',s.index('  void reset')) if False else s.index(' getAssignedLeads(') if False else -1
  # Work within only the relevant method.
  a=s.index(f' {method}(');a=s.rfind('  Future',0,a);b=s.index(nextmethod,a)
  block=s[a:b]
  block=block.replace('    try {',f'    {field} = null;\n    try {{',1)
  block=re.sub(r'    } catch \(_\) \{.*?    } finally \{\n      '+flag+r' = true;\n    }',f'    }} catch (e) {{\n      {field} = ErrorMapper.message(e);\n    }} finally {{\n      {flag} = {field} == null;\n      notifyListeners();\n    }}',block,flags=re.S)
  s=s[:a]+block+s[b:]
 s=s.replace('ApiClient.instance.dio.patch(', 'ApiClient.instance.patch(')
 s=s.replace('throw Exception("Could not update lead status: ${ErrorMapper.message(err)}");','throw ErrorMapper.map(err);')
 s=s.replace('throw Exception("Failed to complete visit on server: ${ErrorMapper.message(err)}");','throw ErrorMapper.map(err);')
 s=s.replace('    if (index == -1) return;','    if (index == -1) throw const AppFailure(FailureKind.notFound);')
 # Publish completion only after successful persistence (retain existing request contracts).
 a=s.index('    // Optimistic local update');b=s.index('    try {',a)
 s=s[:a]+s[b:]
 marker='''      if (res.statusCode != 200) {
        throw Exception("Server returned ${res.statusCode}");
      }'''
 s=s.replace(marker,marker+'''\n      _leads[index] = targetLead.copyWith(stage: newStage);
      notifyListeners();''',1)
 a=s.index('    // Optimistic UI');b=s.index('    try {',a);saved=s[a:b].replace('    // Optimistic UI\n','')
 s=s[:a]+s[b:]
 a=s.index('  Future<void> completeVisit');b=s.index('    } catch (err)',a)
 s=s[:b]+saved+s[b:]
 # Attendance legacy fallback only when route is absent, never on timeouts or auth errors.
 a=s.index('    } catch (_) {',s.index('  Future<Map<String, dynamic>> punchAttendance'))
 s=s[:a]+s[a:].replace('    } catch (_) {','    } on AppFailure catch (e) {\n      if (e.statusCode != 404) rethrow;',1)
 # Remove all remaining service response prose from thrown messages.
 s=re.sub(r'''throw Exception\(\s*res.data is Map.*?: "Failed to (?:enroll client|record attendance)\.",\s*\);''','throw const AppFailure(FailureKind.unknown);',s,flags=re.S)
 return s
edit('core/repositories/agent_repository.dart',agent)
# Corresponding read pages render failure distinctly from empty state.
for path,repo,error,load in [
 ('features/payments/payments_page.dart','PaymentRepository','lastError','_loadPayments'),
 ('features/subsidy/subsidy_page.dart','SubsidyRepository','lastError','_loadStatus'),
 ('features/documents/documents_page.dart','DocumentRepository','lastError','_loadDocuments'),
 ('features/documents/documents_home_page.dart','DocumentRepository','lastError','_loadState'),
 ('features/support/service_page.dart','SupportRepository','lastError','_loadTickets'),
 ('features/project/project_page.dart','ProjectRepository','lastError','_loadProject'),
 ('agent/leads/agent_leads_page.dart','AgentRepository','leadsError','_loadLeads'),
 ('agent/tasks/agent_tasks_page.dart','AgentRepository','tasksError','_loadTasks'),
 ('agent/visits/agent_visits_page.dart','AgentRepository','visitsError','_loadData'),
]:
 def page(s):
  s=imp(s,'../../core/widgets/data_state.dart')
  call=f'{load}()'
  if path.startswith('agent/'):call=f'{load}(force: true)'
  if path=='features/project/project_page.dart':call='_loadProject(forceRefresh: true)'
  marker='Widget build(BuildContext context) {'
  if marker in s:
   s=s.replace(marker,marker+f'''\n    final loadError = {repo}.instance.{error};
    if (loadError != null) return Scaffold(
      appBar: AppBar(title: const Text('Sunlife Solar')),
      body: DataState(message: loadError, onRetry: () async {{ await {call}; }}),
    );''',1)
  else:
   # Expression-body page needs a method wrapper.
   marker='Widget build(BuildContext context) => '
   if marker in s:
    a=s.index(marker); expr=a+len(marker);b=s.index('\n}',expr)
    before=s[:a];body=s[expr:b].rstrip();body=body[:-1] if body.endswith(';') else body
    s=before+f'''Widget build(BuildContext context) {{
    final loadError = {repo}.instance.{error};
    if (loadError != null) return Scaffold(body: DataState(message: loadError, onRetry: () async {{ await {call}; }}));
    return '''+body+';\n  }'+s[b:]
  return s
 edit(path,page)
# Refresh actions must actually perform fresh reads.
for path,method in [('features/payments/payments_page.dart','getPaymentSummary'),('features/subsidy/subsidy_page.dart','getSubsidyStatus'),('features/documents/documents_page.dart','getDocuments'),('features/documents/documents_home_page.dart','getDocuments'),('features/support/service_page.dart','getTickets')]:
 edit(path,lambda s:s.replace(f'.{method}()',f'.{method}(forceRefresh: true)'))
# Remove additional raw identifier presentation.
for path in (lib/'features').rglob('*.dart'):
 s=path.read_text(encoding='utf-8').replace('Plant ID: ${p.id} •','Solar plant •').replace('Project ${project.id} •','Project •').replace("Info('Transaction ID', 'TXN-${item.id}'),",'').replace("'Ticket #${ticket.id} created'","'Service request received'")
 s=s.replace("final prjCode = activeProject?.id.isNotEmpty == true ? 'for project ${activeProject!.id}' : 'from Sunlife Solar';","const prjCode = 'from Sunlife Solar';")
 path.write_text(s,encoding='utf-8')
# Location failures have specific recovery guidance.
edit('agent/dashboard/agent_dashboard.dart',lambda s:s.replace("throw Exception('Location services are disabled. Please enable GPS on your device.');",'throw const AppFailure(FailureKind.locationDisabled);').replace("throw Exception('Location permission is required for attendance.');",'throw const AppFailure(FailureKind.locationPermission);').replace("throw Exception('Location permissions are permanently denied. Please allow in app settings.');",'throw const AppFailure(FailureKind.locationPermission);'))
# Profile cannot show unconditional refresh success after repository failures.
edit('agent/profile/agent_profile_page.dart',lambda s:s.replace("const SnackBar(\n                      backgroundColor: AppColors.deepGreen,\n                      content: Text('Refresh finished. Check any messages above for information that could not be updated.'),\n                    )", "SnackBar(content: Text(AgentRepository.instance.hasLoadError ? 'Some information could not be updated. Please try again.' : 'Your information is up to date.'))"))
# Lead mutation catches failures and always releases submit lock.
def detail(s):
 s=re.sub(r"        final custCode = .*;\n        final projCode = .*;\n",'',s)
 s=s.replace('final res = await AgentRepository.instance.enrollClient(', 'await AgentRepository.instance.enrollClient(')
 a=s.index('  Future<void> _saveStage()');b=s.index('  @override',a)
 s=s[:a]+'''  Future<void> _saveStage() async {
    if (isSaving) return;
    setState(() => isSaving = true);
    try {
      await AgentRepository.instance.updateLeadStage(widget.lead?.id ?? widget.name, stage);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(AppMessages.saved)),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ErrorMapper.message(e))),
      );
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

'''+s[b:]
 return s
edit('agent/leads/agent_lead_detail_page.dart',detail)
edit('agent/visits/agent_visit_detail_page.dart',lambda s:s.replace('Future<void> _completeVisit() async {','Future<void> _completeVisit() async {\n    if (_isSaving) return;'))
