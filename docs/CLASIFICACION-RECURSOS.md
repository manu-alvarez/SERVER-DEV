# Clasificación de recursos A/B/C/D — plan de consolidación (Misión 03)

Inventario clasificado con dependencias demostradas. **Nada se elimina sin aprobación
explícita del propietario** (esta misión autoriza investigar, clasificar y diseñar — no
retirar). Cada candidato de retirada incluye: datos afectados, backup disponible,
dependencias comprobadas y procedimiento de recuperación.

Leyenda: **A** Mantener (necesario) · **B** Reorganizar (útil, mal ubicado/configurado) ·
**C** Retirar (sin uso ni dependencias demostradas) · **D** Investigar (desconocido).

## 1. INFRAESTRUCTURA COMPARTIDA — A (Mantener)

| Recurso | Dueño/función | Dependencias demostradas |
|---|---|---|
| traefik | perímetro TLS de los 25 hosts | todo el ecosistema |
| msbross-proxy | portfolio + 26 estáticos + BFF UIEP | todo el portfolio |
| msbross-backend (hub API, `assistant`) | vault de API keys (el proxy inyecta `x-injected-*` desde `api_keys_vault.json` a los backends) + APIs del hub | msbross-proxy (inyección) + apps que consumen el hub |
| llm-admin-proxy (`llm`) | proxy de proveedores LLM | apps que lo consumen |
| ollama (host, systemd) | IA de UIEP (agentes+embeddings) + Teringo (cliente-local) | UIEP |
| swap 8G + fstab | protección OMM | todo |
| ufw/fail2ban/AIDE/tailscale/unattended | seguridad host | operación segura |
| portainer | administración docker | operador |
| uptime-kuma (`monitor`) | monitorización | operador |
| cron backup UIEP + scripts backup | recuperación | UIEP 1.0 |
| redes docker (msbross_net, bridge) | comunicación servicios | todo |

## 2. LOS DIEZ PROYECTOS SELECCIONADOS — A/B

| Proyecto | Clase | Recursos asociados |
|---|---|---|
| UIEP | **A** (1.0.0 congelada) | contenedor + volumen data + backup diario + copia iCloud |
| Tu Energía Maya | **B** (trazabilidad) | estático `www/app/maya` + repo GH separado + Pages |
| LogiSearch | **B** | estático `www/app/logisearch` + repo GH; aclarar backend real en ficha |
| Nikolina AI | **A** | 3 contenedores + PM2 livekit + estático |
| FoZ SoundPro | **A** (solo Pages) | repo GH + Pages viva |
| Teringo | **A** (demo Pages) | repo MSB/apps/teringo + Pages viva; opción estático VPS |
| CombiPro | **A** | estático + repo GH |
| Cuentos Mágicos | **A** | backend + celery + postgres + estático |
| GasStation | **A** | backend + estático |
| Tarot RWS | **B** (trazabilidad) | estático + repo GH + Pages |

**B = reorganizar SOLO la trazabilidad**: añadir `BUILD-INFO.json` en los próximos
despliegues de maya/tarot-rws (versión de origen) — sin mover ni renombrar nada.

## 3. HISTÓRICOS SIN RELACIÓN CON LA SELECCIÓN — C (candidatos a retirar)

| Recurso | Datos afectados | Backup disponible | Recuperación | Espacio |
|---|---|---|---|---|
| `iaprod-backend` (contenedor+imagen) | sin volumen propio | código en GH (monorepo) | rebuild desde apps/iaprod-os | ~499M img |
| `traductor-backend` | sin volumen | código en GH | rebuild | ~297M |
| `industrialpro-backend` | sin volumen | código en GH | rebuild | ~244M |
| `atenea-backend` | volumen **`/app/data` bind-mount del repo** (apps/web-restaurante-atenea/data) | NO verificado | git + datos del repo | ~? |
| `it-english-backend` + `it-coach-agent` | sin volúmenes | código GH | rebuild | ~330M+ |
| `elitescout-backend` + `msbross-elitescout-db` | **postgres volumen 46M** (datos reales) | ❌ SIN backup verificado | pg_dump antes de retirar | 46M+ |
| `msbross` estático (www/app/msbross) | build | GH repo MSBrossAI | rebuild | ~MB |
| `admin-dashboard` + `dev-dashboard` (estáticos) | build | GH repo MSB / livekit repo | rebuild | MB |
| `www/app/uiep-web` (estático DORMIDO — versión previa de UIEP) | build | git (ya en repo) | checkout | MB |
| `app-generator` + `assistant` (estáticos) | build | GH | rebuild | MB |
| Túneles cloudflared: `teringo.json` (sin usar) + 3 credenciales sin config (621835a3/80461b5a/9f1048ed) | sin datos | las credenciales mismas | recrear túneles desde CF | 0 |
| Regla ufw 8765 (sin proceso detrás) | — | — | re-añadir regla | 0 |
| `/var/www/manuelalvarez` (legado nginx) + `/var/log/nginx` | 5,6M estáticos legados | NO (copiar antes) | copiar de vuelta | 5,6M |
| deploy.yml (workflow GH rsync) DESACTIVADO + .cloudflared config muerta | — | — | — | 0 |

