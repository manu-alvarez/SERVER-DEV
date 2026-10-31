import { createApp } from './app';
import { seedDefaultModelProfile } from './services/model-gateway.service';
import { seedDefaultToolSpecs } from './services/tool-registry.service';

// Punto de entrada del contenedor de producción (CMD ["node", "dist/server.js"]).
const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

// Fases 2-3: siembras idempotentes del Model Gateway y del Tool Registry.
// No bloquean ni rompen el arranque si fallan (solo registro).
void seedDefaultModelProfile();
void seedDefaultToolSpecs();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Motor @uiep/design-engine (runPipeline) integrado`);
});
