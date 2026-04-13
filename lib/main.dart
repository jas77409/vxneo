import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'services/chat_provider.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  final messaging = FirebaseMessaging.instance;
  await messaging.requestPermission(alert: true, badge: true, sound: true);
  final token = await messaging.getToken();
  print('[FCM] Device token: ' + (token ?? 'null'));
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('[FCM] Foreground message: ' + (message.notification?.title ?? ''));
  });

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Dark system UI
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


