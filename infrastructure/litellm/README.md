# LiteLLM Proxy - MSBrossAI

Proxy unificado de inferencia LLM. Unifica todos tus proveedores en un endpoint OpenAI-compatible con fallbacks automáticos, virtual keys y routing inteligente.

## Stack separado

Este proxy es **100% independiente** del stack principal. No toca `docker-compose.yml` central.

## Inicio rápido

```bash
cd infrastructure/litellm
./setup.sh                    # Genera .env con keys desde el vault
docker compose up -d          # Levanta el proxy
```

## Endpoint

```
http://localhost:4000/v1
```

Headers requeridos:
```
Authorization: Bearer sk-litellm-proxy-...
```

## Proveedores configurados

| Proveedor | Modelos | Estado |
|-----------|---------|--------|
| OpenAI | gpt-4o, gpt-4o-mini | Verificar saldo |
| Anthropic | claude-sonnet-4-5, claude-haiku | Verificar saldo |
| Google Gemini | gemini-2.5-pro, gemini-2.5-flash | Free tier |
| Groq | llama-3.3-70b, qwen3-6b | Gratis |
| OpenRouter | llama-3.3-70b-instruct:free | Free models |
| DeepSeek | deepseek-chat | Free tier limitado |
| Mistral | mistral-small, codestral | Free tier |
| Together AI | llama-3.3-70b | Verificar crédito |
| Cerebras | llama-3.3-70b | Free tier |
| SiliconFlow | qwen2.5-72b | Verificar key |
| DeepInfra | llama-3.3-70b | Verificar crédito |
| NVIDIA | llama-3.3-70b | Deprecated |
| MiniMax | MiniMax-M1-80k | Free tier |
| HuggingFace | llama-3.3-70b | Free tier |
| OpenCode Zen | code-model | Privado |
| Xiaomi MIMO | gpt-4o-mini | Proxy externo |
| Ollama | gemma3:4b | Local |

## Configuración para OpenCode

Coloca este archivo en la carpeta de configuración de OpenCode:

```bash
cp opencode-config.json ~/.config/opencode/providers/litellm.json
```

O usa variables de entorno:
```bash
export OPENAI_API_KEY="sk-litellm-proxy-b5e28a4a4dd0b3ac3fc8990a9f37a6ff61fd833e16002f340f54b13dd70bfdc1"
export OPENAI_BASE_URL="http://localhost:4000/v1"
```

## Configuración para Pi

```bash
cp pi-config.json ~/.pi/config.json
```

O variables de entorno:
```bash
export LLM_API_BASE="http://localhost:4000/v1"
export LLM_API_KEY="sk-litellm-proxy-b5e28a4a4dd0b3ac3fc8990a9f37a6ff61fd833e16002f340f54b13dd70bfdc1"
export LLM_MODEL="openai/gpt-4o-mini"
```

## Migrar apps existentes

Cambia en cada `.env` de app:

```diff
- OPENAI_API_KEY=sk-proj-...
- ANTHROPIC_API_KEY=sk-ant-...
- GOOGLE_API_KEY=AQ...
+ OPENAI_API_KEY=sk-litellm-proxy-b5e28a4a4dd0b3ac3fc8990a9f37a6ff61fd833e16002f340f54b13dd70bfdc1
+ OPENAI_BASE_URL=http://localhost:4000/v1
+ ANTHROPIC_BASE_URL=http://localhost:4000/v1
+ GOOGLE_BASE_URL=http://localhost:4000/v1
```

Todas las apps usan ahora el proxy único. El routing y fallbacks se manejan en `config.yaml`.

## Comandos útiles

```bash
# Ver modelos disponibles
curl http://localhost:4000/v1/models \
  -H "Authorization: Bearer sk-litellm-proxy-..."

# Test rápido
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-litellm-proxy-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"ping"}],"max_tokens":1}'

# Ver logs
docker logs litellm-proxy -f

# Reiniciar
docker compose restart

# Verificar salud
curl http://localhost:4000/health
```

## Seguridad

- Master key y proxy key generadas aleatoriamente en `setup.sh`
- Archivo `.env` con permisos `600`
- Configuración montada como `:ro` (read-only)
- Sin exposición de keys individuales a las apps
- Traefik + Basic Auth opcional para acceso externo

## Estructura

```
infrastructure/litellm/
├── docker-compose.yml      # Stack independiente
├── config.yaml             # Modelos + fallbacks
├── .env                    # Keys (generado por setup.sh)
├── .env.example            # Plantilla
├── setup.sh                # Inicialización automática
├── opencode-config.json    # Config para OpenCode
├── pi-config.json          # Config para Pi
└── README.md               # Esta documentación
```

## Troubleshooting

**Proxy no responde:**
```bash
docker compose ps
docker logs litellm-proxy --tail 50
```

**Key inválida:**
Verifica que el `.env` tenga las keys correctas. Ejecuta `./setup.sh` de nuevo.

**Modelo no encontrado:**
Lista modelos disponibles: `curl http://localhost:4000/v1/models -H "Authorization: Bearer ..."`

**Timeout:**
Aumenta `timeout` en `config.yaml` o `request_timeout` en `litellm_settings`.
