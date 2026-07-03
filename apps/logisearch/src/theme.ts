import { createTheme, alpha } from '@mui/material/styles'

// LogiSearch AI — Material Design 3 Theme
// Navy + Cyan color scheme with premium dark mode

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00E5FF',     // Cyan más brillante y luminoso
            light: '#84FFFF',
            dark: '#00B8D4',
            contrastText: '#000000', // Texto oscuro sobre botones cyan para max legibilidad
        },
        secondary: {
            main: '#0891B2',
            light: '#22D3EE',
            dark: '#0E7490',
        },
        background: {
            default: '#050505',  // Casi negro absoluto (Deep Black)
            paper: '#0C0C0C',    // Tarjetas muy oscuras para separar del fondo
        },
        surface: {
            main: '#121212',
            light: '#1e1e1e',
            dark: '#000000',
        },
        success: {
            main: '#06B6D4',
            light: '#67E8F9',
            dark: '#0891B2',
        },
        warning: {
            main: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
        },
        error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
        },
        text: {
            primary: '#FFFFFF',  // Blanco puro para data clave
            secondary: '#A1A1AA', // Zinc 400 luminoso pero sutil
            disabled: '#52525B', // Zinc 600
        },
        divider: 'rgba(255, 255, 255, 0.1)',
        action: {
            hover: 'rgba(0, 180, 216, 0.08)',
            selected: 'rgba(0, 180, 216, 0.16)',
            focus: 'rgba(0, 180, 216, 0.12)',
        },
    },
    typography: {
        fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        h1: {
            fontSize: '2.75rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.015em',
            lineHeight: 1.3,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        h5: {
            fontSize: '1.1rem',
            fontWeight: 600,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            color: '#94A3B8',
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#94A3B8',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none' as const,
            letterSpacing: '0.01em',
        },
        caption: {
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.02em',
        },
        overline: {
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
        },
    },
    shape: {
        borderRadius: 16,
    },
    shadows: [
        'none',
        '0 2px 8px rgba(0,0,0,0.3)',
        '0 4px 12px rgba(0,0,0,0.3)',
        '0 6px 16px rgba(0,0,0,0.3)',
        '0 8px 24px rgba(0,0,0,0.35)',
        '0 10px 28px rgba(0,0,0,0.35)',
        '0 12px 32px rgba(0,0,0,0.4)',
        '0 14px 36px rgba(0,0,0,0.4)',
        '0 16px 40px rgba(0,0,0,0.4)',
        '0 18px 44px rgba(0,0,0,0.45)',
        '0 20px 48px rgba(0,0,0,0.45)',
        '0 22px 52px rgba(0,0,0,0.45)',
        '0 24px 56px rgba(0,0,0,0.5)',
        '0 26px 60px rgba(0,0,0,0.5)',
        '0 28px 64px rgba(0,0,0,0.5)',
        '0 30px 68px rgba(0,0,0,0.55)',
        '0 32px 72px rgba(0,0,0,0.55)',
        '0 34px 76px rgba(0,0,0,0.55)',
        '0 36px 80px rgba(0,0,0,0.6)',
        '0 38px 84px rgba(0,0,0,0.6)',
        '0 40px 88px rgba(0,0,0,0.6)',
        '0 42px 92px rgba(0,0,0,0.65)',
        '0 44px 96px rgba(0,0,0,0.65)',
        '0 46px 100px rgba(0,0,0,0.65)',
        '0 48px 104px rgba(0,0,0,0.7)',
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '*': {
                    margin: 0,
                    padding: 0,
                    boxSizing: 'border-box',
                },
                html: {
                    scrollBehavior: 'smooth',
                },
                body: {
                    minHeight: '100vh',
                    backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(0, 229, 255, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%),
            linear-gradient(180deg, #050505 0%, #000000 100%)
          `,
                    backgroundAttachment: 'fixed',
                },
                '::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px',
                },
                '::-webkit-scrollbar-track': {
                    background: 'transparent',
                },
                '::-webkit-scrollbar-thumb': {
                    background: 'rgba(0, 180, 216, 0.3)',
                    borderRadius: '3px',
                },
                '::-webkit-scrollbar-thumb:hover': {
                    background: 'rgba(0, 180, 216, 0.5)',
                },
            },
        },
        MuiCard: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    background: 'rgba(20, 20, 20, 0.6)', // Glassmorphism oscuro
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 16,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.MuiButton-containedPrimary': {
                        background: 'linear-gradient(135deg, #00E5FF, #00B8D4)',
                        color: '#000000',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #84FFFF, #00E5FF)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 30px rgba(0, 229, 255, 0.25)',
                        },
                    },
                    '&.MuiButton-outlinedPrimary': {
                        borderWidth: 2,
                        '&:hover': {
                            borderWidth: 2,
                            background: alpha('#00E5FF', 0.08),
                        },
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.04)',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 2,
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(0, 180, 216, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#00E5FF',
                            boxShadow: '0 0 0 4px rgba(0, 180, 216, 0.15)',
                        },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 20,
                },
                colorPrimary: {
                    background: alpha('#00E5FF', 0.15),
                    color: '#84FFFF',
                    border: `1px solid ${alpha('#00E5FF', 0.3)}`,
                },
                colorSuccess: {
                    background: alpha('#06B6D4', 0.15),
                    color: '#67E8F9',
                    border: `1px solid ${alpha('#06B6D4', 0.3)}`,
                },
            },
        },
        MuiAppBar: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    background: 'rgba(5, 5, 5, 0.85)',
                    backdropFilter: 'blur(24px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    background: '#001A33',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 20,
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
                bar: {
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #00E5FF, #00B8D4)',
                },
            },
        },
        MuiRating: {
            styleOverrides: {
                root: {
                    color: '#FBBF24',
                },
                iconEmpty: {
                    color: 'rgba(255, 255, 255, 0.15)',
                },
            },
        },
        MuiStepper: {
            styleOverrides: {
                root: {
                    padding: '16px 0',
                },
            },
        },
        MuiStepIcon: {
            styleOverrides: {
                root: {
                    color: 'rgba(255, 255, 255, 0.15)',
                    '&.Mui-active': {
                        color: '#00E5FF',
                    },
                    '&.Mui-completed': {
                        color: '#06B6D4',
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    background: '#002147',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                },
            },
        },
        MuiSnackbar: {
            defaultProps: {
                anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(90deg, #00E5FF, #00B8D4)',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 48,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        background: alpha('#00E5FF', 0.15),
                    },
                },
            },
        },
    },
})

// Augment module for custom palette
declare module '@mui/material/styles' {
    interface Palette {
        surface: Palette['primary']
    }
    interface PaletteOptions {
        surface?: PaletteOptions['primary']
    }
}

export default theme
