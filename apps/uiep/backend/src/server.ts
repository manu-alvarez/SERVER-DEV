import { createApp } from './app';
import { seedDefaultModelProfile } from './services/model-gateway.service';
import { seedDefaultToolSpecs } from './services/tool-registry.service';
import { sweepInterruptedRuns } from './services/agent-runtime-store.service';

// Punto de entrada del contenedor de producción (CMD ["node", "dist/server.js"]).
const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

// Fases 2-4: siembras idempotentes del Model Gateway y del Tool Registry, y
// sweep de ejecuciones interrumpidas (quedaron 'running' tras un reinicio).
// No bloquean ni rompen el arranque si fallan (solo registro).
void seedDefaultModelProfile();
void seedDefaultToolSpecs();
void sweepInterruptedRuns().then((swept) => {
  if (swept > 0) {
    console.log(`[UIEP] Agent Runtime: ${swept} ejecución(es) interrumpida(s) marcadas como failed (runtime_restarted)`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Motor @uiep/design-engine (runPipeline) integrado`);
});
