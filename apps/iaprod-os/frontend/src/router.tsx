import { createBrowserRouter, createRoute, redirect } from 'react-router-dom'
import Layout from './components/Layout'
import OrbPage from './pages/OrbPage'
import ChatPage from './pages/ChatPage'
import VisionPage from './pages/VisionPage'
import ToolsPage from './pages/ToolsPage'
import MemoryPage from './pages/MemoryPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './store'

const requireAuth = () => {
  const token = localStorage.getItem('iap_token')
  if (!token) {
    throw redirect('/login')
  }
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <OrbPage />, loader: requireAuth },
      { path: 'chat', element: <ChatPage />, loader: requireAuth },
      { path: 'vision', element: <VisionPage />, loader: requireAuth },
      { path: 'tools', element: <ToolsPage />, loader: requireAuth },
      { path: 'memory', element: <MemoryPage />, loader: requireAuth },
      { path: 'settings', element: <SettingsPage />, loader: requireAuth },
    ],
  },
])
