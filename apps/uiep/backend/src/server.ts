import { createApp } from './app';
import { seedDefaultModelProfile } from './services/model-gateway.service';

// Punto de entrada del contenedor de producción (CMD ["node", "dist/server.js"]).
const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

// Fase 2: siembra idempotente del perfil 'default' del Model Gateway.
// No bloquea ni rompe el arranque si falla (solo registro).
void seedDefaultModelProfile();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Motor @uiep/design-engine (runPipeline) integrado`);
});
