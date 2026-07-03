import { createTheme } from '@mui/material';

const repsolOrange = '#FF6600';
const repsolDark = '#1a1a2e';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: repsolOrange, light: '#FF944D', dark: '#CC5200' },
    secondary: { main: '#00B4D8', light: '#48CAE4', dark: '#0077B6' },
    background: { default: '#0f0f1a', paper: '#1a1a2e' },
    success: { main: '#2ecc71' },
    warning: { main: '#f39c12' },
    error: { main: '#e74c3c' },
    info: { main: '#3498db' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.2rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255,102,0,0.15)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
        containedPrimary: {
          background: `linear-gradient(135deg, ${repsolOrange}, #FF8C00)`,
          '&:hover': { background: `linear-gradient(135deg, #CC5200, ${repsolOrange})` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
      },
    },
  },
});
