# Fase 0.2 — `trust proxy` y rate limiting por cliente real

Base: `f0eebaf` + despliegue de Fase 0.1 · Fecha: 2026-10-30 · **NO desplegado** (requiere autorización).

## Causa (auditada, no asumida)

`express-rate-limit@7.5.1` registró una única vez `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` tras el
despliegue: recibía `X-Forwarded-For` (inyectado por Traefik) con `trust proxy` desactivado.
Efectos: (1) error una vez por proceso, (2) el rate limit de 200 req/min se contabilizaba por la
IP compartida del proxy, no por cliente. Condición **latente también en el contenedor anterior**
(mismo código y misma exposición a XFF) — no fue una regresión del despliegue.

Topología verificada en producción:

- `Traefik` (edge): **sin `forwardedHeaders`/`trustedIPs`** → comportamiento por defecto:
  reemplaza el XFF entrante no confiable por la IP real del cliente (la suplantación se
  neutraliza en el borde).
- `msbross-proxy` → backend: `proxyOpts` **sin `xfwd`** (http-proxy-middleware reenvía las
  cabeceras intactas, no añade su salto) → **único salto TCP** hasta Express.
- Red: `msbross_net` bridge `172.20.0.0/16`; backend `172.20.0.16`; **sin puertos publicados al host**.

## Solución (mínima y a prueba de exposición)

`app.ts`: `app.set('trust proxy', '172.20.0.0/16')` (constante documentada `PRODUCTION_TRUST_PROXY`,
parametrizable vía `createApp({ trustProxy })` para pruebas). Por qué subred y no `1`:

- `req.ip` = la IP que Traefik registró (cliente real) cuando la petición llega desde `msbross_net`
  → rate limit **por cliente**, prefijos XFF suplantados se ignoran (quedan a la izquierda).
- Si el puerto quedara expuesto directamente, el peer no estaría en la subred → no es confiable →
  se usa su IP de socket y el XFF del cliente se ignora (conservador).
- Pendiente operativo: si la subred de `msbross_net` cambiara al recrear la red, ajustar la
  constante (el test 22 de `proxy.test.ts` la tiene fijada como contrato).

Contratos HTTP intactos: mismos endpoints, respuestas y cabeceras.

## Pruebas imprescindibles (24/24 en total)

| # | Prueba | Evidencia |
|---|---|---|
| 1 | Proxy/IP con `X-Forwarded-For` | 200 + `service=uiep-backend`, stderr **sin `ERR_ERL`** |
| 2 | Rate limit aislado por cliente | 200 peticiones IP A → 201ª **429** (`RateLimit-Remaining: 0`) · IP B → **200** con `RateLimit-Remaining: 199` (cubo propio) · A sigue en 429 |
| 3 | Regresión salud sin error | salud 200 detrás del proxy con XFF, stderr limpio |
| — | Config de producción fijada | test afirma `trust proxy === '172.20.0.0/16'` |

Suite completa: **24/24** (21 de Fase 0.1 sin cambios + 3 nuevas; `app.ts` es componente común de
todas, por eso se re-ejecutaron). Build del backend: limpio.

## Despliegue (pendiente de autorización)

Mismo protocolo de Fase 0.1: build → `up -d uiep-backend` (contenedor ya compose-gestionado,
sin conflicto de nombre) → verificar salud pública/local, POST válido/inválido y
`docker logs` sin `ERR_ERL`. Rollback: retag `rollback-20261030` → `latest` + `up -d`.
