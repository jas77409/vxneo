import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/neo_voice_service.dart';
import '../utils/theme.dart';

class HeyNeoButton extends StatefulWidget {
  final String userId;
  const HeyNeoButton({super.key, required this.userId});
  @override State<HeyNeoButton> createState() => _HeyNeoButtonState();
}

class _HeyNeoButtonState extends State<HeyNeoButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulse;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _scale = Tween(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulse, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<NeoVoiceService>(
      builder: (context, voice, _) {
        final color   = _stateColor(voice.state);
        final icon    = _stateIcon(voice.state);
        final label   = _stateLabel(voice.state);
        final pulsing = voice.state == VoiceState.listening ||
                        voice.state == VoiceState.recording;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Pulse ring + button
            GestureDetector(
              onTap: () => _handleTap(context, voice),
              child: AnimatedBuilder(
                animation: _pulse,
                builder: (_, child) {
                  return Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer pulse ring
                      if (pulsing)
                        Transform.scale(
                          scale: _scale.value,
                          child: Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: color.withOpacity(0.2),
                            ),
                          ),
                        ),
                      // Main button
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: color,
                          boxShadow: [
                            BoxShadow(
                              color: color.withOpacity(0.4),
                              blurRadius: 12,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: _stateContent(voice.state, icon),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 6),
            // Label
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            // Transcript preview
            if (voice.transcript.isNotEmpty &&
                voice.state == VoiceState.recording)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '"${voice.transcript}"',
                  style: const TextStyle(
                    color: NeoTheme.muted,
                    fontSize: 10,
                    fontStyle: FontStyle.italic,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _stateContent(VoiceState state, IconData icon) {
    if (state == VoiceState.processing) {
      return const Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Colors.white,
          ),
        ),
      );
    }
    return Icon(icon, color: Colors.white, size: 24);
  }

  Color _stateColor(VoiceState state) {
    switch (state) {
      case VoiceState.idle:       return NeoTheme.muted;
      case VoiceState.listening:  return NeoTheme.blue;
      case VoiceState.detected:   return Colors.teal;
      case VoiceState.recording:  return Colors.red;
      case VoiceState.processing: return Colors.orange;
      case VoiceState.responding: return Colors.green;
      case VoiceState.error:      return Colors.redAccent;
    }
  }

  IconData _stateIcon(VoiceState state) {
    switch (state) {
      case VoiceState.idle:       return Icons.mic_none_outlined;
      case VoiceState.listening:  return Icons.hearing;
      case VoiceState.detected:   return Icons.mic;
      case VoiceState.recording:  return Icons.mic;
      case VoiceState.processing: return Icons.mic;
      case VoiceState.responding: return Icons.check_circle_outline;
      case VoiceState.error:      return Icons.error_outline;
    }
  }

  String _stateLabel(VoiceState state) {
    switch (state) {
      case VoiceState.idle:       return 'TAP TO SPEAK';
      case VoiceState.listening:  return 'SAY "HEY NEO"';
      case VoiceState.detected:   return 'HEY NEO!';
      case VoiceState.recording:  return 'LISTENING...';
      case VoiceState.processing: return 'THINKING...';
      case VoiceState.responding: return 'NEO REPLIED';
      case VoiceState.error:      return 'TRY AGAIN';
    }
  }

  void _handleTap(BuildContext context, NeoVoiceService voice) {
    switch (voice.state) {
      case VoiceState.idle:
        // Start wake word listening
        voice.startListening(userId: widget.userId);
        break;
      case VoiceState.listening:
        // Manual trigger — skip wake word, go straight to recording
        voice.triggerManually(userId: widget.userId);
        break;
      case VoiceState.responding:
      case VoiceState.error:
        voice.reset();
        break;
      default:
        break;
    }
  }
}

// ── Neo Response Overlay ──────────────────────────────────────
// Shows Neo's response as a floating card above the button

class NeoResponseCard extends StatelessWidget {
  const NeoResponseCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<NeoVoiceService>(
      builder: (_, voice, __) {
        if (voice.state != VoiceState.responding &&
            voice.state != VoiceState.error) {
          return const SizedBox.shrink();
        }

        final isError  = voice.state == VoiceState.error;
        final text     = isError ? voice.errorMessage : voice.neoResponse;
        final bgColor  = isError
            ? Colors.red.withOpacity(0.15)
            : Colors.teal.withOpacity(0.12);
        final border   = isError ? Colors.red : Colors.teal;

        return Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: border.withOpacity(0.4)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: border,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('N',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(
                    color: NeoTheme.white,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
