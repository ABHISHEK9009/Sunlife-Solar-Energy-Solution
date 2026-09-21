import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static bool useInMemoryOnly = false;
  static final Map<String, String> _inMemoryCache = {};

  static const String _keyAccessToken = 'auth_access_token';
  static const String _keyRefreshToken = 'auth_refresh_token';
  static const String _keyUserRole = 'auth_user_role';
  static const String _keyUserId = 'auth_user_id';
  static const String _keyUserName = 'auth_user_name';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _inMemoryCache[_keyAccessToken] = accessToken;
    _inMemoryCache[_keyRefreshToken] = refreshToken;

    if (useInMemoryOnly) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyAccessToken, accessToken);
      await prefs.setString(_keyRefreshToken, refreshToken);
      return;
    }

    try {
      await _storage.write(key: _keyAccessToken, value: accessToken).timeout(const Duration(milliseconds: 250));
      await _storage.write(key: _keyRefreshToken, value: refreshToken).timeout(const Duration(milliseconds: 250));
    } catch (_) {
      // Fallback via SharedPreferences if hardware keystore unavailable
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyAccessToken, accessToken);
      await prefs.setString(_keyRefreshToken, refreshToken);
    }
  }

  static Future<String?> getAccessToken() async {
    if (_inMemoryCache.containsKey(_keyAccessToken)) {
      return _inMemoryCache[_keyAccessToken];
    }

    if (!useInMemoryOnly) {
      try {
        final val = await _storage
            .read(key: _keyAccessToken)
            .timeout(const Duration(milliseconds: 250));
        if (val != null && val.isNotEmpty) {
          _inMemoryCache[_keyAccessToken] = val;
          return val;
        }
      } catch (_) {}
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final val = prefs.getString(_keyAccessToken);
      if (val != null && val.isNotEmpty) {
        _inMemoryCache[_keyAccessToken] = val;
        return val;
      }
    } catch (_) {}

    return null;
  }

  static Future<String?> getAuthToken() => getAccessToken();

  static Future<String?> getRefreshToken() async {
    if (_inMemoryCache.containsKey(_keyRefreshToken)) {
      return _inMemoryCache[_keyRefreshToken];
    }

    if (!useInMemoryOnly) {
      try {
        final val = await _storage
            .read(key: _keyRefreshToken)
            .timeout(const Duration(milliseconds: 250));
        if (val != null && val.isNotEmpty) {
          _inMemoryCache[_keyRefreshToken] = val;
          return val;
        }
      } catch (_) {}
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final val = prefs.getString(_keyRefreshToken);
      if (val != null && val.isNotEmpty) {
        _inMemoryCache[_keyRefreshToken] = val;
        return val;
      }
    } catch (_) {}

    return null;
  }

  static Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String role,
    required String userId,
    String? userName,
  }) async {
    await saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    _inMemoryCache[_keyUserRole] = role;
    _inMemoryCache[_keyUserId] = userId;
    if (userName != null) {
      _inMemoryCache[_keyUserName] = userName;
    }

    if (!useInMemoryOnly) {
      try {
        await _storage
            .write(key: _keyUserRole, value: role)
            .timeout(const Duration(milliseconds: 250));
        await _storage
            .write(key: _keyUserId, value: userId)
            .timeout(const Duration(milliseconds: 250));
        if (userName != null) {
          await _storage
              .write(key: _keyUserName, value: userName)
              .timeout(const Duration(milliseconds: 250));
        }
      } catch (_) {}
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_authenticated', true);
    await prefs.setString('user_role', role);
    await prefs.setString('user_id', userId);
    if (userName != null) {
      await prefs.setString('user_name', userName);
    }
  }

  static Future<String?> getUserRole() async {
    if (_inMemoryCache.containsKey(_keyUserRole)) {
      return _inMemoryCache[_keyUserRole];
    }
    if (!useInMemoryOnly) {
      try {
        final val = await _storage
            .read(key: _keyUserRole)
            .timeout(const Duration(milliseconds: 250));
        if (val != null && val.isNotEmpty) {
          _inMemoryCache[_keyUserRole] = val;
          return val;
        }
      } catch (_) {}
    }

    final prefs = await SharedPreferences.getInstance();
    final val = prefs.getString('user_role');
    if (val != null) _inMemoryCache[_keyUserRole] = val;
    return val;
  }

  static Future<String?> getUserId() async {
    if (_inMemoryCache.containsKey(_keyUserId)) {
      return _inMemoryCache[_keyUserId];
    }
    if (!useInMemoryOnly) {
      try {
        final val = await _storage
            .read(key: _keyUserId)
            .timeout(const Duration(milliseconds: 250));
        if (val != null && val.isNotEmpty) {
          _inMemoryCache[_keyUserId] = val;
          return val;
        }
      } catch (_) {}
    }

    final prefs = await SharedPreferences.getInstance();
    final val = prefs.getString('user_id');
    if (val != null) _inMemoryCache[_keyUserId] = val;
    return val;
  }

  static Future<String?> getUserName() async {
    if (_inMemoryCache.containsKey(_keyUserName)) {
      return _inMemoryCache[_keyUserName];
    }
    if (!useInMemoryOnly) {
      try {
        final val = await _storage
            .read(key: _keyUserName)
            .timeout(const Duration(milliseconds: 250));
        if (val != null && val.isNotEmpty) {
          _inMemoryCache[_keyUserName] = val;
          return val;
        }
      } catch (_) {}
    }

    final prefs = await SharedPreferences.getInstance();
    final val = prefs.getString('user_name');
    if (val != null) _inMemoryCache[_keyUserName] = val;
    return val;
  }

  static Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  /// Complete session and state purge on logout or expiry
  static Future<void> clearSession() async {
    _inMemoryCache.clear();
    if (!useInMemoryOnly) {
      try {
        await _storage.deleteAll().timeout(const Duration(milliseconds: 250));
      } catch (_) {}
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    } catch (_) {}
  }
}
