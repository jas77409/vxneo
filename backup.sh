#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/root/backups/$DATE"
mkdir -p "$BACKUP_DIR"

# Backup Redis
docker exec companion-redis-1 redis-cli SAVE
docker cp companion-redis-1:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

# Backup Neo4j
docker exec companion-neo4j neo4j-admin database dump neo4j --to-path=/tmp/ 2>/dev/null || true
docker cp companion-neo4j:/tmp/neo4j.dump "$BACKUP_DIR/neo4j.dump" 2>/dev/null || true

# Backup env and config
cp /root/companion/.env "$BACKUP_DIR/env.backup"
cp /root/companion/google_token.json "$BACKUP_DIR/google_token.backup" 2>/dev/null || true

# Backup vault
tar -czf "$BACKUP_DIR/vault.tar.gz" /root/vault/ 2>/dev/null || true

# Keep only last 7 days
find /root/backups -maxdepth 1 -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "[backup] done: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"
