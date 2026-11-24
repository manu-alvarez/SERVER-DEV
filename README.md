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

## Catálogo de aplicaciones y despliegues registrados

La referencia versionada es [`data/proyectos.json`](data/proyectos.json), con fecha de inventario **2026-10-31**. Los estados siguientes son registros históricos de configuración, no comprobaciones de disponibilidad actuales. Consultar el [inventario VPS](docs/VPS-INVENTARIO.md) y el [runbook](docs/RUNBOOK.md) antes de operar.

| Aplicación | Dominio registrado | Modalidad | Estado registrado |
|---|---|---|---|
| UIEP | uiep.manuelalvarez.dev | vps-docker | activo-congelado |
| Tu Energía Maya | maya.manuelalvarez.dev | gh-pages | activo |
| LogiSearch | logisearch.manuelalvarez.dev | vps-static | activo |
| Nikolina AI | nikolina.manuelalvarez.dev | vps-docker | activo |
| FoZ SoundPro | foz.manuelalvarez.dev | gh-pages | activo |
| Teringo MailOps AI / Neural CockPit | teringo.manuelalvarez.dev | gh-pages | activo |
| CombiPro | combipro.manuelalvarez.dev | vps-static | activo |
| Cuentos Mágicos | cuentos.manuelalvarez.dev | vps-docker | activo |
| GasStation | gasstation.manuelalvarez.dev | vps-docker | activo |
| Tarot RWS | tarot.manuelalvarez.dev | gh-pages | activo |
| CV Portfolio | cv.manuelalvarez.dev | vps-static | recurso profesional del portfolio — RECOMENDACIÓN: mantener |
| JartosDTO | — | retirado-del-vps | stack retirado (31-oct); dumps pg/minio/redis en iCloud |

Los proyectos históricos no incluidos en el catálogo no se consideran despliegues activos por defecto. No se ha verificado el estado del VPS en esta revisión.

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

**UIEP 1.0.0** (congelada, tag `uiep-1.0.0`): agentes ejecutables con RAG y memoria, workflows multiagente con diseñador visual, integraciones HTTP/MCP/webhooks, y observabilidad con quality gate automático. Dominio registrado: `https://uiep.manuelalvarez.dev`; disponibilidad actual pendiente de verificar.

---

## 🚀 Despliegue (CI/CD)

Los workflows de despliegue `deploy.yml`, `deploy-vps.yml` y `deploy-cv.yml` son exclusivamente manuales (`workflow_dispatch`).

1. Un push a `main` no dispara el despliegue. El frontend principal puede desplegarse manualmente tras revisar el destino y el artefacto.
2. El resto de servicios se despliegan según el [RUNBOOK](docs/RUNBOOK.md) (SSH + docker compose por proyecto; UIEP incluye verificación del binario servido).
3. `Secret Scan` (gitleaks) corre en cada push — verdes requeridos.

### ⚠️ Requisitos para el CI/CD (GitHub Secrets)
Para que el despliegue automático funcione sin errores de conexión SSH, los siguientes **Secrets** deben estar configurados en el repositorio de GitHub (`Settings > Secrets and variables > Actions`):
- `VPS_HOST`: Debe contener la IP actual del servidor Contabo (**84.247.186.126**).
- `VPS_USER`: El usuario SSH (ej. `root` o `ubuntu`).
- `VPS_SSH_KEY`: La clave privada SSH para acceder sin contraseña.
- `VPS_SSH_KNOWN_HOSTS`: Identidad SSH del servidor verificada por un canal independiente.

---

## Controles de seguridad documentados

Los siguientes controles son objetivos documentados; su cumplimiento debe verificarse por componente.
- **CORS Estricto:** Los backends (FastAPI, Express, Node) utilizan `allow_origin_regex` o listas blancas dinámicas (`CORS_ORIGINS`) en lugar de comodines `*`.
- **Prevención de inyección:** 
  - Subprocesos gestionados vía bindings seguros (`asyncio.create_subprocess_exec` o `subprocess.run` con arrays, NUNCA `shell=True`).
  - Base de datos (SQLite/PostgreSQL) deben utilizar consultas preparadas (`?`) o Prisma ORM para evitar SQLi.
- **Limpieza de Hardcodes:** Revisar referencias de staging y enlaces antes de cada publicación.
- **Secrets Seguros:** Gestionar credenciales fuera del código cliente y validar con Secret Scan.

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

## Política de propiedad del código y despliegue

Este repositorio es la **fuente de configuración de infraestructura**, no una garantía de que sus copias de frontend sean las versiones más recientes. Las aplicaciones [CombiPro](https://github.com/manu-alvarez/CombiPro) y [TaskFlowPro](https://github.com/manu-alvarez/TaskFlowPro) se editan en sus propios repositorios. El catálogo y la publicación GitHub Pages del panel se mantienen en [MSB](https://github.com/manu-alvarez/MSB); el portal de la suite se coordina con [MSBrossAI](https://github.com/manu-alvarez/MSBrossAI).

Antes de cualquier despliegue se debe identificar el artefacto exacto y su commit origen, conservar copia/rollback y verificar la identidad SSH de destino mediante `VPS_SSH_KNOWN_HOSTS`. **No se realiza ningún despliegue al VPS en esta fase de consolidación de GitHub.**
