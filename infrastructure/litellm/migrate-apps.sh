#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/Users/manu/Library/Mobile Documents/com~apple~CloudDocs/Desktop/SERVER-DEV"
LITELLM_URL="http://localhost:4000/v1"
LITELLM_KEY=$(grep LITELLM_API_KEY "$SCRIPT_DIR/.env" | cut -d= -f2)

echo "=== Migrate Apps to LiteLLM ==="
echo "This will update .env files to use LiteLLM proxy instead of direct provider keys."
echo ""

APPS=(
    "cuentos-magicos"
    "elitescout"
    "jartosdto"
    "livekit-nikolina"
    "mapfre"
    "traductor-pro"
    "txa-fitness-pro"
    "web-restaurante-atenea"
)

for app in "${APPS[@]}"; do
    ENV_FILE="$PROJECT_ROOT/apps/$app/.env"
    if [ ! -f "$ENV_FILE" ]; then
        echo "⏭️  $app: no .env file"
        continue
    fi

    # Backup original
    cp "$ENV_FILE" "$ENV_FILE.backup-$(date +%Y%m%d-%H%M%S)"

    # Comment out direct provider keys
    sed -i.bak \
        -e "s/^\(GOOGLE_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(OPENAI_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(ANTHROPIC_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(GROQ_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(GEMINI_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(OPENROUTER_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(OPENROUTER_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(MISTRAL_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        -e "s/^\(DEEPSEEK_API_KEY=\)/# LITELLM_PROXY manages this key\n\1/" \
        "$ENV_FILE" 2>/dev/null || true

    # Add LiteLLM config if not present
    if ! grep -q "LITELLM_API_KEY" "$ENV_FILE"; then
        {
            echo ""
            echo "# LiteLLM Proxy Configuration"
            echo "LITELLM_API_KEY=$LITELLM_KEY"
            echo "OPENAI_BASE_URL=$LITELLM_URL"
            echo "ANTHROPIC_BASE_URL=$LITELLM_URL"
            echo "GOOGLE_BASE_URL=$LITELLM_URL"
            echo "GROQ_BASE_URL=$LITELLM_URL"
            echo "OPENROUTER_BASE_URL=$LITELLM_URL"
            echo "MISTRAL_BASE_URL=$LITELLM_URL"
            echo "DEEPSEEK_BASE_URL=$LITELLM_URL"
        } >> "$ENV_FILE"
    fi

    echo "✅ $app migrated"
done

echo ""
echo "Done. Original .env files backed up with .backup-* suffix."
echo "Restart apps to apply changes."
