/**
 * MSBrossAI — PM2 Ecosystem Configuration (Hardened)
 *
 * Manages backend services NOT running in Docker.
 * Docker-managed services removed to avoid port/process conflicts.
 */
const path = require('path');

module.exports = {
  apps: [
    // ──────────────────────────────────────────────
    // LIVEKIT NIKOLINA
    // ──────────────────────────────────────────────
    {
      name: 'nikolina-livekit-server',
      script: 'livekit-server',
      args: '--dev --bind 127.0.0.1 --node-ip 127.0.0.1',
      cwd: __dirname,
      out_file: path.join(__dirname, 'logs/livekit.log'),
      error_file: path.join(__dirname, 'logs/livekit.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '1G'
    },

    // ──────────────────────────────────────────────
    // TXA FITNESS PRO (Next.js SSR, Port 3456)
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
      out_file: path.join(__dirname, 'logs/txa-fitness.log'),
      error_file: path.join(__dirname, 'logs/txa-fitness.error.log'),
      time: true,
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // MAPFRE INFOCOL (Next.js SSR, Port 3333)
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
      out_file: path.join(__dirname, 'logs/mapfre.log'),
      error_file: path.join(__dirname, 'logs/mapfre.error.log'),
      time: true,
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
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
      out_file: path.join(__dirname, 'logs/perfume.log'),
      error_file: path.join(__dirname, 'logs/perfume.error.log'),
      time: true,
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    // ──────────────────────────────────────────────
    // CUENTOS MAGICOS CELERY WORKER
    // ──────────────────────────────────────────────
    {
      name: 'cuentos-magicos-celery',
      script: 'start-celery.sh',
      interpreter: '/bin/bash',
      cwd: path.join(__dirname, 'apps/cuentos-magicos/backend'),
      out_file: path.join(__dirname, 'logs/celery.log'),
      error_file: path.join(__dirname, 'logs/celery.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '800M'
    },

    // ──────────────────────────────────────────────
    // MSBROSS REVERSE PROXY (Port 8080)
    // ──────────────────────────────────────────────
    {
      name: 'msbross-proxy',
      script: 'proxy_server.js',
      cwd: __dirname,
      env: {
        ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN || ''
      },
      out_file: path.join(__dirname, 'logs/proxy.log'),
      error_file: path.join(__dirname, 'logs/proxy.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '400M'
    },
  ]
};
