import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/message.dart';

class ChatProvider extends ChangeNotifier {
  final List<Message> _messages = [];
  bool _loading = false;
  String _currentModel = 'claude';
  List<Map<String, dynamic>> _availableModels = [];

  List<Message> get messages => _messages;
  bool get loading => _loading;
  String get currentModel => _currentModel;
  List<Map<String, dynamic>> get availableModels => _availableModels;

  Future<void> loadModels() async {
    try {
      final data = await ApiService.getModels();
      _availableModels = List<Map<String, dynamic>>.from(data['models'] ?? []);
      _currentModel = data['current'] ?? 'claude';
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> switchModel(String key) async {
    final ok = await ApiService.switchModel(key);
    if (ok) { _currentModel = key; notifyListeners(); }
    return ok;
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    _messages.add(Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text, isUser: true,
      timestamp: DateTime.now(),
    ));
    _loading = true;
    notifyListeners();

    try {
      final data = await ApiService.sendMessage(text);
      final response = data['response'] as String? ?? 'No response.';
      final mode = data['mode'] as String? ?? '';

      _messages.add(Message(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: response, isUser: false,
        timestamp: DateTime.now(),
        mode: mode.isNotEmpty && mode != 'Neo' ? mode : null,
      ));
    } catch (e) {
      _messages.add(Message(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: 'Connection issue. Please try again.',
        isUser: false, isError: true,
        timestamp: DateTime.now(),
      ));
    }
    _loading = false;
    notifyListeners();
  }

  void clearMessages() { _messages.clear(); notifyListeners(); }
}
