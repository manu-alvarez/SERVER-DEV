import { createTheme } from '@mui/material/styles';

export const getAppTheme = () =>
  createTheme({
    typography: {
      fontFamily: '"Inter", "Outfit", sans-serif',
      h3: { fontWeight: 800 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 700, textTransform: 'none' },
    },
    palette: {
      mode: 'dark',
      primary: { main: '#6ee7b7' },
      secondary: { main: '#10b981' },
      background: { default: '#050508', paper: 'transparent' },
      text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.6)' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          containedPrimary: {
            background: 'linear-gradient(135deg, #10b981, #6ee7b7)',
            '&:hover': { background: 'linear-gradient(135deg, #059669, #34d399)' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255,255,255,0.03)',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(110,231,183,0.5)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6ee7b7' },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: { backgroundColor: 'rgba(255,255,255,0.05)' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(11,11,16,0.98)',
            backgroundImage: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },
    },
  });
