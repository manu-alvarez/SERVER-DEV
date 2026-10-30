import type { Express } from 'express';

interface McpServerEntry {
  id: string;
  [key: string]: unknown;
}

// Registro en memoria — contrato idéntico al demo (server.js @ 40a1042).
const mcpServers: McpServerEntry[] = [];

/**
 * GET /api/mcp y POST /api/mcp — contratos exactos del demo.
 */
export function registerMcpRoute(app: Express): void {
  app.get('/api/mcp', (_req, res) => res.json(mcpServers));
  app.post('/api/mcp', (req, res) => {
    const s = { id: 'mcp-' + Date.now(), ...req.body };
    mcpServers.push(s);
    res.status(201).json(s);
  });
}
