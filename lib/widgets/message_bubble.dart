import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/message.dart';
import '../utils/theme.dart';
import 'package:intl/intl.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  const MessageBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: message.isUser ? _userBubble() : _neoBubble(),
    );
  }

  Widget _userBubble() {
    return Row(mainAxisAlignment: MainAxisAlignment.end, crossAxisAlignment: CrossAxisAlignment.end, children: [
      Flexible(
        child: GestureDetector(
          onLongPress: () => Clipboard.setData(ClipboardData(text: message.text)),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 300),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: NeoTheme.blue,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18), topRight: Radius.circular(18), bottomLeft: Radius.circular(18), bottomRight: Radius.circular(4),
              ),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(message.text, style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.5)),
              const SizedBox(height: 4),
              Text(DateFormat('HH:mm').format(message.timestamp), style: const TextStyle(color: Colors.white54, fontSize: 11)),
            ]),
          ),
        ),
      ),
    ]);
  }

  Widget _neoBubble() {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 32, height: 32,
        decoration: BoxDecoration(color: message.isError ? Colors.red : NeoTheme.blue, borderRadius: BorderRadius.circular(16)),
        child: Center(child: Text('N', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14, fontFamily: 'Georgia'))),
      ),
      const SizedBox(width: 8),
      Flexible(
        child: GestureDetector(
          onLongPress: () => Clipboard.setData(ClipboardData(text: message.text)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (message.mode != null) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: NeoTheme.cyan.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: NeoTheme.cyan.withOpacity(0.3)),
                ),
                child: Text(message.mode!, style: TextStyle(color: NeoTheme.cyan, fontSize: 10, letterSpacing: 1)),
              ),
            ],
            Container(
              constraints: const BoxConstraints(maxWidth: 300),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: message.isError ? Colors.red.withOpacity(0.1) : NeoTheme.bg2,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4), topRight: Radius.circular(18), bottomLeft: Radius.circular(18), bottomRight: Radius.circular(18),
                ),
                border: Border.all(color: message.isError ? Colors.red.withOpacity(0.3) : NeoTheme.border, width: 0.5),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(message.text, style: TextStyle(color: message.isError ? Colors.redAccent : NeoTheme.textSecondary, fontSize: 15, height: 1.6)),
                const SizedBox(height: 4),
                Text(DateFormat('HH:mm').format(message.timestamp), style: const TextStyle(color: NeoTheme.muted, fontSize: 11)),
              ]),
            ),
          ]),
        ),
      ),
    ]);
  }
}
