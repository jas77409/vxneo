import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../services/auth_provider.dart';
import '../services/chat_provider.dart';
import '../utils/theme.dart';
import 'auth_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _fcmToken = 'loading...';
  @override
  void initState() {
    super.initState();
    FirebaseMessaging.instance.getToken().then((t) {
      setState(() => _fcmToken = t ?? 'null');
    }).catchError((e) { setState(() => _fcmToken = 'error: $e'); });
  }
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final chat = context.watch<ChatProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(child: Padding(padding: const EdgeInsets.all(20), child: Row(children: [
          CircleAvatar(radius: 28, backgroundColor: NeoTheme.blue,
            child: Text(auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : 'J',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700))),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(auth.userName, style: const TextStyle(color: NeoTheme.white, fontSize: 17, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(auth.userTier == 'personal' ? 'Personal plan' : 'Free tier',
              style: TextStyle(color: auth.userTier == 'personal' ? NeoTheme.green : NeoTheme.muted, fontSize: 12)),
          ])),
        ]))),
        const SizedBox(height: 8),
        Card(child: ListTile(
          leading: const Icon(Icons.psychology_outlined, color: NeoTheme.blue),
          title: const Text('Active model', style: TextStyle(color: NeoTheme.white)),
          subtitle: Text(chat.currentModel, style: const TextStyle(color: NeoTheme.muted)),
        )),
        const SizedBox(height: 8),
        Card(child: Column(children: [
          ListTile(leading: const Icon(Icons.web_outlined, color: NeoTheme.muted), title: const Text('vxneo.com', style: TextStyle(color: NeoTheme.white, fontSize: 14)), onTap: () {}),
          const Divider(height: 0, color: NeoTheme.border),
          ListTile(leading: const Icon(Icons.code_outlined, color: NeoTheme.muted), title: const Text('GitHub', style: TextStyle(color: NeoTheme.white, fontSize: 14)), subtitle: const Text('github.com/jas77409/vxneo', style: TextStyle(color: NeoTheme.muted, fontSize: 12)), onTap: () {}),
          const Divider(height: 0, color: NeoTheme.border),
          ListTile(leading: const Icon(Icons.bug_report_outlined, color: NeoTheme.muted), title: const Text('Send feedback', style: TextStyle(color: NeoTheme.white, fontSize: 14)), subtitle: const Text('contact@vxneolabs.com', style: TextStyle(color: NeoTheme.muted, fontSize: 12)), onTap: () {}),
        ])),
        const SizedBox(height: 8),
        Card(child: ListTile(
          leading: const Icon(Icons.logout, color: Colors.redAccent),
          title: const Text('Sign out', style: TextStyle(color: Colors.redAccent)),
          onTap: () async {
            await context.read<AuthProvider>().logout();
            if (context.mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const AuthScreen()), (_) => false);
          },
        )),
        const SizedBox(height: 16),
        Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Text('FCM Device Token', style: TextStyle(color: NeoTheme.muted, fontSize: 12)),
            const Spacer(),
            GestureDetector(onTap: () { Clipboard.setData(ClipboardData(text: _fcmToken)); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied'), duration: Duration(seconds: 1))); },
              child: const Text('copy', style: TextStyle(color: NeoTheme.blue, fontSize: 12))),
          ]),
          const SizedBox(height: 6),
          SelectableText(_fcmToken, style: const TextStyle(color: NeoTheme.muted, fontSize: 9)),
        ]))),
        const SizedBox(height: 32),
        Center(child: Text('VXNeo Labs Inc.  ·  vxneo.com', style: TextStyle(color: NeoTheme.muted.withOpacity(0.5), fontSize: 12))),
      ]),
    );
  }
}
