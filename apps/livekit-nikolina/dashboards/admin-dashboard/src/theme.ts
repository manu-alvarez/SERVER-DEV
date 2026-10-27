import { createTheme } from '@mui/material/styles';

/**
 * MSB Restaurant Dashboard — Premium Luxury System v3.0
 * Palette: Gold (#d4af37), Deep Black (#06060a), Glassmorphism effect.
 */
export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#d4af37', // MSB GOLD
            light: '#f9e29b',
            dark: '#a67c00',
        },
        secondary: {
            main: '#ffffff',
            light: '#ffffff',
            dark: '#cccccc',
        },
        background: {
            default: '#050505',
            paper: 'rgba(10, 10, 15, 0.85)',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
        divider: 'rgba(212, 175, 55, 0.2)',
        error: { main: '#f43f5e' },
        warning: { main: '#f59e0b' },
        success: { main: '#10b981' },
        info: { main: '#3b82f6' },
    },
    typography: {
        fontFamily: '"Outfit", "Inter", -apple-system, sans-serif',
        h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: '0.05em', color: '#d4af37' },
        h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: '0.02em', color: '#d4af37' },
        h3: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        h4: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        h5: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        h6: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#d4af37' },
        button: { fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' },
        overline: { letterSpacing: '5px', fontWeight: 800, fontSize: '0.7rem', color: '#d4af37', textTransform: 'uppercase' },
    },
    shape: {
        borderRadius: 0, // Sharp architectural edges for absolute luxury
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: `
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
                
                body {
                    background-color: #050505;
                    background-image: 
                        radial-gradient(circle at 10% 10%, rgba(212, 175, 55, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.03) 0%, transparent 40%);
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #d4af37; }
            `,
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateY(-10px)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    padding: '14px 32px',
                    fontSize: '0.75rem',
                },
                containedPrimary: {
                    background: '#d4af37',
                    color: '#000000',
                    '&:hover': {
                        background: '#f9e29b',
                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
                    },
                },
                outlinedPrimary: {
                    borderColor: 'rgba(212, 175, 55, 0.4)',
                    color: '#d4af37',
                    '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.05)',
                        borderColor: '#d4af37',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(5, 5, 5, 0.98)',
                    backdropFilter: 'blur(50px)',
                    borderRight: '1px solid rgba(212, 175, 55, 0.15)',
                    width: 280,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(5, 5, 5, 0.8)',
                    backdropFilter: 'blur(30px)',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                    boxShadow: 'none',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    color: '#d4af37',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    fontSize: '0.65rem',
                    padding: '20px',
                    borderBottom: '2px solid rgba(212, 175, 55, 0.2)',
                },
                root: {
                    padding: '16px 20px',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.05)',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.04) !important',
                    },
                },
            },
        },
    },
});
