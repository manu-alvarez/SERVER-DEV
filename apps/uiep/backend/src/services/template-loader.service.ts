import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BlueprintV1Schema, type BlueprintV1 } from '@uiep/agent-spec';
import type { TemplateInfo } from './project.service';

/**
 * template-loader (Fase 9 → Misión 11) — blueprints versionados EN EL REPO
 * (apps/uiep/templates/*.json). Desde M11 los ficheros se validan al cargar
 * (Blueprint v1 con apiVersion uiep.io/ues/v1); el formato LEGACY libre
 * (specs+knowledge sin envolver) sigue aceptándose por compatibilidad.
 */

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

export type LoadedTemplate =
  | { format: 'ues-v1'; doc: BlueprintV1 }
  | { format: 'legacy'; doc: LegacyTemplateFile }
  | { format: 'invalid'; doc: null; errors: Record<string, string[]>; notFound: boolean };

export interface LegacyTemplateFile {
  id: string
  title: string
  description: string
  specs?: unknown[]
  knowledge?: Array<{ title: string; text: string; bindTo?: string[] }>
}

function isLegacyTemplate(doc: unknown): doc is LegacyTemplateFile {
  const d = doc as { id?: unknown; title?: unknown; description?: unknown };
  return typeof d?.id === 'string' && typeof d?.title === 'string' && typeof d?.description === 'string';
}

/** Resumen de catálogo compatible con el contrato previo (id/title/description/kind) + metadatos UES. */
export type CatalogInfo = TemplateInfo & { apiVersion: string; blueprintVersion: string; artifacts: number };

function toCatalogInfo(doc: BlueprintV1): CatalogInfo {
  const first = doc.artifacts[0]?.spec;
  const kind: TemplateInfo['kind'] = first?.kind === 'Workflow' ? 'workflow' : 'agent';
  return {
    id: doc.metadata.id,
    title: doc.title || doc.metadata.name,
    description: doc.metadata.description ?? doc.title,
    kind,
    apiVersion: doc.apiVersion,
    blueprintVersion: doc.metadata.version,
    artifacts: doc.artifacts.length,
  };
}

function toCatalogInfoLegacy(doc: LegacyTemplateFile): CatalogInfo {
  const kind: TemplateInfo['kind'] = doc.specs?.[0] && (doc.specs[0] as { kind?: string }).kind === 'Workflow' ? 'workflow' : 'agent';
  return { id: doc.id, title: doc.title, description: doc.description, kind, apiVersion: 'legacy', blueprintVersion: '0', artifacts: doc.specs?.length ?? 0 };
}

export async function loadTemplates(): Promise<CatalogInfo[]> {
  try {
    const files = (await fs.readdir(TEMPLATES_DIR)).filter((f) => f.endsWith('.json'));
    const out: CatalogInfo[] = [];
    for (const f of files) {
      try {
        const raw = JSON.parse(await fs.readFile(path.join(TEMPLATES_DIR, f), 'utf8')) as unknown;
        const bp = BlueprintV1Schema.safeParse(raw);
        if (bp.success) {
          out.push(toCatalogInfo(bp.data));
        } else if (isLegacyTemplate(raw)) {
          out.push(toCatalogInfoLegacy(raw));
        }
        /* inválido (ni blueprint ni legacy): ignorar */
      } catch {
        /* JSON corrupto: ignorar */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function loadTemplateById(id: string): Promise<LoadedTemplate> {
  try {
    const safe = id.replace(/[^a-z0-9-]/g, '');
    const raw = JSON.parse(await fs.readFile(path.join(TEMPLATES_DIR, `${safe}.json`), 'utf8')) as unknown;
    // UES v1: el id vive en metadata.id; legacy: en la raíz.
    const rawId = (raw as { metadata?: { id?: string }; id?: string });
    const declared = rawId.metadata?.id ?? rawId.id;
    if (declared !== id) {
      return { format: 'invalid', doc: null, errors: { id: ['el id del fichero no coincide con el solicitado'] }, notFound: false };
    }
    const bp = BlueprintV1Schema.safeParse(raw);
    if (bp.success) {
      return { format: 'ues-v1', doc: bp.data };
    }
    if (isLegacyTemplate(raw)) {
      return { format: 'legacy', doc: raw };
    }
    const errors: Record<string, string[]> = {};
    for (const issue of bp.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
      (errors[key] ??= []).push(issue.message);
    }
    return { format: 'invalid', doc: null, errors, notFound: false };
  } catch {
    return { format: 'invalid', doc: null, errors: { template: ['no encontrado o JSON corrupto'] }, notFound: true };
  }
}
