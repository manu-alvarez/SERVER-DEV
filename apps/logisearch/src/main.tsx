import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import theme from './theme'
import App from './App'
import './index.css'

const checkEnv = () => {
  const missing = [];
  if (!import.meta.env.VITE_GEMINI_API_KEY_1 && !import.meta.env.VITE_OPENROUTER_API_KEY) {
    missing.push('AI_PROVIDER_KEYS');
  }
  if (!import.meta.env.VITE_GEMINI_API_KEY) missing.push('VITE_GEMINI_API_KEY');
  if (missing.length > 0) {
    console.warn('⚠️ Faltan variables de entorno para LogiSearch:', missing.join(', '));
  }
}
checkEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
