# Runbook de operación — ecosistema manuelalvarez.dev

Procedimientos operativos estándar. La descripción de la plataforma está en el README
raíz y el inventario real del VPS en `docs/VPS-INVENTARIO.md`.

## 1. Cadena de tráfico (producción)

```
Cliente → Traefik (contenedor :80/:443, TLS Let's Encrypt)
  → msbross-proxy (contenedor, Express) → estáticos www/app/<app>/ + /api → backends
  → uiep-backend (BFF consola + runtime de agentes)
Eventos externos → webhook /api/hooks/:id (token por referencia) → workflow UIEP
```

## 2. Despliegue por tipo de proyecto

### UIEP (apps/uiep) — backend docker + estático en repo
```bash
# en el Mac: commit + push (el bundle web va commiteado en www/app/uiep)
corepack pnpm --filter uiep-backend test   # 137 tests + GATE RAG — obligatorio
ssh VPS 'cd MSBrossAI && git fetch && git reset --hard origin/main && cd apps/uiep \
  && corepack pnpm install --frozen-lockfile && corepack pnpm --filter "uiep-backend..." build \
  && cd ../../infrastructure && docker compose build uiep-backend && docker compose up -d uiep-backend'
# VERIFICACIÓN OBLIGATORIA del binario servido:
ssh VPS 'docker exec uiep-backend sh -c "ls dist/routes/ | grep -c <ruta-nueva>"'
```

### Backends msbross-* (granian) — rebuild de imagen por proyecto
```bash
ssh VPS 'cd MSBrossAI/apps/<app> && docker build -t msbross-<app>:granian . \
  && cd ../../infrastructure && docker compose up -d <app>-backend'
```

### Apps estáticas (SPA en www/app/)
Commit de los artefactos en `www/app/<app>/` → en el VPS `git reset --hard origin/main`
(el msbross-proxy las sirve directamente; cabeceras anti-cache ya configuradas).

## 3. Backup

- **UIEP**: diario 04:17 automático (`infrastructure/backup/uiep-backup.sh`, retención
  14 días, verificación de integridad). Restauración: contenedor aislado + `tar xzf`
  (procedimiento completo en `apps/uiep/docs/PHASE42-HARDENING.md`).
- Postgres (elitescout/cuentos/jartosdto/perfume): volúmenes docker — snapshots manuales
  `docker exec <pg> pg_dump` cuando toque.
- Resto: volúmenes pequeños sin datos críticos (ver inventario §3).

## 4. Recuperación / rollback

| Escenario | Procedimiento |
|---|---|
| UIEP backend roto tras un deploy | `docker tag msbrossai-uiep-backend:1.0.0 latest` (imagen congelada) o `git checkout <tag>` + build. Ancla: `rollback-fase3` (commit `8dce03b`). |
| Datos UIEP corruptos/perdidos | Backup 04:17 + restauración aislada (PHASE42) |
| Disco lleno (ENOSPC) | 1) `df -h` + `docker system df` 2) `docker builder prune -a -f` (regenerable; 51G recuperados el 31-oct) 3) NUNCA `image prune -a`/`system prune` (anclas) |
| VPS completo perdido | 1) VPS nuevo + UFW + docker 2) `git clone SERVER-DEV` 3) `.env` desde el gestor de secretos del propietario 4) imágenes: rebuild por proyecto (no hay registry remoto) 5) DNS → IP nueva 6) restaurar backups de volúmenes |

## 4b. Copia EXTERNA al VPS (protección ante pérdida total)

- El CÓDIGO ya es externo por diseño (GitHub).
- Los DATOS de UIEP: `infrastructure/backup/pull-uiep-backup.sh` (desde el Mac) —
  genera backup fresco en el VPS y lo trae a `backups-local/uiep/` (sincronizado por
  iCloud = fuera del servidor). Retención local configurable (default 7).
- Ejecución manual (recomendado tras cambios importantes) o cron local si el Mac está
  encendido a esa hora.
- Los VOLUMENES de otros proyectos (postgres/minio) NO tienen copia externa todavía —
  pendiente de decisión del propietario.

## 5. Secretos (gestión)

- Valores SOLO en `infrastructure/.env` del VPS (chmod 600, gitignored).
- El repo solo contiene REFERENCIAS (`secretEnv`) — jamás valores (gitleaks lo vela).
- Rotaciones documentadas: consola UIEP (PHASE42), runtime token (mismo patrón).
- Copia de seguridad de `.env`: en el gestor de contraseñas del propietario (fuera del VPS).

## 6. Salud y diagnóstico rápido

```bash
df -h /                                    # disco (umbral de alerta: >85%)
docker ps --format "{{.Names}} {{.Status}}" | wc -l   # 25 esperados
curl -s https://uiep.manuelalvarez.dev/_uiep/api/health
systemctl status ollama docker tailscaled fail2ban
pm2 ls                                      # nikolina-livekit-server online
journalctl -u ollama --since "1 hour ago" | tail -20
```

Consola UIEP → **Observabilidad**: métricas por plano, límites globales en vuelo y
auditoría correlacionada (últimos 60 eventos).
