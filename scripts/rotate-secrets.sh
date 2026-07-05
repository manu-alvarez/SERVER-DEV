#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# rotate-secrets.sh — MSBrossAI Secrets Rotation Script
# ═══════════════════════════════════════════════════════════════
# Generates NEW secure credentials for LOCAL secrets.
# For THIRD-PARTY API keys (OpenAI, Google, Groq, etc.),
# you MUST rotate them manually in each provider dashboard.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."

# ── Generate a cryptographically secure random string ──
gen_secret() {
  openssl rand -hex 32
}

gen_token() {
  openssl rand -base64 48 | tr -d '/+=' | cut -c1-64
}

# ── Timestamp for backup ──
TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".secrets-backup-$TS"

echo "════════════════════════════════════════════════════"
echo "  MSBrossAI — Secrets Rotation Script"
echo "  Date: $(date)"
echo "════════════════════════════════════════════════════"
echo ""
echo "⚠️  THIS SCRIPT ONLY ROTATES LOCAL CREDENTIALS"
echo "   (JWT secrets, admin passwords, API tokens)"
echo ""
echo "🔴 THIRD-PARTY API KEYS MUST BE ROTATED MANUALLY:"
echo "   • OpenAI       → https://platform.openai.com/api-keys"
echo "   • Google/Gemini → https://aistudio.google.com/apikey"
echo "   • Groq         → https://console.groq.com/keys"
echo "   • OpenRouter   → https://openrouter.ai/keys"
echo "   • Anthropic    → https://console.anthropic.com/"
echo "   • Mistral      → https://console.mistral.ai/"
echo "   • Supabase     → https://supabase.com/dashboard"
echo "   • LiveKit      → https://cloud.livekit.io/"
echo "   • Tavily       → https://tavily.com/dashboard"
echo ""

# ── Backup existing .env files ──
echo "📦 Backing up existing .env files to $BACKUP_DIR/"
mkdir -p "$BACKUP_DIR"
find apps -name ".env" -not -path "*/venv/*" -not -path "*/node_modules/*" 2>/dev/null | while read -r envfile; do
  cp "$envfile" "$BACKUP_DIR/$(echo "$envfile" | tr '/' '_')"
  echo "   Backed up: $envfile"
done

echo ""
echo "🚀 Generating new credentials..."

# ── Generate ADMIN_API_TOKEN for proxy auth ──
ADMIN_API_TOKEN=$(gen_token)
echo "   ✅ ADMIN_API_TOKEN = $ADMIN_API_TOKEN"
echo ""

# ── LiveKit Nikolina ──
echo "📝 Updating apps/livekit-nikolina/.env (local creds only)..."
LIVEKIT_JWT=$(gen_secret)
LIVEKIT_ADMIN_PASS=$(openssl rand -base64 12)
sed -i '' "s/^JWT_SECRET=.*/JWT_SECRET=$LIVEKIT_JWT/" apps/livekit-nikolina/.env 2>/dev/null || true
sed -i '' "s/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$LIVEKIT_ADMIN_PASS/" apps/livekit-nikolina/.env 2>/dev/null || true

# ── Gas Station ──
echo "📝 Updating apps/gas-station/backend/.env..."
NEWTON_JWT=$(gen_secret)
sed -i '' "s/^NEWTON_JWT_SECRET=.*/NEWTON_JWT_SECRET=$NEWTON_JWT/" apps/gas-station/backend/.env 2>/dev/null || true

# ── TxaFitness ──
echo "📝 Updating apps/txa-fitness-pro/.env..."
TXA_SECRET=$(gen_secret)
sed -i '' "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$TXA_SECRET/" apps/txa-fitness-pro/.env 2>/dev/null || true

# ── Create central .env.production with ADMIN_API_TOKEN ──
echo "📝 Creating infrastructure/.env.production..."
cat > infrastructure/.env.production << EOF
# ═══════════════════════════════════════════════════════════════
# MSBrossAI — Production Environment (CENTRALIZED)
# ═══════════════════════════════════════════════════════════════
# WARNING: Never commit this file to git.
# Load this file on the VPS and source it before starting services.
# ═══════════════════════════════════════════════════════════════

# Traefik
TRAEFIK_DASHBOARD_AUTH=admin:\$(openssl passwd -apr1 $(openssl rand -base64 12))
ACME_EMAIL=manuelalvarezdianez@gmail.com

# Proxy Auth Token (protects /__health and /__config)
ADMIN_API_TOKEN=$ADMIN_API_TOKEN

# PostgreSQL (shared across services)
POSTGRES_PASSWORD=$(gen_secret)

# MinIO
MINIO_ROOT_PASSWORD=$(gen_secret)
EOF

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ LOCAL CREDENTIALS ROTATED SUCCESSFULLY"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Rotate third-party API keys in provider dashboards"
echo "   2. Copy infrastructure/.env.production to VPS"
echo "   3. Run: docker compose --env-file infrastructure/.env.production up -d"
echo "   4. Run: pm2 start ecosystem.config.js --update-env"
echo ""
echo "🔑 ADMIN_API_TOKEN for proxy access:"
echo "   $ADMIN_API_TOKEN"
echo ""
echo "   Use: curl -H 'x-admin-token: YOUR_TOKEN' https://manuelalvarez.dev/__health"
echo ""
echo "⚠️  Backup saved to: $BACKUP_DIR/"
echo "   Delete after confirming new keys work."
