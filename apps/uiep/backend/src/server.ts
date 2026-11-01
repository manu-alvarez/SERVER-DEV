import { createApp } from './app';
import { seedDefaultModelProfile } from './services/model-gateway.service';
import { seedDefaultToolSpecs } from './services/tool-registry.service';
import { sweepInterruptedRuns } from './services/agent-runtime-store.service';
import { sweepInterruptedWorkflowRuns } from './services/workflow-store.service';
import { reconcileZombieExecutions } from './services/execution-registry.service';

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

// Misión 15 — reconciliación de runs zombis del Execution Registry: al
// arrancar (el sandbox pudo reiniciarse con jobs en vuelo) y luego cada 5
// minutos. Fail-closed: si el sandbox no responde, no se toca nada.
void reconcileZombieExecutions().then((r) => {
  if (r.reconciled.length > 0) {
    console.log(`[UIEP] Execution Registry: ${r.reconciled.length} run(s) zombi(s) reconciliado(s)`);
  }
});
const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;
const reconcileTimer = setInterval(() => {
  void reconcileZombieExecutions().catch(() => undefined);
}, RECONCILE_INTERVAL_MS);
reconcileTimer.unref();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Motor @uiep/design-engine (runPipeline) integrado`);
});
