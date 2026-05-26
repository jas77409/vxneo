Neo is an open-source, privacy-first voice AI companion that runs on a Raspberry Pi 5 at
the client's home. It wakes on voice, speaks naturally, detects falls, tracks health daily,
reads emails aloud, and remembers every client permanently — without sending personal data
to the cloud.
Live deployment: PROAS Vienna, Austria · First client: May 2026
vxneo.com · Android App · iOS App · VXNeo Labs

What Neo Does Today
Neo runs on a Raspberry Pi 5 at the client's home. Every morning it checks in by name.
Every evening it asks how the day went. In between, it is always listening.
FeatureTechnologyWhere it runsVoice wake word "Hey Neo"Porcupine custom modelOn Pi — no cloudSpeech to textWhisper STTOn Pi — no cloudNatural voice outputPiper TTSOn Pi — no cloudFall detectionSony AITRIOS IMX500 + PoseNetOn-chip — zero CPUDaily health check-insAPScheduler + Neo4jOn Pi9-dimensional memory graphNeo4j — persistent foreverOn Pi + serverSemantic memory searchQdrant vector searchOn Pi + serverEmail reading + dictationGmail API + WhisperServerMedicine remindersAPSchedulerOn PiWeb searchDuckDuckGoServerCare coordinator alertsTelegram BotServerMobile appsFlutterAndroid + iOSCoordinator dashboardNext.jschatvx.com

What Makes Neo Different
Edge-first, not cloud-first. Voice processing, wake word detection, and fall detection
all happen on the Raspberry Pi. Personal health data never leaves the device. This is not
a privacy policy — it is the architecture.
Permanent memory. Neo remembers every client across reboots, power cuts, and updates.
A 9-dimensional graph in Neo4j stores episodic, semantic, health, medication, social,
emotional, preference, contextual, and schedule memories. Salience decays over time and
boosts on recall — the most relevant memories always surface first.
Safety-tiered AI routing. Neo does not use one model for everything. Routine queries
run on-device. Sensitive health conversations use EU-hosted open models. Crisis situations
— fall detection, pain score 8+, emotional distress — always route to the highest-quality
model with clinical safety prompting.
Open-source first. Every model in the routing stack except the safety fallback is
open-weights and self-hostable. When we build our own GPU infrastructure, external API
dependency drops to zero.

Architecture
CLIENT HOME (Raspberry Pi 5 — 8GB)
├── Porcupine wake word — "Hey Neo" (on-chip)
├── Whisper STT — speech to text (local)
├── Piper TTS — text to speech (local)
├── Ollama — Mistral 7B / Phi-3 Mini (local inference)
├── Sony AITRIOS IMX500 — fall detection (on-chip PoseNet)
├── APScheduler — reminders, health check-ins
└── FastAPI client — connects to Hetzner API

HETZNER SERVER (Ubuntu 4GB, Helsinki)
├── FastAPI backend — 19+ endpoints (port 8000)
├── Neo4j — 9-dimensional memory graph (port 7687)
├── Qdrant — vector semantic search (port 6333)
├── Redis — real-time state + alert queue (port 6379)
├── Telegram Bot — coordinator alerts
├── Gmail API — email reading + dictation
├── Ghost CMS — blog.vxneo.com
└── Docker Compose — all services auto-restart

MOBILE + WEB
├── Flutter — Android (Play Store) + iOS (App Store)
├── chatvx.com — coordinator dashboard (Next.js)
└── vxneo.com — platform (Hetzner)

3-Tier Model Routing
Neo uses a safety-tiered model router. Every call is classified by safety level before
a model is selected. Clinical context (pain score, fall detection, mood) overrides keyword
classification — if a client reported pain 8 this morning, every subsequent call in that
session routes to at least Tier 3.
TIER 1 — ON-DEVICE (Ollama on Pi)
  Mistral 7B Q4 · Phi-3 Mini · Llama 3.2 3B · Gemma 2B
  Zero cost · Zero latency · Zero data transfer
  Use for: greetings, weather, time, simple reminders

TIER 2 — EU CLOUD (open-weight models)
  Mistral Small/Medium/Large (French company, EU servers, GDPR-native)
  Qwen 3 72B (best for Austrian German dialect)
  DeepSeek V4 (long context, structured reports)
  Cohere Command R (RAG + document retrieval)
  Use for: health check-ins, emails, care reports, multilingual

TIER 3 — SAFETY NET (proprietary, last resort)
  Claude Haiku → Claude Sonnet
  Use for: fall alerts · pain ≥ 8 · emotional crisis · clinical decisions
Safety rules — never overridden:

Fall detected → Claude only
Pain score ≥ 8 → Claude minimum
Mood score ≤ 2 → Claude minimum
Crisis keywords (English + German) → Claude + coordinator alert

