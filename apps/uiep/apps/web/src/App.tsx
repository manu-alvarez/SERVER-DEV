import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import AppLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import { AgentEditor, AgentList } from './pages/Agents'
import Playground from './pages/Playground'
import Knowledge from './pages/Knowledge'
import MemoryPage from './pages/Memory'
import Workflows from './pages/Workflows'
import Integrations from './pages/Integrations'
import Observability from './pages/Observability'
import Project from './pages/Project'
import Models from './pages/Models'
import Tools from './pages/Tools'
import Catalog from './pages/engineering/Catalog'
import Generator from './pages/engineering/Generator'
import Composer from './pages/engineering/Composer'
import Registry from './pages/engineering/Registry'
import Executions from './pages/engineering/Executions'
import Quality from './pages/engineering/Quality'
import Exports from './pages/engineering/Exports'
import Admin from './pages/engineering/Admin'
import Deployments from './pages/engineering/Deployments'

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
          <Route index element={<Home />} />
          <Route path="/sistema" element={<Dashboard />} />
          <Route path="/agents" element={<AgentList />} />
          <Route path="/agents/new" element={<AgentEditor specId={null} />} />
          <Route path="/agents/:id/edit" element={<AgentEditorRouter />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/playground/:sessionId" element={<Playground />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/memory" element={<MemoryPage />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/observability" element={<Observability />} />
          <Route path="/project" element={<Project />} />
          <Route path="/models" element={<Models />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/engineering" element={<Catalog />} />
          <Route path="/engineering/generar" element={<Generator />} />
          <Route path="/engineering/compositor" element={<Composer />} />
          <Route path="/engineering/registry" element={<Registry />} />
          <Route path="/engineering/ejecuciones" element={<Executions />} />
          <Route path="/engineering/calidad" element={<Quality />} />
          <Route path="/engineering/export" element={<Exports />} />
          <Route path="/engineering/despliegues" element={<Deployments />} />
          <Route path="/engineering/admin" element={<Admin />} />
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
