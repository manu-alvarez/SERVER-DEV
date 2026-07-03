import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Badge } from '@mui/material';
import { theme } from './theme';
import { api, getToken, setToken } from './api/client';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import CheckListView from './components/CheckListView';
import ExpiryView from './components/ExpiryView';
import IncidentsView from './components/IncidentsView';
import TimesheetView from './components/TimesheetView';
import SettingsView from './components/SettingsView';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'checklist', label: 'Checklists', icon: <ChecklistIcon /> },
  { id: 'expiry', label: 'Caducidades', icon: <WarningAmberIcon /> },
  { id: 'incidents', label: 'Incidencias', icon: <ReportProblemIcon /> },
  { id: 'timesheet', label: 'Timesheet', icon: <AccessTimeIcon /> },
  { id: 'settings', label: 'Ajustes', icon: <SettingsIcon /> },
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.me().then(u => setUser(u)).catch(() => { setToken(null); }).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard user={user} onNavigate={v => { setView(v); setDrawerOpen(false); }} />;
      case 'checklist': return <CheckListView />;
      case 'expiry': return <ExpiryView />;
      case 'incidents': return <IncidentsView />;
      case 'timesheet': return <TimesheetView />;
      case 'settings': return <SettingsView user={user} onLogout={() => { setToken(null); setUser(null); }} />;
      default: return <Dashboard user={user} onNavigate={v => setView(v)} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {checking ? null : !user ? (
        <LoginScreen onLogin={u => setUser(u)} />
      ) : (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="fixed" sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(255,102,0,0.2)', boxShadow: 'none' }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: 'primary.main' }}>
              Gas Station
            </Typography>
            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14, fontWeight: 700 }}>
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </Toolbar>
        </AppBar>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { bgcolor: 'background.paper', borderRight: '1px solid rgba(255,102,0,0.1)', width: 250 } }}>
          <Toolbar>
            <Typography variant="h6" fontWeight={700} color="primary.main">Gas Station</Typography>
          </Toolbar>
          <List>
            {navItems.map(item => (
              <ListItemButton key={item.id} selected={view === item.id} onClick={() => { setView(item.id); setDrawerOpen(false); }}
                sx={{ mx: 1, borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(255,102,0,0.12)' } }}>
                <ListItemIcon sx={{ color: view === item.id ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
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
