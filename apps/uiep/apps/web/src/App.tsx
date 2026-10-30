import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/Layout'
import Canvas from './pages/Canvas'
import Templates from './pages/Templates'
import Generator from './pages/Generator'
import MCP from './pages/MCP'
import Adversarial from './pages/Adversarial'
import Settings from './pages/Settings'
import LogIn from './pages/Login'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LogIn />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Layout /> },
      { path: 'canvas', element: <Canvas /> },
      { path: 'templates', element: <Templates /> },
      { path: 'generator', element: <Generator /> },
      { path: 'mcp', element: <MCP /> },
      { path: 'adversarial', element: <Adversarial /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
