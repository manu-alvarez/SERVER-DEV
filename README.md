# MSBrossAI Digital Ecosystem

Bienvenido al monorepo principal del ecosistema digital **MSBrossAI**. Este repositorio centraliza la infraestructura, configuración y código fuente del hub de aplicaciones de Manuel Álvarez.

## 🏗️ Arquitectura del Sistema

El ecosistema está construido bajo una arquitectura de microservicios y despliegues contenerizados con Docker, orquestados por un proxy inverso dual (Traefik + Node.js).

### Capas Principales:
1. **Frontends estáticos (SPA)**: las apps compiladas viven en `www/app/<app>/` del repo y las sirve el msbross-proxy (con cabeceras anti-cache). El directorio `/var/www/manuelalvarez/` del host queda como legado (nginx del host **inactivo**).
2. **Traefik (Reverse Proxy de Nivel 1)**: Maneja el tráfico entrante (`*.manuelalvarez.dev`), la terminación SSL (Let's Encrypt) y el balanceo de carga.
3. **MSBross Proxy (Node.js - Nivel 2)**: Situado en `infrastructure/msbross-proxy`, se encarga de servir las aplicaciones estáticas de React/Vue compiladas en `www/app/` y redirigir las peticiones API a los contenedores Docker internos.
4. **Backend Services (Docker)**: Múltiples contenedores (PostgreSQL, Redis, MinIO, Python/NodeJS APIs) corriendo en la red segura de Docker `msbross-network`.

---

## 🌐 Mapeo de Dominios y Aplicaciones (24 Apps)

El ecosistema alberga actualmente **25+ despliegues funcionales**, categorizadas por área de negocio y uso.

| Aplicación | Subdominio (`*.manuelalvarez.dev`) | Tipo de Despliegue |
| :--- | :--- | :--- |
| **Nikolina Agent** | `nikolina` | Docker (Node/Python) + LiveKit WS |
| **JartosDTO** | `jartosdto` | Docker (Node) + PostgreSQL + MinIO |
| **Cuentos Mágicos** | `cuentos` | Docker (Node) + PostgreSQL |
| **Gas Station** | `gasstation` | Docker (Node) |
| **IAprod OS** | `iaprod` | Docker (Node) |
| **Mapfre Gestión** | `mapfre` | Traefik Direct Proxy (Puerto 3333) |
| **Perfume Trading** | `perfume` | Traefik Direct Proxy (Puerto 3011) |
| **EliteScout** | `elitescout` | Docker (Node) |
| **CombiPro** | `combipro` | App Estática (Servida por Node) |
| **IndustrialPro** | `industrial` | Docker (Node) + React Frontend |
| **TaskFlowPro** | `taskflow` | App Estática |
| **Traductor Pro** | `traductor` | Docker (Node) |
| **TxaFitnessPro** | `txafitness` | Traefik Direct Proxy (Puerto 3456) |
| **Web Atenea** | `atenea` | Externa (`host.docker.internal:8009`) |
| **Edelweiss** | `edelweiss` | App Estática |
| **CV / Portfolio** | `cv` | App Estática |
| **IT English Coach**| `itenglish` | Docker (Node) |
| **LogiSearch** | `logisearch` | App Estática |
| **LogiTrack** | `logitrack` | Alias de LogiSearch |
| **MSBross Mano** | `mano` | App Estática |
| **Moko Tools** | `mokotools` | App Estática |
| **App Generator** | `appgenerator` | App Estática |
| **Expositator RTE** | `expositator` | App Estática |
| **MSBross Voice** | `msbross-voice` | Docker (Python) Directo Traefik |
| **UIEP 1.0** | `uiep` | **Plataforma de agentes** (Docker + Ollama + RAG + workflows) |

---

## 📚 Documentación

| Documento | Contenido |
|---|---|
| [`docs/VPS-INVENTARIO.md`](docs/VPS-INVENTARIO.md) | Inventario real del VPS: servicios, docker, almacenamiento, seguridad, limpieza |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | Operación: despliegue por tipo, backup, recuperación/rollback, salud |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura del ecosistema |
| [`apps/uiep/README.md`](apps/uiep/README.md) | **UIEP 1.0** — plataforma de ingeniería de agentes (matriz de rollback incluida) |
| [`apps/uiep/docs/`](apps/uiep/docs/) | Fases 0→9 de UIEP + ADR de límites |
| `LA_BIBLIA.md` | Contexto histórico del ecosistema |
| `docs/PROJECT_STANDARDS.md` · `docs/SECURITY.md` | Estándares del repo |

**UIEP 1.0.0** (congelada, tag `uiep-1.0.0`): agentes ejecutables con RAG y memoria, workflows multiagente con diseñador visual, integraciones HTTP/MCP/webhooks, y observabilidad con quality gate automático. Desplegada en `https://uiep.manuelalvarez.dev`.

---

## 🚀 Despliegue (CI/CD)

El despliegue está automatizado mediante **GitHub Actions** (`.github/workflows/deploy.yml`).

1. Un push a `main` dispara el workflow de despliegue del frontend principal (build + `rsync`).
2. El resto de servicios se despliegan según el [RUNBOOK](docs/RUNBOOK.md) (SSH + docker compose por proyecto; UIEP incluye verificación del binario servido).
3. `Secret Scan` (gitleaks) corre en cada push — verdes requeridos.

### ⚠️ Requisitos para el CI/CD (GitHub Secrets)
Para que el despliegue automático funcione sin errores de conexión SSH, los siguientes **Secrets** deben estar configurados en el repositorio de GitHub (`Settings > Secrets and variables > Actions`):
- `VPS_HOST`: Debe contener la IP actual del servidor Contabo (**84.247.186.126**).
- `VPS_USER`: El usuario SSH (ej. `root` o `ubuntu`).
- `VPS_SSH_KEY`: La clave privada SSH para acceder sin contraseña.

---

## 🛡️ Auditoría de Seguridad (Nivel 99 - Modo Ómnicron-Quetta)

Todo el ecosistema ha sido auditado bajo estándares estrictos de seguridad de código:
- **CORS Estricto:** Los backends (FastAPI, Express, Node) utilizan `allow_origin_regex` o listas blancas dinámicas (`CORS_ORIGINS`) en lugar de comodines `*`.
- **Inyección de Código Prevenida:** 
  - Subprocesos gestionados vía bindings seguros (`asyncio.create_subprocess_exec` o `subprocess.run` con arrays, NUNCA `shell=True`).
  - Base de datos (SQLite/PostgreSQL) blindadas usando consultas preparadas (`?`) o Prisma ORM para evitar SQLi.
- **Limpieza de Hardcodes:** Todas las IPs de staging obsoletas han sido purgadas, y los enlaces rotos (ej. perfiles de LinkedIn antiguos) han sido actualizados a sus URLs canónicas (`manu-alvarez-dev`).
- **Secrets Seguros:** Gestión estricta a través de `.env` sin exponer tokens ni credenciales en código cliente.

---

## 💻 Desarrollo Local

Para levantar la infraestructura localmente:
```bash
cd infrastructure
docker compose up -d
```
Para construir el frontend manualmente:
```bash
cd apps/msbross-frontend
npm install
npm run build
```
