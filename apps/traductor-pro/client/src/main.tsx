import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import App from './App';
import { getAppTheme } from './theme';
import './index.css';

/**
 * moko-Translate ENTRY POINT
 * FORCE DARK ARCHITECTURE
 */
const Root = () => {
  const theme = React.useMemo(() => getAppTheme(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
