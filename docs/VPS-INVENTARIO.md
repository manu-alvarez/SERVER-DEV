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

## 3. Docker — estado DEFINITIVO (Misión 04): 11 contenedores, red `msbross_net`

| Contenedor | Imagen | Proyecto |
|---|---|---|
| uiep-backend | msbrossai-uiep-backend:latest (prod 1.5.0 = `1f3fe0a…` = 6b6dc34; anclas: 1.4.0 = `e6dbc82…` = cfb9028, 1.3.0 = `a24d6a4…`, 1.2.0 = `49228b8…`, 1.0.1 = `128cfd7…` reconstruida, 1.0.0 = `4ea095d6`) | **UIEP** (apps/uiep) — *1.5.0: Execution Sandbox & Quality Engine* |
| uiep-sandbox | msbrossai-uiep-sandbox:latest (`48764495…`), aislado: read-only + cap_drop ALL + red interna sin salida + pids/mem duros | **UIEP M14** — intérprete de artefactos; callbacks SOLO a uiep-backend:4000 vía runner con token |
| msbross-proxy | node:22-alpine | infrastructure/msbross-proxy |
| traefik | traefik:latest | perímetro |
| portainer | portainer-ce:lts | administración (sin puertos publicados) |
| uptime-kuma | louislam/uptime-kuma:1 | monitorización (`monitor`) |
| cuentos-magicos-backend + celery + msbross-cuentos-db | msbross-cuentos-magicos-backend:granian + postgres:16 | apps/cuentos-magicos |
| gas-station-backend | msbross-gas-station-backend:granian | apps/gas-station |
| nikolina-agent + nikolina-api-hub | msbross-nikolina-backend | apps/livekit-nikolina |
| jartosdto-redis | redis:7-alpine | **compartido: cola de cuentos-magicos** (nombre legacy) |

Retirados el 31-oct (Misión 04, con backup externo previo y registro en
CLASIFICACION-RECURSOS.md): iaprod, traductor, industrialpro, atenea, it-english+coach,
elitescout+pg, jartosdto backend/pg/minio, msbross-backend(hub), llm-admin-proxy — y 16
estáticos históricos de www/app (git-reversibles; repos GH y Pages intactos).
Imágenes: 14, todas con contenedor. Volúmenes: 12 (8 activos + 4 dangling preservados:
fitness-data, perfume-data, perfume-pg-data, uptime-kuma — decisión del propietario).
BuildKit cache: 821M (la limpieza de 51,3 GB está en §5).

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
