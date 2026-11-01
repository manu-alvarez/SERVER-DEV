import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { waitForSandbox, stopAll } from './helpers/sandbox-env';
import './helpers/sandbox-port-4185';
import { seedDefaultModelProfile } from '../services/model-gateway.service';
import { seedDefaultToolSpecs } from '../services/tool-registry.service';
import { startRuntimeMock } from './helpers/runtime-mock';
import type { Server as HttpServer } from 'node:http';
import {
  createUser,
  verifyUser,
  listUsers,
  deleteUser,
  signUserToken,
  verifyUserToken,
  permissionsOf,
  filterByTenant,
  PLATFORM_TENANT,
} from '../services/iam.service';
import { deploy, stopDeployment, rollbackDeployment, healthCheck, listDeployments, invokeDeployment } from '../services/deployment-engine.service';
import { runGeneration, type GenerationResponse, sha256Hex } from '../services/engineering-generator.service';
import { getLatestArtifact } from '../services/engineering-registry.service';
import { crc32, buildZip } from '../services/zip.service';

/**
 * Misión FINAL — cierre de plataforma:
 * · IAM: usuarios/tenants/roles con aislamiento VERIFICADO (un tenant no ve
 *   recursos de otro), permisos granulares, sesiones firmadas.
 * · Deployment Engine: deploy/stop/health/rollback sobre el sandbox runtime.
 * · Generador de código fuente determinista (SourceProject node-express).
 * · ZIP de export sin dependencias (CRC32 + estructura válida).
 */

let MOCK: { server: HttpServer; url: string } | null = null;

before(async () => {
  assert.equal(await seedDefaultModelProfile(), 'seeded');
  assert.equal(await seedDefaultToolSpecs(), 'seeded');
  MOCK = await startRuntimeMock();
  process.env.OLLAMA_BASE_URL = MOCK.url;
  assert.equal(await waitForSandbox(), true);
});

after(async () => {
  await stopAll();
  MOCK?.server.close();
});

const okOf = (r: GenerationResponse): Extract<GenerationResponse, { ok: true }> => {
  assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
  return r;
};

/* ── IAM: identidad, tenants y aislamiento ──────────────────────────────── */

test('IAM: crear usuarios (validación incluida), login, sesión firmada y permisos', async () => {
  const weak = await createUser({ username: 'weak-user', password: 'corta', tenantId: 'tenant-a', role: 'operator' }, 'test');
  assert.equal(weak.ok, false);
  if (!weak.ok) {
    assert.match(weak.reason, /password/);
  }
  const a = await createUser({ username: 'op-tenant-a', password: 'contraseña-larga-m16', tenantId: 'tenant-a', role: 'operator' }, 'test');
  assert.equal(a.ok, true, JSON.stringify(a));
  const dup = await createUser({ username: 'op-tenant-a', password: 'contraseña-larga-m16', tenantId: 'tenant-a', role: 'operator' }, 'test');
  assert.equal(dup.ok, false);
  if (!dup.ok) {
    assert.equal(dup.status, 409);
  }
  const b = await createUser({ username: 'op-tenant-b', password: 'contraseña-larga-m16', tenantId: 'tenant-b', role: 'viewer' }, 'test');
  assert.equal(b.ok, true);
  // Login correcto / incorrecto.
  assert.equal(verifyUser('op-tenant-a', 'contraseña-larga-m16').ok, true);
  assert.equal(verifyUser('op-tenant-a', 'OTRA').ok, false);
  // Sesión firmada: válida → principal; manipulada → null.
  if (a.ok) {
    const token = signUserToken({ id: 'usr-op-tenant-a', username: 'op-tenant-a', tenantId: 'tenant-a', role: 'operator' });
    const principal = verifyUserToken(token);
    assert.ok(principal);
    assert.equal(principal?.tenantId, 'tenant-a');
    assert.equal(verifyUserToken(token + 'x'), null);
    assert.equal(verifyUserToken('garbage.token'), null);
  }
  // Matriz de permisos granulares.
  const viewerPerms = permissionsOf({ id: 'x', username: 'op-tenant-b', tenantId: 'tenant-b', role: 'viewer', via: 'user-session' });
  assert.equal(viewerPerms.includes('engineering:write'), false);
  assert.equal(viewerPerms.includes('engineering:read'), true);
  const operatorPerms = permissionsOf({ id: 'x', username: 'op-tenant-a', tenantId: 'tenant-a', role: 'operator', via: 'user-session' });
  assert.equal(operatorPerms.includes('executions:run'), true);
  assert.equal(operatorPerms.includes('iam:manage'), false, 'solo el admin gestiona IAM');
  // Listado y borrado.
  assert.ok((await listUsers()).length >= 2);
  assert.equal((await deleteUser('op-tenant-b', 'test')).ok, true);
});

