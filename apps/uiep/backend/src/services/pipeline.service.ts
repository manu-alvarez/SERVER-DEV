import { runPipeline, deriveAgentSpec, type PipelineInput, type PipelineResult } from '@uiep/design-engine';
import type { AgentSpecV1 } from '@uiep/agent-spec';
import type { EntityType, Framework } from '@uiep/entity-schema';
import type { GenerateRequest } from '../schemas';

/**
 * pipeline.service — servicio intermedio independiente de Express (Fase 0, ETAPA 4).
 *
 * Responsabilidad:
 *   1. Adaptar el esquema HTTP (GenerateRequest) al PipelineInput del motor.
 *   2. Invocar runPipeline() de @uiep/design-engine (sincrónico, determinista, sin LLM).
 *   3. Derivar los campos legacy del contrato HTTP a partir de los artifacts del motor.
 *   4. Incluir el resultado completo del motor de forma aditiva (`engine`) para trazabilidad.
 *
 * No valida la entrada (la ruta ya la validó con GenerateSchema) ni captura errores (la ruta
 * decide la respuesta 500). Así puede reutilizarse desde CLI, SDK o pruebas.
 */

/** type HTTP → EntityType del motor. Mapeo explícito y documentado; la formalización
 *  declarativa llegará con AgentSpec en Fase 1. */
const REQUEST_TYPE_TO_ENTITY_TYPE: Record<NonNullable<GenerateRequest['type']>, EntityType> = {
  agent: 'agent',
  subagent: 'agent',
  system: 'application',
  mcp: 'mcp-server',
  harness: 'harness',
  adversarial: 'evaluation',
  template: 'other',
};

/** framework HTTP → Framework del motor ('openai' del contrato = 'openai-agents' del motor). */
const REQUEST_FRAMEWORK_TO_ENGINE: Record<
  NonNullable<GenerateRequest['framework']>,
  Framework
> = {
  langgraph: 'langgraph',
  crewai: 'crewai',
  n8n: 'n8n',
  openai: 'openai-agents',
  custom: 'custom',
};

/** Estructura de proyecto del contrato legacy ({ root, files }). */
export interface ProjectStructure {
  root: string;
  files: string[];
}

/** Configuración MCP del contrato legacy (solo para type='mcp'). */
export interface McpConfig {
  serverName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

/** Respuesta de /api/generate: campos legacy intactos + resultado del motor aditivo. */
export interface GenerateResponse {
  id: string;
  goal: string;
  type: string;
  framework: string | null;
  code: string;
  structure: ProjectStructure;
  mcpConfig: McpConfig | null;
  adversarialTests: string[];
  createdAt: string;
  /** Aditivo, no consumido por el frontend actual: PipelineResult completo de runPipeline(). */
  engine: PipelineResult;
  /** Aditivo (Fase 1): AgentSpec v1 derivado del resultado del motor y validado contra @uiep/agent-spec. */
  agentSpec?: AgentSpecV1;
}

function toPipelineInput(req: GenerateRequest): PipelineInput {
  const input: PipelineInput = { goal: req.goal };
  // El framework explícito se respeta INDEPENDIENTEMENTE del type (Fase 0.1):
  // el early-return anterior lo descartaba cuando type venía omitido.
  if (req.framework) {
    input.targetFrameworks = [REQUEST_FRAMEWORK_TO_ENGINE[req.framework]];
  }
  if (!req.type) {
    // type omitido → delega en la heurística de inferencia del motor (intent.ts).
    return input;
  }
  input.entityType = REQUEST_TYPE_TO_ENTITY_TYPE[req.type];
  return input;
}

/** Extrae el artifact 'code' principal que el motor generó (contrato legacy: `code`). */
function primaryCodeArtifact(result: PipelineResult): string {
  const artifact = result.generation.artifacts.find((a) => a.type === 'code');
  return artifact ? artifact.content : '';
}

/** Deriva la estructura de proyecto legacy a partir de los artifacts reales del motor. */
function toProjectStructure(id: string, result: PipelineResult): ProjectStructure {
  const files = [
    ...result.generation.artifacts.map((a) => a.name),
    'package.json',
    'tsconfig.json',
    'README.md',
  ];
  return { root: `uiep-${id}`, files };
}

/**
 * Ejecuta la generación completa: HTTP request (ya validado) → PipelineInput → runPipeline()
 * → GenerateResponse (contrato legacy + engine aditivo).
 */
export function runGenerate(req: GenerateRequest): GenerateResponse {
  const result = runPipeline(toPipelineInput(req));
  const id = result.intent.id;

  return {
    id,
    goal: result.intent.goal,
    type: req.type ?? 'agent',
    framework: req.framework ?? null,
    code: primaryCodeArtifact(result),
    structure: toProjectStructure(id, result),
    // Campos legacy de compatibilidad: se mantienen con las mismas condiciones del demo
    // (solo dentro del motor, entityType 'mcp-server'/'evaluation' ya reflejan el resto).
    mcpConfig:
      req.type === 'mcp'
        ? {
            serverName: `uiep-mcp-${id}`,
            command: 'node',
            args: [`uiep-${id}/mcp-server.js`],
            env: {},
          }
        : null,
    adversarialTests:
      req.type === 'adversarial'
        ? [
            `Prueba de inyección de prompt para: ${req.goal}`,
            'Prueba de fuga de datos sensibles',
            'Prueba de bypass de restricciones',
          ]
        : [],
    createdAt: new Date().toISOString(),
    engine: result,
    agentSpec: deriveAgentSpec(result),
  };
}
