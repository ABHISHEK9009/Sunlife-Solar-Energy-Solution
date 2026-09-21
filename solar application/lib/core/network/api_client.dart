import 'dart:async';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage_service.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.details});

  final String message;
  final int? statusCode;
  final dynamic details;

  @override
  String toString() => message;
}

class ApiClient {
  String? _cachedToken;
  final Map<String, Future<Response<dynamic>>> _inFlightGetRequests = {};
  static void Function()? onSessionExpired;

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          var token = _cachedToken;
          if (token == null || token.isEmpty) {
            token = await SecureStorageService.getAccessToken();
            _cachedToken = token;
          }
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Session expired: purge credentials cleanly without recursive loop
            _cachedToken = null;
            await SecureStorageService.clearSession();
            onSessionExpired?.call();
          }
          return handler.next(error);
        },
      ),
    );
  }

  static bool enableLiveApi =
      const bool.fromEnvironment('LIVE_API', defaultValue: true);

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;

  Dio get dio => _dio;

  void setAuthToken(String? token) {
    _cachedToken = token;
    if (token != null && token.isNotEmpty) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    } else {
      _dio.options.headers.remove('Authorization');
    }
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final cacheKey = '$path?${queryParameters?.toString() ?? ''}';
    if (_inFlightGetRequests.containsKey(cacheKey)) {
      final existing = await _inFlightGetRequests[cacheKey]!;
      return existing as Response<T>;
    }

    final future = _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );

    _inFlightGetRequests[cacheKey] = future;
    try {
      final res = await future;
      return res;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } finally {
      _inFlightGetRequests.remove(cacheKey);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  ApiException _handleDioError(DioException error) {
    String message = 'Network connection failed. Please check your internet connection.';
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      message = 'Connection timed out. Please check your network and try again.';
    } else if (error.response != null) {
      final statusCode = error.response?.statusCode;
      final data = error.response?.data;
      if (data is Map && data.containsKey('error')) {
        message = data['error'].toString();
      } else if (data is Map && data.containsKey('message')) {
        message = data['message'].toString();
      } else {
        switch (statusCode) {
          case 400:
            message = 'Invalid request parameters.';
            break;
          case 401:
            message = 'Your session has expired. Please sign in again.';
            break;
          case 403:
            message = 'You do not have permission to perform this action.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 500:
            message = 'Unable to complete the request right now. Please try again.';
            break;
          default:
            message = 'Request failed. Please try again.';
        }
      }
      return ApiException(message, statusCode: statusCode, details: data);
    }
    return ApiException(message);
  }
}