Cost at scale (20 clients, 30K calls/month): ~€14/month total inference
All Tier 1 and Tier 2 models are open-weights (Apache 2.0 / MIT) — fully self-hostable
on your own GPU infrastructure via vLLM. See agent/routing/neo_model_router.py.

Memory Architecture
Neo4j graph with 9 node types. Each node has a salience score (0–1) that decays nightly
by 0.99 and boosts by +0.05 on every recall. Qdrant stores 384-dimensional embeddings
(all-MiniLM-L6-v2) for semantic search. Top 6 memories are injected into every LLM call.
DimensionDescriptionEpisodicSpecific events and conversationsSemanticGeneral knowledge about the clientHealthPain scores, symptoms, medication historyMedicationPrescriptions, dosages, schedulesSocialPeople, organisations, relationshipsEmotionalMood patterns, emotional state over timePreferenceLikes, dislikes, communication styleContextualEnvironmental and situational awarenessScheduleAppointments, reminders, routines

Agent Pipeline
Each request flows through a LangGraph StateGraph:
security → router → classify → recall → respond → store
                  ↘ tool handler (bypasses LLM) ↗

security — injection detection, PII scanning
router — keyword task classification → dispatches to tool handler if matched
classify — detects conversation mode (navigator / mirror / catalyst / witness / horizon / librarian)
recall — Qdrant top-6 semantic memory retrieval, salience boost
respond — model router selects tier, calls model with memory context
store — writes episodic memory, updates Redis state, continuous learning

PROAS check runs first — disability support case management integration reads from
Google Drive .xlsm before general task classification.

Conversation Modes
Auto-detected from keywords. Each mode has a distinct system prompt:
ModeBehaviournavigatorDecision mapping, one clarifying questionmirrorPattern reflection, unflinchingcatalystDisrupts avoidance, one concrete actionwitnessListens only, no advicehorizonLong-arc thinking, identity over taskslibrarianFull memory retrieval and synthesis

Integrations
IntegrationStatusCapabilitiesGmail✅ LiveRead aloud, dictate replies by voiceGoogle Calendar✅ LiveEvents, reminders, appointment awarenessMicrosoft Calendar✅ LiveOAuth via ms_token.jsonTelegram Bot✅ LiveCoordinator alerts, rich notificationsFirebase FCM✅ LivePush notifications (Android + iOS)PROAS case mgmt✅ LiveGoogle Drive .xlsm — disability supportGitHub✅ LiveRepo monitoring, issue managementNotion✅ LivePages and databasesObsidian Vault✅ LiveMarkdown vault at /root/vault/Sony AITRIOS✅ LiveOn-chip fall detection, PoseNetStripe✅ LiveSubscription billingGhost CMS✅ Liveblog.vxneo.comBrevo SMTP✅ LiveEmail delivery

Quick Start (Self-Host)
Prerequisites

Raspberry Pi 5 (8GB recommended) or any Linux server
Docker + Docker Compose
Python 3.12+
Ollama (for on-device inference)
At least one model API key (Mistral, Anthropic, or Together AI)

Setup
bashgit clone https://github.com/jas77409/vxneo.git
cd vxneo
cp .env.example .env
nano .env                          # fill in your API keys
docker compose up -d               # start Neo4j, Qdrant, Redis
source venv/bin/activate
uvicorn agent.api:app --host 0.0.0.0 --port 8000
Install Ollama (Tier 1 on-device inference)
bashcurl -fsSL https://ollama.ai/install.sh | sh
ollama pull mistral:7b-instruct-q4_K_M    # 4.1GB — recommended
ollama pull phi3:mini-4k-instruct-q4      # 2.2GB — fastest on Pi
Environment Variables
bash# Required — at least one model
ANTHROPIC_API_KEY=your_key         # Claude — safety fallback
MISTRAL_API_KEY=your_key           # Mistral — EU cloud, recommended
TOGETHER_API_KEY=your_key          # Qwen, DeepSeek

# On-device inference
OLLAMA_BASE_URL=http://localhost:11434

# Infrastructure
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7687
NEO4J_PASSWORD=your_password
QDRANT_URL=http://localhost:6333

# Integrations (optional)
TELEGRAM_BOT_TOKEN=your_token
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
PROAS_FILE_ID=your_google_drive_file_id
GITHUB_TOKEN=your_token
NOTION_TOKEN=your_token

# Notifications
FIREBASE_PROJECT_ID=your_project

Running the Stack
bash# Infrastructure
docker compose up -d               # Neo4j, Qdrant, Redis, Redis Commander
docker compose ps                  # verify all 4 services running

# API server
source venv/bin/activate
uvicorn agent.api:app --host 0.0.0.0 --port 8000 --reload

# Telegram bot
python3 telegram_bot.py

