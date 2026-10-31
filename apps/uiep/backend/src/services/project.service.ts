import { validateSpec } from '@uiep/agent-spec';
import { listSpecs, saveSpec, listSpecVersions, getLatestSpec } from '../services/spec-registry.service';
import { listSources, getSource, loadChunks, setBindingsForAgent, getBindings } from '../services/knowledge-store.service';
import { audit } from '../services/observability.service';

/**
 * Project & Templates (Fase 9) — reproducibilidad de instalación a instalación.
 *
 * · EXPORT: bundle JSON con todos los CONTRATOS del proyecto (AgentSpecs,
 *   Workflows, Tools, Integrations) + knowledge (fuentes con contenido,
 *   chunks y bindings). La MEMORIA se excluye por diseño (datos derivados
 *   privados — no reproducibles ni transportables).
 * · IMPORT: upsert idempotente de cada contrato (misma (id,version) → sin
 *   cambio) + re-creación/ingesta del knowledge + bindings. Dos instalaciones
 *   distintas quedan en el mismo estado funcional.
 * · TEMPLATES: blueprints versionados en el repo (apps/uiep/templates/)
 *   instalables en una llamada (crea specs + knowledge de ejemplo).
 *
 * Rutas (SOLO consola — cookie+CSRF): GET/POST /api/console/project ·
 * GET /api/console/templates · POST /api/console/templates/:id/install
 */

export interface ProjectBundle {
  bundleVersion: string
  exportedAt: string
  specs: unknown[] // todos los specs (Agent/Workflow/Tool/Integration) en su última versión
  knowledge: Array<{
    source: { sourceId: string; type: string; ref: string; title: string }
    content?: string | null // solo textuales
    bindings: string[] // agentSpecIds
  }>
}

export async function exportProject(): Promise<ProjectBundle> {
  const kinds = ['Agent', 'ModelProfile', 'Workflow', 'Tool', 'Integration'] as const;
  const specs: unknown[] = [];
  for (const kind of kinds) {
    for (const summary of await listSpecs({ kind })) {
      const doc = await getLatestSpec(summary.id);
      if (doc) {
        specs.push(doc);
      }
    }
  }
  const bindings = await getBindings();
  const sources = await listSources();
  const knowledge: ProjectBundle['knowledge'] = [];
  for (const s of sources) {
    const full = await getSource(s.sourceId);
    const content = s.type === 'text' ? (full ? await (async () => {
      const { loadSourceContent } = await import('../services/knowledge-store.service');
      return loadSourceContent(s.sourceId);
    })() : null) : null;
    knowledge.push({
      source: { sourceId: s.sourceId, type: s.type, ref: s.ref, title: s.title },
      content,
      bindings: Object.entries(bindings).filter(([, ids]) => ids.includes(s.sourceId)).map(([agent]) => agent),
    });
  }
  return { bundleVersion: '1', exportedAt: new Date().toISOString(), specs, knowledge };
}

export type ImportResult = {
  ok: boolean
  specsImported: number
  knowledgeImported: number
  errors: string[]
}

