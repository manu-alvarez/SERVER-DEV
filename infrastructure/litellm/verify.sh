#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_URL="http://localhost:4000"
API_KEY=$(grep LITELLM_API_KEY "$SCRIPT_DIR/.env" | cut -d= -f2)

echo "=== LiteLLM Health Check ==="

# Check container
if ! docker compose -f "$SCRIPT_DIR/docker-compose.yml" ps | grep -q "running"; then
    echo "❌ Proxy not running. Start with: docker compose up -d"
    exit 1
fi

# Check health endpoint
echo -n "Health endpoint: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
else
    echo "❌ HTTP $HTTP_CODE"
    exit 1
fi

# Check models
echo -n "Models endpoint: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL/v1/models" \
    -H "Authorization: Bearer $API_KEY" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
    MODEL_COUNT=$(curl -s "$PROXY_URL/v1/models" \
        -H "Authorization: Bearer $API_KEY" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "?")
    echo "   Models available: $MODEL_COUNT"
else
    echo "❌ HTTP $HTTP_CODE"
    exit 1
fi

# Test completion
echo -n "Completion test: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL/v1/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"ping"}],"max_tokens":1}' || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
else
    echo "⚠️  HTTP $HTTP_CODE (check provider keys/credits)"
fi

echo ""
echo "Proxy URL: $PROXY_URL"
echo "API Key: $API_KEY"
