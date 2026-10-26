#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== LiteLLM Quickstart ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env not found. Run ./setup.sh first."
    exit 1
fi

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Start Docker first."
    exit 1
fi

echo "🔑 Keys loaded:"
grep -c "API_KEY=" .env | xargs -I {} echo "   {} provider keys"
echo ""

echo "🚀 Starting LiteLLM proxy..."
docker compose up -d

echo ""
echo "⏳ Waiting for proxy to be healthy..."
sleep 5

echo ""
echo "🔍 Running health check..."
./verify.sh

echo ""
echo "📋 Available models:"
make models

echo ""
echo "✅ LiteLLM is ready!"
echo ""
echo "Endpoint: http://localhost:4000/v1"
echo "API Key: $(grep LITELLM_API_KEY .env | cut -d= -f2)"
echo ""
echo "Next steps:"
echo "  - Configure OpenCode: use opencode-config.json"
echo "  - Configure Pi: use pi-config.json"
echo "  - Migrate apps: make migrate"
echo "  - View logs: make logs"
