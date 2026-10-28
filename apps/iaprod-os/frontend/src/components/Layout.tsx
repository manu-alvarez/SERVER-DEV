import { Box, Drawer, Typography, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button, Chip, Divider, Avatar } from '@mui/material'
import { Menu as MenuIcon, Dashboard as DashboardIcon, Code as CodeIcon, Camera as CameraIcon, DeviceHub as DeviceHubIcon, Memory as MemoryIcon, Settings as SettingsIcon, Logout as LogoutIcon, Shield as ShieldIcon, Zap as ZapIcon } from '@mui/icons-material'
import { useLocation, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store'

const drawerWidth = 260

const menuItems = [
  { path: '/', label: 'Orb Cognitivo', icon: <ZapIcon /> },
  { path: '/chat', label: 'Chat de Voz', icon: <DashboardIcon /> },
  { path: '/vision', label: 'Visión Continua', icon: <CameraIcon /> },
  { path: '/tools', label: 'Herramientas', icon: <DeviceHubIcon /> },
  { path: '/memory', label: 'Memoria', icon: <MemoryIcon /> },
  { path: '/settings', label: 'Configuración', icon: <SettingsIcon /> },
]

export default function Layout() {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#02040a' }}>
      <Drawer
        anchor="left"
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          bgcolor: '#050812',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a' }}>I</Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              IA Prod OS
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Sistema Operativo Cognitivo
            </Typography>
          </Box>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mx: 1 }}>
              <button
                onClick={() => window.location.href = item.path}
                selected={location.pathname === item.path}
                sx={{
                  width: '100%',
                  borderRadius: '10px',
                  color: location.pathname === item.path ? '#22d3ee' : '#94a3b8',
                  background: location.pathname === item.path ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#22d3ee' },
                  textAlign: 'left',
                  padding: '10px 16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ marginRight: 12 }}>{React.createElement(item.icon as any)}</span>
                {item.label}
              </button>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.04)', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0a0f1a', border: '1px solid rgba(255,255,255,0.08)' }}>{user?.email?.[0] || 'U'}</Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>{user?.email || 'Usuario'}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>{user?.role || 'user'}</Typography>
            </Box>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            onClick={logout}
            startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
            sx={{
              mt: 1,
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.05)' },
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>IA Prod OS</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Sistema operativo cognitivo — voce, visión, herramientas y memoria
            </Typography>
          </Box>
          <Chip
            label={`Modo: ${user?.role === 'admin' ? 'ADMIN' : 'USER'}`}
            size="small"
            sx={{ color: '#22d3ee', borderColor: 'rgba(34, 211, 238, 0.3)', fontWeight: 700 }}
          />
        </Box>
        <Outlet />
      </Box>
    </Box>
  )
}
