CLAUDE.md — VXNeo Labs Complete Project Context
Last updated: May 2026 | Compiled from full project history
Claude Code reads this automatically at the start of every session.
When something major changes, update this file (ask Claude Code or edit directly).

What This Project Is
Neo is a privacy-first voice AI companion for people with disabilities, deployed as a
self-contained Raspberry Pi 5 at the client's home. It wakes on voice, speaks naturally,
detects falls on-chip, tracks health daily, reads emails aloud, and remembers every client
permanently via a 9-dimensional Neo4j graph memory.
Live deployment: PROAS Vienna, Austria · 2 clients · First client Amrit since Feb 2026
Revenue: CAD $1,000/month per care org · Contract signed · GDPR DPA signed
There are TWO codebases:

/root/companion/ — live production server (this repo)
/root/companion/vxneo/ — open-source distribution copy (separate git repo, Apache 2.0)

Changes to production are NOT automatically mirrored to vxneo/

Hardware — Raspberry Pi 5 (Client Home)

Case/Kit:  Pironman 5 Pro Max Kit (SunFounder)
CPU:       Raspberry Pi 5 — 8GB RAM — ARM Cortex-A76
Camera:    Raspberry Pi AI Camera (Sony IMX500) — integrated — on-chip PoseNet
Display:   0.96" OLED on Pironman front panel — driven by neo_display.py
Audio:     USB PnP Sound Device (MIC_INDEX=4 in systemd)
Storage:   NVMe SSD via M.2 slot in Pironman
Note: "Raspberry Pi AI Camera" IS the Sony IMX500 — same chip, official RPi packaging.
Code references to AITRIOS IMX500 and PoseNet remain correct.


Infrastructure — All Servers & Access
Hetzner VPS (Primary Server)

IP / SSH:  root@204.168.170.174
OS:        Ubuntu 22.04 LTS, 4GB RAM, Helsinki
Companion code: /root/companion/
Neo4j password (live): companion_2026
Ghost blog: /var/www/ghost/ (run as ghostuser) — https://blog.vxneo.com/ghost
Ghost Content API Key: 065df050372b429ae37b9f0822

Raspberry Pi 5 (Edge Device)

SSH:       neo@192.168.0.48 or neo@neo-pi.local
Remote:    connect.raspberrypi.com (device: neo)
Pi code:   /home/neo/vxneo/
User:      neo (not root)
OS:        Raspberry Pi OS Lite 64-bit — headless

Developer Machines (Tailscale VPN)

Jas office PC:  100.95.38.100:9000
Amrit home PC:  100.94.15.109:9000
Flutter project: C:\Users\Info\Documents\neo_official (branch: flutter-app)
Local vxneo repo: C:\Users\jaspa\vxneo
Android keystore: C:\Users\Info\Documents\neo-release-key.jks (alias: neo)

VS Code SSH config (~/.ssh/config)
Host vxneo-hetzner
    HostName 204.168.170.174
    User root
    IdentityFile C:\Users\Info\.ssh\id_ed25519
    StrictHostKeyChecking no
    ServerAliveInterval 60
