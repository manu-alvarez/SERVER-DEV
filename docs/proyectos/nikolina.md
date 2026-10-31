# Nikolina AI

- **Qué es**: Asistente de voz para restaurantes (LiveKit + agente de voz).
- **Dominio**: nikolina.manuelalvarez.dev
- **Repo**: monorepo apps/livekit-nikolina
- **Tecnología**: LiveKit (cloud nikolina-1jg7t00i + PM2 self-host :7880/:7881), FastAPI (token server), agente Python (livekit.agents + google STT/TTS), frontend Vite/React
- **Arquitectura**: señalización LiveKit cloud; worker docker precalentado; token JWT por /api/token
- **Despliegue**: compose (api-hub + agent) + estático www/app/livekit-nikolina
- **Estado real**: activo; voz verificada hasta señalización (micrófono humano = prueba del propietario); dashboards Admin/Dev en /app/admin-dashboard y /app/dev-dashboard con JWT por /api/login (contraseña rotada 31-oct, en el fichero del escritorio)
- **BUILD-INFO**: n/a (build del monorepo)
- **Actualización**: commit → VPS git reset + compose/static sync
- **Limitaciones conocidas**: —
