import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _loading = false;
  String? _error;

  Map<String, dynamic>? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;
  String get userName => _user?['name'] ?? 'Neo';
  String get userTier => _user?['tier'] ?? 'free';

  Future<void> init() async {
    _user = await ApiService.getUser();
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.login(email: email, password: password);
      if (data.containsKey('token')) {
        _user = data;
        try {
          final fcmToken = await FirebaseMessaging.instance.getToken();
          print('[FCM] token: ' + (fcmToken ?? 'NULL'));
          if (fcmToken != null) {
            await ApiService.registerFCMToken(fcmToken);
            print('[FCM] registered ok');
          }
        } catch (e) { print('[FCM] error: ' + e.toString()); }
        _loading = false; notifyListeners(); return true;
      }
      _error = data['detail'] ?? 'Login failed';
    } catch (e) {
      _error = 'Connection error. Check your network.';
    }
    _loading = false; notifyListeners(); return false;
  }

  Future<bool> signup(String name, String email, String password) async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.signup(name: name, email: email, password: password);
      if (data.containsKey('token')) {
        _user = data;
        try {
          final fcmToken = await FirebaseMessaging.instance.getToken();
          if (fcmToken != null) await ApiService.registerFCMToken(fcmToken);
        } catch (_) {}
        _loading = false; notifyListeners(); return true;
      }
      _error = data['detail'] ?? 'Signup failed';
    } catch (e) {
      _error = 'Connection error. Check your network.';
    }
    _loading = false; notifyListeners(); return false;
  }

  Future<void> logout() async {
    await ApiService.clearAuth();
    _user = null; notifyListeners();
  }

  void clearError() { _error = null; notifyListeners(); }
}


