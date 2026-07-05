/**
 * MSBrossAI — PM2 Ecosystem Configuration
 *
 * Only services NOT managed by Docker.
 * Docker handles all app backends + proxy.
 * PM2 handles: LiveKit server, Celery worker, and non-Dockerized apps.
 */
const path = require('path');

module.exports = {
  apps: [
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

    {
      name: 'mapfre-infocol',
      script: 'node_modules/.bin/next',
      args: 'start -p 3333 -H 127.0.0.1',
      cwd: path.join(__dirname, 'apps/mapfre-infocol/frontend'),
      env: {
        NODE_ENV: 'production',
        PORT: '3333'
      },
      out_file: path.join(__dirname, 'logs/mapfre-infocol.log'),
      error_file: path.join(__dirname, 'logs/mapfre-infocol.error.log'),
      time: true,
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },

    {
      name: 'web-restaurante-atenea-backend',
      script: 'venv/bin/python3',
      args: '-m uvicorn main:app --host 0.0.0.0 --port 8009',
      cwd: path.join(__dirname, 'apps/web-restaurante-atenea'),
      out_file: path.join(__dirname, 'logs/atenea.log'),
      error_file: path.join(__dirname, 'logs/atenea.error.log'),
      autorestart: true,
      max_restarts: 15,
      exp_backoff_delay: 1000,
      min_uptime: '15s',
      max_memory_restart: '500M'
    },
  ]
};
