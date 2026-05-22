import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../utils/theme.dart';
import '../services/chat_provider.dart';
import '../services/auth_provider.dart';
import '../services/neo_background_service.dart';
import 'chat_screen.dart';
import 'memory_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _idx = 0;
  bool _neoListening = false;
  String _lastResponse = '';

  final List<Widget> _screens = const [
    ChatScreen(),
    MemoryScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadModels();
      _startNeoBackground();
    });
  }

  Future<void> _startNeoBackground() async {
    final auth   = context.read<AuthProvider>();
    final userId = auth.userId;

    // Start background service
    await NeoBackgroundService.start();
    NeoBackgroundService.setUser(userId);

    setState(() => _neoListening = true);

    // Listen for Neo responses from background
    NeoBackgroundService.onNeoResponse.listen((data) {
      if (data != null && mounted) {
        final reply   = data['text'] ?? '';
        final command = data['command'] ?? '';
        setState(() => _lastResponse = reply);

        // Add to chat history
        if (command.isNotEmpty && reply.isNotEmpty) {
          context.read<ChatProvider>().addVoiceExchange(command, reply);
        }
      }
    });

    // Listen for wake detections
    NeoBackgroundService.onWakeDetected.listen((data) {
      if (mounted) setState(() => _lastResponse = 'Listening...');
    });
  }

  Future<void> _toggleNeo() async {
    if (_neoListening) {
      NeoBackgroundService.stop();
      setState(() {_neoListening = false; _lastResponse = '';});
    } else {
      await NeoBackgroundService.start();
      final auth = context.read<AuthProvider>();
      NeoBackgroundService.setUser(auth.userId);
      setState(() => _neoListening = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Neo status bar
          if (_neoListening || _lastResponse.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: _neoListening
                  ? NeoTheme.blue.withOpacity(0.1)
                  : Colors.transparent,
              child: Row(
                children: [
                  // Pulsing dot
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 500),
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _neoListening ? NeoTheme.blue : NeoTheme.muted,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _neoListening
                          ? (_lastResponse.isEmpty
                              ? 'Say "Hey Neo" anytime'
                              : _lastResponse)
                          : 'Neo is off',
                      style: TextStyle(
                        color: _neoListening ? NeoTheme.blue : NeoTheme.muted,
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Toggle button
                  GestureDetector(
                    onTap: _toggleNeo,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _neoListening
                            ? NeoTheme.blue.withOpacity(0.2)
                            : NeoTheme.bg2,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _neoListening ? NeoTheme.blue : NeoTheme.border,
                        ),
                      ),
                      child: Text(
                        _neoListening ? 'ON' : 'OFF',
                        style: TextStyle(
                          color: _neoListening ? NeoTheme.blue : NeoTheme.muted,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          // Bottom nav
          Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: NeoTheme.border, width: 0.5)),
            ),
            child: BottomNavigationBar(
              currentIndex: _idx,
              onTap: (i) => setState(() => _idx = i),
              items: const [
                BottomNavigationBarItem(
                    icon: Icon(Icons.chat_bubble_outline),
                    activeIcon: Icon(Icons.chat_bubble),
                    label: 'Neo'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.memory_outlined),
                    activeIcon: Icon(Icons.memory),
                    label: 'Memory'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.person_outline),
                    activeIcon: Icon(Icons.person),
                    label: 'Profile'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

