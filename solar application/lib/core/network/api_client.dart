import '../errors/app_error.dart';
import 'dart:async';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage_service.dart';

class ApiException extends AppFailure {
  ApiException(this.diagnostic, {int? statusCode, dynamic details, FailureKind? kind})
      : super(kind ?? ErrorMapper.fromStatus(statusCode).kind, statusCode: statusCode);
  final String diagnostic;

  @override
  String get message => diagnostic.trim().isNotEmpty ? diagnostic.trim() : super.message;
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
        onResponse: (response, handler) {
          if (response.data is Map && response.data['success'] == false) {
            return handler.reject(DioException(
              requestOptions: response.requestOptions,
              type: DioExceptionType.unknown,
              error: const AppFailure(FailureKind.unknown),
            ));
          }
          handler.next(response);
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
      try {
        final existing = await _inFlightGetRequests[cacheKey]!;
        return existing as Response<T>;
      } on DioException catch (e) {
        throw _handleDioError(e);
      }
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
    final failure = ErrorMapper.map(error);
    String serverMsg = '';
    final resData = error.response?.data;
    if (resData is Map) {
      final msg = resData['error'] ?? resData['message'];
      if (msg != null && msg.toString().trim().isNotEmpty) {
        serverMsg = msg.toString().trim();
      }
    }
    return ApiException(serverMsg, statusCode: failure.statusCode, kind: failure.kind);
  }
}
