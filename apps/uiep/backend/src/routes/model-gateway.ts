import type { Express } from 'express';
import { EntityIdSchema, validateSpec } from '@uiep/agent-spec';
import {
  checkProfileHealth,
  profileTestCompletion,
  resolveModelRef,
} from '../services/model-gateway.service';
import { getLatestSpec, listSpecs, saveSpec } from '../services/spec-registry.service';

/**
 * Model Gateway (Fase 2) — endpoints aditivos, no consumidos por el frontend
 * actual, sin tocar contratos existentes:
 *   POST /api/profiles            — registra un ModelProfile validado (201/400)
 *   GET  /api/profiles            — listado de ModelProfiles registrados (200)
 *   GET  /api/profiles/:id        — perfil en su versión más reciente (200/404)
 *   GET  /api/profiles/:id/health — disponibilidad REAL contra el proveedor (200)
 *   POST /api/profiles/:id/test   — completación real acotada (200/502)
 *   POST /api/profiles/resolve    — resuelve la referencia de modelo de un AgentSpec (200/404)
 *
 * Sin secretos: los perfiles referencian el endpoint por el NOMBRE de su
 * variable de entorno; el valor resuelto nunca sale de la infraestructura.
 */
export function registerModelGatewayRoute(app: Express): void {
  const idFromParams = (raw: unknown): string | null => {
    const id = String(raw);
    return EntityIdSchema.safeParse(id).success ? id : null;
  };

  app.post('/api/profiles/resolve', (req, res) => {
    const body = (req.body ?? {}) as {
      profileId?: string;
      agentSpec?: { spec?: { model?: { profile?: string } } };
    };
    const profileId =
      typeof body.profileId === 'string' && body.profileId.trim().length > 0
        ? body.profileId.trim()
        : typeof body.agentSpec?.spec?.model?.profile === 'string'
          ? body.agentSpec.spec.model.profile
          : null;
    if (!profileId) {
      return res.status(400).json({ error: { profileId: ['falta profileId o agentSpec.spec.model.profile'] } });
    }
    if (body.agentSpec !== undefined) {
      const validation = validateSpec(body.agentSpec);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.errors });
      }
    }
    resolveModelRef(profileId)
      .then((result) => {
        if (!result.ok) {
          return res.status(404).json({ error: result.reason, message: result.message });
        }
        const spec = result.profile.spec;
        res.json({
          resolved: true,
          profileId: result.profile.metadata.id,
          version: result.profile.metadata.version,
          invocation: {
            provider: spec.provider,
            model: spec.model,
            endpoint: `env:${spec.endpointEnv || 'OLLAMA_BASE_URL'}`,
            costTier: spec.costTier ?? null,
          },
        });
      })
      .catch((err) => {
        console.error('[UIEP] profile_resolve_failed', err);
        res.status(500).json({ error: 'profile_resolve_failed' });
      });
  });

  app.post('/api/profiles', (req, res) => {
    const validation = validateSpec(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.errors });
    }
    if (validation.kind !== 'ModelProfile') {
      return res.status(400).json({
        error: { kind: [`se esperaba kind 'ModelProfile', recibido '${validation.kind}'`] },
      });
    }
    saveSpec(validation.spec)
      .then(() =>
        res.status(201).json({
          stored: true,
          id: validation.spec.metadata.id,
          version: validation.spec.metadata.version,
        }),
      )
      .catch((err) => {
        console.error('[UIEP] profile_store_failed', err);
        res.status(500).json({ error: 'profile_store_failed' });
      });
  });

  app.get('/api/profiles', (_req, res) => {
    listSpecs({ kind: 'ModelProfile' })
      .then((profiles) => res.json(profiles))
      .catch((err) => {
        console.error('[UIEP] profile_list_failed', err);
        res.status(500).json({ error: 'profile_list_failed' });
      });
  });

  app.get('/api/profiles/:id', (req, res) => {
    const id = idFromParams(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    getLatestSpec(id)
      .then((envelope) => {
        if (!envelope || envelope.kind !== 'ModelProfile') {
          return res.status(404).json({ error: 'profile_not_found' });
        }
        res.json(envelope);
      })
      .catch((err) => {
        console.error('[UIEP] profile_get_failed', err);
        res.status(500).json({ error: 'profile_get_failed' });
      });
  });

  app.get('/api/profiles/:id/health', (req, res) => {
    const id = idFromParams(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    resolveModelRef(id)
      .then((result) => {
        if (!result.ok) {
          return res.status(404).json({ error: result.reason, message: result.message });
        }
        checkProfileHealth(result.profile)
          .then((health) => res.json(health))
          .catch((err) => {
            console.error('[UIEP] profile_health_failed', err);
            res.status(500).json({ error: 'profile_health_failed' });
          });
      })
      .catch((err) => {
        console.error('[UIEP] profile_resolve_failed', err);
        res.status(500).json({ error: 'profile_resolve_failed' });
      });
  });

  app.post('/api/profiles/:id/test', (req, res) => {
    const id = idFromParams(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { id: ['formato de id inválido'] } });
    }
    const body = (req.body ?? {}) as { prompt?: string };
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 500) : undefined;
    resolveModelRef(id)
      .then((result) => {
        if (!result.ok) {
          return res.status(404).json({ error: result.reason, message: result.message });
        }
        profileTestCompletion(result.profile, prompt)
          .then((test) => res.status(test.ok ? 200 : 502).json(test))
          .catch((err) => {
            console.error('[UIEP] profile_test_failed', err);
            res.status(500).json({ error: 'profile_test_failed' });
          });
      })
      .catch((err) => {
        console.error('[UIEP] profile_resolve_failed', err);
        res.status(500).json({ error: 'profile_resolve_failed' });
      });
  });
}