export async function importProject(bundle: ProjectBundle): Promise<ImportResult> {
  const result: ImportResult = { ok: true, specsImported: 0, knowledgeImported: 0, errors: [] };
  // 1) Contratos: upsert idempotente con validación (nada inválido entra).
  for (const doc of Array.isArray(bundle.specs) ? bundle.specs : []) {
    const v = validateSpec(doc);
    if (!v.ok) {
      result.errors.push(`spec inválido (${String((doc as { metadata?: { id?: string } }).metadata?.id ?? '?')}): ${Object.keys(v.errors).join(',')}`);
      continue;
    }
    await saveSpec(v.spec as never);
    result.specsImported += 1;
  }
  // 2) Knowledge: re-crear fuentes (nuevo sourceId preservando el original en
  //    el título para trazabilidad) + ingesta + bindings.
  for (const entry of Array.isArray(bundle.knowledge) ? bundle.knowledge : []) {
    try {
      const { createSource, ingestSource } = await import('../services/ingestion.service');
      const type = entry.source?.type === 'url' ? 'url' : 'text';
      if (type === 'url' && !entry.source.ref) {
        continue;
      }
      if (type === 'text' && !entry.content) {
        continue;
      }
      const created = await createSource({
        type,
        ref: type === 'url' ? entry.source.ref : undefined,
        title: entry.source.title,
        text: type === 'text' ? entry.content! : undefined,
      });
      if (!created.ok) {
        result.errors.push(`knowledge '${entry.source.title}': ${created.reason}`);
        continue;
      }
      const ingested = await ingestSource(created.source.sourceId);
      if (!ingested.ok) {
        result.errors.push(`knowledge '${entry.source.title}': ingesta ${ingested.reason}`);
        continue;
      }
      for (const agentSpecId of entry.bindings ?? []) {
        const current = (await getBindings())[agentSpecId] ?? [];
        await setBindingsForAgent(agentSpecId, [...new Set([...current, created.source.sourceId])]);
      }
      result.knowledgeImported += 1;
    } catch (err) {
      result.errors.push(`knowledge '${entry.source?.title ?? '?'}': ${(err as Error).message}`);
    }
  }
  return result;
}

/* ── Clonado de agentes (lifecycle) ──────────────────────────────────────── */

export async function cloneAgentSpec(sourceId: string, newId: string): Promise<{ ok: boolean; reason?: string; version?: string }> {
  const doc = await getLatestSpec(sourceId);
  if (!doc || (doc as { kind?: string }).kind !== 'Agent') {
    return { ok: false, reason: 'agent_not_found' };
  }
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(newId)) {
    return { ok: false, reason: 'invalid_new_id' };
  }
  const clone = JSON.parse(JSON.stringify(doc)) as typeof doc;
  clone.metadata = { ...clone.metadata, id: newId, name: `${clone.metadata.name} (copia)`, version: '1.0.0' };
  await saveSpec(clone);
  return { ok: true, version: clone.metadata.version };
}

/* ── Plantillas (blueprints versionados en el repo) ──────────────────────── */

export interface TemplateInfo {
  id: string
  title: string
  description: string
  kind: 'agent' | 'workflow' | 'knowledge'
}

export async function listTemplates(): Promise<Array<TemplateInfo & { spec?: unknown }>> {
  const { loadTemplates } = await import('./template-loader.service');
  return loadTemplates();
}

export async function installTemplate(templateId: string): Promise<{ ok: boolean; reason?: string; details?: string[] }> {
  const { loadTemplateById } = await import('./template-loader.service');
  const tpl = await loadTemplateById(templateId);
  if (!tpl) {
    return { ok: false, reason: 'template_not_found' };
  }
  const details: string[] = [];
  for (const spec of tpl.specs ?? []) {
    const v = validateSpec(spec);
    if (!v.ok) {
      return { ok: false, reason: 'template_invalid', details: Object.keys(v.errors) };
    }
    await saveSpec(v.spec as never);
    details.push(`${v.kind}:${(v.spec as { metadata: { id: string } }).metadata.id}`);
  }
  for (const doc of tpl.knowledge ?? []) {
    const { createSource, ingestSource } = await import('./ingestion.service');
    const created = await createSource({ type: 'text', title: doc.title, text: doc.text });
    if (created.ok) {
      await ingestSource(created.source.sourceId);
      for (const agentSpecId of doc.bindTo ?? []) {
        const current = (await getBindings())[agentSpecId] ?? [];
        await setBindingsForAgent(agentSpecId, [...new Set([...current, created.source.sourceId])]);
      }
      details.push(`knowledge:${doc.title}`);
    }
  }
  audit({ actor: { kind: 'console' }, action: 'template.install', correlation: { targetId: templateId }, detail: { details } });
  return { ok: true, details };
}
