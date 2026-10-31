# Fase 4.2 — Hardening operativo de UIEP

Estado: implementado, 92/92 tests (+2 de rate-limit), Secret Scan verde, desplegado y
verificado con evidencia de producción real (rotación, fuerza bruta, backup y
restauración). Sin cambios de arquitectura; JSON se mantiene (Fase 4.1 diferida hasta
que la carga lo justifique).

## Alcance ejecutado

| Área | Qué se hizo | Dónde |
|---|---|---|
| Rate-limit de login | Limiter dedicado por IP: **5 intentos / 15 min** (env `LOGIN_RATE_LIMIT_MAX` / `LOGIN_RATE_LIMIT_WINDOW_MS`), 429 `too_many_attempts` + headers estándar `RateLimit-*`; el login correcto también se bloquea durante el lockout (sin oráculo de contraseñas). Solo cubre la ruta de login — el resto de la consola no se ve afectado. | `backend/routes/console.ts` |
| Rotación de contraseña | Procedimiento verificado en producción (abajo). La MAC de la cookie deriva de `UIEP_CONSOLE_PASSWORD`: rotar invalida TODAS las sesiones al instante. | docs + evidencia |
| Backup del volumen | `infrastructure/backup/uiep-backup.sh`: tar del volumen `uiep-backend-data` con el tar del propio contenedor (sin imágenes nuevas), verificación de integridad (legible + tamaño mínimo) y retención 14 días. Cron diario 04:17 en el VPS. | script + crontab |
| Restauración | Comprobada en contenedor aislado (volumen nuevo, puerto local, sin tocar producción): los datos restaurados levantan la consola con los conteos idénticos a producción. | evidencia |
| IP de origen | Cadena auditada y probada empíricamente con XFF falseado (abajo). | evidencia |

## Cadena de IP de origen (por qué el rate-limit es por cliente)

```
cliente → Traefik (edge; SIN forwardedHeaders.insecure → REEMPLAZA el
          X-Forwarded-For entrante por la IP real del cliente)
        → msbross-proxy (http-proxy: reenvía cabeceras tal cual; no añade XFF)
        → uiep-backend (trust proxy = SOLO bridge docker 172.20.0.0/16)
```

**Evidencia empírica**: 6 logins fallidos desde el VPS con XFF falseado rotativo
(`6.6.6.1`…`6.6.6.6`) y `X-Real-IP` falso → 401×4 y 429 en el 5º (bucket compartido por
la IP real). Si el XFF spoofable llegase al backend, cada IP falsificada tendría bucket
propio y nunca habría 429. Conclusión: el límite es por cliente real.

Nota operativa: el contador del limiter vive en memoria del proceso — una recreación del
contenedor lo reinicia (comportamiento aceptado para MVP; la ventana de 15 min acota la
exposición). El límite global de 200 req/min de la API no cambia.

## Rotación de UIEP_CONSOLE_PASSWORD (procedimiento)

```bash
# 1. Nueva contraseña y sustitución en el .env (solo cambia esa clave)
NEW=$(openssl rand -hex 24)
sed -i "s/^UIEP_CONSOLE_PASSWORD=.*/UIEP_CONSOLE_PASSWORD=$NEW/" /home/ubuntu/MSBrossAI/infrastructure/.env

# 2. Recrear el contenedor con el nuevo env
cd /home/ubuntu/MSBrossAI/infrastructure && docker compose up -d uiep-backend
```

**Evidencia real (rotación ejecutada dos veces)**: login con la contraseña vigente →
cookie HttpOnly capturada → rotación + `up -d` → la cookie previa devuelve **401** (la
MAC deja de verificar con la clave derivada nueva) → login con la nueva contraseña →
**200** + overview con conteos reales. Las cookies NO requieren store: sobreviven a
`docker restart` (misma contraseña) y mueren con la rotación.

## Backup y restauración (procedimiento)

Backup (automático, cron 04:17; manual = ejecutar el script):

```bash
/home/ubuntu/MSBrossAI/infrastructure/backup/uiep-backup.sh
# → /home/ubuntu/backups/uiep/uiep-data-<stamp>.tgz  (legible, ≥1 KB, retención 14 d)
```

Restauración en aislado (verificada; nunca contra producción):

```bash
docker volume create uiep-restore-test-vol
docker run -d --name uiep-restore-test -v uiep-restore-test-vol:/app/data \
  -p 127.0.0.1:4300:4000 -e DATA_DIR=/app/data \
  -e UIEP_CONSOLE_PASSWORD=pass-de-prueba -e UIEP_RUNTIME_TOKEN=token-de-prueba \
  msbrossai-uiep-backend:latest
sleep 4
docker exec -i uiep-restore-test sh -c 'tar xzf - -C /app/data' < /home/ubuntu/backups/uiep/<backup>.tgz
docker restart uiep-restore-test
# verificar: /api/health, login, /api/console/overview (conteos == producción)
docker rm -f uiep-restore-test && docker volume rm uiep-restore-test-vol
```

**Evidencia real**: backup `uiep-data-2026-10-31-1318.tgz` (4.5 KB, 28 ficheros) →
restaurado en aislado → health 200, login 200, overview con `agents 9 · profiles 1 ·
tools 2 · sessions 5 · runs 6` (idéntico a producción en ese momento) e historial de
runs con resultados de tool intacto.

## Tests (+2, `console-rate-limit.test.ts`)

Ventana acotada por env (max=3/60 s): 3 intentos → 401, el 4º → **429** con headers
`RateLimit-*` estándar; el login CORRECTO también 429 durante el lockout; el resto de
endpoints de consola NO queda limitado (401 del guard, nunca 429).

## Impacto en servicios ajenos: CERO

- Solo cambió `uiep-backend` (imagen reconstruida) y el crontab del usuario.
- `infrastructure/.env`: solo la clave `UIEP_CONSOLE_PASSWORD` (COACH_/POSTGRES_/
  MINIO_/ADMIN_ intactas).
- Proxy/Traefik/Ollama/PM2 sin cambios.
- `/api/generate` legacy → 200 tras el despliegue; flota completa: 25 contenedores Up.
