import type { Express } from 'express';
import { GenerateSchema } from '../schemas';
import { runGenerate } from '../services/pipeline.service';
import { saveSpec } from '../services/spec-registry.service';

/**
 * POST /api/generate — contrato HTTP del demo (server.js @ 40a1042), preservado:
 *   - mismo método, ruta y esquema de entrada;
 *   - misma forma de respuesta { id, goal, type, framework, code, structure,
 *     mcpConfig, adversarialTests, createdAt } (+ `engine` aditivo con el PipelineResult real);
 *   - 400 con { error: fieldErrors } para validación fallida.
 */
export function registerGenerateRoute(app: Express): void {
  app.post('/api/generate', async (req, res) => {
    const parse = GenerateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten().fieldErrors });
    }

    try {
      const response = runGenerate(parse.data);
      // Fase 1: el spec derivado se registra con consistencia read-after-write
      // (await); un fallo de almacenamiento NO rompe el contrato de /api/generate.
      if (response.agentSpec) {
        try {
          await saveSpec(response.agentSpec);
        } catch (err) {
          console.error('[UIEP] spec_store_failed (no bloquea la generación)', err);
        }
      }
      return res.json(response);
    } catch (err) {
      // Errores del pipeline: rechazados de forma explícita y trazable, nunca como 200.
      console.error('[UIEP] pipeline_execution_failed', err);
      return res.status(500).json({
        error: 'pipeline_execution_failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
