import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { TemplateInfo } from './project.service';

/**
 * template-loader (Fase 9) — blueprints versionados EN EL REPO
 * (apps/uiep/templates/*.json). Instalables en una llamada desde la consola.
 * El fichero define specs (Agent/Workflow/…) + knowledge de ejemplo con su
 * binding — ejemplos funcionales, no pósters.
 */

const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

interface TemplateFile {
  id: string
  title: string
  description: string
  specs?: unknown[]
  knowledge?: Array<{ title: string; text: string; bindTo?: string[] }>
}

export async function loadTemplates(): Promise<Array<TemplateInfo>> {
  try {
    const files = (await fs.readdir(TEMPLATES_DIR)).filter((f) => f.endsWith('.json'));
    const out: TemplateInfo[] = [];
    for (const f of files) {
      try {
        const doc = JSON.parse(await fs.readFile(path.join(TEMPLATES_DIR, f), 'utf8')) as TemplateFile;
        out.push({ id: doc.id, title: doc.title, description: doc.description, kind: doc.specs?.[0] && (doc.specs[0] as { kind?: string }).kind === 'Workflow' ? 'workflow' : 'agent' });
      } catch {
        /* inválido: ignorar */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function loadTemplateById(id: string): Promise<TemplateFile | null> {
  try {
    const safe = id.replace(/[^a-z0-9-]/g, '');
    const doc = JSON.parse(await fs.readFile(path.join(TEMPLATES_DIR, `${safe}.json`), 'utf8')) as TemplateFile;
    return doc.id === id ? doc : null;
  } catch {
    return null;
  }
}
