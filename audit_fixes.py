from pathlib import Path
import re
lib=Path('solar application/lib')
def edit(path,fn):
 p=lib/path;s=p.read_text(encoding='utf-8');p.write_text(fn(s),encoding='utf-8')
def imp(s,p):
 line=f"import '{p}';\n";return s if line in s else line+s
# Auth: allowlisted success copy, no backend prose; no optimistic enquiry persistence.
def auth(s):
 s=s.replace("message: data['message'] as String?,",'message: AppMessages.codeSent,')
 s=re.sub(r"final errorMsg = data\?\['error'\]\?\.toString\(\) \?\? '[^']*';",'final errorMsg = AppMessages.failure(FailureKind.unknown);',s)
 a=s.index("        final channel =");b=s.index('        return OtpRequestResult(',a)
 s=s[:a]+"        const message = AppMessages.codeSent;\n"+s[b:]
 a=s.index("      final errorMsg = (data != null");b=s.index('    } catch (e)',a)
 s=s[:a]+"      throw const AppFailure(FailureKind.validation);\n"+s[b:]
 s=s.replace("throw ApiException('Enter a valid 6-digit OTP');","throw const AppFailure(FailureKind.validation);")
 s=s.replace("if (e is ApiException) rethrow;", "if (e is AppFailure) rethrow;")
 a=s.index('    } catch (err) {',s.index('Future<bool> submitLeadEnquiryChunk'));b=s.index('  Future<UserProfile?> loadStoredSession',a)
 s=s[:a]+'''    } catch (err) {
      throw ErrorMapper.map(err);
    }
    throw const AppFailure(FailureKind.save);
  }

'''+s[b:]
 s=s.replace("if ((res.statusCode == 200 || res.statusCode == 201) && data != null) {", "if ((res.statusCode == 200 || res.statusCode == 201) && data != null && data['success'] == true) {")
 return s
edit(Path('core/repositories/auth_repository.dart'),auth)
# Onboarding errors retain fields and current step.
def onboard(s):
 s=imp(s,'../../core/errors/app_error.dart')
 s=s.replace('_currentStep = 2; // Allow moving forward gracefully','_errorMessage = ErrorMapper.message(e);')
 s=s.replace('    } catch (_) {}', '''    } catch (e) {
      if (mounted) setState(() {
        _errorMessage = ErrorMapper.message(e);
        _isLoading = false;
      });
      return;
    }''')
 for method in ['_handleStep1Next','_handleStep2Submit']:
  s=s.replace(f'Future<void> {method}() async {{',f'Future<void> {method}() async {{\n    if (_isLoading) return;')
 s=s.replace('Solar Survey Booked! 🎉','Your enquiry has been received')
 return s
edit(Path('features/enquiry/enquiry_onboarding_page.dart'),onboard)
edit(Path('features/auth/otp_page.dart'),lambda s:s.replace("Text(res.message ?? 'A new verification code has been dispatched')","Text(res.success ? AppMessages.codeSent : (res.error ?? AppMessages.failure(FailureKind.unknown)))"))
# Strict real-file upload and confirmed document record.
def docs(s):
 a=s.index('    FormData formData;');b=s.index('    final res =',a)
 s=s[:a]+'''    FormData formData;
    try {
      final multipart = fileBytes != null
          ? MultipartFile.fromBytes(fileBytes, filename: fileName)
          : await MultipartFile.fromFile(filePath, filename: fileName);
      formData = FormData.fromMap({
        'file': multipart,
        'documentCategory': category,
        'documentName': title,
        'projectId': activeProject.id,
      });
    } catch (_) {
      throw const AppFailure(FailureKind.upload);
    }

'''+s[b:]
 s=s.replace('ApiClient.instance.dio.post(', 'ApiClient.instance.post(')
 a=s.index("    final docData = resData['document']");b=s.index('    final savedDoc',a)
 s=s[:a]+'''    if (resData['document'] is! Map<String, dynamic> ||
        (resData['document']['id'] as String? ?? '').isEmpty) {
      throw const AppFailure(FailureKind.upload);
    }
    final docData = resData['document'] as Map<String, dynamic>;

'''+s[b:]
 s=s.replace("    final isPdf = fileName.toLowerCase().endsWith('.pdf');\n    final mimeType = isPdf ? 'application/pdf' : 'image/jpeg';\n",'')
 return s
