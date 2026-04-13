import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../utils/theme.dart';
import 'home_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});
  @override State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  final _loginEmail    = TextEditingController();
  final _loginPass     = TextEditingController();
  final _signupName    = TextEditingController();
  final _signupEmail   = TextEditingController();
  final _signupPass    = TextEditingController();
  bool _obscure = true;

  @override void initState() { super.initState(); _tab = TabController(length: 2, vsync: this); }
  @override void dispose() { _tab.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            const SizedBox(height: 48),
            // Logo
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('VX', style: TextStyle(fontFamily: 'Georgia', fontSize: 36, fontWeight: FontWeight.w700, color: NeoTheme.white)),
              Text('Neo', style: TextStyle(fontFamily: 'Georgia', fontSize: 36, fontWeight: FontWeight.w700, color: NeoTheme.blue)),
            ]),
            const SizedBox(height: 8),
            Text('Personal Companion Intelligence', style: TextStyle(color: NeoTheme.muted, fontSize: 13, letterSpacing: 1.5)),
            const SizedBox(height: 48),

            // Tabs
            Container(
              decoration: BoxDecoration(
                color: NeoTheme.bg2,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: NeoTheme.border, width: 0.5),
              ),
              child: TabBar(
                controller: _tab,
                indicator: BoxDecoration(color: NeoTheme.blue, borderRadius: BorderRadius.circular(10)),
                labelColor: NeoTheme.white,
                unselectedLabelColor: NeoTheme.muted,
                labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                tabs: const [Tab(text: 'Sign In'), Tab(text: 'Create Account')],
              ),
            ),
            const SizedBox(height: 32),

            SizedBox(
              height: 340,
              child: TabBarView(controller: _tab, children: [_loginForm(), _signupForm()]),
            ),

            const SizedBox(height: 24),
            Consumer<AuthProvider>(builder: (ctx, auth, _) {
              if (auth.error != null) {
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Text(auth.error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                );
              }
              return const SizedBox.shrink();
            }),
          ]),
        ),
      ),
    );
  }

  Widget _loginForm() {
    return Column(children: [
      TextField(controller: _loginEmail, keyboardType: TextInputType.emailAddress,
        decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline, color: NeoTheme.muted))),
      const SizedBox(height: 16),
      TextField(controller: _loginPass, obscureText: _obscure,
        decoration: InputDecoration(
          labelText: 'Password',
          prefixIcon: const Icon(Icons.lock_outline, color: NeoTheme.muted),
          suffixIcon: IconButton(
            icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: NeoTheme.muted),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        )),
      const SizedBox(height: 24),
      Consumer<AuthProvider>(builder: (ctx, auth, _) => ElevatedButton(
        onPressed: auth.loading ? null : () => _doLogin(ctx, auth),
        child: auth.loading
          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('Sign In'),
      )),
    ]);
  }

  Widget _signupForm() {
    return Column(children: [
      TextField(controller: _signupName,
        decoration: const InputDecoration(labelText: 'Your name', prefixIcon: Icon(Icons.person_outline, color: NeoTheme.muted))),
      const SizedBox(height: 12),
      TextField(controller: _signupEmail, keyboardType: TextInputType.emailAddress,
        decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline, color: NeoTheme.muted))),
      const SizedBox(height: 12),
      TextField(controller: _signupPass, obscureText: _obscure,
        decoration: InputDecoration(
          labelText: 'Password',
          prefixIcon: const Icon(Icons.lock_outline, color: NeoTheme.muted),
          suffixIcon: IconButton(
            icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: NeoTheme.muted),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        )),
      const SizedBox(height: 20),
      Consumer<AuthProvider>(builder: (ctx, auth, _) => ElevatedButton(
        onPressed: auth.loading ? null : () => _doSignup(ctx, auth),
        child: auth.loading
          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('Create Account'),
      )),
    ]);
  }

  Future<void> _doLogin(BuildContext ctx, AuthProvider auth) async {
    auth.clearError();
    final ok = await auth.login(_loginEmail.text.trim(), _loginPass.text);
    if (ok && mounted) {
      Navigator.pushReplacement(ctx, MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  Future<void> _doSignup(BuildContext ctx, AuthProvider auth) async {
    auth.clearError();
    final ok = await auth.signup(_signupName.text.trim(), _signupEmail.text.trim(), _signupPass.text);
    if (ok && mounted) {
      Navigator.pushReplacement(ctx, MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }
}
