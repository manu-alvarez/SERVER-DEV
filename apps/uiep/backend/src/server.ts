import { createApp } from './app';
import { seedDefaultModelProfile } from './services/model-gateway.service';
import { seedDefaultToolSpecs } from './services/tool-registry.service';
import { sweepInterruptedRuns } from './services/agent-runtime-store.service';
import { sweepInterruptedWorkflowRuns } from './services/workflow-store.service';

// Punto de entrada del contenedor de producción (CMD ["node", "dist/server.js"]).
const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

// Fases 2-6: siembras idempotentes y sweeps de arranque. No bloquean el
// arranque si fallan (solo registro).
void seedDefaultModelProfile();
void seedDefaultToolSpecs();
void sweepInterruptedRuns().then((swept) => {
  if (swept > 0) {
    console.log(`[UIEP] Agent Runtime: ${swept} ejecución(es) interrumpida(s) marcadas como failed (runtime_restarted)`);
  }
});
void sweepInterruptedWorkflowRuns().then((swept) => {
  if (swept > 0) {
    console.log(`[UIEP] Workflow Runtime: ${swept} ejecución(es) de workflow interrumpida(s) marcadas como failed (workflow_restarted)`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Motor @uiep/design-engine (runPipeline) integrado`);
});
