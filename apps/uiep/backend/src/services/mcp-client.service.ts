import type { IntegrationSpecV1 } from '@uiep/agent-spec';
import { callIntegration } from './integration.service';

/**
 * MCP client (Fase 7) — protocolo de INTEROPERABILIDAD, no núcleo.
 *
 * Cliente JSON-RPC 2.0 sobre HTTP SIN ESTADO (cada llamada es independiente;
 * las sesiones/sampling de MCP quedan para evolución — documentado). Dos
 * operaciones: tools/list (descubrir) y tools/call (ejecutar). El transporte
 * hereda timeout/circuit-breaker/auth del connector.
 */

export interface McpToolDescriptor {
  name: string
  description?: string
  inputSchema?: unknown
}

export interface McpListResult {
  ok: boolean
  tools?: McpToolDescriptor[]
  error?: string
}

export interface McpCallResult {
  ok: boolean
  content?: string
  isError?: boolean
  error?: string
}

async function rpc(spec: IntegrationSpecV1, method: string, params: Record<string, unknown>): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const r = await callIntegration(spec, {
    method: 'POST',
    path: '',
    body: { jsonrpc: '2.0', id: Date.now(), method, params },
  });
  if (!r.ok) {
    return { ok: false, error: r.error };
  }
  try {
    const parsed = JSON.parse(r.body ?? '{}') as { result?: unknown; error?: { message?: string } };
    if (parsed.error) {
      return { ok: false, error: `mcp_error: ${parsed.error.message ?? 'desconocido'}` };
    }
    return { ok: true, result: parsed.result };
  } catch {
    return { ok: false, error: 'mcp_response_invalid' };
  }
}

/** Descubre las herramientas del servidor MCP. */
export async function mcpListTools(spec: IntegrationSpecV1): Promise<McpListResult> {
  const r = await rpc(spec, 'tools/list', {});
  if (!r.ok) {
    return { ok: false, error: r.error };
  }
  const result = r.result as { tools?: McpToolDescriptor[] } | undefined;
  return { ok: true, tools: Array.isArray(result?.tools) ? result.tools : [] };
}

/** Ejecuta una herramienta del servidor MCP. */
export async function mcpCallTool(spec: IntegrationSpecV1, toolName: string, args: Record<string, unknown>): Promise<McpCallResult> {
  const r = await rpc(spec, 'tools/call', { name: toolName, arguments: args });
  if (!r.ok) {
    return { ok: false, error: r.error };
  }
  const result = r.result as { content?: Array<{ type?: string; text?: string }>; isError?: boolean } | undefined;
  const text = (result?.content ?? []).filter((c) => c.type === 'text' || c.text).map((c) => c.text ?? '').join('\n');
  return { ok: !result?.isError, content: text, isError: result?.isError };
}
