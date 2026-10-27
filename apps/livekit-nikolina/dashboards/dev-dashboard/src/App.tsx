import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import PromptStudio from './pages/PromptStudio'
import Pipeline from './pages/Pipeline'
import Tools from './pages/Tools'
import VAD from './pages/VAD'
import Status from './pages/Status'

const RequireAuth = () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<PromptStudio />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="tools" element={<Tools />} />
          <Route path="vad" element={<VAD />} />
          <Route path="status" element={<Status />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
