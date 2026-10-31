import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Envelope mínimo de cualquier documento de especificación (AgentSpec,
 * ModelProfile, ...). Fase 2 convierte el registro en polimórfico: la
 * persistencia y las interfaces no cambian, solo el tipo del envelope.
 */
export type SpecEnvelope = {
  apiVersion: string;
  kind: string;
  metadata: { id: string; name: string; version: string; description?: string; createdAt?: string };
  spec?: unknown;
};

/**
 * spec-registry — persistencia inicial de especificaciones (Fase 1, P0).
 *
 * Almacén de ficheros JSON con escritura atómica (tmp + rename): sin dependencias
 * nuevas, suficiente para el registro de specs y sobrevive a reinicios del
 * contenedor (volumen montado en DATA_DIR por docker-compose). La migración a
 * SQLite/PostgreSQL (Fase 4+) reemplazará este módulo sin cambiar su interfaz.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const SPECS_DIR = path.join(DATA_DIR, 'specs');

let dirReady = false;

async function ensureDir(): Promise<void> {
  if (!dirReady) {
    await fs.mkdir(SPECS_DIR, { recursive: true });
    dirReady = true;
  }
}

function specFile(id: string, version: string): string {
  return path.join(SPECS_DIR, `${id}@${version}.json`);
}

/** Upsert idempotente: (id, version) identifica el documento. */
export async function saveSpec(spec: SpecEnvelope): Promise<void> {
  await ensureDir();
  const file = specFile(spec.metadata.id, spec.metadata.version);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(spec, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

export interface SpecSummary {
  id: string;
  name: string;
  version: string;
  kind: string;
  apiVersion: string;
  description?: string;
  createdAt?: string;
}

export async function listSpecs(opts?: { kind?: string }): Promise<SpecSummary[]> {
  await ensureDir();
  const files = (await fs.readdir(SPECS_DIR)).filter((f) => f.endsWith('.json'));
  const summaries: SpecSummary[] = [];
  for (const file of files) {
    try {
      const doc = JSON.parse(await fs.readFile(path.join(SPECS_DIR, file), 'utf8')) as SpecEnvelope;
      // Filtro additive por kind (Fase 2: ModelProfile); sin filtro se listan todos.
      if (opts?.kind && doc.kind !== opts.kind) {
        continue;
      }
      summaries.push({
        id: doc.metadata.id,
        name: doc.metadata.name,
        version: doc.metadata.version,
        kind: doc.kind,
        apiVersion: doc.apiVersion,
        description: doc.metadata.description,
        createdAt: doc.metadata.createdAt,
      });
    } catch {
      // fichero corrupto: se ignora en el listado (no bloquea el registro)
    }
  }
  return summaries.sort((a, b) => (a.createdAt || a.id).localeCompare(b.createdAt || b.id));
}

function compareSemVer(a: string, b: string): number {
  const [ax, ay, az] = a.split('.').map(Number);
  const [bx, by, bz] = b.split('.').map(Number);
  return ax - bx || ay - by || az - bz;
}

/** Devuelve la versión más reciente del documento con ese id (cualquier kind), o null. */
export async function getLatestSpec(id: string): Promise<SpecEnvelope | null> {
  await ensureDir();
  // El id ya fue validado contra /^[a-z0-9][a-z0-9-]{2,63}$/ en la ruta:
  // nunca se usa sin sanear para construir rutas.
  const prefix = `${id}@`;
  const versions = (await fs.readdir(SPECS_DIR))
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .map((f) => f.slice(prefix.length, -'.json'.length))
    .sort(compareSemVer);
  if (versions.length === 0) {
    return null;
  }
  const latest = versions[versions.length - 1];
  return JSON.parse(await fs.readFile(specFile(id, latest), 'utf8')) as SpecEnvelope;
}
