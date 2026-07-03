#!/bin/bash
# EliteScout — PM2 Production Server Launcher
# Ensures proper cwd, env loading, and port binding.
cd "$(dirname "$0")"
export NEXT_SERVER_MODE=true
export NODE_ENV=production
exec npx next start -p "${PORT:-8003}"
