import 'package:flutter/material.dart';
import '../services/chat_provider.dart';
import '../utils/theme.dart';

class ModelSheet extends StatelessWidget {
  final ChatProvider chat;
  const ModelSheet({super.key, required this.chat});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: NeoTheme.border, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 16),
        const Text('Choose Model', style: TextStyle(fontFamily: 'Georgia', fontSize: 18, color: NeoTheme.white, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        const Text('Switch the AI model powering Neo', style: TextStyle(color: NeoTheme.muted, fontSize: 13)),
        const SizedBox(height: 20),
        if (chat.availableModels.isEmpty)
          const Center(child: Padding(
            padding: EdgeInsets.all(24),
            child: CircularProgressIndicator(color: NeoTheme.blue, strokeWidth: 2),
          ))
        else
          ...chat.availableModels.where((m) => m['available'] == true).map((m) => _modelTile(context, m)),
      ]),
    );
  }

  Widget _modelTile(BuildContext context, Map<String, dynamic> model) {
    final isActive = model['key'] == chat.currentModel;
    final cost = (model['cost'] as num?) ?? 0;
    final costStr = cost == 0 ? 'free' : '\$${cost}/1M tokens';

    return GestureDetector(
      onTap: () async {
        await chat.switchModel(model['key']);
        if (context.mounted) Navigator.pop(context);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? NeoTheme.blue.withOpacity(0.1) : NeoTheme.bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isActive ? NeoTheme.blue : NeoTheme.border, width: isActive ? 1.5 : 0.5),
        ),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(model['label'] ?? model['key'], style: TextStyle(color: isActive ? NeoTheme.blue : NeoTheme.white, fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 2),
            Text('${model['key']}  ·  $costStr', style: const TextStyle(color: NeoTheme.muted, fontSize: 12)),
          ])),
          if (isActive) const Icon(Icons.check_circle, color: NeoTheme.blue, size: 20),
        ]),
      ),
    );
  }
}
