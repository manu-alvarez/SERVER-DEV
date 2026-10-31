# Inventario y arquitectura real del VPS (Contabo 84.247.186.126)

Auditoría de solo lectura del 31-oct-2026 (post-limpieza de build cache). Fuente
autoritativa de la infraestructura del ecosistema manuelalvarez.dev. Actualizar en cada
cambio de infraestructura.

## 1. Sistema

| | |
|---|---|
| Host | Contabo, Ubuntu (kernel 6.x), disco 96G, 6 vCPU, RAM 11 GiB |
| Uso disco | **48G usados / 49G libres (50%)** — antes de la limpieza: 98% |
| Swap | **8G activo** en `/swapfile` (persistido en fstab — estaba sin registrar) |
| Cuentas | ubuntu (sudo), root (solo .cache/.npm/.pm2 residuales, 17M) |
| SSH | puerto 22 público + fail2ban + unattended-upgrades |
| VPN | tailscaled activo (IP tailscale 100.100.1.10) |
| Firewall (ufw) | 22/80/443 públicos; **11434 (Ollama) y 8765 SOLO desde 172.16.0.0/12** (red docker) |
| Postfix | escucha solo en 127.0.0.1:25 (correo local) |
| Servicios host | docker, containerd, ollama (systemd), tailscaled, fail2ban, cron, auditd (AIDE 363M), chrony, rsyslog, postfix |

## 2. Perímetro web (cadena de tráfico)

```
Internet → Traefik (contenedor, 80/443, certs Let's Encrypt en /opt/traefik/acme.json)
  ├── manuelalvarez.dev + 24 subdominios *.manuelalvarez.dev → msbross-proxy (contenedor)
  └── dominios restantes → routers por labels de cada contenedor
msbross-proxy (node:22-alpine, Express):
  · sirve estáticos de www/app/<app>/ (todos los SPA del repo)
  · /api/<servicio> → backends docker (red msbross_net)
  · /_uiep → uiep-backend:4000 (BFF de la consola UIEP)
Host nginx: **INACTIVO** (instalado pero sin uso — el README antiguo lo citaba; corregido)
PM2 (host): nikolina-livekit-server (LiveKit 7880/7881)
```

## 3. Docker (25 contenedores, red `msbross_net`)

| Contenedor | Imagen | Proyecto |
|---|---|---|
| uiep-backend | msbrossai-uiep-backend:1.0.0 (243M) | **UIEP** (apps/uiep) |
| msbross-proxy | node:22-alpine | infrastructure/msbross-proxy |
| traefik | traefik:latest | perímetro |
| portainer | portainer-ce:lts | administración (puertos internos, no expuestos) |
| msbross-backend | msbross-msbross:granian | apps/msbross-backend (hub API) |
| nikolina-agent · it-coach-agent · nikolina-api-hub | msbross-nikolina-backend (+granian) | apps/livekit-nikolina + it-english-coach |
| it-english-backend | node:22-bookworm-slim | apps/it-english-coach |
| jartosdto-backend + postgres(pgvector) + redis + minio | granian + pgvector:pg16 + redis:7 + minio | apps/jartosdto |
| cuentos-magicos-backend + celery + postgres | granian ×2 + postgres:16 | apps/cuentos-magicos |
| msbross-elitescout-db + elitescout-backend | postgres:16 + node:22-alpine | apps/elitescout |
| iaprod-backend / traductor-backend / gas-station-backend / industrialpro-backend / atenea-backend / llm-admin-proxy | granian / bun | apps/* |

Imágenes: 9,5 GB (20; todas referenciadas). Digests completos: `docker images --digests`.
Volúmenes: 12 (8 activos); datos de Postgres/MinIO/UIEP; **4 dangling NO tocados**:
`fitness-data`, `perfume-data`, `perfume-pg-data`, `uptime-kuma` (decisión del propietario).
BuildKit cache: 821M (tras limpieza de 51G — ver §5).

## 4. Almacenamiento (contabilidad completa de 48G usados)

| Ruta | Tamaño | Qué es |
|---|---|---|
| /usr | 21G | **ollama 15G** (modelos del host: qwen3.5:4b, gemma4, deepseek-r1:8b, nomic-embed-text) + sistema |
| /var/lib/containerd | 12G | capas/contenido de las imágenes docker (snapshotter) |
| swapfile | 8G | swap activo (antes sin fstab — corregido) |
| /var/lib/docker | 2,1G | buildkit 0,8G + volúmenes 1,3G + contenedores/logs 0,1G |
| /home/ubuntu | 3,9G | MSBrossAI (3,0G: apps con node_modules + www 125M + .git 198M) + backups 615M |
| /var/cache + resto | ~1G | apt/pip/audit(363M AIDE)/logs 270M |

## 5. Limpieza ejecutada (31-oct-2026, con inventario previo)

| Acción | Espacio recuperado | Justificación |
|---|---|---|
| `docker builder prune -a -f` | **51,3 GB** | 137 entradas de caché BuildKit con **0 activas**; 100% regenerable; el disco estaba al 100% (ENOSPC en un build). Los builds siguientes re-compilan (minutos). |

**Enconsistentemente prohibido para el futuro**: `docker system prune` y
`docker image prune -a` (eliminan anclas de rollback tagged sin contenedor — ocurrió en
Fase 8 y se corrigió reconstruyendo desde el commit; ver matriz en apps/uiep/README.md).

## 6. Candidatos de limpieza PENDIENTES (requieren decisión del propietario)

| Candidato | Espacio | Riesgo | Nota |
|---|---|---|---|
| 4 volúmenes docker dangling | 48 MB | datos de proyectos posiblemente activos a futuro | solo borrar con confirmación explícita |
| duplicados iCloud en el repo (`* 2.*`) | ~KB-10M | nulo (git) | borrados en el repo (git reversa) |
| `/var/www/manuelalvarez` + nginx host inactivo | 5,6M | portfolio legacy — verificar destino antes | conservar |
| imágenes base antiguas re-descargables | — | cero | ya cubierto |

## 7. Seguridad (postura observada)

- Exposición pública mínima: 22/80/443; resto denegado (ufw activo).
- Ollama/8765 restringidos a la red docker (no accesibles desde internet).
- Portainer sin puertos publicados al host.
- Secretos: `infrastructure/.env` (chmod 600, gitignored) — runtime token, consola,
  hooks; autenticaciones de integraciones por referencia (`secretEnv`).
- Auditoría UIEP: JSONL correlacionado sin secretos (`DATA_DIR/audit/`).
- AIDE (363M) activo como IDS + fail2ban + unattended-upgrades.
