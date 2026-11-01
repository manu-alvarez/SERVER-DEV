import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { audit } from './observability.service';

/**
 * IAM (Misión FINAL) — identidad, tenants y autorización granular v1.
 *
 * · Usuarios: id + tenant + rol + contraseña (scrypt + salt). El ADMIN de
 *   plataforma (UIEP_CONSOLE_PASSWORD) los gestiona — el admin raíz NUNCA
 *   se persiste aquí.
 * · Tenants: separación LÓGICA de recursos por tenantId. Los recursos
 *   'platform' (los creados antes del IAM y los del admin) son visibles a
 *   todos los usuarios autenticados; los de un tenant SOLO a sus miembros.
 * · Roles → permisos granulares (matriz fija, sin UI para permisos: menor
 *   superficie). Autorización en TODA ruta de ingeniería vía authz().
 *
 * Persistencia: JSON atómico (tmp+rename) — evaluación M17: el volumen y la
 * concurrencia actuales no justifican migrar a SQL; los writes atómicos y la
 * serialización por mutex del registry son suficientes (decisión registrada
 * en docs/UIEP-DECISIONES.md).
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const IAM_FILE = path.join(DATA_DIR, 'iam', 'users.json');

export type IamRole = 'admin' | 'operator' | 'viewer';

export interface IamUser {
  id: string;
  username: string;
  tenantId: string;
  role: IamRole;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

export type IamPermission =
  | 'engineering:read'
  | 'engineering:write'
  | 'executions:run'
  | 'executions:cancel'
  | 'deployments:manage'
  | 'iam:manage';

const ROLE_PERMISSIONS: Record<IamRole, IamPermission[]> = {
  admin: ['engineering:read', 'engineering:write', 'executions:run', 'executions:cancel', 'deployments:manage', 'iam:manage'],
  operator: ['engineering:read', 'engineering:write', 'executions:run', 'executions:cancel', 'deployments:manage'],
  viewer: ['engineering:read'],
};

export const PLATFORM_TENANT = 'platform';

let mutex: Promise<unknown> = Promise.resolve();

async function readUsers(): Promise<IamUser[]> {
  try {
    const raw = JSON.parse(await fs.readFile(IAM_FILE, 'utf8')) as { users?: IamUser[] };
    return Array.isArray(raw.users) ? raw.users : [];
  } catch {
    return [];
  }
}

async function writeUsers(users: IamUser[]): Promise<void> {
  await fs.mkdir(path.dirname(IAM_FILE), { recursive: true });
  const tmp = `${IAM_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ users }, null, 2), 'utf8');
  await fs.rename(tmp, IAM_FILE);
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

const USER_ID_RE = /^[a-z0-9][a-z0-9-]{2,31}$/;
const TENANT_ID_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

/** Crea un usuario (solo admin de plataforma). Sin lanzar. */
export async function createUser(input: { username: string; password: string; tenantId: string; role: IamRole }, actor: string): Promise<{ ok: true; user: Pick<IamUser, 'id' | 'username' | 'tenantId' | 'role' | 'createdAt'> } | { ok: false; status: 400 | 409; reason: string }> {
  const username = input.username.trim().toLowerCase();
  const tenantId = input.tenantId.trim().toLowerCase();
  if (!USER_ID_RE.test(username)) {
    return { ok: false, status: 400, reason: 'username_inválido (slug 3-32)' };
  }
  if (!TENANT_ID_RE.test(tenantId)) {
    return { ok: false, status: 400, reason: 'tenantId_inválido (slug 2-32)' };
  }
  if (!ROLE_PERMISSIONS[input.role]) {
    return { ok: false, status: 400, reason: 'rol_inválido' };
  }
  if (typeof input.password !== 'string' || input.password.length < 10) {
    return { ok: false, status: 400, reason: 'password_debe_tener_10+_caracteres' };
  }
  const run = mutex.then(async () => {
    const users = await readUsers();
    if (users.some((u) => u.username === username)) {
      return { ok: false as const, status: 409 as const, reason: 'username_ya_existe' };
    }
    const salt = randomBytes(16).toString('hex');
    const user: IamUser = {
      id: `usr-${username}`,
      username,
      tenantId,
      role: input.role,
      passwordSalt: salt,
      passwordHash: hashPassword(input.password, salt),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await writeUsers(users);
    audit({ actor: { kind: 'console' }, action: 'iam.user.create', correlation: { targetId: username }, detail: { tenant: tenantId, role: input.role, via: actor } });
    const { passwordHash: _ph, passwordSalt: _ps, ...pub } = user;
    return { ok: true as const, user: pub };
  });
  mutex = run.catch(() => undefined);
  return run;
}

export async function listUsers(): Promise<Array<Pick<IamUser, 'id' | 'username' | 'tenantId' | 'role' | 'createdAt'>>> {
  return (await readUsers()).map(({ passwordHash: _ph, passwordSalt: _ps, ...pub }) => pub);
}

export async function deleteUser(username: string, actor: string): Promise<{ ok: boolean; reason?: string }> {
  const run = mutex.then(async () => {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.username === username);
    if (idx < 0) {
      return { ok: false, reason: 'usuario_no_encontrado' };
    }
    users.splice(idx, 1);
    await writeUsers(users);
    audit({ actor: { kind: 'console' }, action: 'iam.user.delete', correlation: { targetId: username }, detail: { via: actor } });
    return { ok: true };
  });
  mutex = run.catch(() => undefined);
  return run;
}

