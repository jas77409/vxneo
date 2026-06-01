import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:speech_to_text/speech_to_text.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum VoiceState {
  idle, listening, detected, recording, processing, responding, error,
}

class NeoVoiceService extends ChangeNotifier {
  static const String _baseUrl = 'https://vxneo.com';

  final SpeechToText _stt = SpeechToText();
  bool _sttReady = false;
  VoiceState _state = VoiceState.idle;
  String _transcript = '';
  String _neoResponse = '';
  String _errorMessage = '';

  VoiceState get state      => _state;
  String get transcript     => _transcript;
  String get neoResponse    => _neoResponse;
  String get errorMessage   => _errorMessage;
  bool get isListening      => _state == VoiceState.listening;
  bool get isActive         => _state != VoiceState.idle;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('neo_token');
  }

  // Initialise the speech engine ONLY. Do NOT request mic permission here —
  // requesting on screen load (before a user gesture) causes iOS to silently
  // deny and the app never appears in Settings > Privacy > Microphone.
  Future<bool> init() async {
    try {
      _sttReady = await _stt.initialize(
        onError: (e) => debugPrint('[STT] Error: $e'),
      );
    } catch (e) {
      debugPrint('[STT] init failed: $e');
      _sttReady = false;
    }
    return _sttReady;
  }

  // Request mic permission on a user-initiated action.
  Future<bool> _ensureMicPermission() async {
    var status = await Permission.microphone.status;
    if (status.isGranted) return true;

    if (status.isDenied) {
      status = await Permission.microphone.request();
      if (status.isGranted) return true;
    }

    if (status.isPermanentlyDenied) {
      _setError('Microphone access is off. Enable it in Settings to talk to Neo.');
      await openAppSettings();
      return false;
    }

    _setError('Microphone permission is needed to talk to Neo.');
    return false;
  }

  Future<void> startListening({String userId = 'jas_personal'}) async {
    if (_state != VoiceState.idle) return;

    final ok = await _ensureMicPermission();
    if (!ok) return;

    if (!_sttReady) {
      await init();
      if (!_sttReady) {
        _setError('Voice engine unavailable. Please try again.');
        return;
      }
    }

    _setState(VoiceState.listening);
    debugPrint('[Neo] Listening for Hey Neo...');

    _stt.listen(
      onResult: (result) {
        final text = result.recognizedWords.toLowerCase();
        debugPrint('[STT] Heard: $text');
        if (text.contains('hey neo') ||
            text.contains('hey, neo') ||
            text.contains('a neo') ||
            text.contains('hey new')) {
          _stt.stop();
          _onWakeWord(userId: userId);
        }
      },
      listenMode: ListenMode.confirmation,
      cancelOnError: false,
      partialResults: true,
      listenFor: const Duration(seconds: 60),
      pauseFor: const Duration(seconds: 8),
    );
  }

  void _onWakeWord({required String userId}) async {
    debugPrint('[Neo] Wake word detected!');
    _setState(VoiceState.detected);
    await Future.delayed(const Duration(milliseconds: 400));
    await _startRecording(userId: userId);
  }

  Future<void> _startRecording({required String userId}) async {
    _transcript = '';
    _setState(VoiceState.recording);

    _stt.listen(
      onResult: (result) {
        _transcript = result.recognizedWords;
        notifyListeners();
        if (result.finalResult && _transcript.isNotEmpty) {
          _stt.stop();
          _sendToNeo(text: _transcript, userId: userId);
        }
      },
      listenFor: const Duration(seconds: 8),
      pauseFor: const Duration(seconds: 3),
      partialResults: true,
      cancelOnError: false,
    );

    Future.delayed(const Duration(seconds: 9), () {
      if (_state == VoiceState.recording) {
        _stt.stop();
        if (_transcript.isNotEmpty) {
          _sendToNeo(text: _transcript, userId: userId);
        } else {
          _setError('I did not hear anything. Tap the mic to try again.');
        }
      }
    });
  }

  Future<void> _sendToNeo({required String text, required String userId}) async {
    if (text.trim().isEmpty) return;
    _setState(VoiceState.processing);
    debugPrint('[Neo] Sending: $text');

    try {
      final token = await _getToken();
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await http.post(
        Uri.parse('$_baseUrl/neo/ask'),
        headers: headers,
        body: jsonEncode({'text': text, 'user_id': userId, 'voice': true}),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _neoResponse = data['response'] ?? 'Neo did not respond.';
        _setState(VoiceState.responding);
        Future.delayed(const Duration(seconds: 6), () {
          if (_state == VoiceState.responding) _setState(VoiceState.idle);
        });
      } else if (response.statusCode == 401) {
        _setError('Please log in to use voice commands.');
      } else {
        _setError('Neo error ${response.statusCode}. Try again.');
      }
    } on TimeoutException {
      _setError('Neo took too long. Please try again.');
    } catch (e) {
      _setError('Connection error. Check your internet.');
    }
  }

  Future<void> triggerManually({required String userId}) async {
    final ok = await _ensureMicPermission();
    if (!ok) return;

    if (!_sttReady) {
      await init();
      if (!_sttReady) {
        _setError('Voice engine unavailable. Please try again.');
        return;
      }
    }

    if (_state == VoiceState.listening || _state == VoiceState.idle) {
      _stt.stop();
      _setState(VoiceState.detected);
      await Future.delayed(const Duration(milliseconds: 200));
      await _startRecording(userId: userId);
    }
  }

  Future<void> stopListening() async {
    _stt.stop();
    _setState(VoiceState.idle);
  }

  void _setState(VoiceState s) {
    _state = s;
    notifyListeners();
  }

  void _setError(String msg) {
    _errorMessage = msg;
    _state = VoiceState.error;
    notifyListeners();
    Future.delayed(const Duration(seconds: 4), () {
      if (_state == VoiceState.error) {
        _state = VoiceState.idle;
        notifyListeners();
      }
    });
  }

  void reset() {
    _stt.stop();
    _transcript = '';
    _neoResponse = '';
    _errorMessage = '';
    _setState(VoiceState.idle);
  }

  @override
  void dispose() {
    _stt.stop();
    super.dispose();
  }
}
