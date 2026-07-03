#!/bin/bash
# ============================================================================
# CuentosMagicos AI - macOS Native Setup Script
# Installs all dependencies for backend (Python) and frontend (Node.js)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

echo "🪄 CuentosMagicos AI - Setup for macOS"
echo "======================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install with: brew install python3"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install with: brew install node"
    exit 1
fi

if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew not found. Install from https://brew.sh"
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
NODE_VERSION=$(node --version)
echo "✅ Python $PYTHON_VERSION"
echo "✅ Node $NODE_VERSION"
echo ""

# Install PostgreSQL and Redis via Homebrew (if not already installed)
echo "📦 Installing system dependencies..."

if ! command -v psql &> /dev/null; then
    echo "   Installing PostgreSQL..."
    brew install postgresql@16
    brew services start postgresql@16
    echo "   Creating database..."
    createdb cuentos_magicos 2>/dev/null || echo "   Database may already exist"
else
    echo "✅ PostgreSQL already installed"
fi

if ! command -v redis-cli &> /dev/null; then
    echo "   Installing Redis..."
    brew install redis
    brew services start redis
else
    echo "✅ Redis already installed"
fi

echo ""

# Setup backend
echo "🐍 Setting up Python backend..."
cd "$PROJECT_DIR/backend"

if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

echo "   Activating virtual environment..."
source venv/bin/activate

echo "   Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend dependencies installed"
echo ""

# Setup frontend
echo "⚛️  Setting up Next.js frontend..."
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "   Installing Node.js dependencies..."
    npm install
else
    echo "✅ Node modules already installed"
fi

echo ""

# Create .env if not exists
cd "$PROJECT_DIR"
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Review .env and update with your actual credentials"
else
    echo "✅ .env already exists"
fi

echo ""
echo "======================================="
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "  Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use the convenience script:"
echo "  ./start.sh"
echo ""
