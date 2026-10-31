import { createServer, type Server } from 'node:http';

/**
 * Proveedor mock con estado para el runtime (Fase 3): /api/chat con llamadas de
 * herramientas y respuestas finales DETERMINISTAS controladas por marcadores
 * en el mensaje del usuario:
 *   [TOOL_CALL:<nombre>]     → el modelo declara esa llamada (declarada o no)
 *   [FAIL_PROVIDER]          → el proveedor responde 500
 * Sin marcador y con tools anunciadas → llama a la primera herramienta; tras un
 * resultado de herramienta → respuesta final 'MADE'; sin tools → 'PLAIN'.
 */
export function startRuntimeMock(): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/tags') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ models: [{ name: 'mock-model', capabilities: ['completion', 'tools'] }] }));
      return;
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        let body: { messages?: Array<{ role: string; content?: string }>; tools?: Array<{ function?: { name?: string } }> } = {};
        try {
          body = JSON.parse(raw);
        } catch {
          body = {};
        }
        const messages = body.messages ?? [];
        const last = messages[messages.length - 1];
        const match = /\[(LOOP_CALL|TOOL_CALL):([a-zA-Z0-9-]+)\]/.exec(
          messages.filter((m) => m.role === 'user').map((m) => m.content ?? '').join('\n'),
        );
        if (last && last.role === 'user' && (last.content ?? '').includes('[FAIL_PROVIDER]')) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'fail_provider' }));
          return;
        }
        const callResponse = (name: string) =>
          res.end(
            JSON.stringify({
              message: { role: 'assistant', content: '', tool_calls: [{ function: { name, arguments: {} } }] },
              done: true,
            }),
          );
        // LOOP_CALL: el modelo hace la misma llamada en EVERY iteración (límites del runtime).
        if (match && match[1] === 'LOOP_CALL') {
          callResponse(match[2]);
          return;
        }
        // TOOL_CALL: una única tentativa; tras un resultado de herramienta finaliza ('MADE').
        if (match && match[2] && last && last.role !== 'tool') {
          callResponse(match[2]);
          return;
        }
        if (last && last.role === 'tool') {
          res.end(JSON.stringify({ message: { role: 'assistant', content: 'MADE' }, done: true }));
          return;
        }
        if (body.tools && body.tools.length > 0) {
          callResponse(body.tools[0].function?.name ?? 'clock');
          return;
        }
        res.end(JSON.stringify({ message: { role: 'assistant', content: 'PLAIN' }, done: true }));
      });
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}
