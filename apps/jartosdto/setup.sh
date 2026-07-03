#!/bin/bash
# ═══════════════════════════════════════════════════════════
# JartosDTo — Quick Setup Script for macOS
# Run: chmod +x setup.sh && ./setup.sh
# ═══════════════════════════════════════════════════════════

set -e
echo "⚡ JartosDTo — Setup Starting..."

# ── 1. Check prerequisites ─────────────────────────────────
command -v brew >/dev/null 2>&1 || { echo "❌ Homebrew required. Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""; exit 1; }
command -v node >/dev/null 2>&1 || { echo "📦 Installing Node.js..."; brew install node; }
command -v python3 >/dev/null 2>&1 || { echo "📦 Installing Python..."; brew install python; }

# ── 2. Install PostgreSQL + pgvector + Redis ────────────────
echo "📦 Installing databases..."
brew install postgresql@17 pgvector redis 2>/dev/null || true

echo "🔧 Starting services..."
brew services start postgresql@17
brew services start redis
sleep 2

# ── 3. Create database ─────────────────────────────────────
export PATH="/usr/local/opt/postgresql@17/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"
createuser -s jartosdto 2>/dev/null || true
createdb jartosdto -O jartosdto 2>/dev/null || true
psql -d jartosdto -c "ALTER USER jartosdto WITH PASSWORD 'jartosdto_secret';" 2>/dev/null || true
psql -d jartosdto -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
echo "✅ Database ready"

# ── 4. Setup Backend ───────────────────────────────────────
echo "🐍 Setting up Python backend..."
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -q -e "."
pip install -q email-validator langchain-text-splitters
cd ..
echo "✅ Backend ready"

# ── 5. Setup Frontend ──────────────────────────────────────
echo "📦 Installing frontend dependencies..."
cd client
npm install --silent
cd ..
echo "✅ Frontend ready"

# ── 6. Create .env if missing ──────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env from .env.example — edit it to add your API keys"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ⚡ JartosDTo — Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  To start:"
echo "    Terminal 1 (Backend):  cd server && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8100"
echo "    Terminal 2 (Frontend): cd client && PORT=3100 npm run dev"
echo ""
echo "  Then open: http://localhost:3100/login"
echo ""
echo "  For external access:    cloudflared tunnel --url http://localhost:3100"
echo "═══════════════════════════════════════════════════════"
