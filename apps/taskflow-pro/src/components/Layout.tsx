import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  useTheme, useMediaQuery, Avatar, Paper
} from '@mui/material';
import { Menu as MenuIcon, LayoutDashboard, CheckSquare, Tags, Settings, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../store/taskStore';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/' },
  { text: 'Tareas', icon: <CheckSquare size={22} />, path: '/tasks' },
  { text: 'Categorías', icon: <Tags size={22} />, path: '/categories' },
  { text: 'Ajustes', icon: <Settings size={22} />, path: '/settings' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useTaskStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ my: 3, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Sparkles size={24} color={theme.palette.primary.main} />
          <Typography variant="h5" color="text.primary" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
            TaskFlow<Box component="span" sx={{ color: 'primary.main' }}>Pro</Box>
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5 }}>
          ¿Algo nuevo que podamos organizar?
        </Typography>
      </Toolbar>
      
      <Box sx={{ px: 3, mb: 4 }}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 4, 
          bgcolor: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40, fontWeight: 800 }}>
            {(settings.whatsappPhone1 || 'U')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{settings.whatsappPhone1 || 'Usuario MSB'}</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mx: 2 }} />
      
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/tasks' && location.pathname.startsWith('/tasks'));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  backgroundColor: isActive ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(0, 245, 255, 0.12)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? 'primary.light' : 'text.primary',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                   primary={item.text} 
                   slotProps={{ primary: { sx: { 
                     fontWeight: isActive ? 800 : 500,
                     fontSize: '0.95rem'
                   }}}} 
                />
                {isActive && (
                  <motion.div layoutId="activeNav" style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: theme.palette.primary.main }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ p: 3 }}>
         <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(0, 245, 255, 0.05)', border: '1px solid rgba(0, 245, 255, 0.1)' }}>
           <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>MSBrossAI</Typography>
           <Typography variant="caption" color="text.secondary" component="a" href="https://msbross.me/" target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>
             https://msbross.me/
           </Typography>
         </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: 'none' },
          width: '100%',
          bgcolor: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>
            TaskFlow<Box component="span" sx={{ color: 'text.primary' }}>Pro</Box>
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundImage: 'none', borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundImage: 'none', borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 5 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 0 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default Layout;
