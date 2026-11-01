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
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ExpandIcon from '@mui/icons-material/ExpandMoreRounded'
import IntegrationsIcon from '@mui/icons-material/Extension'
import ObsIcon from '@mui/icons-material/Insights'
import ProjectIcon from '@mui/icons-material/FolderCopy'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { useConsole } from '../store'
import { useState } from 'react'

const NAV_TRABAJO = [
  { to: '/agents', icon: <SmartToyIcon sx={{ color: 'text.secondary' }} />, label: 'Tus agentes' },
  { to: '/playground', icon: <ChatIcon sx={{ color: 'text.secondary' }} />, label: 'Conversar' },
  { to: '/workflows', icon: <AccountTreeIcon sx={{ color: 'text.secondary' }} />, label: 'Flujos' },
  { to: '/knowledge', icon: <KnowledgeIcon sx={{ color: 'text.secondary' }} />, label: 'Saber' },
]

const NAV_AVANZADO = [
  { to: '/models', icon: <MemoryIcon sx={{ color: 'text.secondary' }} />, label: 'Modelos' },
  { to: '/tools', icon: <BuildIcon sx={{ color: 'text.secondary' }} />, label: 'Herramientas' },
  { to: '/integrations', icon: <IntegrationsIcon sx={{ color: 'text.secondary' }} />, label: 'Integraciones' },
  { to: '/memory', icon: <HistoryIcon sx={{ color: 'text.secondary' }} />, label: 'Memoria' },
  { to: '/observability', icon: <ObsIcon sx={{ color: 'text.secondary' }} />, label: 'Observabilidad' },
  { to: '/sistema', icon: <DashboardIcon sx={{ color: 'text.secondary' }} />, label: 'Sistema' },
  { to: '/project', icon: <ProjectIcon sx={{ color: 'text.secondary' }} />, label: 'Proyecto' },
]

const DRAWER_WIDTH = 232

/** Marca UIEP: tile con gradiente + palabra con degradado azul→cian. */
function Brand(): ReactNode {
  return (
    <Stack direction="row" spacing={1.1} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        aria-hidden
        sx={{
          width: 26,
          height: 26,
          borderRadius: '8px',
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #4f7dff 0%, #22d3ee 130%)',
          boxShadow: '0 0 14px rgba(79, 125, 255, 0.45)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        U
      </Box>
      <Typography noWrap sx={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em' }}>
        <Box
          component="span"
          sx={{
            background: 'linear-gradient(92deg, #7c9bff 20%, #22d3ee 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          UIEP
        </Box>
        <Box component="span" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {' '}
          · Control Center
        </Box>
      </Typography>
    </Stack>
  )
}

/** Fondo de la consola: base profunda con dos auroras estáticas muy suaves. */
const SHELL_BACKGROUND = {
  bgcolor: 'background.default',
  backgroundImage:
    'radial-gradient(1100px 480px at 88% -8%, rgba(79, 125, 255, 0.09), transparent 60%), radial-gradient(900px 420px at -8% 108%, rgba(167, 139, 250, 0.07), transparent 55%)',
}

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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        ...SHELL_BACKGROUND,
      }}
    >
      <Paper
        variant="outlined"
        sx={{ maxWidth: 430, width: '100%', p: 4, boxShadow: '0 0 44px rgba(79, 125, 255, 0.16)' }}
      >
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Brand />
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
  const [avanzado, setAvanzado] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
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

  const navBody = (
    <>
      <Toolbar />
      <List sx={{ px: 1.2, pt: 2 }}>
        {NAV_TRABAJO.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{ mb: 0.4 }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14.5 }} />
          </ListItemButton>
        ))}
      </List>
      <Stack
        direction="row"
        onClick={() => setAvanzado((v) => !v)}
        sx={{ px: 2.2, pt: 2.4, pb: 0.8, alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.1em', color: 'text.secondary' }}>
          AVANZADO
        </Typography>
        <ExpandIcon fontSize="small" sx={{ ml: 'auto', color: 'text.secondary', transform: avanzado ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </Stack>
      {avanzado && (
        <List sx={{ px: 1.2 }} disablePadding>
          {NAV_AVANZADO.map((item) => (
            <ListItemButton key={item.to} component={NavLink} to={item.to} sx={{ mb: 0.4, pl: 3 }}>
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          ))}
        </List>
      )}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Typography variant="caption" color="text.secondary" component={Link} to="/tools" display="block">
          motor: agent-spec v1 · runtime v0.3
        </Typography>
      </Box>
    </>
  )

  const drawerPaper = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    bgcolor: '#070b16',
    borderRight: '1px solid rgba(99, 140, 255, 0.16)',
    display: 'flex',
    flexDirection: 'column',
  } as const

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', ...SHELL_BACKGROUND }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'rgba(5, 7, 15, 0.78)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(99, 140, 255, 0.2)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            size="small"
            sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.secondary' }}
            onClick={() => setNavOpen(true)}
            title="Abrir navegación"
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Brand />
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

      {/* Navegación lateral permanente (≥ md). */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: drawerPaper,
        }}
      >
        {navBody}
      </Drawer>

      {/* Navegación lateral temporal (móvil). */}
      <Drawer
        variant="temporary"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: drawerPaper,
        }}
      >
        {navBody}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3.2 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
