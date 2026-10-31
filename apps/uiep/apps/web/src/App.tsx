import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import AppLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import { AgentEditor, AgentList } from './pages/Agents'
import Playground from './pages/Playground'
import Knowledge from './pages/Knowledge'
import MemoryPage from './pages/Memory'
import Models from './pages/Models'
import Tools from './pages/Tools'

/**
 * Routing con HashRouter: el estático se publica bajo dos superficies del
 * proxy ('/' con dominio propio y '/app/uiep'), y el hash evita cualquier
 * acoplamiento a la ruta física del servidor. Mismo origen que la API.
 */
export default function App(): ReactNode {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/agents" element={<AgentList />} />
          <Route path="/agents/new" element={<AgentEditor specId={null} />} />
          <Route path="/agents/:id/edit" element={<AgentEditorRouter />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/playground/:sessionId" element={<Playground />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/memory" element={<MemoryPage />} />
          <Route path="/models" element={<Models />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

function AgentEditorRouter(): ReactNode {
  const { id } = useParams<'id'>()
  return <AgentEditor specId={id ?? null} />
}
