#!/bin/bash
# OpenCode Integration for LiteLLM
# Call this before starting OpenCode or set as pre-request hook

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAKE_SCRIPT="$SCRIPT_DIR/wake.sh"

# Wake proxy if sleeping
if [ -f "$WAKE_SCRIPT" ]; then
    "$WAKE_SCRIPT" wake >/dev/null 2>&1 || true
fi

# Export environment for OpenCode
export OPENAI_API_KEY="sk-litellm-proxy-b5e28a4a4dd0b3ac3fc8990a9f37a6ff61fd833e16002f340f54b13dd70bfdc1"
export OPENAI_BASE_URL="http://localhost:4000/v1"
export ANTHROPIC_BASE_URL="http://localhost:4000/v1"
export GOOGLE_BASE_URL="http://localhost:4000/v1"
export GROQ_BASE_URL="http://localhost:4000/v1"
export OPENROUTER_BASE_URL="http://localhost:4000/v1"
export MISTRAL_BASE_URL="http://localhost:4000/v1"
export DEEPSEEK_BASE_URL="http://localhost:4000/v1"

echo "✅ LiteLLM proxy configured for OpenCode"
echo "   Endpoint: http://localhost:4000/v1"
echo "   Models: openai/gpt-4o-mini, anthropic/claude-sonnet-4-5, google/gemini-2.5-pro, ..."
