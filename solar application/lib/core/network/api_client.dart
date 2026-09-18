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
  String toString() => 'ApiException: $message (code: $statusCode)';
}

class ApiClient {
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
          final token = await SecureStorageService.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            final refreshed = await _refreshToken();
            if (refreshed) {
              final token = await SecureStorageService.getAccessToken();
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer $token';
              try {
                final cloneReq = await _dio.fetch(opts);
                return handler.resolve(cloneReq);
              } catch (_) {
                // Refresh failed
              }
            }
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
    if (token != null && token.isNotEmpty) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    } else {
      _dio.options.headers.remove('Authorization');
    }
  }

  Future<bool> _refreshToken() async {
    if (!enableLiveApi) return false;
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final res = await _dio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
        options: Options(headers: {'Authorization': null}),
      );

      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        final newAccess = res.data['access_token'] as String?;
        final newRefresh = res.data['refresh_token'] as String?;
        if (newAccess != null) {
          await SecureStorageService.saveTokens(
            accessToken: newAccess,
            refreshToken: newRefresh ?? refreshToken,
          );
          return true;
        }
      }
    } catch (_) {
      await SecureStorageService.clearSession();
    }
    return false;
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
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
    String message = 'Network connection failed. Please check your internet.';
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      message = 'Connection timed out. Please try again.';
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
            message = 'Session expired. Please sign in again.';
            break;
          case 403:
            message = 'You do not have permission to perform this action.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          default:
            message = 'Request failed with code $statusCode.';
        }
      }
      return ApiException(message, statusCode: statusCode, details: data);
    }
    return ApiException(message);
  }
}
