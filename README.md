# Neo — Personal Companion Intelligence

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![AgentShield: A](https://img.shields.io/badge/AgentShield-A%20100%2F100-green.svg)](https://github.com/affaan-m/agentshield)
[![Self-host](https://img.shields.io/badge/self--host-one%20command-cyan.svg)](#quick-start)

> Not a chatbot. A presence that knows you.

Neo is an open-source personal companion intelligence with 9-dimensional memory, 6 mentor modes, and 4 self-improving autoresearch loops. Runs on your own server. Your data never leaves it.

---

## Quick Start
```bash
git clone https://github.com/jas77409/vxneo.git
cd vxneo
sudo bash bootstrap.sh
```

You will be prompted for your Anthropic API key, Telegram bot token (optional), name, and timezone. Neo will be live in ~3 minutes.

---

## What Neo Is

Neo is a personal companion intelligence — not a task executor. Designed for the examined life.

**9-Dimensional Memory** — Neo4j graph + Qdrant vectors. Episodic, Semantic, Procedural, Affective, Goal, Belief, Identity, Contextual, Capture. Salience decays and reinforces like real memory.

**6 Mentor Modes** — auto-detected from context:

| Mode | When it activates |
|---|---|
| Navigator | Decisions and crossroads |
| Mirror | Patterns and contradictions |
| Catalyst | Stuck or avoiding |
| Witness | Just need to be heard |
| Horizon | Reconnecting to the long arc |
| Librarian | Retrieving and synthesising |

**Self-improving** — 4 weekly autoresearch loops refine prompts, memory constants, and mode detection without your involvement.

**Learns from every conversation** — instinct-based continuous learning with confidence scoring and skill evolution.

---

## Architecture
```
User (Web / Telegram / API)
         │
         ▼
  Security Layer (AgentShield A 100/100)
         │
         ▼
  Smart Task Router
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 LLM Agent  Direct handlers
 (Claude)   (memory, email, calendar)
    │
    ▼
 Memory Store
 (Neo4j + Qdrant + Redis)
```

**Stack:** LangGraph, Claude (Anthropic), Neo4j 5, Qdrant 1.17, Redis 7, FastAPI, all-MiniLM-L6-v2 embeddings, Obsidian vault, Telegram bot, Gmail, Google Calendar.

---

## Features

- 9-dimensional memory graph with salience decay
- 6 auto-detected mentor modes
- Obsidian vault — daily notes, reflections, weekly reviews
- Gmail + Google Calendar integration
- Telegram bot interface
- 4 autoresearch self-improvement loops
- Continuous learning v2 (instinct-based)
- Strategic compaction (context window management)
- AgentShield A-grade security (100/100)
- Free hosted tier at vxneo.com

---

## Requirements

| Component | Minimum |
|---|---|
| OS | Ubuntu 22.04+ or Debian 12 |
| RAM | 4GB |
| Storage | 20GB |
| CPU | 2 vCPU |
| Python | 3.10+ |

Recommended: Hetzner CPX22 (~$7/month)

---

## Hosted Free Tier

Use the hosted version at **vxneo.com** — no server needed:
- 50 messages/day
- 500 memories
- No credit card required

---

## Roadmap

- [x] 9-dimensional memory (Neo4j + Qdrant)
- [x] 6 mentor modes
- [x] Telegram integration
- [x] Gmail + Google Calendar
- [x] Continuous learning v2
- [x] Strategic compaction
- [x] AgentShield A-grade security
- [x] vxneo.com hosted free tier
- [x] One-command bootstrap deploy
- [ ] Multi-model support (GPT-4o, Gemini, Ollama)
- [ ] Notion + Trello integration
- [ ] GitHub + shell tools
- [ ] Flutter mobile app (Android + iOS)
- [ ] ChatVX — unified AI gateway
- [ ] WhatsApp integration
- [ ] VS Code extension

---

## Contributing

PRs welcome. Areas where help is most needed:
- Multi-model adapters (GPT, Gemini, Ollama)
- Integration skills (Notion, Trello, Linear)
- Flutter mobile app
- Windows/macOS bootstrap
- Documentation

---

## License

MIT — use freely, modify as needed, contribute back if you can.

---

## Links

- Hosted version: [vxneo.com](https://vxneo.com)
- Contact: contact@vxneolabs.com