VS Code Remote SSH needs the FULL Windows path to the key (~ fails).
Open the LOCAL folder (code C:\Users\jaspa\vxneo), never the GitHub virtual
filesystem (vscode-vfs://) — Claude Code cannot run on virtual workspaces.
Always activate venv first
bash# Pi
source /home/neo/vxneo/venv/bin/activate && cd /home/neo/vxneo
# Hetzner
source /root/companion/venv/bin/activate && cd /root/companion

Raspberry Pi — All 6 Systemd Services
bashsudo systemctl status neo-api neo-wake neo-fall neo-alerts neo-scheduler neo-emotion --no-pager
sudo systemctl restart neo-wake
sudo journalctl -u neo-wake -f
sudo systemctl daemon-reload    # after editing any .service file
ServiceFunctionDescriptionneo-apiFastAPI :800028+ endpoints — Neo4j + Qdrant + Redisneo-wakeWake wordPorcupine + pvrecorder · MIC_INDEX=4 · Hey Neoneo-fallFall detectionAITRIOS IMX500 PoseNet → Telegram alertneo-alertsAlert routingReads Redis neo_alerts → Piper TTS → speakerneo-schedulerRemindersAPScheduler · medicine 08:00+20:00 · check-in 08:30neo-emotionEmotion sensingCamera scene inference → Redis emotion_state
CRITICAL service fix — neo-wake.service
Environment="XDG_RUNTIME_DIR=/run/user/1000"
Without this, pvrecorder CANNOT see the USB mic in systemd context (pipewire
blocks device enumeration). Known production bug — keep it in the file.
Docker Compose (Hetzner)
bashdocker compose up -d        # Neo4j, Qdrant, Redis, Redis Commander
docker compose ps

Wake Word System — wake_word.py
SettingValueWake word"Hey Neo" — custom Porcupine (hey_neo.ppn)Porcupine keyG8tVxojA2IcKWBmC6oCMe3TYHaDER3qP1hVyOB13hpLdgs9qyF1WzA==MIC_INDEX4 (USB PnP in systemd) · 0 (interactive/manual)Sensitivity0.9 · Sample rate 16000 HzVolume boostnp.clip(samples * 10, -32767, 32767) — 10xSilence skipRMS < 800 → skip transcriptionTTSPiper en_US-lessac-medium.onnx · fallback espeak-ngBackupagent/wake_word_v2_working.py — golden copy
python_PC_MAP = {
    'prime_amrit_001': 'http://100.94.15.109:9000/command',
    'jas_personal':    'http://100.95.38.100:9000/command',
}
_ACTIVE_USER = 'jas_personal'   # MUST change to prime_amrit_001 at Amrit's home

Audio Pipeline

pvrecorder 16000Hz → 10x numpy boost → noisereduce (prop_decrease=0.85) → RMS check → Whisper
Whisper tiny (English) → Whisper base (German) — auto language detection
Austrian German vocab: /home/neo/vxneo/data/austrian_hints.json
NEVER share pvrecorder + arecord in same thread → segfault. Use pvrecorder on Pi 5.


Key API Endpoints (28+ on FastAPI)
MethodEndpointDescriptionPOST/askMain conversation · user_id requiredPOST/ask/smartMulti-model router (current production)POST/ask/v2NEW 3-tier router (neo_model_router.py) — wire pendingPOST/neo/askMobile app endpoint (Bearer token)GET/healthHealth checkPOST/prime/enrollEnroll Prime Program clientGET/prime/clientsList enrolled clientsGET/memory/recentRecent memoriesGET/memory/search?q=Semantic memory searchPOST/memory/addAdd memory nodeDELETE/memory/deleteGDPR Art.17 deletionGET/camera/stateFall detection + emotionPOST/alertTrigger coordinator alertPOST/scheduler/addAdd appointment/reminderGET/modelsList modelsPOST/models/setSwitch active model (Redis)GET/proas/clientsPROAS case managementGET/ws/screenWebSocket screen state

Client Profiles
Amrit Singh — Live Client + Co-Founder of PROAS partnership
user_id:     prime_amrit_001
condition:   Mobility impairment — daily companion support
coordinator: Amandeep · location: Vienna · language: English
enrolled:    February 2026
PC Tailscale: http://100.94.15.109:9000/command
Note: Amrit is co-founder of the PROAS-VXNeo partnership (NOT co-owner of VXNeo Labs Inc.)
Jas (Founder)
user_id: jas_personal · PC: http://100.95.38.100:9000/command
Neo4j multi-tenant: all nodes isolated by user_id.

9-Dimensional Memory Architecture
Episodic · Health · Medication · Emotional · Social · Preference · Schedule ·
Contextual · Semantic (+ Procedural for success-chain learning)

Salience: decays ×0.99 nightly · boosts +0.05 on recall
Vectors: all-MiniLM-L6-v2 (384-dim) in Qdrant · top-6 injected per call

Agent Pipeline (LangGraph StateGraph)
security → router → classify → recall → respond → store
                  ↘ tool handler (bypasses LLM) ↗
PROAS check runs FIRST — before general task classification.

3-Tier Model Router (neo_model_router.py)
TIER 1 — ON-DEVICE (Ollama on Pi): Mistral 7B Q4, Phi-3 Mini, Llama 3.2 3B — €0
TIER 2 — EU CLOUD: Mistral API (FR), Qwen 3 72B, DeepSeek V4, Cohere
TIER 3 — SAFETY NET: Claude Haiku → Claude Sonnet (critical care only)
Safety rules — NEVER overridden:

Fall detected → Claude only
Pain score ≥ 8 → Claude minimum
Mood score ≤ 2 → Claude minimum
Crisis keywords (EN + DE) → Claude + coordinator alert

Cost ~€14/mo at 20 clients vs ~€90 all-Claude. All Tier 1/2 models open-weights →
self-hostable via vLLM on future GPU server (change TOGETHER_BASE_URL).

Redis Key Conventions
KeyPurposeneo:model:defaultActive model keyneo:instinctsLearned patterns (hash, expire 30d)neo:session:turns/context/milestonesStrategic compactionneo_alertsAlert queue read by neo-alerts serviceemotion_stateCurrent emotion (TTL 60s)router_log / security_warningsRolling logs (last 100)

Flutter Mobile App
SettingValueProjectC:\Users\Info\Documents\neo_official (branch: flutter-app)Android packagecom.vxneolabs.neo_companion (Google Play — LIVE)iOS bundlecom.vxneolabs.neoCompanion (App Store)Current version1.0.9+15App Store ID6768433086 · Team ID 5C3T3UFBFK · jaybpangli@gmail.comiOS deploymentIPHONEOS_DEPLOYMENT_TARGET = 16.0API endpointhttps://vxneo.com/neo/ask (Bearer, SharedPreferences key: neo_token)iOS CICodemagic — builds on push to flutter-app branchAndroid keystoreC:\Users\Info\Documents\neo-release-key.jks (alias: neo)
Build commands (Windows PowerShell)
powershellflutter build appbundle --release --no-tree-shake-icons   # Android — local only
flutter clean ; flutter pub get
# Version in pubspec.yaml: version: 1.0.9+15 (number after + = build number)
git push origin flutter-app    # triggers Codemagic iOS build
iOS Critical Fixes (LEARNED — do not regress)

Info.plist UIApplicationSceneManifest must have CLEAN structure — NO duplicated
keys. Duplicated usage-description keys nested in scene dicts caused
NSInvalidArgumentException (-[__NSCFString count]) crash on iPad launch (iPadOS 26.5).
Fixed in 1.0.9+15. All usage descriptions + ITSAppUsesNonExemptEncryption at TOP
LEVEL once. UIWindowSceneSessionRoleApplication must be an array → single dict.
SceneDelegate.swift must exist (manifest references $(PRODUCT_MODULE_NAME).SceneDelegate)
AppDelegate.swift — safe plugin registration
ITSAppUsesNonExemptEncryption = false
porcupine_flutter requires iOS deployment target 16.0
Many audio plugins compete for mic/audio session (porcupine_flutter, speech_to_text,
just_audio, record, flutter_foreground_task, flutter_background_service).
If launch crashes recur, audio session conflict is the next suspect.

App Store Connect rules (LEARNED)

NEVER reuse a build number already uploaded — App Store reserves every uploaded
number even from rejected builds. Each upload needs a strictly HIGHER number.
Match the App Store version field to the build's CFBundleShortVersionString.
Codemagic auto-trigger may not fire — start builds manually if needed
(codemagic.io → neo_companion → Start new build → branch flutter-app).
Build Android locally (keystore on Windows), iOS via Codemagic.


Integrations
IntegrationFileAuthGmailagent/tools/google_tools.pyOAuth google_token.jsonGoogle Calendaragent/tools/google_tools.pysame tokenMicrosoft Calendaragent/tools/ms_tools.pyms_token.jsonTelegram Bottelegram_bot.pytelegram.envFirebase FCMfirebase-adminsdk.jsonservice accountPROAS case mgmtagent/tools/proas_tools.pyGoogle Drive — PROAS_FILE_ID in .envGitHubagent/tools/github_tools.pyGITHUB_TOKEN in .envNotionagent/tools/notion_tools.pyNOTION_TOKEN in .envObsidian vaultagent/tools/obsidian_tools.py/root/vault/Ghost CMSGhost Content APIblog.vxneo.comBrevo SMTPBrevo API9eadc5001@smtp-brevo.com
Google OAuth

Token: /root/companion/google_token.json (gitignored — NEVER commit)
Re-auth: python3 reauth.py (interactive OAuth flow)


GitHub

Repo: github.com/jas77409/vxneo (Apache 2.0)
Two separate repos: companion/ and companion/vxneo/ — push each independently
PAT auth: git remote set-url origin https://TOKEN@github.com/jas77409/vxneo.git
Save creds: git config --global credential.helper store
Identity: git config --global user.email "jaybpangli@gmail.com"
Before push: git pull origin main --rebase
"Neo/Matrix" = Telegram bot + Pironman OLED display (neo_display.py), NOT Matrix protocol.


Known Issues & Fixes (LEARNED)
IssueFixpvrecorder segfaultDelete pvrecorder + porcupine BEFORE conversation loop. Never share with arecord.USB mic inaudible10x numpy boost. RMS check skips silence.systemd audio deviceXDG_RUNTIME_DIR=/run/user/1000 in neo-wake.serviceiOS launch crash (iPad)Clean Info.plist scene manifest — no duplicated keys. Fixed 1.0.9+15.Duplicate build numberAlways bump build number higher; never reuse an uploaded number.Whisper hallucinationSkip transcription if RMS < 800 (TTS echo).AP isolation (router)Use Tailscale VPN — Pi↔PC over 100.x IPs.German mishearingAuto-detect language. Use austrian_hints.json.MIC index wrongMIC_INDEX=4 systemd, 0 interactive.Codemagic debug AABBuild Android locally with --release.VS Code virtual FS errorOpen LOCAL folder (code C:\Users\jaspa\vxneo), not vscode-vfs://Claude Code wrong accountClear ~/.claude.json, re-login.

Best Practices (CRITICAL — do not regress)

Always activate venv before running Python
MIC_INDEX=4 systemd · 0 interactive
XDG_RUNTIME_DIR mandatory in neo-wake.service
Never share pvrecorder + arecord in same thread
Build Android locally, iOS via Codemagic
Never commit .env, google_token.json, ms_token.json
PROAS_FILE_ID in .env — never hardcode Google Drive IDs
All Pi paths absolute (/home/neo/vxneo/...) — set via sed when moving from /root/companion
_ACTIVE_USER in wake_word.py MUST match deployment location
Never reuse an App Store build number
Clean Info.plist — no duplicated keys, valid scene manifest
Flutter version in pubspec.yaml controls build number (after +)
Piper TTS fallback: always espeak-ng as backup
Pi Connect for remote access — no VPN needed
Open LOCAL folder in VS Code, never the GitHub virtual filesystem


Business & Company Context
Company Structure (May 2026)

VXNeo Labs Inc. — Ontario, Canada (parent, IP owner, IRAP/SR&ED eligible)
VXNeo Labs BV — Netherlands (EU HoldCo, Ananda Impact Ventures vehicle)
VXNeo Labs FlexCo — Vienna, Austria (incorporating via USP eGründung + ID Austria)
VXNeo Labs SAS — France (Q4 2026, Sofinnova Partners)

Revenue & Compliance

PROAS Vienna: CAD $1,000/month · 12-month auto-renewing · GDPR DPA signed
Data deletion: <10 days · Austrian DSG compliant
EU AI Act: high-risk health AI — conformity deadline August 2026

Funding Pipeline

Ananda Impact Ventures (Munich) — requires EU HoldCo → Netherlands BV
FFG Kleinprojekt — up to €90,000 PURE GRANT, rolling — TOP priority after FlexCo
FFG Basisprogramm — up to €3M (grant+loan) for GPU/data center R&D
aws PreSeed (€267k), Austrian Forschungsprämie (14% cash), Canadian SR&ED (35%) — stackable
EIC Accelerator (€2.5M+€10M) — Year 2
Zero Project 2027 — submit by 21 June 2026 (Amrit presents)

Patent Strategy

Austrian Gebrauchsmuster #1 (fall detection + voice pipeline) — ready to file ~€100
#2 (9-dim memory) and #3 (edge privacy) — drafts Month 3
PCT via Canadian provisional Month 12
Review Ada Health EP4679451B1 before filing safety-routing patent

Hiring

Jaspreet Sandhu — AI Architect (India retainer, ₹1,50,000/mo, 15hrs/wk)
CTO — to hire (equity 2-5%)
Senior AI/ML Architect — to hire (equity 0.5-2%)
Vienna summer interns 2026 — Tech + Research/Impact tracks

BCI Roadmap (2027)
OpenBCI BrainFlow, Synchron, Emotiv — thought-command interface for non-verbal/ALS clients.

Running the Stack
bash# HETZNER
docker compose up -d
source venv/bin/activate
uvicorn agent.api:app --host 0.0.0.0 --port 8000 --reload
python3 telegram_bot.py
python3 reauth.py    # when Google token expires

# PI
sudo systemctl status neo-api neo-wake neo-fall neo-alerts neo-scheduler neo-emotion
python3 agent/memory/memory_manager.py     # self-test
python3 agent/routing/neo_model_router.py   # test routing

Current Priorities (May 2026)

iOS 1.0.9+15 — awaiting App Review (Info.plist crash fixed) — submitted
Incorporate FlexCo via usp.gv.at (needs €5,000 in business bank account first)
File FFG Kleinprojekt after FlexCo incorporates (€90k non-dilutive — highest value)
File Gebrauchsmuster #1 at patentamt.at (~€100, document ready)
Submit Zero Project by 21 June 2026 (ideally June 7)
Wire neo_model_router.py into /ask/v2 endpoint
Address 20 critical production gaps before Ananda due diligence
Record 90-second YouTube video of Amrit using Neo
OVHcloud France VPS (EU data residency)
chatvx.com coordinator dashboard (Next.js)


VXNeo Labs Inc. · Ontario, Canada · vxneo.com · contact@vxneolabs.com
Update this file when major changes occur — ask Claude Code or edit directly.
