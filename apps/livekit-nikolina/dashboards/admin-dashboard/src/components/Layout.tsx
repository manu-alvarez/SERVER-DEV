import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, CssBaseline, Drawer, IconButton, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText,
    Typography, Avatar, Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    EventSeat as TablesIcon,
    BookOnline as ReservationsIcon,
    PhoneInTalk as CallsIcon,
    Settings as SettingsIcon,
    Restaurant as RestaurantIcon,
    MenuBook as MenuBookIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Reservas', icon: <ReservationsIcon />, path: '/reservations' },
    { text: 'Mesas', icon: <TablesIcon />, path: '/tables' },
    { text: 'Carta', icon: <MenuBookIcon />, path: '/menu' },
    { text: 'Llamadas IA', icon: <CallsIcon />, path: '/calls' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Logo */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}>
                <Avatar sx={{
                    bgcolor: 'transparent',
                    border: '2px solid rgba(212, 168, 83, 0.5)',
                    width: 42,
                    height: 42,
                }}>
                    <RestaurantIcon sx={{
                        fontSize: 22,
                        color: '#d4a853',
                    }} />
                </Avatar>
                <Box>
                    <Typography sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #d4a853 0%, #e8c97a 50%, #d4a853 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1.2,
                    }}>
                        MSB
                    </Typography>
                    <Typography sx={{
                        fontSize: '0.6rem',
                        color: 'text.secondary',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                    }}>
                        Restaurant
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.04)' }} />

            {/* Navigation */}
            <List sx={{ px: 1.5, pt: 2, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={isActive}
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileOpen(false);
                                }}
                                sx={{
                                    borderRadius: '12px',
                                    py: 1.2,
                                    px: 2,
                                    transition: 'all 0.2s ease',
                                    '&.Mui-selected': {
                                        bgcolor: 'rgba(124, 58, 237, 0.12)',
                                        borderLeft: '3px solid #7c3aed',
                                        '&:hover': {
                                            bgcolor: 'rgba(124, 58, 237, 0.16)',
                                        },
                                    },
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{
                                    color: isActive ? '#a78bfa' : '#64748b',
                                    minWidth: 40,
                                    transition: 'color 0.2s ease',
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? '#f1f5f9' : '#94a3b8',
                                    }}
                                />
                                {isActive && (
                                    <Box sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: '#7c3aed',
                                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                                    }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <Typography sx={{
                    fontSize: '0.65rem',
                    color: '#475569',
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                }}>
                    MSB SOLUTIONS · v2.0
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />

            {/* Mobile hamburger */}
            <Box sx={{
                position: 'fixed',
                top: 16,
                left: 16,
                zIndex: 1300,
                display: { sm: 'none' },
            }}>
                <IconButton
                    onClick={handleDrawerToggle}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#f1f5f9',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            </Box>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 4 },
                    pt: { xs: 8, sm: 4 },
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
