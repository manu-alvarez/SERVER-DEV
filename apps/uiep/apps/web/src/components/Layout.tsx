import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/SpaceDashboard'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import ChatIcon from '@mui/icons-material/Forum'
import MemoryIcon from '@mui/icons-material/Memory'
import BuildIcon from '@mui/icons-material/BuildCircle'
import KnowledgeIcon from '@mui/icons-material/AutoStories'
import HistoryIcon from '@mui/icons-material/ManageHistory'
import WorkflowIcon from '@mui/icons-material/AccountTree'
import IntegrationsIcon from '@mui/icons-material/Extension'
import ObsIcon from '@mui/icons-material/Insights'
import ProjectIcon from '@mui/icons-material/FolderCopy'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LogoutIcon from '@mui/icons-material/Logout'
import { useConsole } from '../store'
import { useState } from 'react'

const NAV = [
  { to: '/', icon: <DashboardIcon sx={{ color: 'text.secondary' }} />, label: 'Dashboard' },
  { to: '/agents', icon: <SmartToyIcon sx={{ color: 'text.secondary' }} />, label: 'Agentes' },
  { to: '/playground', icon: <ChatIcon sx={{ color: 'text.secondary' }} />, label: 'Playground' },
  { to: '/knowledge', icon: <KnowledgeIcon sx={{ color: 'text.secondary' }} />, label: 'Conocimiento' },
  { to: '/memory', icon: <HistoryIcon sx={{ color: 'text.secondary' }} />, label: 'Memoria' },
  { to: '/workflows', icon: <WorkflowIcon sx={{ color: 'text.secondary' }} />, label: 'Workflows' },
  { to: '/integrations', icon: <IntegrationsIcon sx={{ color: 'text.secondary' }} />, label: 'Integraciones' },
  { to: '/observability', icon: <ObsIcon sx={{ color: 'text.secondary' }} />, label: 'Observabilidad' },
  { to: '/project', icon: <ProjectIcon sx={{ color: 'text.secondary' }} />, label: 'Proyecto' },
  { to: '/models', icon: <MemoryIcon sx={{ color: 'text.secondary' }} />, label: 'Modelos' },
  { to: '/tools', icon: <BuildIcon sx={{ color: 'text.secondary' }} />, label: 'Herramientas' },
]

const DRAWER_WIDTH = 232

function LoginGate(): ReactNode {
  /**
   * Pantalla de login EXCLUSIVA del estado público: jamás renderiza rutas.
   * (Un <Outlet /> aquí duplicaría la vista: AppLayout ya tiene el único
   * Outlet del shell autenticado.)
   */
  const { status, refresh, login, consoleDisabled } = useConsole()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (status === 'unknown') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress size={30} />
      </Box>
    )
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await login(password)
      void navigate('/', { replace: true })
    } catch (err) {
      setError('Contraseña incorrecta o consola deshabilitada.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Paper variant="outlined" sx={{ maxWidth: 430, width: '100%', p: 4 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            UIEP · <Box component="span" sx={{ color: 'primary.main' }}>Control Center</Box>
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            Cabina de control de la plataforma de agentes. La sesión viaja en una cookie
            HttpOnly firmada — el token de runtime nunca llega al navegador.
          </Typography>
        </Stack>
        <Stack spacing={2}>
          {consoleDisabled ? (
            <Alert severity="warning">
              La consola está <strong>disabled</strong> en este despliegue: falta la variable de
              entorno <code>UIEP_CONSOLE_PASSWORD</code>. Se habilita en <code>infrastructure/.env</code> del VPS.
            </Alert>
          ) : (
            <>
              <TextField
                label="Contraseña de consola"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submit()}
                fullWidth
                autoFocus
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShow((s) => !s)} edge="end" size="small">
                          {show ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                variant="contained"
                size="large"
                disabled={busy || password.length === 0}
                onClick={() => void submit()}
              >
                {busy ? <CircularProgress size={20} /> : 'Entrar'}
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}

export default function AppLayout(): ReactNode {
  const { status, logout, expiresAt, refresh } = useConsole()
  const navigate = useNavigate()

  // Estado público (desconocido/anónimo): SOLO pantalla de login, sin shell.
  useEffect(() => {
    void refresh()
  }, [refresh])

  if (status !== 'authed') {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <LoginGate />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: 'rgba(10,15,28,0.82)', backdropFilter: 'blur(10px)', borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar sx={{ gap: 1 }}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 700, mr: 2 }}>
                UIEP · <Box component="span" sx={{ color: 'primary.main' }}>Control Center</Box>
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              {expiresAt && (
                <Chip size="small" variant="outlined" label={`Sesión hasta ${new Date(expiresAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`} />
              )}
              <Chip size="small" color="success" variant="status" label="Operador" />
              <IconButton
                size="small"
                onClick={() => {
                  void logout().then(() => navigate('/'))
                }}
                title="Cerrar sesión"
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: '#0c1220', borderRight: 1, borderColor: 'divider' },
            }}
          >
            <Toolbar />
            <List sx={{ px: 1.2, pt: 2 }}>
              {NAV.map((item) => (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.to === '/'}
                  sx={{
                    borderRadius: 2,
                    mb: 0.4,
                    '&.active': { bgcolor: 'rgba(124,140,255,0.12)', '& .MuiListItemText-primary': { color: 'primary.main', fontWeight: 600 }, '& svg': { color: 'primary.main' } },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14.5 }} />
                </ListItemButton>
              ))}
            </List>
            <Box sx={{ mt: 'auto', p: 2 }}>
              <Typography variant="caption" color="text.secondary" component={Link} to="/tools" display="block">
                motor: agent-spec v1 · runtime v0.3
              </Typography>
            </Box>
          </Drawer>
          <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: 3.2, bgcolor: 'background.default' }}>
            <Toolbar />
            <Outlet />
          </Box>
    </Box>
  )
}
