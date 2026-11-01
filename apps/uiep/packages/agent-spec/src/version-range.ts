/**
 * Rangos de versión mínimos (Misión 11) — sin dependencias nuevas.
 * Soporta: indefinido/''/'*' (cualquiera), '1.2.3' (exacto), '^1.2.3'
 * (>=1.2.3 <2.0.0) y '~1.2.3' (>=1.2.3 <1.3.0). CUALQUIER rango inválido
 * o versión malformada devuelve false (fail-closed).
 */

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function parseSemVer(v: string): [number, number, number] | null {
  const m = SEMVER_RE.exec(v);
  if (!m) {
    return null;
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a: [number, number, number], b: [number, number, number]): number {
  return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);
}

export function satisfiesRange(version: string, range: string | undefined | null): boolean {
  if (range === undefined || range === null || range.trim() === '' || range.trim() === '*') {
    return true;
  }
  const v = parseSemVer(version);
  if (!v) {
    return false;
  }
  const raw = range.trim();
  let mode: 'exact' | 'caret' | 'tilde' = 'exact';
  let target = raw;
  if (raw.startsWith('^')) {
    mode = 'caret';
    target = raw.slice(1);
  } else if (raw.startsWith('~')) {
    mode = 'tilde';
    target = raw.slice(1);
  }
  const t = parseSemVer(target);
  if (!t) {
    return false; // rango inválido → no compatible (fail-closed)
  }
  const cmp = compareSemver(v, t);
  if (cmp < 0) {
    return false;
  }
  if (mode === 'exact') {
    return cmp === 0;
  }
  if (mode === 'caret') {
    return v[0] === t[0];
  }
  return v[0] === t[0] && v[1] === t[1]; // tilde
}
