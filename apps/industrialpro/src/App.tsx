import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Badge } from '@mui/material';
import { createTheme } from '@mui/material';
import { getToken, setToken } from './api/client';
import api from './api/client';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import OperationsView from './components/OperationsView';
import ProductsView from './components/ProductsView';
import HistoryView from './components/HistoryView';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    secondary: { main: '#06b6d4' },
    background: { default: '#0a0e17', paper: '#111827' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          border: '1px solid rgba(59,130,246,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          '&:hover': { background: 'linear-gradient(135deg, #2563eb, #0891b2)' },
        },
      },
    },
  },
});

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'operations', label: 'Operaciones', icon: <PrecisionManufacturingIcon /> },
  { id: 'products', label: 'Productos', icon: <InventoryIcon /> },
  { id: 'history', label: 'Historial', icon: <HistoryIcon /> },
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => { setToken(null); }).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return null;

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard user={user} onNavigate={v => { setView(v); setDrawerOpen(false); }} />;
      case 'operations': return <OperationsView />;
      case 'products': return <ProductsView />;
      case 'history': return <HistoryView />;
      default: return <Dashboard user={user} onNavigate={v => setView(v)} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!user ? (
        <LoginScreen onLogin={u => setUser(u)} />
      ) : (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar position="fixed" sx={{ bgcolor: '#111827', borderBottom: '1px solid rgba(59,130,246,0.15)', boxShadow: 'none' }}>
            <Toolbar>
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1, color: '#3b82f6' }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                IndustrialPro
              </Typography>
              <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32, fontSize: 14, fontWeight: 700 }}>
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
            </Toolbar>
          </AppBar>

          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { bgcolor: '#111827', borderRight: '1px solid rgba(59,130,246,0.1)', width: 250 } }}>
            <Toolbar>
              <Typography variant="h6" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                IndustrialPro
              </Typography>
            </Toolbar>
            <List>
              {navItems.map(item => (
                <ListItemButton key={item.id} selected={view === item.id} onClick={() => { setView(item.id); setDrawerOpen(false); }}
                  sx={{ mx: 1, borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(59,130,246,0.12)' } }}>
                  <ListItemIcon sx={{ color: view === item.id ? 'primary.main' : 'text.secondary', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
              <ListItemButton onClick={() => { setToken(null); setUser(null); }} sx={{ mx: 1, borderRadius: 2, mt: 2 }}>
                <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Cerrar Sesión" />
              </ListItemButton>
            </List>
          </Drawer>

          <Box component="main" sx={{ flex: 1, mt: '64px', p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', width: '100%' }}>
            {renderView()}
          </Box>
        </Box>
      )}
    </ThemeProvider>
  );
}
