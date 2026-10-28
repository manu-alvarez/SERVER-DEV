import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: '2mb' }))

// Rate limiting global
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'uiep-backend', timestamp: new Date().toISOString() })
})

// Generate entity (agent, subagent, system, mcp, harness, adversarial, template)
const GenerateSchema = z.object({
  goal: z.string().min(1),
  type: z.enum(['agent', 'subagent', 'system', 'mcp', 'harness', 'adversarial', 'template']),
  framework: z.enum(['langgraph', 'crewai', 'n8n', 'openai', 'custom']).optional(),
  templateId: z.string().optional(),
})

app.post('/api/generate', (req, res) => {
  const parse = GenerateSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors })
  }
  const { goal, type, framework, templateId } = parse.data
  const id = uuidv4()

  // Generación local usando los paquetes UIEP (sin APIs de pago externas)
  const code = `
// Generado por UIEP — ${new Date().toISOString()}
export const entity = {
  id: '${id}',
  goal: ${JSON.stringify(goal)},
  type: ${JSON.stringify(type)},
  framework: ${JSON.stringify(framework ?? null)},
  createdAt: new Date().toISOString(),
}
export function run() {
  console.log('Ejecutando ${type}:', ${JSON.stringify(goal)})
}
`
  const structure = {
    root: `uiep-${id}`,
    files: [
      `uiep-${id}/index.ts`,
      `uiep-${id}/agent.ts`,
      `uiep-${id}/config.json`,
      `uiep-${id}/package.json`,
      type === 'mcp' ? `uiep-${id}/mcp-server.ts` : null,
      type === 'adversarial' ? `uiep-${id}/adversarial-tests.ts` : null,
      type === 'harness' ? `uiep-${id}/harness.ts` : null,
    ].filter(Boolean),
  }

  const mcpConfig = type === 'mcp' ? {
    serverName: `uiep-mcp-${id}`,
    command: 'node',
    args: [`uiep-${id}/mcp-server.js`],
    env: {},
  } : null

  const adversarialTests = type === 'adversarial'
    ? [
        `Prueba de inyección de prompt para: ${goal}`,
        `Prueba de fuga de datos sensibles`,
        `Prueba de bypass de restricciones`,
      ]
    : []

  res.json({
    id,
    goal,
    type,
    framework: framework ?? null,
    code,
    structure,
    mcpConfig,
    adversarialTests,
    createdAt: new Date().toISOString(),
  })
})

// Templates (mock local — se persiste en memoria por ahora; se conectará a DB en siguiente fase)
const templates: any[] = [
  {
    id: 'tpl-1',
    name: 'Agente de Reservas',
    category: 'hospitality',
    description: 'Agente para gestionar reservas de restaurantes con confirmación.',
    code: 'export const template = { type: "agent", domain: "hospitality" }',
    variables: {},
  },
]
app.get('/api/templates', (_req, res) => res.json(templates))
app.post('/api/templates', (req, res) => {
  const t = { id: 'tpl-' + Date.now(), ...req.body }
  templates.push(t)
  res.status(201).json(t)
})

// MCP servers (memoria local)
const mcpServers: any[] = []
app.get('/api/mcp', (_req, res) => res.json(mcpServers))
app.post('/api/mcp', (req, res) => {
  const s = { id: 'mcp-' + Date.now(), ...req.body }
  mcpServers.push(s)
  res.status(201).json(s)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[UIEP Backend] Puerto ${PORT} — Modo local, sin APIs de pago externas`)
})