/** Verifica credenciales y devuelve el perfil público del usuario. */
export function verifyUser(username: string, password: string): { ok: true; user: Pick<IamUser, 'id' | 'username' | 'tenantId' | 'role'> } | { ok: false } {
  // Síncrono por diseño (scrypt sobre un único fichero pequeño, usuario por login).
  let users: IamUser[] = [];
  try {
    users = (JSON.parse(readFileSync(IAM_FILE, 'utf8')).users ?? []) as IamUser[];
  } catch {
    users = [];
  }
  const user = users.find((u) => u.username === username.trim().toLowerCase());
  if (!user) {
    return { ok: false };
  }
  const given = Buffer.from(hashPassword(password, user.passwordSalt));
  const expected = Buffer.from(user.passwordHash);
  if (!timingSafeEqual(given, expected)) {
    return { ok: false };
  }
  return { ok: true, user: { id: user.id, username: user.username, tenantId: user.tenantId, role: user.role } };
}

/* ── Sesión de USUARIO (cookie firmada separada de la de consola) ────────── */

const USER_COOKIE = 'uiep_user';
const USER_SESSION_SECRET = () => process.env.UIEP_SESSION_SECRET || process.env.UIEP_CONSOLE_PASSWORD || '';

export function signUserToken(user: Pick<IamUser, 'id' | 'username' | 'tenantId' | 'role'>, ttlMs = 8 * 3600_000): string {
  const payload = { ...user, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', USER_SESSION_SECRET()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export type UserPrincipal = { id: string; username: string; tenantId: string; role: IamRole; via: 'user-session' | 'console-admin' };

/** Verifica el token de usuario (HMAC + expiración). */
export function verifyUserToken(token: string): UserPrincipal | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) {
    return null;
  }
  const expected = createHmac('sha256', USER_SESSION_SECRET()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { exp?: number; id: string; username: string; tenantId: string; role: IamRole };
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return { id: payload.id, username: payload.username, tenantId: payload.tenantId, role: payload.role, via: 'user-session' };
  } catch {
    return null;
  }
}

export const USER_COOKIE_NAME = USER_COOKIE;

/* ── Autorización por recurso ────────────────────────────────────────────── */

export function permissionsOf(principal: UserPrincipal): IamPermission[] {
  if (principal.via === 'console-admin') {
    return ROLE_PERMISSIONS.admin;
  }
  return ROLE_PERMISSIONS[principal.role] ?? [];
}

/** ¿Puede el principal VER un recurso del tenant dado? */
export function canSeeTenant(principal: UserPrincipal, resourceTenant: string | undefined): boolean {
  const tenant = resourceTenant || PLATFORM_TENANT;
  if (tenant === PLATFORM_TENANT) {
    return true; // los recursos de plataforma son visibles a todos los autenticados
  }
  return principal.tenantId === tenant || principal.role === 'admin';
}

/** Aislamiento: un usuario NUNCA ve recursos de otro tenant (salvo platform). */
export function filterByTenant<T extends { tenantId?: string }>(principal: UserPrincipal, items: T[]): T[] {
  return items.filter((r) => canSeeTenant(principal, r.tenantId));
}
