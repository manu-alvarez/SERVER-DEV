#!/bin/bash
# Pi Integration for LiteLLM
# Call this before starting Pi or set as pre-request hook

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAKE_SCRIPT="$SCRIPT_DIR/wake.sh"

# Wake proxy if sleeping
if [ -f "$WAKE_SCRIPT" ]; then
    "$WAKE_SCRIPT" wake >/dev/null 2>&1 || true
fi

# Export environment for Pi
export LLM_API_BASE="http://localhost:4000/v1"
export LLM_API_KEY="sk-litellm-REDACTED-ROTATE-ME"
export LLM_MODEL="openai/gpt-4o-mini"
export LLM_PROVIDER="litellm"

# Alternative: if Pi uses OpenAI-compatible format
export OPENAI_API_KEY="sk-litellm-REDACTED-ROTATE-ME"
export OPENAI_BASE_URL="http://localhost:4000/v1"

echo "✅ LiteLLM proxy configured for Pi"
echo "   Endpoint: http://localhost:4000/v1"
echo "   Model: openai/gpt-4o-mini"
echo "   Provider: litellm"
