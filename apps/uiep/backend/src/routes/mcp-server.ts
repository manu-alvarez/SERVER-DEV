import type { Express, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getToolSpec, executeTool } from '../services/tool-registry.service';

/**
 * MCP Server de UIEP (Fase 7) — expone herramientas cerradas de la plataforma
 * vía JSON-RPC 2.0 (MCP sin estado sobre HTTP). El núcleo (contrato interno
 * de tools) NO depende de MCP: este endpoint es un ADAPTADOR de
 * interoperabilidad hacia fuera.
 *
 * · SOLO herramientas en el allowlist (env UIEP_MCP_EXPOSED_TOOLS, default
 *   'clock,runtime-info') — las de escritura/efectos nunca se exponen por
 *   defecto.
 * · Autenticación: Bearer UIEP_RUNTIME_TOKEN (consumidores server-side).
 * · Path: /api/mcp-server (la ruta /api/mcp pertenece al generador legacy de
 *   Fase 0 — no se toca).
 * · tools/list → descriptores con inputSchema; tools/call → ejecuta a través
 *   de los MISMOS adaptadores cerrados (executeTool) — un solo motor.
 */

function tokenOk(req: Request): boolean {
  const token = process.env.UIEP_RUNTIME_TOKEN;
  if (!token || token.length < 8) {
    return false;
  }
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    return false;
  }
  const provided = header.slice('Bearer '.length);
  if (provided.length !== token.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(token));
}

function exposedToolIds(): string[] {
  return (process.env.UIEP_MCP_EXPOSED_TOOLS || 'clock,runtime-info')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function jsonResponse(res: Response, id: unknown, result?: unknown, error?: { code: number; message: string }): void {
  res.json(error ? { jsonrpc: '2.0', id, error } : { jsonrpc: '2.0', id, result: result ?? {} });
}

export function registerMcpServer(app: Express): void {
  app.post('/api/mcp-server', (req, res) => {
    if (!tokenOk(req)) {
      return void jsonResponse(res, null, undefined, { code: -32001, message: 'unauthorized' });
    }
    const body = (req.body ?? {}) as { id?: unknown; method?: unknown; params?: Record<string, unknown> };
    const id = body.id ?? null;
    const method = String(body.method ?? '');

    if (method === 'initialize') {
      return void jsonResponse(res, id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'uiep-mcp', version: '1.0.0' },
      });
    }
    if (method === 'tools/list') {
      void (async () => {
        const tools: unknown[] = [];
        for (const toolId of exposedToolIds()) {
          const tool = await getToolSpec(toolId);
          if (!tool) {
            continue;
          }
          tools.push({
            name: tool.metadata.id,
            description: tool.spec.description,
            inputSchema: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(tool.spec.inputSchema.properties).map(([k, v]) => [k, { type: String((v as { type?: unknown }).type ?? 'string'), description: (v as { description?: string }).description }]),
              ),
              required: tool.spec.inputSchema.required,
            },
          });
        }
        jsonResponse(res, id, { tools });
      })().catch(() => jsonResponse(res, id, undefined, { code: -32603, message: 'tools/list failed' }));
      return;
    }
    if (method === 'tools/call') {
      void (async () => {
        const params = (body.params ?? {}) as { name?: unknown; arguments?: Record<string, unknown> };
        const name = String(params.name ?? '');
        if (!exposedToolIds().includes(name)) {
          return jsonResponse(res, id, undefined, { code: -32602, message: `tool no expuesta: ${name}` });
        }
        const tool = await getToolSpec(name);
        if (!tool) {
          return jsonResponse(res, id, undefined, { code: -32602, message: `tool no registrada: ${name}` });
        }
        // Contexto de ejecución: MCP es server-side — sin agente/sesión que
        // herede (la tool corre como la plataforma, con su permiso propio).
        const result = await executeTool(tool, params.arguments ?? {}, {
          agentSpecId: 'mcp-server',
          sessionId: 'mcp',
          executionId: 'mcp',
          input: '',
          memoryEnabled: false, // vía MCP nadie escribe memoria
        });
        const payload =
          result.ok
            ? { ok: true, result: result.result }
            : { ok: false, error: result.error, detail: result.detail };
        jsonResponse(res, id, {
          content: [{ type: 'text', text: JSON.stringify(payload) }],
          isError: !result.ok,
        });
      })().catch(() => jsonResponse(res, id, undefined, { code: -32603, message: 'tools/call failed' }));
      return;
    }
    jsonResponse(res, id, undefined, { code: -32601, message: `método no soportado: ${method}` });
  });
}
