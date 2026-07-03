/**
 * MSBrossAI — Unified PM2 Ecosystem Configuration (Hardened HA Release)
 * 
 * Manages all backend services for the ecosystem dynamically resolved:
 * - LiveKit Server (WebRTC engine)
 * - Nikolina API Hub (FastAPI token server + dashboard)
 * - Nikolina Agent (LiveKit voice agent)
 * - IndustrialPro Backend (FastAPI task manager)
 * - IAPuta OS Backend (FastAPI AI assistant)
 * - Arantxa Translate Server (Express translation proxy)
 * - MSBrOSs Backend (Adele voice server)
 * - Cuentos Mágicos Backend (Story teller FastAPI)
 * - MSBross Reverse Proxy (Unified portal & port-based routing)
 * 
 * Hardening:
 * - max_memory_restart: Prevents memory leaks from killing the OS (OOM Killer mitigation).
 * - exp_backoff_delay: Exponential backoff delay starting at 1000ms.
 * - min_uptime: Process must be up for 15s to be considered running.
 * - max_restarts: Cap at 15 restarts before triggering operator alert/stable sleep.
 */
const path = require('path');

module.exports = {
  apps: [
    // ──────────────────────────────────────────────
    // LIVEKIT NIKOLINA (Voice AI)
    // ──────────────────────────────────────────────
    {
      name: 'nikolina-livekit-server',
      script: 'livekit-server',
      args: '--dev --bind 127.0.0.1 --node-ip 127.0.0.1',
      cwd: __dirname,
      out_file: path.join(__dirname, 'apps/livekit-nikolina/logs/livekit.log'),
      error_file: path.join(__dirname, 'apps/livekit-nikolina/logs/livekit.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '1G'
    },
    {
      name: 'nikolina-api-hub',
      script: path.join(__dirname, 'apps/livekit-nikolina/venv/bin/python3'),
      args: '-m uvicorn main:app --host 127.0.0.1 --port 8001',
      cwd: path.join(__dirname, 'apps/livekit-nikolina/server'),
      env: {
        PYTHONPATH: path.join(__dirname, 'apps/livekit-nikolina/agent/src') + ':' + path.join(__dirname, 'apps/livekit-nikolina/server/src') + ':' + path.join(__dirname, 'apps/livekit-nikolina/server'),
        PORT: '8001'
      },
      out_file: path.join(__dirname, 'apps/livekit-nikolina/logs/api.log'),
      error_file: path.join(__dirname, 'apps/livekit-nikolina/logs/api.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },
    {
      name: 'nikolina-agent',
      script: path.join(__dirname, 'apps/livekit-nikolina/venv/bin/python3'),
      args: 'src/agent.py start',
      cwd: path.join(__dirname, 'apps/livekit-nikolina/agent'),
      env: {
        PYTHONPATH: './agent/src:./server/src'
      },
      out_file: path.join(__dirname, 'apps/livekit-nikolina/logs/agent.log'),
      error_file: path.join(__dirname, 'apps/livekit-nikolina/logs/agent.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '1G'
    },
    {
      name: 'it-coach-agent',
      script: path.join(__dirname, 'apps/livekit-nikolina/venv/bin/python3'),
      args: 'src/coach_agent.py start',
      cwd: path.join(__dirname, 'apps/livekit-nikolina/agent'),
      env: {
        PYTHONPATH: './agent/src:./server/src',
        LIVEKIT_WORKER_PORT: 8082
      },
      out_file: path.join(__dirname, 'apps/livekit-nikolina/logs/coach_agent.log'),
      error_file: path.join(__dirname, 'apps/livekit-nikolina/logs/coach_agent.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '1G'
    },

    // ──────────────────────────────────────────────
    // Gas Station (Checklist & Inventory Backend)
    // ──────────────────────────────────────────────
    {
      name: 'gas-station-backend',
      script: path.join(__dirname, 'apps/gas-station/backend/venv/bin/python3'),
      args: '-m uvicorn main:app --host 127.0.0.1 --port 3005',
      cwd: path.join(__dirname, 'apps/gas-station/backend'),
      env: {
        PORT: '3005'
      },
      out_file: path.join(__dirname, 'apps/gas-station/backend/gas-station.log'),
      error_file: path.join(__dirname, 'apps/gas-station/backend/gas-station.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // IndustrialPro (Task Manager Backend)
    // ──────────────────────────────────────────────
    {
      name: 'industrialpro-backend',
      script: path.join(__dirname, 'apps/industrialpro/backend/venv/bin/python3'),
      args: '-m uvicorn app:app --host 127.0.0.1 --port 8002',
      cwd: path.join(__dirname, 'apps/industrialpro/backend'),
      out_file: path.join(__dirname, 'apps/industrialpro/backend/industrialpro.log'),
      error_file: path.join(__dirname, 'apps/industrialpro/backend/industrialpro.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // IAPUTA OS (AI Assistant Backend)
    // ──────────────────────────────────────────────
    {
      name: 'iaputa-backend',
      script: path.join(__dirname, 'apps/iaputa-os/backend/venv/bin/python3'),
      args: '-m uvicorn main:app --host 127.0.0.1 --port 8006',
      cwd: path.join(__dirname, 'apps/iaputa-os/backend'),
      out_file: path.join(__dirname, 'apps/iaputa-os/backend/iaputa.log'),
      error_file: path.join(__dirname, 'apps/iaputa-os/backend/iaputa.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '800M'
    },

    // ──────────────────────────────────────────────
    // ARANTXA TRANSLATE (Translation Server)
    // ──────────────────────────────────────────────
    {
      name: 'traductor-pro-server',
      script: 'node',
      args: 'dist/index.js',
      cwd: path.join(__dirname, 'apps/traductor-pro/server'),
      env: {
        PORT: '8004'
      },
      out_file: path.join(__dirname, 'apps/traductor-pro/server/arantxa.log'),
      error_file: path.join(__dirname, 'apps/traductor-pro/server/arantxa.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '300M'
    },

    // ──────────────────────────────────────────────
    // MSBROSS ACTIVE ADELE VOICE SERVER
    // ──────────────────────────────────────────────
    {
      name: 'msbross-backend',
      script: path.join(__dirname, 'apps/msbross/venv/bin/python3'),
      args: 'server.py',
      cwd: path.join(__dirname, 'apps/msbross'),
      out_file: path.join(__dirname, 'apps/msbross/msbross.log'),
      error_file: path.join(__dirname, 'apps/msbross/msbross.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // CUENTOSMÁGICOS AI (Creative Story Teller Backend)
    // ──────────────────────────────────────────────
    {
      name: 'cuentos-magicos-backend',
      script: path.join(__dirname, 'apps/cuentos-magicos/backend/venv/bin/python3'),
      args: '-m uvicorn app.main:app --host 127.0.0.1 --port 8007',
      cwd: path.join(__dirname, 'apps/cuentos-magicos/backend'),
      out_file: path.join(__dirname, 'apps/cuentos-magicos/backend/cuentosmagicos.log'),
      error_file: path.join(__dirname, 'apps/cuentos-magicos/backend/cuentosmagicos.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '600M'
    },

    {
      name: 'cuentos-magicos-celery',
      script: 'start-celery.sh',
      interpreter: '/bin/bash',
      cwd: path.join(__dirname, 'apps/cuentos-magicos/backend'),
      out_file: path.join(__dirname, 'apps/cuentos-magicos/backend/celery.log'),
      error_file: path.join(__dirname, 'apps/cuentos-magicos/backend/celery.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '800M'
    },

    // ──────────────────────────────────────────────
    // ELITESCOUT (Semantic Travel Finder & Price Scraper Server, Port 8003)
    // ──────────────────────────────────────────────
    {
      name: 'elitescout-server',
      script: 'start-server.sh',
      cwd: path.join(__dirname, 'apps/elitescout'),
      interpreter: '/bin/bash',
      env: {
        PORT: '8003',
        NEXT_SERVER_MODE: 'true',
        NODE_ENV: 'production'
      },
      out_file: path.join(__dirname, 'apps/elitescout/elitescout.log'),
      error_file: path.join(__dirname, 'apps/elitescout/elitescout.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '800M'
    },

    // ──────────────────────────────────────────────
    // ATENEA RESTAURANT BACKEND (Port 8009)
    // ──────────────────────────────────────────────
    {
      name: 'web-restaurante-atenea-backend',
      script: path.join(__dirname, 'apps/web-restaurante-atenea/venv/bin/python3'),
      args: '-m uvicorn main:app --host 127.0.0.1 --port 8009',
      cwd: path.join(__dirname, 'apps/web-restaurante-atenea'),
      env: {
        PYTHONPATH: '.',
        PORT: '8009'
      },
      out_file: path.join(__dirname, 'apps/web-restaurante-atenea/atenea.log'),
      error_file: path.join(__dirname, 'apps/web-restaurante-atenea/atenea.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '300M'
    },

    // ──────────────────────────────────────────────
    // JARTOSDTO BACKEND (RAG & Multi-LLM, Port 8010)
    // ──────────────────────────────────────────────
    {
      name: 'jartosdto-backend',
      script: path.join(__dirname, 'apps/jartosdto/server/.venv/bin/python3'),
      args: '-m uvicorn app.main:app --host 127.0.0.1 --port 8010',
      cwd: path.join(__dirname, 'apps/jartosdto/server'),
      env: {
        PYTHONPATH: '.',
        PORT: '8010'
      },
      out_file: path.join(__dirname, 'apps/jartosdto/server/jartosdto.log'),
      error_file: path.join(__dirname, 'apps/jartosdto/server/jartosdto.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '60s',
      kill_timeout: 10000,
      max_memory_restart: '800M'
    },

    // ──────────────────────────────────────────────
    // TXA FITNESS PRO (Behavioral Change Coaching, Next.js SSR, Port 3456)
    // ──────────────────────────────────────────────
    {
      name: 'txa-fitness-pro',
      script: 'node_modules/.bin/next',
      args: 'start -p 3456 -H 127.0.0.1',
      cwd: path.join(__dirname, 'apps/txa-fitness-pro'),
      env: {
        NODE_ENV: 'production',
        PORT: '3456'
      },
      out_file: path.join(__dirname, 'apps/txa-fitness-pro/txa-fitness.log'),
      error_file: path.join(__dirname, 'apps/txa-fitness-pro/txa-fitness.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // MAPFRE INFOCOL (Insurance Claim Automation Dashboard, Next.js SSR, Port 3333)
    // ──────────────────────────────────────────────
    {
      name: 'mapfre',
      script: 'npm',
      args: 'run start',
      cwd: path.join(__dirname, 'apps/mapfre/frontend'),
      env: {
        PORT: 3333,
        NODE_ENV: 'production'
      },
      out_file: path.join(__dirname, 'apps/mapfre/frontend/mapfre.log'),
      error_file: path.join(__dirname, 'apps/mapfre/frontend/mapfre.error.log'),
      time: true,
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // REVERSE PROXY (Unified Portal & Routing, Port 8080)
    // ──────────────────────────────────────────────
    {
      name: 'msbross-proxy',
      script: 'proxy_server.js',
      cwd: __dirname,
      out_file: path.join(__dirname, 'logs/proxy.log'),
      error_file: path.join(__dirname, 'logs/proxy.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '400M'
    },

    // ──────────────────────────────────────────────
    // IT ENGLISH COACH (CORS Proxy & Backend)
    // ──────────────────────────────────────────────
    {
      name: 'it-english-backend',
      script: 'server.js',
      cwd: path.join(__dirname, 'apps/it-english-coach'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '300M'
    },



    // ──────────────────────────────────────────────
    // PERFUME TRADING ERP (Next.js SSR, Port 3011)
    // ──────────────────────────────────────────────
    {
      name: 'perfume-trading',
      script: 'node_modules/.bin/next',
      args: 'start -p 3011 -H 127.0.0.1',
      cwd: path.join(__dirname, 'apps/perfume-trading/erp'),
      env: {
        NODE_ENV: 'production',
        PORT: '3011'
      },
      out_file: path.join(__dirname, 'apps/perfume-trading/erp/perfume.log'),
      error_file: path.join(__dirname, 'apps/perfume-trading/erp/perfume.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },
  ]
};
