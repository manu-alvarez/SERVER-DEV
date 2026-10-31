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
  const failOnceSeen = new Set<string>(); // Fase 6: tokens [FAIL_ONCE:] ya vistos
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/tags') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ models: [{ name: 'mock-model', capabilities: ['completion', 'tools'] }] }));
      return;
    }
    // Fase 5.2 — embeddings mock DETERMINISTAS (6 dims, ortogonales por tema):
    // rojo/azul/verde/naranja/violeta/gris → cada documento del corpus tiene
    // su propia dirección; temas desconocidos caen en un bucket aparte.
    if (req.method === 'POST' && req.url === '/api/embed') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        let body: { input?: string | string[] } = {};
        try {
          body = JSON.parse(raw);
        } catch {
          body = {};
        }
        const inputs = Array.isArray(body.input) ? body.input : [body.input ?? ''];
        const vectorFor = (text: string): number[] => {
          const t = text.toLowerCase();
          const topics = ['rojo', 'azul', 'verde', 'naranja', 'violeta', 'gris'];
          const idx = topics.findIndex((k) => t.includes(k));
          const v = [0, 0, 0, 0, 0, 0];
          v[idx >= 0 ? idx : 5] = 1; // desconocido comparte bucket con 'gris'
          return v;
        };
        res.end(JSON.stringify({ model: 'mock-embed', embeddings: inputs.map(vectorFor) }));
      });
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
        const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
        const match = /\[(LOOP_CALL|TOOL_CALL):([a-zA-Z0-9-]+)\]/.exec(
          messages.filter((m) => m.role === 'user').map((m) => m.content ?? '').join('\n'),
        );
        if (last && last.role === 'user' && (last.content ?? '').includes('[FAIL_PROVIDER]')) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'fail_provider' }));
          return;
        }
        // Fase 6 — [FAIL_ONCE:<token>]: falla SOLO la primera vez (por token)
        // y después responde SAY → prueba de reintentos y REANUDACIÓN.
        const failOnceMatch = /FAIL_ONCE:([a-zA-Z0-9-]+)/.exec(
          messages.filter((m) => m.role === 'user').map((m) => m.content ?? '').join('\n'),
        );
        if (failOnceMatch && !failOnceSeen.has(failOnceMatch[1])) {
          failOnceSeen.add(failOnceMatch[1]);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: `fail_once_${failOnceMatch[1]}` }));
          return;
        }
        // [SAY:<texto>]: eco determinista SOLO sin contexto inyectado — el
        // backbone de los tests de flujo (transferencia entre nodos).
        const hasInjectedContext =
          systemMsg.includes('[Contexto de conocimiento recuperado') || systemMsg.includes('[Memoria del agente');
        const sayMatch = /\[SAY:([^\]]+)\]/.exec(
          messages.filter((m) => m.role === 'user').map((m) => m.content ?? '').join('\n'),
        );
        if (sayMatch && !hasInjectedContext && last && last.role === 'user') {
          res.end(JSON.stringify({ message: { role: 'assistant', content: sayMatch[1] }, done: true }));
          return;
        }
        const callResponse = (name: string) => {
          // memory-write con args VÁLIDOS: así el flujo auto-mock llega a la
          // POLÍTICA de memoria (no se queda en invalid_input).
          const args =
            name === 'memory-write'
              ? { content: 'recuerdo escrito por el flujo automático del mock', kind: 'agent' }
              : {};
          res.end(
            JSON.stringify({
              message: { role: 'assistant', content: '', tool_calls: [{ function: { name, arguments: args } }] },
              done: true,
            }),
          );
        };
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
        // Fase 5 — eco semántico (systemMsg ya declarado arriba): si el system
        // inyectó contexto de conocimiento, el modelo "responde" con el
        // fragmento recuperado que contiene 'RECOVER:' — prueba el viaje
        // chunk→contexto→modelo. Fase 5.1 — igual para [M1] de memoria.
        if (systemMsg.includes('[Contexto de conocimiento recuperado')) {
          const recover = /RECOVER:\s*([^\n\]]+)/.exec(systemMsg)?.[1]?.trim();
          if (recover) {
            // [1] = el primer fragmento inyectado (determinista en el corpus):
            // el modelo de prueba emite cita para las métricas de Fase 5.2.
            res.end(JSON.stringify({ message: { role: 'assistant', content: `FACT: ${recover} [1]` }, done: true }));
            return;
          }
        }
        if (systemMsg.includes('[Memoria del agente')) {
          const memRecover = /\[M\d+\]\s*(?:RECOVER:\s*)?([^\n]+)/.exec(systemMsg)?.[1]?.trim();
          if (memRecover) {
            res.end(JSON.stringify({ message: { role: 'assistant', content: `FACT: ${memRecover}` }, done: true }));
            return;
          }
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
