# UIEP — Decisiones y lecciones (M11 → M17 / uiep-1.8.0)

> **PRODUCTION FREEZE 2026-11-01**: este registro queda CONGELADO con el
> release `uiep-1.8.0` (commit `d3baf08`). Refleja el estado definitivo
> desplegado y verificado.

Registro versionado de las decisiones técnicas y lecciones operativas
acumuladas. Conservado EN EL REPOSITORIO (no en memoria externa) según la
directiva de la misión final.

## Decisiones de arquitectura

| # | Decisión | Justificación |
|---|---|---|
| D1 | Artefactos de ingeniería = documentos declarativos (sin código ejecutable en el schema) | Seguridad por diseño: la plataforma interpreta, nunca ejecuta código generado |
| D2 | agentes/workflows generados → `data/specs` (runtimes), documentos → `data/engineering/artifacts` | separación ejecutables/registros; compat v1 intacta |
| D3 | Upserts `id@version` fail-closed con huella de contenido; `onConflict:'bump'` sube patch | reproducibilidad + idempotencia; conflicto de contenido = 409 |
| D4 | Composición con orden topológico + rollback lógico (proyecto no registrado si falla) | integridad del grafo y trazabilidad del grupo |
| D5 | Sandbox = contenedor SEPARADO (read-only, cap_drop ALL, red `internal:true`, pids/mem duros) | aislamiento real; sin socket Docker; sin egress; fail-closed sin sandbox |
| D6 | Los turnos agénticos corren en los runtimes del backend (M2–M8); el sandbox orquesta/mide/corta | no reimplementar runtimes; límites ya auditados |
| D7 | Evaluación de la persistencia JSON: NO migrar a SQL | volumen pequeño, writes atómicos tmp+rename, mutex por recurso; migración = coste/riesgo sin beneficio demostrable a este volumen (re-evaluar si crece) |
| D8 | IAM v1: usuarios (scrypt) + tenants lógicos + roles → permisos granulares en el BFF; recursos `platform` visibles a todos; los de tenant SOLO a sus miembros | multi-usuario REAL sin romper compatibilidad; aislamiento verificado por tests |
| D9 | Deployment Engine v1 = despliegues al runtime del sandbox CON health checks/versiones/rollback; SIN routing público Traefik | control de exposición: la superficie pública no crece sin necesidad |
| D10 | SourceProject: código fuente DETERMINISTA generado (node-express, deps pinneadas) SOLO para exportación externa | la plataforma no ejecuta código generado (permanente mientras no haya microVMs) |
| D11 | Export: JSON canónico (`uiep-export-v1`) + ZIP STORED sin dependencias (CRC32 propio) | reintalable + verificable; sin binarios de terceros |
| D12 | Catálogo HONESTO: lo no implementado se declara (schema-only) | confianza del sistema; prohibido fingir capacidades |

## Lecciones operativas

| # | Lección |
|---|---|
| L1 | **Anclar imagen PREVIA a cada rebuild** (`docker tag …:latest …:1.x.y`) — la 1.0.1 desapareció por GC del host |
| L2 | El contenedor `uiep-backend` pertenece al proyecto compose `infrastructure` (label) — recrear con `-p infrastructure` o `--force-recreate` |
| L3 | `docker compose -f infrastructure/…` busca `.env` en `infrastructure/` (dirname del primer `-f`), NO en el CWD → `--env-file .env` |
| L4 | El build web (vite emptyOutDir) BORRA `www/app/uiep/BUILD-INFO.json` → `git checkout` tras cada build |
| L5 | **`git add` con un path inexistente ABORTA el staging entero** (silenciosamente con 2>/dev/null) → verificar con `git status` antes de cada commit |
| L6 | `node --test` corre los ficheros en PARALELO → puertos únicos por fichero de test (sandbox 4177/4183) |
| L7 | Ollama en el VPS se CONTIENE con otras apps (turnos 18–120s según carga) → timeouts del sandbox a 300s y health checks tolerantes |
| L8 | Qwen3.5:4b tiene "thinking": respuestas lentas con content vacío si `num_predict` es bajo — documentado para las demos |
| L9 | La exportación del bundle de specs se reinstala vía `saveSpec` (canal real de instalación), no vía generadores de entrada |
| L10 | Los intentos de sesión sin contraseña NO deben filtrar si el usuario existe (mismo error para username/password) |
| L11 | Notificación del formulario "Hablemos" por SMTP DIRECTO en node puro (net+dns.resolveMx): el contenedor proxy no tiene sendmail (EPIPE) y postfix no hace relay desde la red docker; la máquina de estados SMTP debe escribir el send del PASO CASADO (el EHLO se saltaba → "503 Send hello first"); el parser exige '250 ' con espacio para el FIN de bloque multilínea. Entrega verificada: 250 aceptado por el MX de hotmail |
| L12 | El formulario guarda SIEMPRE en data/messages.json (VPS) ANTES de notificar — si el email falla, el mensaje no se pierde (el fallo solo queda en el log) |

## Matriz de tecnologías soportadas (HONESTA)

| Tecnología | Estado |
|---|---|
| Modelos LLM: Ollama (qwen3.5:4b, gemma4, deepseek-r1:8b) vía ModelProfile | ✔ operativo (proveedores remotos: NO conectados) |
| Generación de código: Node/Express desde ApiPlatform (deps pinneadas) | ✔ generación determinista + export; EJECUCIÓN fuera del host |
| Ejecución de artefactos declarativos: sandbox container | ✔ operativo (agentic-app/api-platform/dataset/harness) |
| MCP: exposición de tools (server) + clientes MCP declarativos | ✔ operativo |
| Workflow engine: pipeline/orquestador + condiciones + paralelo | ✔ operativo |
| RAG: ingesta + embeddings + retrieval con gate 0.70 | ✔ operativo |
| Traefik routing para servicios generados | ✖ decisión de seguridad (solo BFF) |
| Ejecución de código generado en la plataforma | ✖ permanente sin microVM |
| ZIP STORED propio | ✔ (sin compresión deflate — innecesaria para JSON pequeño) |
