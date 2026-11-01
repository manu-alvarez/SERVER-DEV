import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getLatestSpec, listSpecVersions } from './spec-registry.service';
import {
  getLatestArtifact,
  getArtifactVersion,
  getArtifactLifecycle,
  getLatestProject,
  listProjectVersions,
  getLifecycle,
  isEngineeringArtifactKind,
} from './engineering-registry.service';
import { getGenerationRecord, sha256Hex } from './engineering-generator.service';
import { buildZip } from './zip.service';

/**
 * engineering-export (Misión 12 §5) — exportación ESTRUCTURADA.
 *
 * Formato 'uiep-export-v1': bundle JSON (equivalente estructurado a un ZIP
 * sin añadir dependencias) con un MAPA de documentos reinstalables:
 *
 *   specs/<id>@<version>.json            → Agent/Workflow/etc. (data/specs)
 *   artifacts/<Kind>/<id>@<version>.json → documento de ingeniería
 *   projects/<id>@<version>.json         → proyecto UES completo
 *   generation.json                      → registro de generación (procedencia)
 *
 * Los bundles NO contienen secretos ni contenido de entrada del usuario:
 * solo documentos validados, procedencia (hashes/referencias) y un README
 * de re-instalación. Sin ejecución: instalar = registrar los documentos.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const EXPORTS_DIR = path.join(DATA_DIR, 'engineering', 'exports');

const EXPORT_FORMAT = 'uiep-export-v1';

export interface ExportResult {
  ok: true;
  format: typeof EXPORT_FORMAT;
  filename: string;
  documents: string[];
  sizeBytes: number;
  sha256: string;
  bundle: ExportBundle;
}

export type ExportError = { ok: false; status: 404; reason: string };

export interface ExportBundle {
  export: {
    format: typeof EXPORT_FORMAT;
    createdAt: string;
    generator: { id: string; version: string };
    subject: { project?: string; kind?: string; id?: string; version?: string; generationId?: string };
  };
  documents: Record<string, unknown>;
  readme: string;
}

function readmeFor(subject: string, docs: string[]): string {
  return [
    `# Exportación UIEP — ${subject}`,
    '',
    `Formato: ${EXPORT_FORMAT} (bundle JSON estructurado; los ZIP binarios llegan con el sandbox de M14).`,
    '',
    '## Contenido',
    ...docs.map((d) => `- ${d}`),
    '',
    '## Re-instalación',
    '1. Los documentos de `specs/` van a `data/specs/` reutilizando `POST /api/console/specs` (o blueprint install: `validate-all-then-write`, idempotente por id@version).',
    '2. Los documentos de `artifacts/` van al almacén de artefactos vía `POST /api/console/engineering/generate` con el mismo documento (reutilización por hash).',
    '3. Los documentos de `projects/` viajan a través de `POST /api/console/engineering/projects` (validación UES completa previa a la escritura).',
    '4. Re-ejecutar 1–3 es SEGURO: los upserts son idempotentes (id@version con contenido idéntico se reutiliza; el conflicto de contenido distinto falla cerrado con 409).',
    '',
    '## Seguridad',
    '- Sin ejecución de código; los bundles son documentos declarativos.',
    '- Sin secretos: la procedencia guarda hashes y referencias, nunca valores de entrada.',
    '',
  ].join('\n');
}

function sanitizeFilename(raw: string): string {
  const slug = raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9@._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 120);
  return slug.length >= 3 ? slug : 'export';
}

/** Anota el documento exportado en el mapa del bundle. */
function putDoc(docs: Record<string, unknown>, keyPath: string, doc: unknown): void {
  if (doc && typeof doc === 'object') {
    docs[keyPath] = doc;
  }
}

async function specVersionDoc(id: string, version: string | undefined): Promise<unknown | null> {
  if (version) {
    const all = await listSpecVersions(id);
    return all.find((d) => d.metadata?.version === version) ?? null;
  }
  return getLatestSpec(id);
}

