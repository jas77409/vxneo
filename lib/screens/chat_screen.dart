import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_provider.dart';
import '../services/auth_provider.dart';
import '../models/message.dart';
import '../utils/theme.dart';
import '../widgets/message_bubble.dart';
import '../widgets/model_sheet.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadModels();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<ChatProvider>(
          builder: (_, chat, __) => GestureDetector(
            onTap: () => _showModelSheet(context, chat),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text('Neo', style: TextStyle(fontFamily: 'Georgia', color: NeoTheme.white, fontWeight: FontWeight.w700)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: NeoTheme.blue.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: NeoTheme.blue.withOpacity(0.3)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(chat.currentModel, style: TextStyle(color: NeoTheme.blue, fontSize: 11)),
                  const SizedBox(width: 4),
                  Icon(Icons.expand_more, color: NeoTheme.blue, size: 14),
                ]),
              ),
            ]),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: NeoTheme.muted),
            onPressed: () => context.read<ChatProvider>().clearMessages(),
          ),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: Consumer<ChatProvider>(
            builder: (_, chat, __) {
              if (chat.messages.isEmpty) return _emptyState();
              WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
              return ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                itemCount: chat.messages.length + (chat.loading ? 1 : 0),
                itemBuilder: (_, i) {
                  if (i == chat.messages.length) return const _TypingIndicator();
                  return MessageBubble(message: chat.messages[i]);
                },
              );
            },
          ),
        ),
        _inputBar(),
      ]),
    );
  }

  Widget _emptyState() {
    final auth = context.watch<AuthProvider>();
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('Hello, ${auth.userName.split(' ').first}.',
          style: const TextStyle(fontFamily: 'Georgia', fontSize: 22, color: NeoTheme.white, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Text('Start with something real.', style: TextStyle(color: NeoTheme.muted, fontSize: 14)),
        const SizedBox(height: 32),
        ...[
          'What has been on my mind lately?',
          'Remind me what I was working on',
          'How am I doing on my goals?',
        ].map((hint) => GestureDetector(
          onTap: () => _send(hint),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: NeoTheme.bg2,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: NeoTheme.border),
            ),
            child: Text(hint, style: const TextStyle(color: NeoTheme.textSecondary, fontSize: 13)),
          ),
        )),
      ]),
    );
  }

  Widget _inputBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: NeoTheme.bg2,
        border: Border(top: BorderSide(color: NeoTheme.border, width: 0.5)),
      ),
      child: Row(children: [
        Expanded(
          child: TextField(
            controller: _controller,
            minLines: 1, maxLines: 5,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: 'Talk to Neo...',
              hintStyle: TextStyle(color: NeoTheme.muted, fontSize: 14),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              isDense: true,
            ),
            onSubmitted: (v) => _send(v),
          ),
        ),
        const SizedBox(width: 10),
        Consumer<ChatProvider>(
          builder: (_, chat, __) => GestureDetector(
            onTap: chat.loading ? null : () => _send(_controller.text),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: chat.loading ? NeoTheme.muted : NeoTheme.blue,
                borderRadius: BorderRadius.circular(12),
              ),
              child: chat.loading
                ? const Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
                : const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 20),
            ),
          ),
        ),
      ]),
    );
  }

  void _send(String text) {
    if (text.trim().isEmpty) return;
    _controller.clear();
    context.read<ChatProvider>().sendMessage(text);
  }

  void _scrollToBottom() {
    if (_scroll.hasClients) {
      _scroll.animateTo(_scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }
  }

  void _showModelSheet(BuildContext context, ChatProvider chat) {
    showModalBottomSheet(
      context: context,
      backgroundColor: NeoTheme.bg2,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => ModelSheet(chat: chat),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(color: NeoTheme.blue, borderRadius: BorderRadius.circular(16)),
          child: const Center(child: Text('N', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14))),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(color: NeoTheme.bg2, borderRadius: BorderRadius.circular(16), border: Border.all(color: NeoTheme.border)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            _Dot(delay: 0), const SizedBox(width: 4),
            _Dot(delay: 200), const SizedBox(width: 4),
            _Dot(delay: 400),
          ]),
        ),
      ]),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({required this.delay});
  @override State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late AnimationController _anim;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 600))
      ..repeat(reverse: true);
    _opacity = Tween(begin: 0.3, end: 1.0).animate(_anim);
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _anim.forward();
    });
  }

  @override void dispose() { _anim.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _opacity,
    child: Container(width: 6, height: 6, decoration: const BoxDecoration(color: NeoTheme.muted, shape: BoxShape.circle)),
  );
}
