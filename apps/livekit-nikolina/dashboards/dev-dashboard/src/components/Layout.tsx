import { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import {
  Box, Drawer, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery,
  Breadcrumbs, Link as MuiLink, Avatar, Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Code as CodeIcon,
  Hearing as HearingIcon,
  MonitorHeart as MonitorHeartIcon,
  AccountTree as AccountTreeIcon,
  Construction as ToolsIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material'

const DRAWER_WIDTH = 260
const DRAWER_COLLAPSED_WIDTH = 72

const menuItems = [
  { path: '/', label: 'Prompt Studio', icon: <CodeIcon /> },
  { path: '/pipeline', label: 'Pipeline', icon: <AccountTreeIcon /> },
  { path: '/tools', label: 'Tools', icon: <ToolsIcon /> },
  { path: '/vad', label: 'VAD Settings', icon: <HearingIcon /> },
  { path: '/status', label: 'System Status', icon: <MonitorHeartIcon /> },
]

const pageTitles: Record<string, string> = {
  '/': 'Prompt Studio',
  '/pipeline': 'Pipeline Configuration',
  '/tools': 'Tools Management',
  '/vad': 'VAD Settings',
  '/status': 'System Status',
}

export default function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setCollapsed(!collapsed)
    }
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        p: collapsed ? 1.5 : 2.5,
        minHeight: 64,
      }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              bgcolor: 'transparent',
              border: '2px solid rgba(124, 58, 237, 0.4)',
              width: 36, height: 36,
            }}>
              <TerminalIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
            </Avatar>
            <Box>
              <Typography sx={{
                fontWeight: 700, fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}>
                DEV DASH
              </Typography>
              <Typography sx={{
                fontSize: '0.55rem', color: '#64748b',
                letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                MSB LiveKit
              </Typography>
            </Box>
          </Box>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small" sx={{ color: '#94a3b8' }}>
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.04)' }} />

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 2, px: 1.5 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: collapsed ? 1.5 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(124, 58, 237, 0.12)',
                    borderLeft: collapsed ? 'none' : '3px solid #7c3aed',
                    '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.16)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: collapsed ? 0 : 40,
                  color: isActive ? '#a78bfa' : '#64748b',
                  transition: 'color 0.2s ease',
                }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#f1f5f9' : '#94a3b8',
                    }}
                  />
                )}
                {isActive && !collapsed && (
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%',
                    bgcolor: '#7c3aed',
                    boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {!collapsed && (
          <Typography sx={{
            fontSize: '0.6rem', color: '#475569',
            letterSpacing: '0.1em', textAlign: 'center',
          }}>
            MSB SOLUTIONS · DEV v2.0
          </Typography>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        width: { md: `calc(100% - ${drawerWidth}px)` },
      }}>
        {/* Top Bar */}
        <Box sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: 'rgba(6, 6, 10, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton onClick={handleDrawerToggle} sx={{ color: '#f1f5f9' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink component={Link} to="/" underline="hover" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Dev
              </MuiLink>
              <Typography color="text.primary" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {pageTitles[location.pathname] || 'Page'}
              </Typography>
            </Breadcrumbs>
          </Box>

          <Box sx={{
            px: 2, py: 0.5, borderRadius: '8px',
            bgcolor: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
          }}>
            <Typography sx={{
              fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.15em', color: '#a78bfa',
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              DEV MODE
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{
          flexGrow: 1, p: { xs: 2, sm: 3 },
          overflow: 'auto',
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