edit(Path('core/repositories/document_repository.dart'),docs)
def docpage(s):
 s=imp(s,'../../core/errors/app_error.dart')
 a=s.index('    } catch (_) {');b=s.index('    } finally {',a)
 s=s[:a]+'''    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorMapper.message(e))),
        );
      }
'''+s[b:]
 s=s.replace('Future<void> _pickAndUploadCheque() async {','Future<void> _pickAndUploadCheque() async {\n    if (_isUploading) return;')
 return s
edit(Path('features/documents/documents_home_page.dart'),docpage)
# Do not pretend a local checklist uploads customer documents.
edit(Path('agent/documents/agent_documents_page.dart'),lambda s:s.replace("setState(() => received.add(i));\n                              _message('${documents[i]} uploaded');", "_message('Document upload is unavailable here. Please contact your team manager to submit this document.');"))
# Payment outage uses a typed failure; no integration details.
def payment(s):
 a=s.index('    throw Exception(\n');s=s[:a]+'''    throw const AppFailure(FailureKind.paymentUnavailable);
  }
}
''';return s
edit(Path('core/repositories/payment_repository.dart'),payment)
def paypage(s):
 s=imp(s,'../../core/errors/app_error.dart')
 s=s.replace('Future<void> _handlePayment() async {','Future<void> _handlePayment() async {\n    if (_isPaying) return;')
 a=s.index('      final success =');b=s.index('\n    }\n  }',a)
 s=s[:a]+'''      try {
        final success = await PaymentRepository.instance.processPayment(
          amount: summary.remainingBalance, method: method,
        );
        if (success && mounted) await _loadPayments();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ErrorMapper.message(e))),
        );
      } finally {
        if (mounted) setState(() => _isPaying = false);
      }'''+s[b:]
 a=s.index('    final summary = _summary ??');b=s.index('    final progress =',a)
 s=s[:a]+'''    final summary = _summary ?? PaymentSummary.empty();

'''+s[b:]
 return s
edit(Path('features/payments/payments_page.dart'),paypage)
def subsidy(s):
 a=s.index('    final s = _status ??');b=s.index('    return SubPage(',a)
 s=s[:a]+'''    final s = _status ?? SubsidyStatus.empty();

'''+s[b:];return s
edit(Path('features/subsidy/subsidy_page.dart'),subsidy)
# Remove internal IDs from presentation; retain them for all request routing.
edit(Path('features/profile/profile_page.dart'),lambda s:re.sub(r'    final customerId = .*;\n','',s).replace("'Customer ID: $customerId'","'Sunlife Solar customer'").replace("(activeProject?.id ?? 'Pending Survey')","(activeProject?.projectIdCode ?? 'Information is not available yet.')"))
edit(Path('agent/profile/agent_profile_page.dart'),lambda s:re.sub(r'    final agentId = .*;\n','',s).replace("'Field Sales Agent · $agentId'","'Sunlife Solar field partner'").replace("user?.territory ?? 'Jaipur Central'","user?.territory ?? 'Not assigned yet'"))
edit(Path('features/project/project_page.dart'),lambda s:s.replace('Text(p.id,','Text(p.projectIdCode ?? \'Solar project\','))
edit(Path('features/project/project_detail_page.dart'),lambda s:s.replace("Project ${p.id} •", "Project •"))
for path in ['features/support/service_page.dart','features/support/service_request_page.dart']:
 edit(Path(path),lambda s:s.replace("'#${ticket.id}'","'Service request'").replace("'Ticket #${ticket.id}'","'Service request'"))
# Server notifications contain only approved fixed text; routing/data retained internally.
edit(Path('core/models/notification_item.dart'),lambda s:imp(s,'../errors/app_error.dart').replace("title: json['title'] as String? ?? '',",'title: AppMessages.notificationTitle,').replace("message: json['message'] as String? ?? '',",'message: AppMessages.notificationBody,'))
edit(Path('core/repositories/support_repository.dart'),lambda s:s.replace("title: 'Ticket #${newTicket.id} submitted'","title: 'Service request submitted'"))
# Guard user-triggered forms against repeated taps before a rebuild.
for path,method,flag in [('features/auth/login_page.dart','_submit','_isLoading'),('features/auth/otp_page.dart','_verify','_isLoading'),('features/support/service_request_page.dart','_submit','_isSubmitting'),('agent/leads/agent_lead_capture_page.dart','_save','_isSaving')]:
 p=lib/path;s=p.read_text(encoding='utf-8')
 if flag in s:
  s=s.replace(f'Future<void> {method}() async {{',f'Future<void> {method}() async {{\n    if ({flag}) return;')
  p.write_text(s,encoding='utf-8')