test('AISLAMIENTO DE TENANTS: los recursos de un tenant son invisibles para otro', () => {
  // Registros con tenant (como los graba el backend según el principal).
  const recursos = [
    { name: 'platform-resource', tenantId: undefined },
    { name: 'de-tenant-a', tenantId: 'tenant-a' },
    { name: 'de-tenant-b', tenantId: 'tenant-b' },
  ];
  const userA = { id: 'x', username: 'op-tenant-a', tenantId: 'tenant-a', role: 'operator' as const, via: 'user-session' as const };
  const userB = { id: 'y', username: 'op-tenant-b', tenantId: 'tenant-b', role: 'viewer' as const, via: 'user-session' as const };
  const admin = { id: 'z', username: 'platform-admin', tenantId: PLATFORM_TENANT, role: 'admin' as const, via: 'console-admin' as const };
  const visibleA = filterByTenant(userA, recursos);
  assert.deepEqual(visibleA.map((r) => r.name).sort(), ['de-tenant-a', 'platform-resource'], 'A ve lo suyo + plataforma, NO lo de B');
  const visibleB = filterByTenant(userB, recursos);
  assert.deepEqual(visibleB.map((r) => r.name).sort(), ['de-tenant-b', 'platform-resource']);
  assert.equal(filterByTenant(admin, recursos).length, 3, 'el admin lo ve todo');
});

/* ── Deployment Engine ───────────────────────────────────────────────────── */

test('Deployment Engine: deploy/health/invoke/stop + rollback a versión anterior', async () => {
  const seed = okOf(await runGeneration('agent', { name: 'M14 Agente API', role: 'demo', objective: 'o', system: 's', memory: { enabled: false, strategy: 'none' } }));
  const agentId = (seed.outcome as { id: string }).id;
  const input = { name: 'M17 App Despliegues', agents: [{ agent: agentId, role: 'núcleo' }], surfaces: [{ type: 'console' }] };
  okOf(await runGeneration('agentic-app', input)); // v1.0.0
  const appId = 'm17-app-despliegues';
  const admin = { id: 'z', username: 'platform-admin', tenantId: PLATFORM_TENANT, role: 'admin' as const, via: 'console-admin' as const };

  const d1 = await deploy({ deploymentId: 'dep-m17-demo', kind: 'AgenticApp', id: appId }, admin);
  assert.equal(d1.ok, true, JSON.stringify(d1));
  // Idempotente (mismo artefacto+versión → mismo deployment sin duplicar versiones).
  const d2 = await deploy({ deploymentId: 'dep-m17-demo', kind: 'AgenticApp', id: appId }, admin);
  if (d2.ok) {
    assert.equal(d2.deployment.versions.length, 1, 'deploy idempotente no duplica versiones');
  }
  // Health real (sandbox vivo + artefacto resoluble).
  const h = await healthCheck('dep-m17-demo');
  assert.equal(h.ok, true, h.detail);
  // Invoke: ejecución REAL con trazabilidad del deployment.
  const inv = await invokeDeployment('dep-m17-demo', { input: 'turno contra el deployment', timeoutMs: 120000 });
  assert.equal(inv.ok, true, JSON.stringify(inv).slice(0, 200));
  // Nueva versión del artefacto → redeploy acumula historial → rollback vuelve.
  okOf(await runGeneration('agentic-app', { ...input, description: 'v1.0.1 con nota distinta', version: '1.0.1', onConflict: 'bump' as const }));
  const d3 = await deploy({ deploymentId: 'dep-m17-demo', kind: 'AgenticApp', id: appId }, admin);
  if (d3.ok) {
    assert.equal(d3.deployment.artifact.version, '1.0.1');
    assert.equal(d3.deployment.versions.length, 2);
  }
  const rb = await rollbackDeployment('dep-m17-demo', admin);
  assert.equal(rb.ok, true, JSON.stringify(rb).slice(0, 200));
  if (rb.ok) {
    assert.equal(rb.deployment.artifact.version, '1.0.0', 'rollback → versión anterior');
  }
  // Stop + desplegar algo parado → 400 honesto.
  const stop = await stopDeployment('dep-m17-demo', admin);
  assert.equal(stop.ok, true);
  const invStopped = await invokeDeployment('dep-m17-demo', { input: 'x' });
  assert.equal(invStopped.ok, false);
  // Aislamiento: los deployments 'platform' son VISIBLES a todos (por diseño);
  // los de un tenant NO se ven desde otro tenant.
  const userA = { id: 'x', username: 'op-tenant-a', tenantId: 'tenant-a', role: 'operator' as const, via: 'user-session' as const };
  const userB = { id: 'y', username: 'op-tenant-b', tenantId: 'tenant-b', role: 'viewer' as const, via: 'user-session' as const };
  // Deployment creado POR userA → tenant-a; invisible para B.
  const dTenant = await deploy({ deploymentId: 'dep-m17-tenant-a', kind: 'AgenticApp', id: appId }, userA);
  assert.equal(dTenant.ok, true, JSON.stringify(dTenant).slice(0, 200));
  if (dTenant.ok) {
    assert.equal(dTenant.deployment.tenantId, 'tenant-a', 'el deployment hereda el tenant del usuario');
  }
  const visibleParaB = await listDeployments(userB);
  assert.equal(visibleParaB.some((d) => d.deploymentId === 'dep-m17-tenant-a'), false, 'B NO ve los deployments de tenant-a');
  const visibleParaA = await listDeployments(userA);
  assert.equal(visibleParaA.some((d) => d.deploymentId === 'dep-m17-tenant-a'), true, 'A ve los suyos');
  assert.ok((await listDeployments(userA)).every((d) => d.tenantId !== 'tenant-b'));
});

