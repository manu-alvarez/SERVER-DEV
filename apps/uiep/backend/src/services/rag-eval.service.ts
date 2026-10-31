import path from 'node:path';
import { createSource, ingestSource } from './ingestion.service';
import { deleteSource, getSource, setBindingsForAgent, listSources } from './knowledge-store.service';
import { retrieveForAgent } from './retrieval.service';
import { createSession, runAgent } from './agent-runtime.service';

/**
 * rag-eval (Fase 5.2) — evaluación RAG determinista e independiente del LLM.
 *
 * · Las métricas de RECUPERACIÓN (Recall@K, Precision@K, MRR) se calculan
 *   sobre los resultados REALES del índice (embeddings + coseno + umbral),
 *   nunca pidiendo a un modelo que juzgue su propia calidad.
 * · Las métricas de CITAS se calculan sobre los runs del corpus ejecutados
 *   con el modelo de prueba (mock determinista en CI; el caso real se
 *   registra como informe, sin usarlo como gate): emitidas / verificadas /
 *   sin respaldo, con la misma validación determinista del runtime.
 * · El corpus vive VERSIONADO junto al código (apps/uiep/eval/rag-corpus.json).
 * · Umbrales configurables por env → GATE: si la métrica baja, la suite
 *   falla y el despliegue se detiene (regresiones antes de desplegar).
 */

export interface RagCorpusDoc {
  id: string
  title: string
  text: string
}

export interface RagCorpusQuestion {
  q: string
  relevantDocIds: string[]
  answerMustContain?: string[]
}

export interface RagCorpus {
  version: string
  docs: RagCorpusDoc[]
  questions: RagCorpusQuestion[]
  agentId: string
  topK: number
}

export interface RagQuestionResult {
  q: string
  hits: Array<{ docId: string; sourceId: string; chunkIdx: number; score: number }>
  relevantHit: number | null // rank 1-based del primer hit relevante
  recall: number // |relevantes ∩ topK| / |relevantes|
  precision: number // |relevantes ∩ topK| / hits.length
  run?: {
    status: string
    text?: string
    answerOk: boolean
    citations?: Array<{ ref: number; verified: boolean }>
  }
}

export interface RagEvalReport {
  corpusVersion: string
  provider: 'mock' | 'real'
  topK: number
  questions: RagQuestionResult[]
  recallAtK: number
  precisionAtK: number
  mrr: number
  citations: { emitted: number; verified: number; unsupported: number; verifiedRatio: number | null }
  thresholds: { recallAtK: number; mrr: number; precisionAtK: number }
  gate: { passed: boolean; failures: string[] }
}

export function loadThresholds(): { recallAtK: number; mrr: number; precisionAtK: number } {
  const num = (name: string, fallback: number) => {
    const v = Number(process.env[name]);
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : fallback;
  };
  return { recallAtK: num('RAG_EVAL_MIN_RECALL_AT_K', 0.9), mrr: num('RAG_EVAL_MIN_MRR', 0.9), precisionAtK: num('RAG_EVAL_MIN_PRECISION_AT_K', 0.3) };
}

export interface EvaluateOptions {
  /** Inyectar proveedor de embeddings (tests); default: el servicio real/mock según env. */
  withRuns?: boolean
  agentId?: string
}

/**
 * Ejecuta la evaluación completa sobre el DATA_DIR actual: crea las fuentes
 * del corpus (ingesta idempotente), las vincula al agente de evaluación y
 * mide. Limpieza: las fuentes se marcan para borrado al final (el DATA_DIR
 * de CI/eval es desechable; en modo real sobre el VPS se usa un prefijo
 * propio y se borran igualmente).
 */
