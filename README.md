# Neo — Personal Companion Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web%20%7C%20Telegram-blue)](https://vxneo.com)
[![Status](https://img.shields.io/badge/status-active-green)](https://vxneo.com)
[![Android](https://img.shields.io/badge/Android-Beta-brightgreen)](https://play.google.com/apps/testing/com.vxneolabs.neo_companion)

Neo is an open-source personal companion intelligence platform that builds a living memory of your life — your goals, habits, relationships, health, and work. Unlike generic AI chatbots, Neo gets smarter about you with every conversation.

**Live at [vxneo.com](https://vxneo.com) · [Android Beta](https://play.google.com/apps/testing/com.vxneolabs.neo_companion) · [VXNeo Labs](https://vxneolabs.com)**

---

## What Makes Neo Different

- **9-Dimensional Memory** — Goals, habits, health, relationships, work, events, emotions, preferences, and context stored in a Neo4j graph that grows with every conversation
- **Fully Private** — Self-hostable on your own server. Your data never leaves your infrastructure
- **Multi-Model AI** — Switch between Claude, DeepSeek, Qwen, Mistral, Kimi, and Llama on the fly
- **Proactive Intelligence** — Neo surfaces reminders, notices patterns, and reaches out when something matters
- **Mobile + Web + Telegram** — Android app live, iOS coming soon, full Telegram bot interface

---

## Architecture

Neo Platform ├── companion-api (FastAPI, port 8000) Core AI agent + memory graph ├── vxneo-platform (FastAPI, port 3000) Auth, billing, push notifications ├── Neo4j Memory graph database ├── Qdrant Vector similarity search ├── Redis Session + FCM token storage └── Telegram Bot Conversational interface

---

## Quick Start (Self-Host)

### Prerequisites

- Docker + Docker Compose
- Python 3.12+
- Anthropic API key (or any supported model key)

### Setup
```bash
git clone https://github.com/jas77409/vxneo.git
cd vxneo
cp .env.example .env
nano .env
docker compose up -d
uvicorn api:app --host 0.0.0.0 --port 8000
```

### Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=your_key

# Open models (optional)
HF_API_KEY=your_huggingface_key

# Integrations (optional)
TELEGRAM_BOT_TOKEN=your_token
NOTION_TOKEN=your_token
GITHUB_TOKEN=your_token

# Infrastructure
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7687
NEO4J_PASSWORD=your_password
QDRANT_URL=http://localhost:6333
```

---

## Memory Architecture

Neo uses a 9-dimensional memory graph stored in Neo4j with vector search via Qdrant:

| Dimension    | Description                                      |
|--------------|--------------------------------------------------|
| Goals        | Short and long-term objectives                   |
| Habits       | Recurring patterns and daily routines            |
| Health       | Physical and mental wellbeing                    |
| Relationships| People, organisations, and connections           |
| Work         | Projects, tasks, and professional context        |
| Events       | Calendar, deadlines, and appointments            |
| Emotions     | Emotional state and patterns over time           |
| Preferences  | Likes, dislikes, and communication style         |
| Context      | Environmental and situational awareness          |

Each memory node has a salience score that decays over time and is boosted by repeated references — so the most relevant memories always surface first.

---

## Multi-Model Support

Neo routes conversations to the best available model based on task type:

| Key         | Model                    | Provider      |
|-------------|--------------------------|---------------|
| claude      | Claude Sonnet (default)  | Anthropic     |
| deepseek    | DeepSeek R1              | HuggingFace   |
| qwen        | Qwen 2.5                 | HuggingFace   |
| kimi        | Kimi                     | HuggingFace   |
| mistral     | Mistral 7B               | HuggingFace   |
| llama       | Llama 3.3 70B            | HuggingFace   |

Switch models via Telegram with `/model` or via the API at `POST /models/set`.

---

## Integrations

| Integration         | Status | Capabilities                                      |
|---------------------|--------|---------------------------------------------------|
| Notion              | ✅ Live | Read, write, search pages and databases           |
| Microsoft Calendar  | ✅ Live | Event awareness, upcoming appointments            |
| Google Calendar     | ✅ Live | Upcoming events, reminders                        |
| GitHub              | ✅ Live | Repo monitoring, issue management, shell tools    |
| Telegram            | ✅ Live | Full conversational interface, /model command     |
| Firebase FCM        | ✅ Live | Push notifications (Android)                      |
| Stripe              | ✅ Live | Subscription billing (CAD $5/month)               |
| Trello              | 🔄 Soon | Task and board management                         |

---

## API Endpoints

### Auth
| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| POST   | /auth/signup   | Create account     |
| POST   | /auth/login    | Login              |
| GET    | /me            | Get profile        |

### Chat
| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| POST   | /neo/ask       | Send message       |

### Memory
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | /memory/recent      | Get recent memories  |
| GET    | /memory/search?q=   | Search memories      |
| POST   | /memory/add         | Add memory           |

### Models
| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| GET    | /models        | List available models|
| POST   | /models/set    | Switch active model  |

### Vault
| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| GET    | /vault         | List vault entries   |
| POST   | /vault/add     | Add vault entry      |

### Notifications
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /device/register  | Register FCM token       |
| POST   | /notify           | Send push notification   |

---

## Mobile App

The Neo Android app is built with Flutter.

- **Package:** `com.vxneolabs.neo_companion`
- **Platform:** Android (iOS coming soon)
- **Beta:** [Join closed beta on Google Play](https://play.google.com/apps/testing/com.vxneolabs.neo_companion)

### Features
- Login / signup
- Chat with Neo with typing indicator
- Model switcher — tap model badge in header
- Memory tab — search and browse your memory graph
- Vault tab — secure notes
- Profile tab — tier, settings, sign out
- Push notifications via Firebase FCM

---

## Roadmap

- [x] Core memory graph (Neo4j + Qdrant)
- [x] Multi-model routing (6 models)
- [x] Telegram bot interface
- [x] Android mobile app (Flutter)
- [x] Firebase push notifications
- [x] Notion integration
- [x] GitHub tools + shell access
- [x] Microsoft + Google Calendar
- [x] Stripe billing
- [x] ULANZI pixel desk display service
- [ ] Trello integration
- [ ] iOS app
- [ ] One-click Docker deploy script
- [ ] Public API documentation site
- [ ] Plugin system for custom integrations

---

## Contributing

We welcome contributions of all kinds — from fixing typos to building new integrations.
```bash
git clone https://github.com/jas77409/vxneo.git
cd vxneo
pip install -r requirements.txt
cp .env.example .env
python3 agent/agent.py
```

Please open an issue before submitting a large PR. See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

### Good First Issues
- Add a new memory dimension
- Improve salience scoring algorithm
- Add WhatsApp integration
- Write tests for memory_manager.py
- Improve self-hosting documentation

---

## Active Deployments

| Deployment | Location | Description |
|---|---|---|
| [vxneo.com](https://vxneo.com) | Hetzner, Helsinki | Hosted platform |
| PROAS Persönliche Assistenz | Vienna, Austria | AI companion for disability support services |

---

## Self-Hosting Infrastructure

Neo runs on a single VPS comfortably:

- **Recommended:** 4GB RAM, 2 vCPU (Hetzner CPX22 or equivalent)
- **Services:** Neo4j, Qdrant, Redis via Docker Compose
- **Reverse proxy:** nginx with Let's Encrypt SSL
- **Monitoring:** UptimeRobot + daily backup cron

---

## License

MIT License — see [LICENSE](LICENSE)

Free to use, modify, and self-host. Commercial use permitted.

---

## Built By

**VXNeo Labs Inc.**
Ontario, Canada

[vxneolabs.com](https://vxneolabs.com) · contact@vxneolabs.com · [X @vxneolabs](https://x.com/vxneolabs)

---

*Neo is open source software. Your data is yours. We build in public.*