/* ── Generador de código fuente determinista ────────────────────────────── */

test('SourceProject: Node/Express determinista desde ApiPlatform (hash estable, deps pinneadas, NO ejecutado)', async () => {
  okOf(await runGeneration('api-platform', {
    id: 'm17-api-fuente',
    name: 'M17 API Fuente',
    endpoints: [
      { id: 'hola', method: 'GET' as const, path: '/api/hola', summary: 'saludo' },
      { id: 'crear', method: 'POST' as const, path: '/api/hola', summary: 'crea', request: [{ name: 'nombre', type: 'string', constraints: [{ kind: 'maxLength', value: 20 }] }] },
    ],
  }));
  const input = { apiId: 'm17-api-fuente', version: '1.0.0' };
  const r1 = okOf(await runGeneration('source-project', input));
  assert.equal((r1.outcome as { artifactKind?: string }).artifactKind, 'SourceProject');
  const doc1 = await getLatestArtifact('SourceProject', 'src-m17-api-fuente');
  const files1 = (doc1?.spec as { files: Record<string, string>; contentHash: string }).files;
  assert.ok(files1['server.js']);
  assert.ok(files1['package.json']);
  const pkg = JSON.parse(files1['package.json']) as { dependencies: { express: string } };
  assert.match(pkg.dependencies.express, /^\d+\.\d+\.\d+$/, 'dependencia PINNEADA (builds reproducibles)');
  assert.ok(files1['server.js'].includes("app.get('/api/hola'"));
  assert.ok(files1['server.js'].includes("app.post('/api/hola'"));
  assert.ok(files1['server.js'].includes('422'));
  // Determinismo: mismo contrato → mismo contentHash; re-run → reused.
  const r2 = okOf(await runGeneration('source-project', input));
  assert.equal(r2.reused, true);
  const doc2 = await getLatestArtifact('SourceProject', 'src-m17-api-fuente');
  assert.equal((doc2?.spec as { contentHash: string }).contentHash, (doc1?.spec as { contentHash: string }).contentHash);
  // Contrato inexistente → 400 fail-closed.
  const bad = await runGeneration('source-project', { apiId: 'no-existe' });
  assert.equal(bad.ok, false);
});

/* ── ZIP de export sin dependencias ─────────────────────────────────────── */

test('ZIP: CRC32 con vector conocido + estructura PK válida', async () => {
  // Vector oficial CRC-32/ISO-HDLC.
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  const zip = buildZip([
    { path: 'a.json', content: '{"x":1}' },
    { path: 'dir/b.txt', content: 'contenido de prueba' },
  ]);
  // Firma local + EOCD.
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  assert.equal(zip[zip.length - 22], 0x50, 'EOCD signature empieza en los últimos 22 bytes');
  assert.equal(zip[zip.length - 21], 0x4b);
  // Los nombres de fichero van dentro (sin compresión → legible en claro).
  assert.ok(zip.includes(Buffer.from('a.json')));
  assert.ok(zip.includes(Buffer.from('contenido de prueba')));
  assert.ok(zip.length > 100);
  // Integración: export del artefacto generado aquí con formato zip → .zip real.
  const exp = await (await import('../services/engineering-export.service')).buildArtifactExport('SourceProject', 'src-m17-api-fuente');
  assert.equal(exp.ok, true, JSON.stringify(exp).slice(0, 200));
  if (exp.ok) {
    const { writeZipFile } = await import('../services/engineering-export.service');
    const zipName = await writeZipFile(exp);
    assert.match(zipName, /\.zip$/);
    const { readExportFile } = await import('../services/engineering-export.service');
    const read = await readExportFile(zipName);
    assert.equal(read.ok, true);
    if (read.ok) {
      assert.ok(read.zip && read.zip.length > 200);
      assert.equal(read.zip.readUInt32LE(0), 0x04034b50);
    }
  }
});
