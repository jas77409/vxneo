class Message {
  final String id;
  final String text;
  final bool isUser;
  final bool isError;
  final DateTime timestamp;
  final String? mode;

  const Message({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.isError = false,
    this.mode,
  });
}
