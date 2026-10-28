import { Box, Typography, Button, Paper, Chip, Grid } from '@mui/material'
import { PlayCircle as PlayIcon, Code as CodeIcon, Terminal as TerminalIcon } from 'lucide-react'
import { useState, useCallback } from 'react'

type NodeType = 'agent' | 'subagent' | 'mcp' | 'tool'

interface FlowNode {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
}

interface FlowEdge {
  id: string
  source: string
  target: string
  label: string
}

const NODE_COLORS: Record<NodeType, string> = {
  agent: '#22d3ee',
  subagent: '#a78bfa',
  mcp: '#4ade80',
  tool: '#fde047',
}

const NODE_ICONS: Record<NodeType, any> = {
  agent: TerminalIcon,
  subagent: CodeIcon,
  mcp: TerminalIcon,
  tool: PlayIcon,
}

export default function Canvas() {
  const [nodes, setNodes] = useState<FlowNode[]>([
    { id: '1', type: 'agent', label: 'Agente Principal', x: 400, y: 100 },
    { id: '2', type: 'subagent', label: 'Subagente A', x: 150, y: 300 },
    { id: '3', type: 'subagent', label: 'Subagente B', x: 650, y: 300 },
    { id: '4', type: 'mcp', label: 'Servidor MCP', x: 400, y: 500 },
  ])
  const [edges, setEdges] = useState<FlowEdge[]>([
    { id: 'e1', source: '1', target: '2', label: 'delega' },
    { id: 'e2', source: '1', target: '3', label: 'delega' },
    { id: 'e3', source: '2', target: '4', label: 'usa' },
    { id: 'e4', source: '3', target: '4', label: 'usa' },
  ])

  const addNode = useCallback(() => {
    const id = Date.now().toString()
    setNodes((prev) => [
      ...prev,
      { id, type: 'subagent', label: `Nodo ${id.slice(-4)}`, x: 300 + Math.random() * 200, y: 300 + Math.random() * 200 },
    ])
  }, [])

  return (
    <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {/* Línea de conexión SVG */}
      <svg
        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      >
        {edges.map((e) => {
          const s = nodes.find((n) => n.id === e.source)
          const t = nodes.find((n) => n.id === e.target)
          if (!s || !t) return null
          return (
            <path
              key={e.id}
              d={`M${s.x + 100} ${s.y + 30} Q${(s.x + t.x) / 2} ${(s.y + t.y) / 2} ${t.x} ${t.y + 30}`}
              stroke="#22d3ee"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6 4"
              style={{ opacity: 0.6 }}
            />
          )
        })}
      </svg>

      {/* Barra de herramientas */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: 1, background: 'rgba(10, 15, 26, 0.8)', p: 1.5, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nodos:</Typography>
          {['agent', 'subagent', 'mcp', 'tool'].map((t) => (
            <Button
              key={t}
              size="small"
              onClick={() =>
                setNodes((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString() + t,
                    type: t as NodeType,
                    label: t.charAt(0).toUpperCase() + t.slice(1),
                    x: 200 + Math.random() * 400,
                    y: 200 + Math.random() * 400,
                  },
                ])
              }
              sx={{
                borderRadius: '8px',
                color: NODE_COLORS[t as NodeType],
                border: `1px solid ${NODE_COLORS[t as NodeType]}40`,
                '&:hover': { background: `rgba(${NODE_COLORS[t as NodeType] === '#22d3ee' ? '34,211,238' : NODE_COLORS[t as NodeType] === '#a78bfa' ? '167,139,250' : NODE_COLORS[t as NodeType] === '#4ade80' ? '74,222,128' : '253,224,71'}, 0.1)` },
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
          <Button
            variant="contained"
            startIcon={<PlayCircle />}
            onClick={addNode}
            sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a', fontWeight: 800, borderRadius: '8px' }}
          >
            Añadir Nodo
          </Button>
        </Box>
      </Box>

      {/* Nodos */}
      {nodes.map((node) => {
        const Icon = NODE_ICONS[node.type]
        const color = NODE_COLORS[node.type]
        return (
          <Box
            key={node.id}
            sx={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: 160,
              zIndex: 5,
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <Paper
              sx={{
                p: 2,
                borderRadius: '12px',
                background: 'rgba(10, 15, 26, 0.8)',
                border: `1px solid ${color}30`,
                boxShadow: `0 0 20px ${color}20`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box sx={{ p: 0.5, borderRadius: '6px', background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                <Icon sx={{ fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc', ml: 0.5 }}>{node.label}</Typography>
            </Paper>
          </Box>
        )
      })}

      {/* Panel de control */}
      <Box sx={{ position: 'absolute', bottom: 30, left: 30, zIndex: 10, background: 'rgba(10, 15, 26, 0.8)', p: 3, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', width: 320 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-1px', mb: 2 }}>Sistema Agentico</Typography>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>
          {nodes.length} nodos · {edges.length} conexiones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PlayCircle />}
            sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a', fontWeight: 800, borderRadius: '10px', flex: 1, py: 1.2 }}
          >
            Ejecutar Diagrama
          </Button>
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            sx={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', flex: 1, py: 1.2 }}
          >
            Exportar Código
          </Button>
        </Box>
      </Box>

      <style>{`
        @keyframes pulse-dot {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Box>
  )
}
