import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static final Map<String, String> _inMemoryFallback = {};

  static const String _keyAccessToken = 'auth_access_token';
  static const String _keyRefreshToken = 'auth_refresh_token';
  static const String _keyUserRole = 'auth_user_role';
  static const String _keyUserId = 'auth_user_id';
  static const String _keyUserName = 'auth_user_name';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _inMemoryFallback[_keyAccessToken] = accessToken;
    _inMemoryFallback[_keyRefreshToken] = refreshToken;
    try {
      await _storage
          .write(key: _keyAccessToken, value: accessToken)
          .timeout(const Duration(milliseconds: 300));
      await _storage
          .write(key: _keyRefreshToken, value: refreshToken)
          .timeout(const Duration(milliseconds: 300));
    } catch (_) {}
  }

  static Future<String?> getAccessToken() async {
    if (_inMemoryFallback.containsKey(_keyAccessToken)) {
      return _inMemoryFallback[_keyAccessToken];
    }
    try {
      final val = await _storage
          .read(key: _keyAccessToken)
          .timeout(const Duration(milliseconds: 300));
      if (val != null) _inMemoryFallback[_keyAccessToken] = val;
      return val;
    } catch (_) {
      return _inMemoryFallback[_keyAccessToken];
    }
  }

  static Future<String?> getRefreshToken() async {
    if (_inMemoryFallback.containsKey(_keyRefreshToken)) {
      return _inMemoryFallback[_keyRefreshToken];
    }
    try {
      final val = await _storage
          .read(key: _keyRefreshToken)
          .timeout(const Duration(milliseconds: 300));
      if (val != null) _inMemoryFallback[_keyRefreshToken] = val;
      return val;
    } catch (_) {
      return _inMemoryFallback[_keyRefreshToken];
    }
  }

  static Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String role,
    required String userId,
    String? userName,
  }) async {
    await saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    _inMemoryFallback[_keyUserRole] = role;
    _inMemoryFallback[_keyUserId] = userId;
    if (userName != null) {
      _inMemoryFallback[_keyUserName] = userName;
    }

    try {
      await _storage
          .write(key: _keyUserRole, value: role)
          .timeout(const Duration(milliseconds: 300));
      await _storage
          .write(key: _keyUserId, value: userId)
          .timeout(const Duration(milliseconds: 300));
      if (userName != null) {
        await _storage
            .write(key: _keyUserName, value: userName)
            .timeout(const Duration(milliseconds: 300));
      }
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance()
          .timeout(const Duration(milliseconds: 300));
      await prefs.setBool('is_authenticated', true);
      await prefs.setString('user_role', role);
    } catch (_) {}
  }

  static Future<String?> getUserRole() async {
    if (_inMemoryFallback.containsKey(_keyUserRole)) {
      return _inMemoryFallback[_keyUserRole];
    }
    try {
      final val = await _storage
          .read(key: _keyUserRole)
          .timeout(const Duration(milliseconds: 300));
      if (val != null) _inMemoryFallback[_keyUserRole] = val;
      return val;
    } catch (_) {
      return _inMemoryFallback[_keyUserRole];
    }
  }

  static Future<String?> getUserId() async {
    if (_inMemoryFallback.containsKey(_keyUserId)) {
      return _inMemoryFallback[_keyUserId];
    }
    try {
      final val = await _storage
          .read(key: _keyUserId)
          .timeout(const Duration(milliseconds: 300));
      if (val != null) _inMemoryFallback[_keyUserId] = val;
      return val;
    } catch (_) {
      return _inMemoryFallback[_keyUserId];
    }
  }

  static Future<String?> getUserName() async {
    if (_inMemoryFallback.containsKey(_keyUserName)) {
      return _inMemoryFallback[_keyUserName];
    }
    try {
      final val = await _storage
          .read(key: _keyUserName)
          .timeout(const Duration(milliseconds: 300));
      if (val != null) _inMemoryFallback[_keyUserName] = val;
      return val;
    } catch (_) {
      return _inMemoryFallback[_keyUserName];
    }
  }

  static Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> clearSession() async {
    _inMemoryFallback.clear();
    try {
      await _storage
          .deleteAll()
          .timeout(const Duration(milliseconds: 300));
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance()
          .timeout(const Duration(milliseconds: 300));
      await prefs.remove('is_authenticated');
      await prefs.remove('user_role');
    } catch (_) {}
  }
}
