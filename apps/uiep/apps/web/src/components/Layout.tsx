import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Box, Drawer as MDrawer, Typography, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Button, Chip, Divider, Avatar } from '@mui/material'
import { Menu as MenuIcon, Home as DashboardIcon, Code as CodeIcon, LayoutList as LayersIcon, Terminal as TerminalIcon, Shield as ShieldIcon, Settings as SettingsIcon, LogOut as LogoutIcon, PlayCircle as PlayIcon, Extension as ExtensionIcon, Bug as BugIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store'

const drawerWidth = 280

const menuItems = [
  { path: '/', label: 'Panel de Control', icon: <DashboardIcon /> },
  { path: '/canvas', label: 'Diseñador de Agentes', icon: <LayersIcon /> },
  { path: '/templates', label: 'Plantillas', icon: <CodeIcon /> },
  { path: '/generator', label: 'Generador de Código', icon: <TerminalIcon /> },
  { path: '/mcp', label: 'Servidores MCP', icon: <ExternalLink /> },
  { path: '/adversarial', label: 'Tests Adversariales', icon: <BugIcon /> },
  { path: '/settings', label: 'Configuración', icon: <SettingsIcon /> },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#030712' }}>
      {/* Drawer */}
      <MDrawer
        anchor="left"
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          bgcolor: '#070b14',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#030712' }}>U</Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              UIEP
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Universal Intelligence Engineering Platform
            </Typography>
          </Box>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mx: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '10px',
                  color: location.pathname === item.path ? '#22d3ee' : '#94a3b8',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#22d3ee' },
                  '&.Mui-selected': { bgcolor: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', fontWeight: 700, borderRight: '3px solid #22d3ee' },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#22d3ee' : '#64748b', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} sx={{ fontWeight: location.pathname === item.path ? 700 : 400 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.04)', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)' }}>{user?.name?.[0] || 'U'}</Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>{user?.name || 'Usuario'}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>{user?.email}</Typography>
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
      </MDrawer>

      {/* Content */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
              UIEP
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Diseña, genera y despliega sistemas agenticos localmente
            </Typography>
          </Box>
          <Chip
            label={`Plan: ${user?.plan?.toUpperCase() || 'FREE'}`}
            size="small"
            sx={{ color: '#22d3ee', borderColor: 'rgba(34, 211, 238, 0.3)', fontWeight: 700 }}
          />
        </Box>
        <Outlet />
      </Box>
    </Box>
  )
}
