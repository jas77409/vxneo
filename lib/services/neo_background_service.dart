import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_background_service_android/flutter_background_service_android.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  if (service is AndroidServiceInstance) {
    service.setAsForegroundService();
    service.setForegroundNotificationInfo(
      title: 'Neo is listening',
      content: 'Say "Hey Neo" anytime',
    );
  }

  final stt = SpeechToText();
  bool sttReady = false;
  bool listening = false;
  String userId = 'jas_personal';

  try {
    final prefs = await SharedPreferences.getInstance();
    userId = prefs.getString('neo_user_id') ?? 'jas_personal';
  } catch (_) {}

  sttReady = await stt.initialize(
    onError: (e) => print('[NEO BG] STT error: $e'),
  );

  service.on('stop').listen((_) {
    stt.stop();
    service.stopSelf();
  });

  service.on('setUser').listen((data) {
    if (data != null) userId = data['userId'] ?? userId;
  });

  Future<void> startListening() async {
    if (!sttReady || listening) return;
    listening = true;
    stt.listen(
      onResult: (result) async {
        final text = result.recognizedWords.toLowerCase();
        if (text.contains('hey neo') || text.contains('hey, neo')) {
          stt.stop();
          listening = false;
          service.invoke('wakeDetected', {'text': text});
          await Future.delayed(const Duration(milliseconds: 400));
          final completer = Completer<String>();
          stt.listen(
            onResult: (r) {
              if (r.finalResult && !completer.isCompleted) {
                completer.complete(r.recognizedWords);
              }
            },
            listenFor: const Duration(seconds: 8),
            pauseFor: const Duration(seconds: 2),
            partialResults: false,
            cancelOnError: false,
          );
          final command = await completer.future
              .timeout(const Duration(seconds: 10), onTimeout: () => '');
          if (command.isNotEmpty) {
            service.invoke('command', {'text': command});
            await _sendToNeo(command, userId, service);
          }
          await Future.delayed(const Duration(milliseconds: 500));
          listening = false;
          await startListening();
        }
      },
      listenMode: ListenMode.confirmation,
      listenFor: const Duration(seconds: 60),
      pauseFor: const Duration(seconds: 10),
      partialResults: true,
      cancelOnError: false,
    );
  }

  stt.statusListener = (status) async {
    if (status == 'done' || status == 'notListening') {
      listening = false;
      await Future.delayed(const Duration(milliseconds: 500));
      await startListening();
    }
  };

  if (sttReady) await startListening();

  Timer.periodic(const Duration(seconds: 30), (_) {
    if (!listening && sttReady) startListening();
    service.invoke('heartbeat', {'ts': DateTime.now().toIso8601String()});
  });
}

Future<void> _sendToNeo(String text, String userId, ServiceInstance service) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('neo_token');
    final response = await http.post(
      Uri.parse('https://vxneo.com/neo/ask'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'text': text, 'user_id': userId, 'voice': true}),
    ).timeout(const Duration(seconds: 20));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      service.invoke('neoResponse', {'text': data['response'] ?? '', 'command': text});
    }
  } catch (e) {
    print('[NEO BG] API error: $e');
  }
}

class NeoBackgroundService {
  static final _svc = FlutterBackgroundService();

  static Future<void> initialize() async {
    await _svc.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: 'neo_listening',
        initialNotificationTitle: 'Neo is listening',
        initialNotificationContent: 'Say "Hey Neo" anytime',
        foregroundServiceNotificationId: 888,
        foregroundServiceTypes: [AndroidForegroundType.microphone],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: (_) async => false,
      ),
    );
  }

  static Future<void> start() async => await _svc.startService();
  static void stop() => _svc.invoke('stop');
  static Future<bool> isRunning() async => await _svc.isRunning();
  static void setUser(String userId) => _svc.invoke('setUser', {'userId': userId});
  static Stream<Map<String, dynamic>?> get onWakeDetected => _svc.on('wakeDetected');
  static Stream<Map<String, dynamic>?> get onNeoResponse => _svc.on('neoResponse');
  static Stream<Map<String, dynamic>?> get onCommand => _svc.on('command');
}
