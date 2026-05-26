# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Neo is a self-hosted personal companion intelligence platform. It builds a persistent memory graph of the user's life across 9 dimensions (Goals, Habits, Health, Relationships, Work, Events, Emotions, Preferences, Context) and uses it to respond contextually via a LangGraph agent pipeline.

There are **two codebases** in this repo:
- `/root/companion/` — the live production deployment (this repo root)
- `/root/companion/vxneo/` — a separate git repo (the open-source distribution copy, tracked independently)

Changes to production code in the root are **not** automatically mirrored to `vxneo/`.

---

## Running the Stack

**Infrastructure (Docker):**
```bash
docker compose up -d          # start Neo4j, Qdrant, Redis, Redis Commander
docker compose ps             # verify all 4 services are up
docker compose logs neo4j     # check a specific service
```

**API server:**
```bash
cd /root/companion
source venv/bin/activate
uvicorn agent.api:app --host 0.0.0.0 --port 8000 --reload
```

**Telegram bot:**
```bash
source venv/bin/activate
python3 telegram_bot.py
```

**Cron jobs (run manually for testing):**
```bash
source venv/bin/activate
python3 cron/morning.py       # morning orientation + daily note
python3 cron/reflection.py    # evening reflection
python3 cron/decay.py         # salience decay on all memories
python3 cron/weekly_review.py # weekly summary
```

**Self-test memory system:**
```bash
source venv/bin/activate
python3 agent/memory/memory_manager.py
```

**Self-test task router:**
```bash
source venv/bin/activate
python3 agent/routing/task_router.py
```

**Re-authenticate Google (when token expires):**
```bash
python3 reauth.py
```

**Systemd services (production):**
```bash
systemctl status companion-api
systemctl status neo-telegram
journalctl -u companion-api -f
```

---

## Architecture

### Agent Pipeline (`agent/agent.py`)

Each request flows through a LangGraph `StateGraph` in this order:

```
security → router → [classify → recall → respond] → store
                  ↘ skip (if routed) ↗
```

1. **security** — scans for injection attempts and PII via regex patterns
2. **router** — keyword-based task classification; dispatches to a tool handler if matched, bypassing the LLM entirely
3. **classify** — detects one of 6 conversation modes (navigator, mirror, catalyst, witness, horizon, librarian) or defaults to `Neo`
4. **recall** — vector-searches Qdrant for the top 6 relevant memories; appends them to the system prompt
5. **respond** — calls the active LLM model with the mode system prompt + memory context
6. **store** — writes the input as an Episodic memory, updates Redis state keys, fires `observe_interaction` for continuous learning, and calls `record_turn` for strategic compaction

### Memory System (`agent/memory/memory_manager.py`)

Dual-write to both Neo4j (graph, relationships, salience) and Qdrant (vector search). On recall, matched memories get their salience boosted by `+0.05` in Neo4j. The `run_decay()` function multiplies all unaccessed memories by `0.99` (called nightly via cron).

Memory types: `Episodic`, `Semantic`, `Procedural`, `Affective`, `Goal`, `Belief`, `Identity`, `Contextual`, `Capture`

Embeddings use `all-MiniLM-L6-v2` (384-dim) via `sentence-transformers`. If the model is unavailable, writes zero-vectors (graceful degradation).

### Task Router (`agent/routing/task_router.py`)

Keyword-matching classifies inputs into task types: `github`, `notion`, `shell`, `email`, `memory_store`, `memory_recall`, `vault_write`, `vault_search`, `web_search`, `calendar`. Matched tasks are dispatched to handler functions that call the relevant integration tool, bypassing the LLM.

**PROAS check runs first** — before general task classification — to handle the disability-support case management integration (reads from a Google Drive `.xlsm` spreadsheet).

### Multi-Model Router (`agent/routing/model_router.py`)

Supports 17 model configurations across Anthropic, OpenAI, Google, DeepSeek, Qwen, Kimi, HuggingFace, and local Ollama. Active model is persisted in Redis (`neo:model:default`). Falls back to `claude` (Opus) if unset.

### Continuous Learning (`agent/routing/continuous_learning_v2.py`)

Tracks "instincts" — weighted patterns (confidence 0–1) stored as Redis hashes under `neo:instincts`. Each interaction calls `observe_interaction` which reinforces or creates instincts. Instincts expire after 30 days. Cron runs `prune_expired()` and `evolve()` daily at 05:00.

### Strategic Compaction (`agent/routing/strategic_compaction.py`)

Maintains a rolling session context in Redis. After 20 turns, compacts to 5 using milestone detection (decision made, insight, goal set, topic shift, session end). Keeps the LLM context lean across long sessions.

### Conversation Modes (`agent/modes/mode_prompts.py`)

6 named modes with distinct system prompts, auto-detected from keywords:
- **navigator** — decision mapping, asks one clarifying question
- **mirror** — pattern reflection, unflinching
- **catalyst** — disrupts avoidance, gives one concrete action
- **witness** — listens only, no advice
- **horizon** — long-arc thinking, identity over tasks
- **librarian** — comprehensive memory retrieval and synthesis

### Integrations (`agent/tools/`)

| File | Integration |
|---|---|
| `google_tools.py` | Gmail read/send, Google Calendar events |
| `ms_tools.py` | Microsoft Calendar (OAuth via `ms_token.json`) |
| `notion_tools.py` | Notion pages and databases |
| `github_tools.py` | Repo monitoring, issues, shell command execution |
| `obsidian_tools.py` | Vault markdown files at `/root/vault/` |
| `proas_tools.py` | PROAS disability-support case mgmt (Google Drive `.xlsm`) |

Google auth tokens live in `google_token.json` (not in `.env`). Run `reauth.py` when they expire.

### Vault Structure

Obsidian-compatible markdown vault at `/root/vault/`:
```
00-Inbox / 10-Daily / 20-Reflections / 30-People /
40-Beliefs / 50-Goals / 60-Patterns / 70-Ideas / 80-Agent-Log
```

### Redis Key Conventions

| Key | Purpose |
|---|---|
| `agent_state` | Last agent state (e.g. `responded:catalyst`) |
| `last_mode` / `last_response` / `last_task_type` | Current session state (read by `/ws/screen`) |
| `neo:model:default` | Active model key |
| `neo:instincts` | Hash of learned instinct objects |
| `neo:session:turns` / `context` / `milestones` | Strategic compaction state |
| `router_log` / `security_warnings` | Rolling logs (last 100 entries) |

---

## Key Config Notes

- All Python files use hardcoded absolute paths (`/root/companion/...`) in `sys.path.insert` calls — this is intentional for the production deployment, but breaks if the repo is moved.
- The `venv/` is at `/root/companion/venv`. Always activate before running any agent code.
- `companion/.env` has a duplicate `NOTION_TOKEN` line — only the first is used.
- `vxneo/.env` has placeholder values (not filled in) and a wrong `NEO4J_PASSWORD` — the live password is `companion_2026`.
- The PROAS tool (`proas_tools.py`) is not in `vxneo/agent/tools/` — it's production-only.