export async function buildArtifactExport(kind: string, id: string, version?: string): Promise<ExportResult | ExportError> {
  if (!isEngineeringArtifactKind(kind)) {
    return { ok: false, status: 404, reason: "el kind no es un artefacto de ingeniería (los specs de runtime se exportan vía exportProject)" };
  }
  let doc: Record<string, unknown> | null = version ? await getArtifactVersion(kind, id, version) : await getLatestArtifact(kind, id);
  if (!doc) {
    return { ok: false, status: 404, reason: version ? `artefacto '${id}@${version}' inexistente` : `artefacto '${id}' inexistente` };
  }
  const meta = (doc as { metadata?: { version?: string } }).metadata;
  const realVersion = meta?.version ?? version ?? '';
  const lifecycle = await getArtifactLifecycle(kind, id);
  const docs: Record<string, unknown> = {};
  putDoc(docs, `artifacts/${kind}/${id}@${realVersion}.json`, doc);
  const bundle: ExportBundle = {
    export: {
      format: EXPORT_FORMAT,
      createdAt: new Date().toISOString(),
      generator: { id: 'uiep-export-service', version: '1.0.0' },
      subject: { kind, id, version: realVersion },
    },
    documents: docs,
    readme: readmeFor(`artefacto ${kind} '${id}@${realVersion}'` + (lifecycle ? ` (estado de vida: ${lifecycle.state})` : ''), Object.keys(docs)),
  };
  return finalize(bundle, `${kind}-${id}@${realVersion}.export.json`);
}

export async function buildGenerationExport(generationId: string): Promise<ExportResult | ExportError> {
  const record = await getGenerationRecord(generationId);
  if (!record) {
    return { ok: false, status: 404, reason: 'generation_not_found' };
  }
  const docs: Record<string, unknown> = {};
  putDoc(docs, 'generation.json', record);
  const outcomes = [
    ...(record.outcome ? [record.outcome] : []),
    ...(record.extraOutcomes ?? []),
  ];
  for (const oc of outcomes) {
    if (oc.store === 'engineering') {
      const doc = await getArtifactVersion(oc.artifactKind, oc.id, oc.version);
      putDoc(docs, `artifacts/${oc.artifactKind}/${oc.id}@${oc.version}.json`, doc);
    } else {
      const spec = (await listSpecVersions(oc.id)).find((d) => d.metadata?.version === oc.version) ?? (await getLatestSpec(oc.id));
      putDoc(docs, `specs/${oc.id}@${(spec as { metadata?: { version?: string } } | null)?.metadata?.version ?? oc.version}.json`, spec);
    }
  }
  const bundle: ExportBundle = {
    export: {
      format: EXPORT_FORMAT,
      createdAt: new Date().toISOString(),
      generator: { id: 'uiep-export-service', version: '1.0.0' },
      subject: { generationId },
    },
    documents: docs,
    readme: readmeFor('generación ' + generationId, Object.keys(docs)),
  };
  return finalize(bundle, `generacion-${generationId}.export.json`);
}

export async function buildProjectExport(projectId: string, version?: string): Promise<ExportResult | ExportError> {
  const versions = await listProjectVersions(projectId);
  const doc = version ? (versions.find((d) => d.metadata.version === version) ?? null) : await getLatestProject(projectId);
  if (!doc) {
    return { ok: false, status: 404, reason: version ? `proyecto '${projectId}@${version}' inexistente` : `proyecto '${projectId}' inexistente` };
  }
  const realVersion = doc.metadata.version;
  const lifecycle = await getLifecycle(projectId);
  const docs: Record<string, unknown> = {};
  putDoc(docs, `projects/${projectId}@${realVersion}.json`, doc);
  for (const a of doc.artifacts) {
    if (!a.specRef) {
      continue;
    }
    if (isEngineeringArtifactKind(a.specRef.kind)) {
      const artifact = a.specRef.version ? await getArtifactVersion(a.specRef.kind, a.specRef.id, a.specRef.version) : await getLatestArtifact(a.specRef.kind, a.specRef.id);
      const v = (artifact as { metadata?: { version?: string } } | null)?.metadata?.version ?? a.specRef.version ?? '';
      putDoc(docs, `artifacts/${a.specRef.kind}/${a.specRef.id}@${v || 'desconocida'}.json`, artifact);
    } else {
      const spec = await specVersionDoc(a.specRef.id, a.specRef.version);
      const v = (spec as { metadata?: { version?: string } } | null)?.metadata?.version ?? a.specRef.version ?? '';
      putDoc(docs, `specs/${a.specRef.id}@${v || 'desconocida'}.json`, spec);
    }
  }
  const bundle: ExportBundle = {
    export: {
      format: EXPORT_FORMAT,
      createdAt: new Date().toISOString(),
      generator: { id: 'uiep-export-service', version: '1.0.0' },
      subject: { project: projectId, version: realVersion },
    },
    documents: docs,
    readme: readmeFor(`proyecto '${projectId}@${realVersion}'` + (lifecycle ? ` (estado de vida: ${lifecycle.state})` : ''), Object.keys(docs)),
  };
  return finalize(bundle, `proyecto-${projectId}@${realVersion}.export.json`);
}

