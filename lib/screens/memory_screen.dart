import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';

class MemoryScreen extends StatefulWidget {
  const MemoryScreen({super.key});
  @override State<MemoryScreen> createState() => _MemoryScreenState();
}

class _MemoryScreenState extends State<MemoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  List<dynamic> _memories = [];
  List<dynamic> _vault = [];
  bool _loadingMem = true, _loadingVault = true;
  final _searchCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  final _noteTitleCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _loadMemories(null);
    _loadVault();
  }

  Future<void> _loadMemories([String? query]) async {
    setState(() => _loadingMem = true);
    _memories = await ApiService.getMemories(query: query);
    setState(() => _loadingMem = false);
  }

  Future<void> _loadVault() async {
    setState(() => _loadingVault = true);
    _vault = await ApiService.getVaultEntries();
    setState(() => _loadingVault = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Memory & Vault'),
        bottom: TabBar(
          controller: _tab,
          indicatorColor: NeoTheme.blue,
          labelColor: NeoTheme.blue,
          unselectedLabelColor: NeoTheme.muted,
          tabs: const [Tab(text: 'Memories'), Tab(text: 'Vault')],
        ),
      ),
      body: TabBarView(controller: _tab, children: [_memoriesTab(), _vaultTab()]),
      floatingActionButton: FloatingActionButton(
        backgroundColor: NeoTheme.blue,
        onPressed: () => _tab.index == 0 ? _addMemoryDialog() : _addVaultDialog(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _memoriesTab() {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(16),
        child: TextField(
          controller: _searchCtrl,
          decoration: InputDecoration(
            hintText: 'Search memories...',
            prefixIcon: const Icon(Icons.search, color: NeoTheme.muted),
            suffixIcon: _searchCtrl.text.isNotEmpty
              ? IconButton(icon: const Icon(Icons.clear, color: NeoTheme.muted), onPressed: () { _searchCtrl.clear(); _loadMemories(null); })
              : null,
          ),
          onSubmitted: (q) => _loadMemories(q.trim()),
        ),
      ),
      Expanded(child: _loadingMem
        ? const Center(child: CircularProgressIndicator(color: NeoTheme.blue))
        : _memories.isEmpty
          ? _empty('No memories yet.\nTalk to Neo and it will remember what matters.')
          : RefreshIndicator(
              onRefresh: _loadMemories,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                itemCount: _memories.length,
                itemBuilder: (_, i) => _memoryCard(_memories[i]),
              ),
            ),
      ),
    ]);
  }

  Widget _memoryCard(dynamic m) {
    final content = m['content'] as String? ?? '';
    final type = m['type'] as String? ?? 'Capture';
    final salience = ((m['salience'] as num?) ?? 0.5).toStringAsFixed(2);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: NeoTheme.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
              child: Text(type, style: const TextStyle(color: NeoTheme.blue, fontSize: 10, letterSpacing: 0.5)),
            ),
            const Spacer(),
            Text('salience: $salience', style: const TextStyle(color: NeoTheme.muted, fontSize: 11)),
          ]),
          const SizedBox(height: 8),
          Text(content, style: const TextStyle(color: NeoTheme.textSecondary, fontSize: 14, height: 1.5)),
        ]),
      ),
    );
  }

  Widget _vaultTab() {
    return _loadingVault
      ? const Center(child: CircularProgressIndicator(color: NeoTheme.blue))
      : _vault.isEmpty
        ? _empty('Vault is empty.\nStore important notes, credentials, or context for Neo.')
        : RefreshIndicator(
            onRefresh: _loadVault,
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
              itemCount: _vault.length,
              itemBuilder: (_, i) => _vaultCard(_vault[i]),
            ),
          );
  }

  Widget _vaultCard(dynamic e) {
    final title = e['title'] as String? ?? 'Untitled';
    final content = e['content'] as String? ?? '';
    final created = e['created_at'] as String? ?? '';
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(title, style: const TextStyle(color: NeoTheme.white, fontWeight: FontWeight.w600, fontSize: 14))),
            if (created.isNotEmpty) Text(created.substring(0, 10), style: const TextStyle(color: NeoTheme.muted, fontSize: 11)),
          ]),
          const SizedBox(height: 8),
          Text(content, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: NeoTheme.textSecondary, fontSize: 13, height: 1.5)),
        ]),
      ),
    );
  }

  Widget _empty(String msg) {
    return Center(child: Padding(
      padding: const EdgeInsets.all(32),
      child: Text(msg, textAlign: TextAlign.center, style: const TextStyle(color: NeoTheme.muted, fontSize: 14, height: 1.6)),
    ));
  }

  Future<void> _addMemoryDialog() async {
    final ctrl = TextEditingController();
    await showDialog(context: context, builder: (_) => AlertDialog(
      backgroundColor: NeoTheme.bg2,
      title: const Text('Add Memory', style: TextStyle(color: NeoTheme.white)),
      content: TextField(controller: ctrl, maxLines: 4, autofocus: true,
        decoration: const InputDecoration(hintText: 'What should Neo remember?')),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: NeoTheme.muted))),
        ElevatedButton(
          onPressed: () async {
            if (ctrl.text.trim().isNotEmpty) {
              await ApiService.addMemory(ctrl.text.trim());
              if (mounted) Navigator.pop(context);
              _loadMemories(null);
            }
          },
          child: const Text('Save'),
        ),
      ],
    ));
  }

  Future<void> _addVaultDialog() async {
    await showDialog(context: context, builder: (_) => AlertDialog(
      backgroundColor: NeoTheme.bg2,
      title: const Text('Add to Vault', style: TextStyle(color: NeoTheme.white)),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: _noteTitleCtrl, decoration: const InputDecoration(hintText: 'Title')),
        const SizedBox(height: 12),
        TextField(controller: _noteCtrl, maxLines: 4, decoration: const InputDecoration(hintText: 'Content...')),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: NeoTheme.muted))),
        ElevatedButton(
          onPressed: () async {
            if (_noteCtrl.text.trim().isNotEmpty) {
              await ApiService.addVaultEntry(_noteCtrl.text.trim(), _noteTitleCtrl.text.trim().isEmpty ? 'Note' : _noteTitleCtrl.text.trim());
              _noteTitleCtrl.clear(); _noteCtrl.clear();
              if (mounted) Navigator.pop(context);
              _loadVault();
            }
          },
          child: const Text('Save'),
        ),
      ],
    ));
  }
}


