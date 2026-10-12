from pathlib import Path
import re
root=Path('solar application')
lib=root/'lib'
changes=[]
def edit(path, fn):
 p=lib/path; old=p.read_text(encoding='utf-8'); new=fn(old)
 if old!=new:p.write_text(new,encoding='utf-8')
def add_import(s,path):
 imp=f"import '{path}';\n"
 return s if imp in s else imp+s
# Snapshot original terminology before presentation edits.
pattern=re.compile(r'crm|database|backend|server|gateway|exception|debugPrint|\$err\b|\$e\b|e\.toString\(|err\.toString\(',re.I)
rows=[]
for p in sorted(lib.rglob('*.dart')):
 if '/errors/' in p.as_posix():continue
 for n,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
  if pattern.search(line):rows.append(f'| `{p.relative_to(root).as_posix()}:{n}` | `{line.strip().replace(chr(124),chr(92)+chr(124))}` |')
(root/'audit').mkdir(exist_ok=True)
(root/'audit/original_findings.md').write_text('# Original technical-text and error-path inventory\n\nCaptured before edits. Includes internal declarations/comments as well as UI sinks; internal-only matches are permitted. Never treat the raw match count as a count of exposed UI messages.\n\n| Location | Original source |\n|---|---|\n'+'\n'.join(rows)+'\n',encoding='utf-8')
# Preserve ApiException compatibility while ensuring that its text is never trusted.
def client(s):
 s=add_import(s,'../errors/app_error.dart')
 start=s.index('class ApiException'); end=s.index('class ApiClient')
 s=s[:start]+'''class ApiException extends AppFailure {
  ApiException(String diagnostic, {int? statusCode, dynamic details, FailureKind? kind})
      : super(kind ?? ErrorMapper.fromStatus(statusCode).kind, statusCode: statusCode);
}

'''+s[end:]
 start=s.index('  ApiException _handleDioError(')
 s=s[:start]+'''  ApiException _handleDioError(DioException error) {
    final failure = ErrorMapper.map(error);
    return ApiException('', statusCode: failure.statusCode, kind: failure.kind);
  }
}
'''
 # Each shared GET waiter must receive mapped errors too.
 s=s.replace('final existing = await _inFlightGetRequests[cacheKey]!;\n      return existing as Response<T>;', '''try {
        final existing = await _inFlightGetRequests[cacheKey]!;
        return existing as Response<T>;
      } on DioException catch (e) {
        throw _handleDioError(e);
      }''')
 # Detect explicit application rejection, even on a successful HTTP status.
 s=s.replace('        onError: (DioException error, handler) async {', '''        onResponse: (response, handler) {
          if (response.data is Map && response.data['success'] == false) {
            return handler.reject(DioException(
              requestOptions: response.requestOptions,
              type: DioExceptionType.unknown,
              error: const AppFailure(FailureKind.unknown),
            ));
          }
          handler.next(response);
        },
        onError: (DioException error, handler) async {''')
 return s
edit(Path('core/network/api_client.dart'),client)
for p in lib.rglob('*.dart'):
 if '/errors/' in p.as_posix():continue
 s=p.read_text(encoding='utf-8'); old=s
 s=s.replace("e.toString().replaceAll('Exception:', '').trim()",'ErrorMapper.message(e)')
 s=s.replace('e.toString()', 'ErrorMapper.message(e)').replace('err.toString()', 'ErrorMapper.message(err)')
 s=s.replace("Text('Failed to complete survey: $e')",'Text(ErrorMapper.message(e))').replace("Text('Error saving lead: $e')",'Text(ErrorMapper.message(e))')
 # No raw diagnostics in device logs.
 s=re.sub(r'^\s*debugPrint\([^\n]*\);\n','\n',s,flags=re.M)
 if 'ErrorMapper.' in s:
  rel='../errors/app_error.dart' if 'core/' in p.relative_to(lib).as_posix() else '../../core/errors/app_error.dart'
  s=add_import(s,rel)
 if s!=old:p.write_text(s,encoding='utf-8')
# Localized presentation copies are centralized by errors; static ordinary labels remain readable.
replacements={
'Only active employees registered in CRM can sign in':'Only active Sunlife Solar employees can sign in',
'Your rooftop solar assessment for $city is registered in Sunlife CRM.':'View your rooftop solar assessment for $city.',
'CRM Connection':'Your solar enquiry',
'Authoritative CRM Connection Active':'Sunlife Solar support',
'Your enquiry records are synchronized in real-time with Sunlife Solar CRM.':'Contact your advisor for help with your enquiry.',
'Refresh from CRM Database':'Refresh project details',
'$remainingCount CRM tasks pending today':'$remainingCount tasks pending today',
'Synced in real-time with your assigned leads':'Tasks for your assigned leads',
'No pending tasks assigned to you in CRM':'No pending tasks assigned to you',
'CRM Employee':'Field Partner',
'CRM access':'Account',
"'Connected'":"'Signed in'",
'CRM sync':'Refresh information',
'Last synced just now':'Get your latest information',
'Syncing CRM records with server…':'Getting your latest information…',
'All CRM records synced in real-time!':'Refresh finished. Check any messages above for information that could not be updated.',
'Any unsynced field updates should be saved before logging out.':'Save your field updates before logging out.',
'Enroll as CRM Customer?':'Enroll as a customer?',
'This will register ${widget.name} (${widget.phone}) as an official customer in the Sunlife Solar CRM and initialize their project record.':'This will register ${widget.name} (${widget.phone}) as a Sunlife Solar customer and create their project.',
'Successfully enrolled $custCode ($projCode) in CRM!':'Customer enrolled successfully.',
'${widget.name} updated to "$stage" in CRM':'Lead status updated.',
'Save to CRM':'Save changes',
'Follow-up scheduled in CRM':'To arrange a follow-up, contact your team manager.',
'Enroll as CRM Customer':'Enroll as a customer',
'Register client & create project in CRM':'Register customer and create project',
'Save Lead to CRM':'Save lead',
'${widget.customer} site survey completed & saved to CRM':'Site survey completed and saved.',
'Working offline • Cached data displayed':'You are offline. Saved information may not be current.',
}
for p in list((lib/'features').rglob('*.dart'))+list((lib/'agent').rglob('*.dart'))+[lib/'core/network/connectivity_service.dart']:
 s=p.read_text(encoding='utf-8')
 for a,b in replacements.items():
  if a in s:
   changes.append((p.relative_to(root).as_posix(),a,b));s=s.replace(a,b)
 p.write_text(s,encoding='utf-8')
(root/'audit/wording_changes.md').write_text('# Wording changes\n\n| File | Original | Replacement |\n|---|---|---|\n'+'\n'.join('| '+' | '.join(x.replace('|','\\|') for x in row)+' |' for row in changes)+'\n',encoding='utf-8')
# Both app entrypoints get identical error boundaries.
for name in ['main.dart','main_agent.dart']:
 def main(s):
  s=s.replace("import 'dart:ui';\n",'')
  s=add_import(s,'core/errors/error_feedback.dart')
  if '// Production global error boundaries' in s:
   a=s.index('  // Production global error boundaries');b=s.index('  await SystemChrome',a);s=s[:a]+s[b:]
  s=s.replace('WidgetsFlutterBinding.ensureInitialized();','WidgetsFlutterBinding.ensureInitialized();\n  ErrorFeedback.install();')
  s=s.replace("debugShowCheckedModeBanner: false,", "debugShowCheckedModeBanner: false,\n        scaffoldMessengerKey: ErrorFeedback.messengerKey,")
  return s
 edit(Path(name),main)