function finalize(bundle: ExportBundle, filenameRaw: string): ExportResult {
  const filename = sanitizeFilename(filenameRaw);
  const json = JSON.stringify(bundle, null, 2);
  return {
    ok: true,
    format: EXPORT_FORMAT,
    filename,
    documents: Object.keys(bundle.documents),
    sizeBytes: Buffer.byteLength(json, 'utf8'),
    sha256: sha256Hex(json),
    bundle,
  };
}

/** Genera el ZIP del bundle (STORED sin compresión, sin dependencias): los
 *  documentos + README + manifest con hashes. Determinista. Los SourceProject
 *  se EXPANDEN: sus files van como ficheros planos (proyecto listo para build). */
export function bundleToZip(result: ExportResult): Buffer {
  const entries: Array<{ path: string; content: string }> = [];
  for (const [p, doc] of Object.entries(result.bundle.documents)) {
    entries.push({ path: p, content: JSON.stringify(doc, null, 2) });
    const spec = (doc as { spec?: { files?: Record<string, string>; runtime?: string } }).spec;
    if (spec?.files && spec.runtime === 'node-express') {
      for (const [fp, content] of Object.entries(spec.files)) {
        entries.push({ path: `codigo/${fp}`, content });
      }
    }
  }
  entries.push({ path: 'README.md', content: result.bundle.readme });
  entries.push({
    path: 'manifest.json',
    content: JSON.stringify({ format: result.format, subject: result.bundle.export.subject, sha256: result.sha256, files: entries.map((e) => e.path) }, null, 2),
  });
  return buildZip(entries);
}

/** Escribe el bundle a data/engineering/exports/ (atómico; el contenido del
 *  fichero es el MISMO que se devuelve, con hashes sobre el JSON canónico). */
export async function writeExportFile(result: ExportResult): Promise<void> {
  await fs.mkdir(EXPORTS_DIR, { recursive: true });
  const file = path.join(EXPORTS_DIR, result.filename);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(result.bundle, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

/** Lee un bundle exportado (por nombre saneado) para su descarga vía BFF. */
export async function readExportFile(filename: string): Promise<{ ok: true; bundle: unknown; zip?: Buffer } | { ok: false; status: 404; reason: string }> {
  if (/^[a-z0-9@._-]{3,140}\.zip$/.test(filename)) {
    try {
      const buf = await fs.readFile(path.join(EXPORTS_DIR, filename));
      return { ok: true, bundle: { zipBytes: buf.length }, zip: buf };
    } catch {
      return { ok: false, status: 404, reason: 'export_no_encontrado' };
    }
  }
  if (!/^[a-z0-9@._-]{3,140}$/.test(filename) || !filename.endsWith('.export.json')) {
    return { ok: false, status: 404, reason: 'filename_invalido' };
  }
  try {
    const raw = await fs.readFile(path.join(EXPORTS_DIR, filename), 'utf8');
    return { ok: true, bundle: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 404, reason: 'export_no_encontrado' };
  }
}

/** Escribe el ZIP del bundle (uiep-export-v1 comprimido STORED). */
export async function writeZipFile(result: ExportResult): Promise<string> {
  const zipName = result.filename.replace(/\.export\.json$/, '.zip');
  await fs.mkdir(EXPORTS_DIR, { recursive: true });
  await fs.writeFile(path.join(EXPORTS_DIR, zipName), bundleToZip(result));
  return zipName;
}

/** Lista los ficheros de export generados (nombre, tamaños, hash). */
export async function listExportFiles(): Promise<Array<{ filename: string; sizeBytes: number; createdAt: string }>> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(EXPORTS_DIR)).filter((f) => f.endsWith('.export.json') || f.endsWith('.zip'));
  } catch {
    return [];
  }
  const out: Array<{ filename: string; sizeBytes: number; createdAt: string }> = [];
  for (const f of files) {
    try {
      const file = path.join(EXPORTS_DIR, f);
      const raw = await fs.readFile(file, 'utf8');
      const bundle = JSON.parse(raw) as { export?: { createdAt?: string } };
      out.push({ filename: f, sizeBytes: Buffer.byteLength(raw, 'utf8'), createdAt: bundle.export?.createdAt ?? '' });
    } catch {
      /* corrupto: ignorar */
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
