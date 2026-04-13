import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://vxneo.com';
  static const Duration timeout = Duration(seconds: 60);

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('neo_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('neo_token', token);
  }

  static Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('neo_user', jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString('neo_user');
    if (str == null) return null;
    return jsonDecode(str);
  }

  static Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('neo_token');
    await prefs.remove('neo_user');
  }

  static Future<Map<String, String>> headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Auth ──────────────────────────────────────────────────

  static Future<Map<String, dynamic>> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    final r = await http.post(
      Uri.parse('$baseUrl/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    ).timeout(timeout);

    final data = jsonDecode(r.body);
    if (r.statusCode == 200) {
      await saveToken(data['token']);
      await saveUser(data);
    }
    return data;
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final r = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    ).timeout(timeout);

    final data = jsonDecode(r.body);
    if (r.statusCode == 200) {
      await saveToken(data['token']);
      await saveUser(data);
    }
    return data;
  }

  static Future<Map<String, dynamic>> getProfile() async {
    final r = await http.get(
      Uri.parse('$baseUrl/me'),
      headers: await headers(),
    ).timeout(timeout);
    return jsonDecode(r.body);
  }

  // ── Chat ──────────────────────────────────────────────────

  static Future<Map<String, dynamic>> sendMessage(String text) async {
    final user = await getUser();
    final userId = user?['user_id'] ?? 'anon';

    final r = await http.post(
      Uri.parse('$baseUrl/neo/ask'),
      headers: await headers(),
      body: jsonEncode({'text': text, 'user_id': userId}),
    ).timeout(timeout);

    if (r.statusCode == 200) {
      return jsonDecode(r.body);
    }
    return {'error': 'Request failed: ${r.statusCode}'};
  }

  // ── Models ────────────────────────────────────────────────

  static Future<Map<String, dynamic>> getModels() async {
    final r = await http.get(
      Uri.parse('$baseUrl/models'),
      headers: await headers(),
    ).timeout(timeout);
    if (r.statusCode == 200) return jsonDecode(r.body);
    return {'models': [], 'current': 'claude'};
  }

  static Future<bool> switchModel(String modelKey) async {
    final r = await http.post(
      Uri.parse('$baseUrl/models/set'),
      headers: await headers(),
      body: jsonEncode({'model': modelKey}),
    ).timeout(timeout);
    return r.statusCode == 200;
  }

  // ── Memory ────────────────────────────────────────────────

  static Future<List<dynamic>> getMemories({String? query}) async {
    final uri = query != null
        ? Uri.parse('$baseUrl/memory/search?q=${Uri.encodeComponent(query)}')
        : Uri.parse('$baseUrl/memory/recent');

    final r = await http.get(uri, headers: await headers()).timeout(timeout);
    if (r.statusCode == 200) {
      final data = jsonDecode(r.body);
      return data['memories'] ?? data['results'] ?? [];
    }
    return [];
  }

  static Future<bool> addMemory(String content, {String type = 'Capture'}) async {
    final r = await http.post(
      Uri.parse('$baseUrl/memory/add'),
      headers: await headers(),
      body: jsonEncode({'content': content, 'type': type}),
    ).timeout(timeout);
    return r.statusCode == 200;
  }

  // ── Vault ─────────────────────────────────────────────────

  static Future<List<dynamic>> getVaultEntries() async {
    final r = await http.get(
      Uri.parse('$baseUrl/vault'),
      headers: await headers(),
    ).timeout(timeout);
    if (r.statusCode == 200) {
      final data = jsonDecode(r.body);
      return data['entries'] ?? [];
    }
    return [];
  }

  static Future<bool> addVaultEntry(String content, String title) async {
    final r = await http.post(
      Uri.parse('$baseUrl/vault/add'),
      headers: await headers(),
      body: jsonEncode({'content': content, 'title': title}),
    ).timeout(timeout);
    return r.statusCode == 200;
  }

  // ── Health ────────────────────────────────────────────────

  static Future<void> registerFCMToken(String token) async {
    final r = await http.post(
      Uri.parse('\/device/register'),
      headers: await headers(),
      body: jsonEncode({'token': token}),
    ).timeout(timeout);
  }

  static Future<bool> ping() async {
    try {
      final r = await http.get(Uri.parse('$baseUrl/health')).timeout(
        const Duration(seconds: 5),
      );
      return r.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}



