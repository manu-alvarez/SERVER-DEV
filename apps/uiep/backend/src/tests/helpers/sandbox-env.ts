import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import http from 'node:http';
import './test-env';
import './sandbox-env-setup';
import { createApp } from '../../app';

/**
 * Helper M14 — arranca el SANDBOX REAL (proceso hijo: apps/uiep/sandbox/server.mjs)
 * y el backend in-process, y exporta las bases para las pruebas.
 *
 * Debe importarse PRIMERO (sandbox-env-setup fija el env ANTES de cargar la
 * app). El sandbox corre como proceso REAL y aislado (no in-process) para
 * probar el contrato HTTP, la autenticación por token y la cancelación.
 */

const backend = createApp({ trustProxy: 'loopback' }).listen(0);
const backendBase = `http://127.0.0.1:${(backend.address() as { port: number }).port}`;

const SANDBOX_PORT = '4177';
const child: ChildProcess = spawn(process.execPath, [path.resolve(__dirname, '../../../../sandbox/server.mjs')], {
  env: {
    ...process.env,
    PORT: SANDBOX_PORT,
    SANDBOX_EXEC_TOKEN: process.env.SANDBOX_EXEC_TOKEN,
    UIEP_BACKEND_URL: backendBase,
    UIEP_RUNNER_TOKEN: process.env.UIEP_RUNNER_TOKEN,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.on('error', (e) => console.error('[sandbox-child] error', e));

export const sandboxBase = `http://127.0.0.1:${SANDBOX_PORT}`;
export { backendBase };

export async function waitForSandbox(timeoutMs = 10_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((resolve) => {
      const req = http.get(`${sandboxBase}/v1/health`, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(500, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

export async function stopAll(): Promise<void> {
  child.kill('SIGTERM');
  await new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
    setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 1500);
  });
  await new Promise<void>((resolve) => backend.close(() => resolve()));
}
