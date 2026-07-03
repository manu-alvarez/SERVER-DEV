#!/bin/bash
# ============================================================================
# CuentosMagicos AI - Start Script
# Launches both backend and frontend in development mode
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🪄 CuentosMagicos AI - Starting..."
echo ""

# Check if services are running
check_redis() {
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            echo "✅ Redis is running"
        else
            echo "⚠️  Redis is not running. Starting..."
            brew services start redis 2>/dev/null || redis-server --daemonize yes 2>/dev/null || echo "   Please start Redis manually: brew services start redis"
        fi
    else
        echo "⚠️  Redis not installed. Install with: brew install redis"
    fi
}

check_postgres() {
    if command -v psql &> /dev/null; then
        if pg_isready &> /dev/null 2>&1; then
            echo "✅ PostgreSQL is running"
        else
            echo "⚠️  PostgreSQL is not running. Starting..."
            brew services start postgresql@16 2>/dev/null || echo "   Please start PostgreSQL manually: brew services start postgresql@16"
        fi
    else
        echo "⚠️  PostgreSQL not installed. Install with: brew install postgresql@16"
    fi
}

check_redis
check_postgres
echo ""

# Start backend in background
echo "🐍 Starting FastAPI backend on port 8000..."
cd "$SCRIPT_DIR/backend"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if port 8000 is in use
if lsof -i :8000 &> /dev/null; then
    echo "⚠️  Port 8000 is already in use. Killing existing process..."
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "   Waiting for backend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:8000/health &> /dev/null; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

echo ""

# Start frontend
echo "⚛️  Starting Next.js frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "======================================="
echo "🪄 CuentosMagicos AI is running!"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo "======================================="

# Trap to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

trap cleanup INT TERM

# Wait for either process to exit
wait
