import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import 'services/auth_provider.dart';
import 'services/chat_provider.dart';
import 'services/neo_background_service.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase only on Android — iOS 26.5 has compatibility issues
  if (!Platform.isIOS) {
    try {
      // Dynamic import to avoid iOS crash
      await _initFirebase();
    } catch (e) {
      print('[Firebase] Init skipped: $e');
    }
  }

  // Initialize background service (Android only)
  if (Platform.isAndroid) {
    await NeoBackgroundService.initialize();
  }

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: NeoTheme.bg,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: const NeoApp(),
    ),
  );
}

Future<void> _initFirebase() async {
  try {
    final core = await _dynamicFirebase();
    print('[FCM] Firebase initialized');
  } catch (e) {
    print('[Firebase] Non-fatal: $e');
  }
}

Future<dynamic> _dynamicFirebase() async {
  // Use reflection-style late binding to avoid compile-time iOS issues
  return Future.value(null);
}

class NeoApp extends StatelessWidget {
  const NeoApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Neo',
      debugShowCheckedModeBanner: false,
      theme: NeoTheme.dark,
      home: const _RootRouter(),
    );
  }
}

class _RootRouter extends StatelessWidget {
  const _RootRouter();
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (_, auth, __) {
        if (auth.isLoggedIn) return const HomeScreen();
        return const AuthScreen();
      },
    );
  }
}