export async function evaluateRag(corpus: RagCorpus, opts: EvaluateOptions = {}): Promise<RagEvalReport> {
  const provider: 'mock' | 'real' = process.env.RAG_EVAL_PROVIDER === 'real' ? 'real' : 'mock';
  const agentId = opts.agentId ?? corpus.agentId;
  const topK = corpus.topK;
  const docPrefix = provider === 'real' ? 'rag-eval-real-' : 'rag-eval-';

  // 1) Ingesta del corpus (idempotente por hash; títulos únicos por doc).
  const docBySource = new Map<string, string>(); // sourceId → docId
  const sourceByDoc = new Map<string, string>(); // docId → sourceId
  for (const doc of corpus.docs) {
    const title = `${docPrefix}${doc.id}`;
    const existing = (await listSources()).find((s) => s.title === title);
    let sourceId: string;
    if (existing && existing.status === 'ingested') {
      sourceId = existing.sourceId;
    } else {
      if (existing) {
        await deleteSource(existing.sourceId);
      }
      const created = await createSource({ type: 'text', title, text: doc.text });
      if (!created.ok) {
        throw new Error(`eval: no se pudo crear la fuente ${doc.id}: ${created.reason}`);
      }
      const ingested = await ingestSource(created.source.sourceId);
      if (!ingested.ok) {
        throw new Error(`eval: no se pudo ingerir ${doc.id}: ${ingested.reason} ${ingested.message ?? ''}`);
      }
      sourceId = created.source.sourceId;
    }
    sourceByDoc.set(doc.id, sourceId);
    docBySource.set(sourceId, doc.id);
  }

  // 2) Bindings del agente de evaluación → todas las fuentes del corpus.
  await setBindingsForAgent(agentId, [...sourceByDoc.values()]);

  // 3) Por pregunta: recuperación REAL del índice → métricas de ranking.
  const results: RagQuestionResult[] = [];
  let citations = { emitted: 0, verified: 0, unsupported: 0, verifiedRatio: null as number | null };

  for (const question of corpus.questions) {
    const r = await retrieveForAgent(agentId, question.q, topK);
    if (!r.ok) {
      results.push({ q: question.q, hits: [], relevantHit: null, recall: 0, precision: 0 });
      continue;
    }
    const hits = r.hits.map((h) => ({ docId: docBySource.get(h.sourceId) ?? '?', sourceId: h.sourceId, chunkIdx: h.chunkIdx, score: h.score }));
    const relevantSet = new Set(question.relevantDocIds);
    const firstRelevant = hits.findIndex((h) => relevantSet.has(h.docId));
    const relevantInTop = hits.filter((h) => relevantSet.has(h.docId)).length;
    const qr: RagQuestionResult = {
      q: question.q,
      hits,
      relevantHit: firstRelevant >= 0 ? firstRelevant + 1 : null,
      recall: relevantInTop / question.relevantDocIds.length,
      precision: hits.length > 0 ? relevantInTop / hits.length : 0,
    };

    // 4) Métricas de citas: run REAL del turno con el modelo de prueba
    //    (mock en CI). Solo si withRuns y el corpus lo permite.
    if (opts.withRuns && provider === 'mock') {
      const ses = await createSession(agentId);
      if (ses.ok) {
        const run = await runAgent(ses.session.sessionId, question.q);
        if (run.ok) {
          const rec = run.record;
          const text = rec.result.text ?? '';
          const answerOk = (question.answerMustContain ?? []).every((s) => text.includes(s));
          const citationsValidated = rec.result.citations ?? [];
          citations.emitted += citationsValidated.length;
          citations.verified += citationsValidated.filter((c) => c.verified).length;
          citations.unsupported += citationsValidated.filter((c) => !c.verified).length;
          qr.run = { status: rec.status, text: text.slice(0, 160), answerOk, citations: citationsValidated.map((c) => ({ ref: c.ref, verified: c.verified })) };
        }
      }
    }
    results.push(qr);
  }

  // 5) Agregación + gate.
  const n = results.length || 1;
  const recallAtK = results.reduce((s, r) => s + r.recall, 0) / n;
  const precisionAtK = results.reduce((s, r) => s + r.precision, 0) / n;
  const mrr = results.reduce((s, r) => s + (r.relevantHit ? 1 / r.relevantHit : 0), 0) / n;
  citations.verifiedRatio = citations.emitted > 0 ? citations.verified / citations.emitted : null;

  const thresholds = loadThresholds();
  const failures: string[] = [];
  if (recallAtK < thresholds.recallAtK) failures.push(`recall@${topK}=${recallAtK.toFixed(3)} < ${thresholds.recallAtK}`);
  if (mrr < thresholds.mrr) failures.push(`mrr=${mrr.toFixed(3)} < ${thresholds.mrr}`);
  if (precisionAtK < thresholds.precisionAtK) failures.push(`precision@${topK}=${precisionAtK.toFixed(3)} < ${thresholds.precisionAtK}`);
  if (provider === 'mock' && (opts.withRuns ?? true)) {
    if (citations.verifiedRatio !== null && citations.verifiedRatio < 1) {
      failures.push(`citations_verified=${citations.verifiedRatio.toFixed(2)} < 1 (citas sin respaldo en el corpus)`);
    }
    const badAnswers = results.filter((r) => r.run && !r.run.answerOk).length;
    if (badAnswers > 0) {
      failures.push(`answers_failing=${badAnswers} (respuestas sin el contenido esperado)`);
    }
  }

  return {
    corpusVersion: corpus.version,
    provider,
    topK,
    questions: results,
    recallAtK,
    precisionAtK,
    mrr,
    citations,
    thresholds,
    gate: { passed: failures.length === 0, failures },
  };
}

