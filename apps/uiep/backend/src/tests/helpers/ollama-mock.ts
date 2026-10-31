import http from 'node:http';

/** Servidor mock de Ollama para pruebas de adaptador/conectividad sin dependencias. */
export function startOllamaMock(options?: { tags?: string[] }): Promise<{ server: http.Server; url: string }> {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/tags') {
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          models: (options?.tags ?? ['qwen3.5:4b']).map((name) => ({ name })),
        }),
      );
      return;
    }
    if (req.method === 'POST' && req.url === '/api/generate') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ response: 'OK' }));
      });
      return;
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        // El request con think:false debe terminar en contenido limpio ('OK').
        res.end(JSON.stringify({ message: { role: 'assistant', content: 'OK' } }));
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
