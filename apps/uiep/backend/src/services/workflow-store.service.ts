import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * workflow-store (Fase 6) — persistencia de EJECUCIONES de workflows.
 *
 * MISMA PAUTA que agent-runtime-store: un fichero JSON por ejecución
 * (DATA_DIR/workflow/<runId>.json), escritura atómica, sweep de arranque
 * para ejecuciones huérfanas (quedaron running tras reiniciar el
 * contenedor → failed workflow_restarted; nunca se simula). Los WorkflowSpec
 * viven en el spec-registry existente (kind 'Workflow') — sin almacén nuevo.
 *
 * Cada paso (nodo) guarda su estado, salida, intentos y — si es un nodo
 * agent — la sesión/ejecución del agente (trazabilidad nodo→run del agente).
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const RUNS_DIR = path.join(DATA_DIR, 'workflow');

export type WorkflowNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

export interface WorkflowNodeStep {
  nodeId: string
  type: 'agent' | 'condition' | 'parallel'
  status: WorkflowNodeStatus
  output?: string
  renderedInput?: string
  error?: string
  attempts: number
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  /** trazabilidad nodo agente → sesión/ejecución del runtime de agentes */
  agentSessionId?: string
  agentExecutionId?: string
  /** Fase 6: rama tomada por un nodo condition (para reanudación determinista). */
  branchTaken?: string
  /** salidas de las ramas en nodos parallel */
  branchOutputs?: Array<{ nodeId: string; ok: boolean; output?: string; error?: string }>
}

export type WorkflowRunStatus =
  | 'running'
  | 'cancelling'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowRunRecord {
  workflowRunId: string // wfr-…
  workflowId: string
  workflowVersion: string
  input: string
  status: WorkflowRunStatus
  steps: Record<string, WorkflowNodeStep> // nodeId → paso
  order: string[] // orden secuencial de los nodos (del spec)
  output?: string // salida del último nodo agent completado
  errors: string[]
  startedAt: string
  finishedAt?: string
}

let ready = false;
async function ensure(): Promise<void> {
  if (!ready) {
    await fs.mkdir(RUNS_DIR, { recursive: true });
    ready = true;
  }
}

async function writeAtomic(file: string, data: unknown): Promise<void> {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

/** Mutex por runId: las ramas en paralelo persisten el MISMO registro — las
 *  escrituras se serializan para que el rename atómico nunca colisione. */
const writeLocks = new Map<string, Promise<void>>();

export function newWorkflowRunId(): string {
  return `wfr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveWorkflowRun(run: WorkflowRunRecord): Promise<void> {
  await ensure();
  const file = path.join(RUNS_DIR, `${run.workflowRunId}.json`);
  const prev = writeLocks.get(run.workflowRunId) ?? Promise.resolve();
  const next = prev.then(() => writeAtomic(file, run));
  // El fallo de una escritura no bloquea la siguiente (el estado real del
  // run se persiste en la siguiente llamada — el motor siempre re-guarda).
  writeLocks.set(run.workflowRunId, next.catch(() => undefined));
  await next;
}

export async function loadWorkflowRun(runId: string): Promise<WorkflowRunRecord | null> {
  await ensure();
  if (!/^wfr-[a-z0-9-]{3,80}$/.test(runId)) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(RUNS_DIR, `${runId}.json`), 'utf8')) as WorkflowRunRecord;
  } catch {
    return null;
  }
}

export async function listWorkflowRuns(limit = 25): Promise<WorkflowRunRecord[]> {
  await ensure();
  const files = (await fs.readdir(RUNS_DIR)).filter((f) => f.endsWith('.json'));
  const runs: WorkflowRunRecord[] = [];
  for (const file of files) {
    try {
      runs.push(JSON.parse(await fs.readFile(path.join(RUNS_DIR, file), 'utf8')) as WorkflowRunRecord);
    } catch {
      // fichero corrupto: se ignora
    }
  }
  runs.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  return runs.slice(0, Math.max(1, limit));
}

export async function countWorkflowRuns(): Promise<number> {
  await ensure();
  return (await fs.readdir(RUNS_DIR)).filter((f) => f.endsWith('.json')).length;
}

/** Sweep de arranque: ejecuciones 'running' huérfanas → failed (nunca simulado). */
export async function sweepInterruptedWorkflowRuns(): Promise<number> {
  await ensure();
  const files = (await fs.readdir(RUNS_DIR)).filter((f) => f.endsWith('.json'));
  let swept = 0;
  for (const file of files) {
    const full = path.join(RUNS_DIR, file);
    try {
      const run = JSON.parse(await fs.readFile(full, 'utf8')) as WorkflowRunRecord;
      if (run.status !== 'running' && run.status !== 'cancelling') {
        continue;
      }
      run.status = 'failed';
      run.errors.push('workflow_restarted: la ejecución quedó en running tras reiniciar el contenedor');
      for (const step of Object.values(run.steps)) {
        if (step.status === 'running' || step.status === 'pending') {
          step.status = 'failed';
          step.error = 'workflow_restarted';
        }
      }
      if (!run.finishedAt) {
        run.finishedAt = new Date().toISOString();
      }
      await writeAtomic(full, run);
      swept += 1;
    } catch {
      // fichero corrupto: no se toca
    }
  }
  return swept;
}