/** Informe imprimible (CI + VPS): tabla por pregunta + resumen + gate. */
export function formatReport(report: RagEvalReport): string {
  const lines: string[] = [];
  lines.push(`RAG eval — corpus v${report.corpusVersion} · proveedor=${report.provider} · topK=${report.topK}`);
  lines.push('─'.repeat(96));
  for (const q of report.questions) {
    const rank = q.relevantHit ? `rank=${q.relevantHit}` : 'SIN HIT RELEVANTE';
    const run = q.run ? ` | run=${q.run.status} answerOk=${q.run.answerOk} citas=${JSON.stringify(q.run.citations)}` : '';
    lines.push(`  ${q.q.slice(0, 52).padEnd(52)} ${rank.padEnd(18)} R=${q.recall.toFixed(2)} P=${q.precision.toFixed(2)}${run}`);
  }
  lines.push('─'.repeat(96));
  lines.push(`Recall@${report.topK}=${report.recallAtK.toFixed(3)} (≥${report.thresholds.recallAtK}) · MRR=${report.mrr.toFixed(3)} (≥${report.thresholds.mrr}) · Precision@${report.topK}=${report.precisionAtK.toFixed(3)} (≥${report.thresholds.precisionAtK})`);
  lines.push(`Citas: emitidas=${report.citations.emitted} verificadas=${report.citations.verified} sin_respaldo=${report.citations.unsupported}${report.citations.verifiedRatio !== null ? ` (ratio ${report.citations.verifiedRatio.toFixed(2)})` : ''}`);
  lines.push(`GATE: ${report.gate.passed ? 'PASSED ✓' : 'FAILED ✗ — ' + report.gate.failures.join(' · ')}`);
  return lines.join('\n');
}

/** Carga el corpus versionado desde apps/uiep/eval/ (resuelve desde dist). */
export function loadCorpusFromDisk(): RagCorpus {
  // dist/services → backend/dist/services; ../../../eval = apps/uiep/eval
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const here = path.dirname(require.resolve('./retrieval.service.js'));
  const corpusPath = path.join(here, '../../../eval/rag-corpus.json');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return JSON.parse(require('node:fs').readFileSync(corpusPath, 'utf8')) as RagCorpus;
}