# Cron jobs (or let systemd run them)
python3 cron/morning.py            # morning orientation
python3 cron/reflection.py         # evening reflection
python3 cron/decay.py              # nightly salience decay
python3 cron/weekly_review.py      # weekly summary

# Re-authenticate Google (when token expires)
python3 reauth.py

# Systemd (production)
systemctl status companion-api
systemctl status neo-telegram
journalctl -u companion-api -f

API Endpoints
MethodEndpointDescriptionPOST/askSend message — model router selects tierPOST/ask/v2New 3-tier router endpointGET/memory/recentRecent memoriesGET/memory/search?q=Semantic memory searchPOST/memory/addAdd memory nodeGET/healthCheck-in status + pain scorePOST/alertTrigger coordinator alertGET/modelsList available modelsPOST/models/setSwitch active modelGET/vaultObsidian vault entriesPOST/vault/addAdd vault entryPOST/device/registerRegister FCM tokenPOST/notifySend push notificationGET/proas/clientsPROAS client listGET/ws/screenWebSocket screen state

Mobile Apps
Built with Flutter. Single codebase, Android + iOS.

Android: com.vxneolabs.neo_companion — Play Store
iOS: com.vxneolabs.neoCompanion — App Store

Features: voice chat with Neo · health check-in · memory browser · coordinator view ·
push notifications · model switcher

Roadmap
Completed

 9-dimensional Neo4j memory graph
 Whisper STT + Piper TTS (on-device)
 Porcupine custom wake word "Hey Neo"
 Fall detection via Sony AITRIOS IMX500
 3-tier model router (on-device → EU cloud → safety net)
 Ollama on-device inference (Mistral 7B, Phi-3 Mini)
 PROAS Vienna live deployment
 Android + iOS apps (Flutter)
 Telegram coordinator alerts
 Gmail voice reading + dictation
 Daily health check-ins (pain + mood)
 Medicine reminders
 GDPR-compliant architecture
 Austrian German dialect support (Qwen 3)

In Progress

 OVHcloud France — EU data residency server
 Mistral API integration (Tier 2 primary)
 chatvx.com coordinator dashboard (Next.js)
 Austrian FlexCo incorporation (eGründung via USP)
 Netherlands BV (EU HoldCo for Ananda Impact Ventures)

Planned

 OpenBCI BrainFlow integration (BCI commands for non-verbal clients)
 Home Assistant integration
 vLLM self-hosted GPU inference (data center Phase 2)
 iOS TestFlight public beta
 FFG Basisprogramm R&D grant application
 Fine-tuned model on anonymised care interaction data
 One-click Pi setup script (new client in under 10 minutes)


Self-Hosting Infrastructure
Neo runs comfortably on modest hardware:
ComponentMinimumRecommendedPi (edge device)Pi 4 4GBPi 5 8GBServer2GB RAM, 1 vCPU4GB RAM, 2 vCPUStorage32GB SD + 64GB USB256GB NVMeGPU (future)—RTX 4090 (Tier 2 self-host)
Recommended server: Hetzner CPX22 (€5.83/month) or OVHcloud VPS (€3.50/month, France)

GDPR Compliance

Personal health data stored exclusively on Pi (edge-first)
EU server data on Hetzner Helsinki (EU jurisdiction)
AI inference via Anthropic covered by Anthropic DPA + SCCs
Mistral API inference: EU-hosted, GDPR-native (French company)
No personal data sold or shared with third parties
Right to deletion: /memory/delete endpoint
Data Protection Officer: contact@vxneolabs.com


Contributing
We welcome contributions — especially from engineers with lived experience of disability
or caregiving. You understand the mission better than anyone.
bashgit clone https://github.com/jas77409/vxneo.git
cd vxneo
pip install -r requirements.txt
cp .env.example .env
ollama pull mistral:7b-instruct-q4_K_M
python3 agent/agent.py
Open an issue before submitting a large PR.
Good First Issues

Improve Austrian German dialect accuracy in Whisper STT
Add WhatsApp integration
Write tests for memory_manager.py and model_router.py
Improve one-click Pi setup script
Add OpenBCI BrainFlow Python integration
Improve self-hosting documentation


Active Deployments
DeploymentLocationDescriptionvxneo.comHetzner, HelsinkiHosted platform + APIPROAS Persönliche AssistenzVienna, AustriaDisability care AI companionPi 5 @ client homeVienna, AustriaLive edge deployment — Amrit

Company
VXNeo Labs Inc.
Ontario, Canada
Expanding: VXNeo Labs BV (Netherlands) · VXNeo Labs GmbH (Vienna) · VXNeo Labs SAS (France, Q4 2026)
vxneolabs.com · contact@vxneolabs.com

License
MIT License — see LICENSE
Free to use, modify, and self-host. Commercial use permitted.

Neo runs at the edge, not in the cloud. Your data is yours. We build in public.
