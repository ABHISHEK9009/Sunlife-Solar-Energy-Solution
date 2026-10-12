import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';

enum FailureKind {
  connection, timeout, validation, sessionExpired, permission, notFound,
  unavailable, conflict, rateLimit, cancelled, unknown, locationDisabled,
  locationPermission, upload, paymentUnavailable, save, accountNotFound,
}

/// Only reviewed, application-owned copy may cross the error/UI boundary.
abstract final class AppMessages {
  static const offline = 'You are offline. Previously saved information may not be current.';
  static const loading = 'Getting your latest information…';
  static const updated = 'Your information is up to date.';
  static const saved = 'Your changes have been saved.';
  static const codeSent = 'Your verification code has been sent.';
  static const retry = 'Retry';
  static const notificationTitle = 'Sunlife Solar update';
  static const notificationBody = 'Open the relevant section to view your latest information.';

  static String failure(FailureKind kind) => switch (kind) {
    FailureKind.connection => 'Please check your internet connection.',
    FailureKind.timeout => 'This is taking longer than expected. Please try again.',
    FailureKind.validation => 'Please check the information you entered and try again.',
    FailureKind.sessionExpired => 'Your session has expired. Please sign in again.',
    FailureKind.permission => "You don't have permission to access this section.",
    FailureKind.notFound => "We couldn't find what you're looking for.",
    FailureKind.accountNotFound => "We couldn't find your account. Please check your details or contact Sunlife Solar.",
    FailureKind.unavailable => 'This service is temporarily unavailable. Please try again later.',
    FailureKind.conflict => 'This information has changed or the request was already received. Refresh and check before submitting again.',
    FailureKind.rateLimit => 'Please wait a little before trying again.',
    FailureKind.cancelled => 'The request was cancelled.',
    FailureKind.locationDisabled => 'Turn on location services and try again.',
    FailureKind.locationPermission => 'Allow location access in your device settings to record attendance.',
    FailureKind.upload => "Your document couldn't be uploaded. Please select the file again and try again.",
    FailureKind.paymentUnavailable => 'Online payments are currently unavailable. Contact Sunlife Solar for payment options.',
    FailureKind.save => "Your changes couldn't be saved. Please try again.",
    FailureKind.unknown => "We couldn't complete your request. Please try again.",
  };
}

class AppFailure implements Exception {
  const AppFailure(this.kind, {this.statusCode});
  final FailureKind kind;
  final int? statusCode;
  String get message => AppMessages.failure(kind);
  bool get canRetryRead => const {
    FailureKind.connection, FailureKind.timeout, FailureKind.unavailable,
    FailureKind.unknown,
  }.contains(kind);
  @override
  String toString() => message;
}

abstract final class ErrorMapper {
  static AppFailure fromStatus(int? status) => AppFailure(switch (status ?? 0) {
    400 || 422 => FailureKind.validation,
    401 => FailureKind.sessionExpired,
    403 => FailureKind.permission,
    404 || 410 => FailureKind.notFound,
    408 || 504 => FailureKind.timeout,
    409 || 412 => FailureKind.conflict,
    429 => FailureKind.rateLimit,
    >= 500 => FailureKind.unavailable,
    _ => FailureKind.unknown,
  }, statusCode: status);

  static AppFailure map(Object? error) {
    if (error is AppFailure) return error;
    if (error is DioException) {
      if (error.error is AppFailure) return error.error as AppFailure;
      if (error.response?.statusCode != null) {
        return fromStatus(error.response!.statusCode);
      }
      return AppFailure(switch (error.type) {
        DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout ||
        DioExceptionType.sendTimeout => FailureKind.timeout,
        DioExceptionType.connectionError => FailureKind.connection,
        DioExceptionType.cancel => FailureKind.cancelled,
        _ => FailureKind.unknown,
      });
    }
    if (error is SocketException) return const AppFailure(FailureKind.connection);
    if (error is TimeoutException) return const AppFailure(FailureKind.timeout);
    return const AppFailure(FailureKind.unknown);
  }

  static String message(Object? error) => map(error).message;
}
