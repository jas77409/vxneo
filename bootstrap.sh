#!/bin/bash
set -e
NEO_VERSION="1.0.0"
NEO_DIR="/root/companion"
VAULT_DIR="/root/vault"
LOG_DIR="/root/companion/logs"
VENV="$NEO_DIR/venv"
RED='\033[0;31m';GREEN='\033[0;32m';BLUE='\033[0;34m';CYAN='\033[0;36m';YELLOW='\033[1;33m';BOLD='\033[1m';NC='\033[0m'
log()     { echo -e "${CYAN}[neo]${NC} $1"; }
success() { echo -e "${GREEN}[ok]${NC}  $1"; }
warn()    { echo -e "${YELLOW}[warn]${NC} $1"; }
error()   { echo -e "${RED}[error]${NC} $1"; exit 1; }
section() { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
echo -e "${BOLD}\n Neo — Personal Companion Intelligence v${NEO_VERSION}\n github.com/jas77409/vxneo\n${NC}"
section "Pre-flight checks"
[ "$EUID" -ne 0 ] && error "Please run as root: sudo bash bootstrap.sh"
RAM=$(free -m | awk '/^Mem:/{print $2}')
log "RAM: ${RAM}MB"
[ "$RAM" -lt 2000 ] && warn "Less than 2GB RAM. Neo may be slow."
section "Configuration"
if [ -f "$NEO_DIR/.env" ]; then
    warn "Existing installation detected."
    read -p "Reinstall? (y/N): " REINSTALL
    [[ "$REINSTALL" != "y" && "$REINSTALL" != "Y" ]] && { log "Aborted."; exit 0; }
fi
echo ""
read -p "Anthropic API key (sk-ant-...): " ANTHROPIC_KEY
[ -z "$ANTHROPIC_KEY" ] && error "API key is required."
read -p "Telegram bot token (optional, Enter to skip): " TELEGRAM_TOKEN
read -p "Your name [Friend]: " USER_NAME
USER_NAME=${USER_NAME:-"Friend"}
read -p "Timezone [UTC]: " TIMEZONE
TIMEZONE=${TIMEZONE:-"UTC"}
section "System packages"
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv docker.io docker-compose redis-server nginx git curl wget build-essential lsb-release
success "System packages installed"
section "Docker services"
mkdir -p "$NEO_DIR"
cat > "$NEO_DIR/docker-compose.yml" << DCEOF
version: '3.8'
services:
  neo4j:
    image: neo4j:5
    container_name: companion-neo4j
    restart: unless-stopped
    ports: ["7474:7474","7687:7687"]
    environment:
      NEO4J_AUTH: neo4j/neo4jpassword
      NEO4J_server_memory_pagecache__size: 512M
      NEO4J_server_memory_heap_max__size: 512M
    volumes: [neo4j_data:/data]
  qdrant:
    image: qdrant/qdrant:latest
    container_name: companion-qdrant
    restart: unless-stopped
    ports: ["6333:6333"]
    volumes: [qdrant_data:/qdrant/storage]
  redis:
    image: redis:7-alpine
    container_name: companion-redis-1
    restart: unless-stopped
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
volumes:
  neo4j_data:
  qdrant_data:
  redis_data:
DCEOF
systemctl start docker
docker-compose -f "$NEO_DIR/docker-compose.yml" up -d 2>/dev/null || docker compose -f "$NEO_DIR/docker-compose.yml" up -d
log "Waiting for services..."; sleep 15
docker ps | grep -q "companion-neo4j" && success "Neo4j running" || warn "Neo4j not running"
docker ps | grep -q "companion-qdrant" && success "Qdrant running" || warn "Qdrant not running"
section "Python environment"
python3 -m venv "$VENV" && source "$VENV/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet fastapi "uvicorn[standard]" python-dotenv anthropic langgraph neo4j qdrant-client sentence-transformers redis httpx aiofiles python-telegram-bot google-api-python-client google-auth-httplib2 google-auth-oauthlib Pillow requests
success "Python packages installed"
section "Vault + logs"
mkdir -p "$VAULT_DIR"/{00-Inbox,10-Daily,20-Reflections,30-People,40-Beliefs,50-Goals,60-Patterns,70-Ideas,80-Agent-Log}
mkdir -p "$LOG_DIR"
success "Vault created at $VAULT_DIR"
section "Environment"
cat > "$NEO_DIR/.env" << ENVEOF
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4jpassword
QDRANT_HOST=localhost
QDRANT_PORT=6333
REDIS_URL=redis://localhost:6379
VAULT_PATH=$VAULT_DIR
USER_NAME=$USER_NAME
TIMEZONE=$TIMEZONE
ENVEOF
chmod 600 "$NEO_DIR/.env"
[ -n "$TELEGRAM_TOKEN" ] && echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN" > "$NEO_DIR/telegram.env" && chmod 600 "$NEO_DIR/telegram.env" && success "Telegram configured"
section "Systemd services"
cat > /etc/systemd/system/companion-api.service << SVCEOF
[Unit]
Description=Neo Companion API
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=$NEO_DIR
ExecStart=$VENV/bin/uvicorn api:app --app-dir $NEO_DIR/agent --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
EnvironmentFile=$NEO_DIR/.env
[Install]
WantedBy=multi-user.target
SVCEOF
if [ -n "$TELEGRAM_TOKEN" ]; then
cat > /etc/systemd/system/neo-telegram.service << SVCEOF
[Unit]
Description=Neo Telegram Bot
After=network.target companion-api.service
[Service]
Type=simple
User=root
WorkingDirectory=$NEO_DIR
ExecStart=$VENV/bin/python3 $NEO_DIR/telegram_bot.py
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
SVCEOF
systemctl enable neo-telegram
fi
systemctl daemon-reload && systemctl enable companion-api && systemctl start companion-api
[ -n "$TELEGRAM_TOKEN" ] && systemctl start neo-telegram
success "Services started"
section "Cron jobs"
(crontab -l 2>/dev/null | grep -v 'companion\|neo_'; echo "30 23 * * * cd $NEO_DIR && $VENV/bin/python3 agent/autoresearch/decay.py >> $LOG_DIR/cron.log 2>&1
0 7 * * * cd $NEO_DIR && $VENV/bin/python3 agent/autoresearch/morning.py >> $LOG_DIR/cron.log 2>&1
0 21 * * * cd $NEO_DIR && $VENV/bin/python3 agent/autoresearch/reflection.py >> $LOG_DIR/cron.log 2>&1
0 5 * * * cd $NEO_DIR && PYTHONPATH=agent/routing:agent/memory $VENV/bin/python3 -c 'from continuous_learning_v2 import prune_expired,evolve; prune_expired(); evolve()' >> $LOG_DIR/learning.log 2>&1") | crontab -
success "Cron jobs scheduled"
section "Nginx"
cat > /etc/nginx/sites-available/neo << NGINXEOF
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINXEOF
ln -sf /etc/nginx/sites-available/neo /etc/nginx/sites-enabled/neo
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
success "Nginx configured"
section "Health check"
log "Waiting for API..."; sleep 10
for i in {1..5}; do
    HEALTH=$(curl -sf http://localhost:8000/health 2>/dev/null)
    [ -n "$HEALTH" ] && success "Neo API is alive" && break
    log "Waiting... $i/5"; sleep 5
done
section "Done"
SERVER_IP=$(curl -sf https://api.ipify.org 2>/dev/null || echo "your-server-ip")
echo -e "\n${BOLD}${GREEN}Neo is live.${NC}\n"
echo -e "  Web UI:     http://$SERVER_IP:8000"
echo -e "  API health: http://$SERVER_IP:8000/health"
echo -e "  Vault:      $VAULT_DIR"
echo -e "  Logs:       $LOG_DIR\n"
[ -n "$TELEGRAM_TOKEN" ] && echo -e "  Telegram:   Bot is running. Message it to start.\n"
echo -e "${CYAN}Documentation: https://github.com/jas77409/vxneo${NC}\n"
