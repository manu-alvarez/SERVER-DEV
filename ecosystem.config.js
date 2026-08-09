/**
 * MSBrossAI — PM2 Ecosystem Configuration
 *
 * Only services NOT managed by Docker.
 * Docker handles all app backends + proxy.
 * PM2 handles: LiveKit server and non-Dockerized apps.
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
    }
  ]
};
