import type { Express } from 'express';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  variables: Record<string, unknown>;
}

// Catálogo en memoria — contrato y contenido idénticos al demo (server.js @ 40a1042).
const templates: Template[] = [
  {
    id: 'tpl-1',
    name: 'Agente de Reservas',
    category: 'hospitality',
    description: 'Agente para gestionar reservas de restaurantes con confirmación.',
    code: 'export const template = { type: "agent", domain: "hospitality" }',
    variables: {},
  },
  {
    id: 'tpl-2',
    name: 'Soporte Técnico',
    category: 'support',
    description: 'Agente de soporte técnico con escalado automático.',
    code: 'export const template = { type: "agent", domain: "support" }',
    variables: {},
  },
  {
    id: 'tpl-3',
    name: 'Analista de Datos',
    category: 'analytics',
    description: 'Agente que analiza datos y genera reportes.',
    code: 'export const template = { type: "agent", domain: "analytics" }',
    variables: {},
  },
];

/**
 * GET /api/templates y POST /api/templates — contratos exactos del demo.
 */
export function registerTemplatesRoute(app: Express): void {
  app.get('/api/templates', (_req, res) => res.json(templates));
  app.post('/api/templates', (req, res) => {
    const t = { id: 'tpl-' + Date.now(), ...req.body };
    templates.push(t);
    res.status(201).json(t);
  });
}
