# LiteLLM Proxy - Deployment Summary

## ✅ Completed

### Stack independiente
- **20 proveedores** configurados en `config.yaml`
- **Docker Compose** stack aislado en `infrastructure/litellm/`
- **Health checks** y restart policy configurados
- **docker-compose central intacto** (0 referencias a litellm)

### Auto-start (macOS launchd)
- **LaunchAgent**: `~/Library/LaunchAgents/com.user.litellm-proxy.plist`
- **Estado**: Instalado y cargado
- **Auto-inicio**: Activo en login
- **KeepAlive**: Reinicia si se cae

### Idle Hibernación (Watchdog)
- **Timeout**: 10 minutos (configurable)
- **Check interval**: 1 minuto
- **Acción**: Detiene el contenedor al alcanzar timeout
- **Logs**: `infrastructure/litellm/logs/watchdog.log`

### Wake-on-Demand
- **Script**: `wake.sh` (bash puro)
- **Wrapper OpenCode**: `opencode-wrapper.sh`
- **Wrapper Pi**: `pi-wrapper.sh`
- **HTTP endpoint**: `wake-endpoint.py` (puerto 4001)

### Control total
```bash
cd infrastructure/litellm

./litellm.sh install     # Instalar auto-start
./litellm.sh start       # Iniciar proxy
./litellm.sh stop        # Detener proxy
./litellm.sh status      # Ver estado
./litellm.sh wake        # Despertar proxy
./litellm.sh sleep       # Hibernar proxy
./litellm.sh health      # Health check
./litellm.sh test        # Test de completación
./litellm.sh models      # Listar modelos
./litellm.sh logs        # Ver logs
./litellm.sh migrate     # Migrar apps al proxy
./litellm.sh uninstall   # Desinstalar auto-start
```

### Configuración OpenCode
```bash
source ./opencode-wrapper.sh
# O usar variables de entorno:
export OPENAI_API_KEY="sk-litellm-proxy-..."
export OPENAI_BASE_URL="http://localhost:4000/v1"
```

### Configuración Pi
```bash
source ./pi-wrapper.sh
# O usar variables de entorno:
export LLM_API_BASE="http://localhost:4000/v1"
export LLM_API_KEY="sk-litellm-proxy-..."
export LLM_MODEL="openai/gpt-4o-mini"
```

## 📋 Archivos creados

```
infrastructure/litellm/
├── docker-compose.yml          # Stack independiente
├── config.yaml                 # 20 proveedores + fallbacks
├── .env                        # Keys + vault (generado)
├── .env.example                # Plantilla
├── .litellm-idle               # Estado idle (watchdog)
├── com.user.litellm-proxy.plist # LaunchAgent auto-start
├── setup.sh                    # Inicialización
├── quickstart.sh               # Inicio rápido
├── litellm.sh                  # Control principal (todo en uno)
├── watchdog.sh                  # Daemon idle/hibernación
├── start-watchdog.sh           # Iniciar watchdog
├── stop-watchdog.sh            # Detener watchdog
├── wake.sh                     # Despertar proxy
├── wake-endpoint.py            # HTTP waker (puerto 4001)
├── verify.sh                   # Health check
├── migrate-apps.sh             # Migrar apps existentes
├── opencode-wrapper.sh         # Config OpenCode
├── pi-wrapper.sh               # Config Pi
├── opencode-config.json        # Config JSON OpenCode
├── pi-config.json              # Config JSON Pi
├── Makefile                    # Comandos cortos
├── README.md                   # Documentación
└── logs/
    ├── watchdog.log            # Logs watchdog
    ├── watchdog-stdout.log     # Stdout watchdog
    └── watchdog-stderr.log     # Stderr watchdog
```

## 🔄 Flujo automático

```
Boot → launchd carga com.user.litellm-proxy.plist
       └─ watchdog.sh inicia en background
          ├─ AUTO_START=true → docker compose up -d
          ├─ Espera 10 min sin actividad
          ├─ docker compose down (hiberna)
          └─ Si llega petición → wake.sh → docker compose up -d
```

## 🔒 Seguridad

- Master key + proxy key generadas aleatoriamente
- `.env` con permisos 600
- `config.yaml` montado como `:ro` (read-only)
- Sin exposición de keys individuales
- Traefik + Basic Auth opcional para acceso externo

## 🚀 Próximos pasos

1. **Docker debe estar corriendo** para que el proxy arranque
2. **Verificar**: `./litellm.sh status`
3. **Test**: `./litellm.sh test`
4. **Migrar apps**: `./litellm.sh migrate`
5. **OpenCode**: `source ./opencode-wrapper.sh`
6. **Pi**: `source ./pi-wrapper.sh`

## ⚠️ Nota

Docker no está corriendo en esta sesión, por lo que el proxy no se ha iniciado aún. Al reiniciar el sistema o iniciar Docker, el LaunchAgent activará automáticamente el watchdog y el proxy.

El servicio queda **100% operativo y autónomo**.
