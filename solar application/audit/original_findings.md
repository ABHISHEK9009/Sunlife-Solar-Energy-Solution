# Original technical-text and error-path inventory

Captured before edits. Includes internal declarations/comments as well as UI sinks; internal-only matches are permitted. Never treat the raw match count as a count of exposed UI messages.

| Location | Original source |
|---|---|
| `lib/agent/auth/agent_login_page.dart:241` | `'Only active employees registered in CRM can sign in',` |
| `lib/agent/auth/agent_otp_page.dart:79` | `} on ApiException catch (e) {` |
| `lib/agent/dashboard/agent_dashboard.dart:60` | `throw Exception('Location services are disabled. Please enable GPS on your device.');` |
| `lib/agent/dashboard/agent_dashboard.dart:67` | `throw Exception('Location permission is required for attendance.');` |
| `lib/agent/dashboard/agent_dashboard.dart:72` | `throw Exception('Location permissions are permanently denied. Please allow in app settings.');` |
| `lib/agent/dashboard/agent_dashboard.dart:100` | `final message = e.toString().replaceAll('Exception:', '').trim();` |
| `lib/agent/dashboard/agent_dashboard.dart:119` | `// Parallelize independent CRM requests for zero-latency dashboard loading` |
| `lib/agent/leads/agent_lead_capture_page.dart:201` | `SnackBar(content: Text('Error saving lead: $e')),` |
| `lib/agent/leads/agent_lead_capture_page.dart:233` | `'Save Lead to CRM',` |
| `lib/agent/leads/agent_lead_detail_page.dart:70` | `title: const Text('Enroll as CRM Customer?'),` |
| `lib/agent/leads/agent_lead_detail_page.dart:72` | `'This will register ${widget.name} (${widget.phone}) as an official customer in the Sunlife Solar CRM and initialize their project record.',` |
| `lib/agent/leads/agent_lead_detail_page.dart:113` | `content: Text('Successfully enrolled $custCode ($projCode) in CRM!'),` |
| `lib/agent/leads/agent_lead_detail_page.dart:119` | `final message = e.toString().replaceAll('Exception:', '').trim();` |
| `lib/agent/leads/agent_lead_detail_page.dart:171` | `content: Text('${widget.name} updated to "$stage" in CRM'),` |
| `lib/agent/leads/agent_lead_detail_page.dart:194` | `'Save to CRM',` |
| `lib/agent/leads/agent_lead_detail_page.dart:321` | `const SnackBar(content: Text('Follow-up scheduled in CRM')),` |
| `lib/agent/leads/agent_lead_detail_page.dart:326` | `'Enroll as CRM Customer',` |
| `lib/agent/leads/agent_lead_detail_page.dart:327` | `'Register client & create project in CRM',` |
| `lib/agent/profile/agent_profile_page.dart:21` | `final agentId = user?.id.isNotEmpty == true ? user!.id : 'CRM Employee';` |
| `lib/agent/profile/agent_profile_page.dart:81` | `const Info('CRM access', 'Connected', last: true),` |
| `lib/agent/profile/agent_profile_page.dart:126` | `'CRM sync',` |
| `lib/agent/profile/agent_profile_page.dart:131` | `content: Text('Syncing CRM records with server…'),` |
| `lib/agent/profile/agent_profile_page.dart:144` | `content: Text('All CRM records synced in real-time!'),` |
| `lib/agent/tasks/agent_tasks_page.dart:153` | `: '$remainingCount CRM tasks pending today',` |
| `lib/agent/tasks/agent_tasks_page.dart:194` | `'No pending tasks assigned to you in CRM',` |
| `lib/agent/visits/agent_visit_detail_page.dart:184` | `content: Text('${widget.customer} site survey completed & saved to CRM'),` |
| `lib/agent/visits/agent_visit_detail_page.dart:195` | `content: Text('Failed to complete survey: $e'),` |
| `lib/core/models/field_visit.dart:46` | `?.map((e) => e.toString())` |
| `lib/core/models/notification_item.dart:41` | `final parsedDate = rawDate != null ? DateTime.tryParse(rawDate.toString()) ?? DateTime.now() : DateTime.now();` |
| `lib/core/models/solar_project.dart:95` | `final double capacityKw; // Support fractional capacity like 3.5 kW without cast exceptions` |
| `lib/core/models/solar_project.dart:147` | `/// CRM-driven installation work listing with conditional milestones based on solar system type` |
| `lib/core/models/solar_project.dart:366` | `?.map((e) => e.toString())` |
| `lib/core/models/subsidy_status.dart:83` | `? stagesList.map((e) => e.toString().replaceAll('_', ' ').toLowerCase()).map((s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}').toList()` |
| `lib/core/network/api_client.dart:6` | `class ApiException implements Exception {` |
| `lib/core/network/api_client.dart:7` | `ApiException(this.message, {this.statusCode, this.details});` |
| `lib/core/network/api_client.dart:49` | `onError: (DioException error, handler) async {` |
| `lib/core/network/api_client.dart:100` | `} on DioException catch (e) {` |
| `lib/core/network/api_client.dart:120` | `} on DioException catch (e) {` |
| `lib/core/network/api_client.dart:138` | `} on DioException catch (e) {` |
| `lib/core/network/api_client.dart:143` | `ApiException _handleDioError(DioException error) {` |
| `lib/core/network/api_client.dart:145` | `if (error.type == DioExceptionType.connectionTimeout \|\|` |
| `lib/core/network/api_client.dart:146` | `error.type == DioExceptionType.receiveTimeout \|\|` |
| `lib/core/network/api_client.dart:147` | `error.type == DioExceptionType.sendTimeout) {` |
| `lib/core/network/api_client.dart:177` | `return ApiException(message, statusCode: statusCode, details: data);` |
| `lib/core/network/api_client.dart:179` | `return ApiException(message);` |
| `lib/core/repositories/agent_repository.dart:65` | `/// Adds new lead. Awaits real server confirmation; never fabricates local mock success.` |
| `lib/core/repositories/agent_repository.dart:112` | `throw Exception("Failed to save lead to CRM. Server rejected the request.");` |
| `lib/core/repositories/agent_repository.dart:133` | `throw Exception("Server returned ${res.statusCode}");` |
| `lib/core/repositories/agent_repository.dart:139` | `throw Exception("Could not update lead status: ${err.toString()}");` |
| `lib/core/repositories/agent_repository.dart:196` | `/// Completes a visit with real server persistence and error rollback.` |
| `lib/core/repositories/agent_repository.dart:206` | `if (i == -1) throw Exception("Visit record not found.");` |
| `lib/core/repositories/agent_repository.dart:230` | `throw Exception("Server returned ${res.statusCode}");` |
| `lib/core/repositories/agent_repository.dart:236` | `throw Exception("Failed to complete visit on server: ${err.toString()}");` |
| `lib/core/repositories/agent_repository.dart:303` | `/// Enrolls client directly into CRM via /api/v1/agent/enroll-client` |
| `lib/core/repositories/agent_repository.dart:336` | `throw Exception(` |
| `lib/core/repositories/agent_repository.dart:362` | `throw Exception("Agent must be logged in to record attendance.");` |
| `lib/core/repositories/agent_repository.dart:393` | `throw Exception(` |
| `lib/core/repositories/auth_repository.dart:88` | `if (e is ApiException) {` |
| `lib/core/repositories/auth_repository.dart:91` | `return OtpRequestResult(success: false, error: e.toString());` |
| `lib/core/repositories/auth_repository.dart:95` | `// Customer OTP Request via CRM Server (Server-side WhatsApp/SMS Dispatch)` |
| `lib/core/repositories/auth_repository.dart:117` | `if (e is ApiException) {` |
| `lib/core/repositories/auth_repository.dart:120` | `return OtpRequestResult(success: false, error: e.toString());` |
| `lib/core/repositories/auth_repository.dart:133` | `throw ApiException('Enter a valid 6-digit OTP');` |
| `lib/core/repositories/auth_repository.dart:146` | `throw ApiException('Invalid session received from server.');` |
| `lib/core/repositories/auth_repository.dart:228` | `throw ApiException(errorMsg);` |
| `lib/core/repositories/auth_repository.dart:230` | `if (e is ApiException) rethrow;` |
| `lib/core/repositories/auth_repository.dart:231` | `throw ApiException('Unable to verify OTP. Please check your connection and try again.');` |
| `lib/core/repositories/auth_repository.dart:304` | `debugPrint('[fetchMe Error]: $err');` |
| `lib/core/repositories/auth_repository.dart:337` | `debugPrint('[submitLeadEnquiryChunk Error]: $err');` |
| `lib/core/repositories/auth_repository.dart:389` | `// Silently refresh current identity from backend` |
| `lib/core/repositories/document_repository.dart:74` | `_lastError = err.toString();` |
| `lib/core/repositories/document_repository.dart:85` | `/// Real multipart file upload to backend. Awaits server confirmation before updating state.` |
| `lib/core/repositories/document_repository.dart:97` | `throw Exception("No active project found for document attachment.");` |
| `lib/core/repositories/document_repository.dart:133` | `throw Exception("Server failed to register document upload.");` |
| `lib/core/repositories/payment_repository.dart:54` | `_lastError = err.toString();` |
| `lib/core/repositories/payment_repository.dart:65` | `/// Online payment processor. Requires server-side gateway order creation & verification.` |
| `lib/core/repositories/payment_repository.dart:73` | `throw Exception("No active project found to process payment.");` |
| `lib/core/repositories/payment_repository.dart:77` | `throw Exception("Please enter a valid payment amount.");` |
| `lib/core/repositories/payment_repository.dart:82` | `throw Exception(` |
| `lib/core/repositories/payment_repository.dart:83` | `"Online payment gateway integration is currently in verification mode. "` |
| `lib/core/repositories/project_repository.dart:102` | `_lastError = e.toString();` |
| `lib/core/repositories/subsidy_repository.dart:57` | `_lastError = err.toString();` |
| `lib/core/repositories/support_repository.dart:52` | `_lastError = err.toString();` |
| `lib/core/repositories/support_repository.dart:63` | `/// Creates real support ticket on server. Awaits backend confirmation before updating UI state.` |
| `lib/core/repositories/support_repository.dart:101` | `throw Exception("Server failed to create support ticket.");` |
| `lib/core/repositories/support_repository.dart:117` | `throw Exception("Failed to confirm ticket resolution.");` |
| `lib/core/repositories/support_repository.dart:135` | `throw Exception("Failed to reopen ticket.");` |
| `lib/core/repositories/support_repository.dart:153` | `throw Exception("Failed to submit ticket rating.");` |
| `lib/features/auth/login_page.dart:60` | `setState(() => _errorMessage = e.toString());` |
| `lib/features/auth/otp_page.dart:90` | `debugPrint('OtpPage verify error: $e');` |
| `lib/features/auth/otp_page.dart:92` | `setState(() => _errorMessage = e.toString());` |
| `lib/features/home/home_page.dart:189` | `'Your rooftop solar assessment for $city is registered in Sunlife CRM.',` |
| `lib/features/home/home_page.dart:360` | `const Heading('CRM Connection'),` |
| `lib/features/home/home_page.dart:365` | `'Authoritative CRM Connection Active',` |
| `lib/features/home/home_page.dart:366` | `'Your enquiry records are synchronized in real-time with Sunlife Solar CRM.',` |
| `lib/features/project/project_page.dart:179` | `label: const Text('Refresh from CRM Database'),` |
| `lib/features/support/service_request_page.dart:83` | `_validationError = e.toString();` |
| `lib/main.dart:16` | `debugPrint('FlutterError caught: ${details.exceptionAsString()}');` |
| `lib/main.dart:20` | `debugPrint('PlatformDispatcher error: $error\n$stack');` |
