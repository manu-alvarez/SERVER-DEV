#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🪄 CuentosMagicos AI - Iniciando con acceso externo..."
echo ""

# Kill existing tunnels
pkill -f localtunnel 2>/dev/null || true
sleep 1

# Start services
echo "📦 Iniciando servicios..."

# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3
echo "✅ Backend: http://localhost:8000"

# Frontend
cd frontend
rm -rf .next
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5
echo "✅ Frontend: http://localhost:3000"

# Create tunnels
echo ""
echo "🌍 Creando tuneles externos..."

npx localtunnel --port 8000 > /tmp/lt-backend.log 2>&1 &
sleep 5
BACKEND_URL=$(grep 'https://' /tmp/lt-backend.log | head -1 | grep -o 'https://[^ ]*' | tr -d '[:space:]')

npx localtunnel --port 3000 > /tmp/lt-frontend.log 2>&1 &
sleep 5
FRONTEND_URL=$(grep 'https://' /tmp/lt-frontend.log | head -1 | grep -o 'https://[^ ]*' | tr -d '[:space:]')

# Update frontend env
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL}
NEXT_PUBLIC_SUPABASE_URL=https://ujktxhqxhxkbrhczbhcf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqa3R4aHF4aHhrYnJoY3piaGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMjM4ODQsImV4cCI6MjA4Nzg5OTg4NH0.HQPF1pb2gDCltEBQpLccp58kYAuqFldCCspTZln4IPU
EOF

# Save URLs
cat > URLS.txt << EOF
CUENTOS MAGICOS AI - URLs de Acceso
====================================
Generado: $(date)

🌍 EXTERNO:
   Frontend: $FRONTEND_URL
   Backend:  $BACKEND_URL

📱 RED LOCAL:
   Frontend: http://192.168.1.34:3000
   Backend:  http://192.168.1.34:8000

💻 LOCAL:
   Frontend: http://localhost:3000
   Backend:  http://localhost:8000
EOF

echo ""
echo "✅ Tuneles activos!"
cat URLS.txt

# Keep script running
echo ""
echo "⏳ Tuneles activos. Ctrl+C para detener."
wait