**NO clasificados como C** (aunque fuera de la selección): `jartosdto` (stack completo
pgvector+redis+minio — proyecto NO seleccionado PERO con datos reales y posiblemente
activo: aclarar con el propietario), `cuentos-*` (SÍ seleccionado), `logitrack` (estático
propio + alias), `msbross-frontend` (el PORTFOLIO), `maya/tarot-maya` (Tarot Maya =
proyecto NO seleccionado con Pages propia — conservar por la política de Pages).

## 3b. POLÍTICA DEFINITIVA — análisis por servicio (las 7 preguntas, con evidencia de código)

Aplicada la política del propietario (31-oct): el VPS solo alberga portfolio + 10
proyectos + infraestructura estrictamente necesaria.

| Servicio | ¿Quién lo usa? (verificado en código) | ¿Imprescindible para los 10? | Alternativa | Veredicto |
|---|---|---|---|---|
| Ollama (host) | UIEP (agentes+embeddings) · Teringo (cliente local del visitante) | SÍ (plano modelo) | — | **A** |
| Postgres cuentos | cuentos-magicos (seleccionado) | SÍ | — | **A** |
| Redis | SOLO jartosdto (no seleccionado) | NO | — | **C** |
| MinIO | SOLO jartosdto (no seleccionado) | NO | almacenamiento local si algún día hace falta | **C** |
| Postgres elitescout | SOLO elitescout (no seleccionado) | NO | — | **C** (dump verificado) |
| Postgres jartosdto (+pgvector) | SOLO jartosdto | NO | — | **C** (dump verificado) |
| msbross-backend (hub+vault, `assistant`) | su vault solo la consumen msbross-backend y **jartosdto** (grep x-injected: 2 consumidores, ninguno de los 10) | NO | — | **C** |
| llm-admin-proxy (`llm`) | sin consumidores identificados en los 10 | NO | — | **C** |
| portainer / uptime-kuma | operador (admin/monitorización) | útiles de operación | — | **A** |
| PM2 livekit | nikolina (seleccionado) | SÍ | — | **A** |
| postfix (localhost:25) | correo local del sistema | marginal (avisos cron) | — | **A-lite** (sin coste) |
| Estáticos históricos (uiep-web, msbross, admin/dev-dashboard, app-generator, assistant, logitrack, iaprod-os, industrialpro, edelweiss, expositator-rte, taskflow, moko-tools, cv, tarot-maya, maya≠seleccionados) | no seleccionados (cv: aclarar si entra en el portfolio) | NO | sus repos GH los conservan | **C** (cv: **D**) |
| Túneles cloudflared (teringo + 3 credenciales huérfanas + e77340ca) | NINGUNO activo (cloudflared no corre; msbross.me vive en Cloudflare ajeno) | NO | — | **C** (rotación del secreto expuesto: decisión aparte) |
| ufw 8765 | sin proceso | NO | — | **C** |
| /var/www/manuelalvarez (nginx legado) | nada (nginx inactivo) | NO | — | **C** |

**Datos protegidos ANTES de retirar** (hecho el 31-oct, copia externa en
`backups-local/retiradas-20261031/` en iCloud):
`elitescout-pg.sql` (3,5K, restauración PROBADA en postgres:16 aislado) ·
`jartosdto-pg.sql` (3,9K) · `cuentos-pg.sql` (133K — seleccionado, prudencia) ·
`jartosdto-minio.tgz` (8K) · `jartosdto-redis.tgz` (794B) · `atenea-data.tgz` (45B).
Los volúmenes docker originales NO se han tocado.

## 4. PROPUESTA DE RETIRADA (lista concreta — ESPERA APROBACIÓN)

Fase de retirada propuesta (solo con tu aprobación, en este orden):

1. **Backups previos** (obligatorio antes de borrar): `pg_dump` de elitescout-db +
   copia de `apps/web-restaurante-atenea/data` + snapshot de volúmenes → destino
   externo (pull al Mac).
2. Contenedores+imágenes: iaprod, traductor, industrialpro, atenea, it-english
   (+it-coach-agent), elitescout (+su pg tras dump).
3. Estáticos dormidos: `uiep-web`, `msbross`, `admin-dashboard`, `dev-dashboard`,
   `app-generator`, `assistant` (los repos GH quedan intactos).
4. Redes/config: regla ufw 8765 · entradas muertas del README (mapfre/perfume/txa) ·
   túneles CF sin uso (desde el dashboard de Cloudflare, con rotación del secreto
   expuesto).
5. Verificación tras cada paso: los 25→N contenedores restantes Up + dominios de los
   10 seleccionados responden + health UIEP.

Espacio recuperable estimado: **~2,5-3 GB** (imágenes+volúmenes) — menor frente a los
51 GB ya recuperados; el VALOR real es la simplicidad operativa (superficie de ataque
y mantenimiento reducida), no el espacio.

## 5. Plan de backups propuesto (para aprobación)

1. **Postgres** (cuentos/jartosdto/elitescout/perfume-pg-dangling): `pg_dump` semanal
   → `/home/ubuntu/backups/pg/` → el patrón pull-to-Mac existente lo trae a iCloud.
2. **MinIO (jartosdto)**: `mc mirror` → idéntico destino.
3. Script único `infrastructure/backup/backup-all.sh` + extensión del pull script.
4. Restauración PROBADA por motor (no basta el dump): verificar con contenedor
   aislado (el patrón UIEP).
