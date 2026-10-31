import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import './helpers/test-env';
import { API_VERSION } from '@uiep/agent-spec';
import { saveSpec } from '../services/spec-registry.service';

/**
 * Fase 4.2 — rate-limit del login de consola (anti fuerza bruta, por IP).
 *
 * El limiter se instancia al registrar la ruta (createApp): el env se fija
 * ANTES del import dinámico de la app para acotar la ventana de prueba.
 */

const CONSOLE_PASSWORD = ['console', 'password-rate-limit-0002'].join('-');

let server: Server | null = null;
let base = '';

before(async () => {
  process.env.LOGIN_RATE_LIMIT_MAX = '3';
  process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.UIEP_CONSOLE_PASSWORD = CONSOLE_PASSWORD;
  process.env.UIEP_RUNTIME_TOKEN = 'runtime-token-solo-servidor-02';
  await saveSpec({
    apiVersion: API_VERSION,
    kind: 'ModelProfile',
    metadata: { id: 'mock-profile', name: 'Perfil mock', version: '1.0.0' },
    spec: { provider: 'ollama', model: 'mock-model', endpointEnv: 'OLLAMA_BASE_URL' },
  });
  const { createApp } = await import('../app');
  server = createApp({ trustProxy: 'loopback' }).listen(0);
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});

after(() => server?.close());

const login = async (password: string): Promise<Response> =>
  fetch(base + '/api/console/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });

test('rate-limit: los primeros intentos llegan al handler (401/200) y excedido → 429 con RateLimit-*', async () => {
  // Ventana nueva: 3 intentos permitidos (max=3), todos 401 (contraseña mala).
  const codes: number[] = [];
  for (let i = 0; i < 3; i += 1) {
    const r = await login('intento-equivocado-' + i);
    codes.push(r.status);
  }
  assert.deepEqual(codes, [401, 401, 401]);

  const blocked = await login('otro-intento-mas');
  assert.equal(blocked.status, 429, 'el 4º intento excede el límite');
  assert.ok(blocked.headers.get('ratelimit-limit'), 'headers estándar RateLimit-* presentes');
  const b: any = await blocked.json();
  assert.equal(b.error, 'too_many_attempts');

  // El bloqueo también alcanza al login CORRECTO (mismo bucket por IP): no
  // se filtra cuál contraseña es válida probando contraseñas.
  const correct = await login(CONSOLE_PASSWORD);
  assert.equal(correct.status, 429, 'ni el login correcto se cuela durante el bloqueo');
});

test('rate-limit: el bloqueo del login NO afecta a otros endpoints de consola', async () => {
  // Sin cookie → 401 del guard (no 429): el limiter solo cubre el login.
  const r = await fetch(base + '/api/console/overview');
  assert.equal(r.status, 401);
  assert.notEqual(r.status, 429);
});
