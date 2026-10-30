import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app';

/**
 * Fase 0.2 — pruebas imprescindibles de proxy/IP y rate limiting.
 *
 * Las pruebas de comportamiento usan una instancia con regla de confianza
 * 'loopback' (equivalente local de "el peer del socket es un proxy confiable"):
 * el mecanismo es idéntico al de producción (req.ip = entrada más a la derecha
 * del XFF registrada por el proxy confiable), solo cambia la subred confiable.
 * El valor por defecto de producción se afirma en el primer test.
 */

// ── Test 0: la configuración de producción queda fijada por test ──
test('trust proxy de producción = subred msbross_net 172.20.0.0/16 (auditada)', () => {
  const app = createApp();
  assert.equal(app.get('trust proxy'), '172.20.0.0/16');
});

// ── Instancia de pruebas con loopback como proxy confiable ──
const server = createApp({ trustProxy: 'loopback' }).listen(0);
const port = (server.address() as AddressInfo).port;
const base = 'http://127.0.0.1:' + port;

after(() => server.close());

/** Captura stderr durante fn() (la validación de express-rate-limit escribe ahí). */
async function captureStdErr<T>(fn: () => Promise<T>): Promise<{ result: T; stderr: string }> {
  const chunks: string[] = [];
  const original = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    return { result: await fn(), stderr: chunks.join('') };
  } finally {
    process.stderr.write = original;
  }
}

const getWithIp = (path: string, ip: string) =>
  fetch(base + path, { headers: { 'x-forwarded-for': ip } });

// ── Prueba imprescindible 1 (y 3): petición vía proxy con XFF ──
test('proxy/IP: petición con X-Forwarded-For → 200, sin ERR_ERL (regresión salud)', async () => {
  const { result, stderr } = await captureStdErr(async () => {
    const res = await getWithIp('/api/health', '203.0.113.7');
    return { status: res.status, body: (await res.json()) as { service: string } };
  });
  assert.equal(result.status, 200, 'salud válida detrás del proxy');
  assert.equal(result.body.service, 'uiep-backend');
  assert.ok(!stderr.includes('ERR_ERL'), 'sin ERR_ERL_UNEXPECTED_X_FORWARDED_FOR en stderr');
});

// ── Prueba imprescindible 2: aislamiento del contador por IP de cliente ──
test('rate limit: dos IP de cliente distintas no comparten contador', async () => {
  const ipA = '198.51.100.1';
  // Agotar el cubo de A (200/min): las 200 primeras OK, la 201ª → 429.
  for (let i = 0; i < 200; i++) {
    const res = await getWithIp('/api/health', ipA);
    assert.equal(res.status, 200, 'peticiones ' + (i + 1) + ' de A dentro del límite');
  }
  const exhausted = await getWithIp('/api/health', ipA);
  assert.equal(exhausted.status, 429, 'límite agotado para A');
  assert.equal(exhausted.headers.get('ratelimit-remaining'), '0');

  // IP distinta → cubo propio fresco (si la clave fuera la IP del proxy, sería 429).
  const other = await getWithIp('/api/health', '203.0.113.9');
  assert.equal(other.status, 200, 'la IP B no hereda el cubo de A');
  assert.equal(other.headers.get('ratelimit-remaining'), '199', 'contador propio para B');

  // A permanece agotada: la clave sigue siendo la IP del cliente.
  const aAgain = await getWithIp('/api/health', ipA);
  assert.equal(aAgain.status, 429, 'el cubo de A sigue agotado');
});
