import { createTheme } from '@mui/material/styles';

/**
 * MSB Developer Console — Premium Engineering Edition v5.0
 */
export const darkNeonTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#d4af37', // MSB GOLD
            light: '#f9e29b',
            dark: '#a67c00',
        },
        secondary: {
            main: '#06b6d4', // Engineering Cyan
            light: '#22d3ee',
            dark: '#0891b2',
        },
        background: {
            default: '#050505',
            paper: 'rgba(10, 10, 15, 0.9)',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.6)',
        },
        divider: 'rgba(212, 175, 55, 0.2)',
        error: { main: '#f43f5e' },
        warning: { main: '#f59e0b' },
        success: { main: '#10b981' },
        info: { main: '#3b82f6' },
    },
    typography: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#d4af37', letterSpacing: '2px' },
        h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#d4af37', letterSpacing: '1px' },
        h3: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        h4: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        h5: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        h6: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        button: { fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' },
        overline: { letterSpacing: '4px', fontWeight: 800, color: 'rgba(212, 175, 55, 0.8)' },
    },
    shape: { borderRadius: 0 },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
                
                body {
                    background-color: #050505;
                    background-image: 
                        radial-gradient(circle at 5% 5%, rgba(212, 175, 55, 0.06) 0%, transparent 35%),
                        radial-gradient(circle at 95% 95%, rgba(6, 182, 212, 0.02) 0%, transparent 35%);
                    min-height: 100vh;
                }

                pre, code, .tech-mono {
                    font-family: 'JetBrains Mono', monospace !important;
                }

                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-thumb { background: #d4af37; }
            `,
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        transform: 'translateY(-5px)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 0, padding: '10px 24px', fontSize: '0.7rem' },
                containedPrimary: {
                    background: '#d4af37',
                    color: '#000000',
                    '&:hover': {
                        background: '#f9e29b',
                        boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(5, 5, 5, 0.98)',
                    backdropFilter: 'blur(30px)',
                    borderRight: '1px solid rgba(212, 175, 55, 0.15)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(5, 5, 5, 0.85)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                    boxShadow: 'none',
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                thumb: { 
                    color: '#d4af37',
                    '&:hover': { boxShadow: '0 0 0 8px rgba(212, 175, 55, 0.1)' } 
                },
                track: { color: '#d4af37' },
                rail: { color: 'rgba(255,255,255,0.1)' },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    '&.Mui-checked': { color: '#d4af37' },
                    '&.Mui-checked + .MuiSwitch-track': { backgroundColor: '#d4af37' },
                },
            },
        },
    },
});
