import { createTheme, alpha } from '@mui/material/styles'
import type { ChipProps } from '@mui/material/Chip'
import type { RunStatus } from './lib/api'

/**
 * Tema UIEP 1.1 — identidad "plataforma de ingeniería de IA".
 * Fondo profundo casi negro azulado; acentos azul eléctrico, cian y violeta.
 * Los resplandores son selectivos (botones primarios, estados, navegación
 * activa, hero): el resto permanece sobrio y legible.
 * Sin animaciones decorativas bajo `prefers-reduced-motion: reduce`.
 */
export const NEON = {
  bg: '#05070f',
  bgElev: '#0a1020',
  paper: '#0b1122',
  blue: '#4f7dff',
  blueSoft: '#7c9bff',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  textPrimary: '#e8ebf6',
  textSecondary: '#93a0ba',
  /** Gradiente de marca (botones, logo, títulos destacados). */
  brandGradient: 'linear-gradient(135deg, #4f7dff 0%, #22d3ee 130%)',
  /** Resplandor del acento primario. */
  glowPrimary: '0 2px 16px rgba(79, 125, 255, 0.35)',
  glowPrimaryHover: '0 4px 26px rgba(79, 125, 255, 0.55)',
} as const

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: NEON.blue, light: NEON.blueSoft, dark: '#2f56d9' },
    secondary: { main: NEON.cyan },
    success: { main: '#34d399' },
    warning: { main: '#fbbf24' },
    error: { main: '#f24e5d' },
    info: { main: '#38bdf8' },
    background: { default: NEON.bg, paper: NEON.paper },
    divider: 'rgba(124, 140, 255, 0.14)',
    text: { primary: NEON.textPrimary, secondary: NEON.textSecondary },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: alpha(NEON.blue, 0.2),
          backgroundImage:
            'linear-gradient(180deg, rgba(20, 28, 56, 0.55) 0%, rgba(9, 13, 28, 0.92) 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
        containedPrimary: {
          background: NEON.brandGradient,
          boxShadow: NEON.glowPrimary,
          transition: 'box-shadow .25s ease, filter .25s ease',
          '&:hover': {
            boxShadow: NEON.glowPrimaryHover,
            filter: 'brightness(1.08)',
            background: NEON.brandGradient,
          },
          '&:focus-visible': { boxShadow: '0 0 0 3px rgba(79,125,255,0.35)' },
        },
        outlined: {
          borderColor: alpha(NEON.blue, 0.35),
          transition: 'border-color .2s ease, background-color .2s ease',
          '&:hover': { borderColor: alpha(NEON.blue, 0.7), backgroundColor: alpha(NEON.blue, 0.08) },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: {
        root: {
          borderColor: 'rgba(99, 140, 255, 0.18)',
          backgroundImage:
            'linear-gradient(180deg, rgba(20, 28, 56, 0.6) 0%, rgba(9, 13, 28, 0.94) 100%)',
          transition: 'border-color .25s ease, box-shadow .25s ease, transform .25s ease',
          '&:hover': { borderColor: 'rgba(99, 140, 255, 0.38)' },
        },
      },
    },
    MuiChip: {
      variants: [
        {
          props: { variant: 'status' } as never,
          style: {
            fontWeight: 600,
            letterSpacing: '0.02em',
            // Indicadores de estado con resplandor propio, cada color distinto.
            '&.MuiChip-colorSuccess': { boxShadow: '0 0 12px rgba(52, 211, 153, 0.3)' },
            '&.MuiChip-colorError': { boxShadow: '0 0 12px rgba(242, 78, 93, 0.3)' },
            '&.MuiChip-colorWarning': { boxShadow: '0 0 12px rgba(251, 191, 36, 0.25)' },
            '&.MuiChip-colorPrimary': { boxShadow: '0 0 12px rgba(79, 125, 255, 0.32)' },
            '&.MuiChip-colorInfo': { boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)' },
            '&.MuiChip-colorSecondary': { boxShadow: '0 0 12px rgba(34, 211, 238, 0.25)' },
          },
        },
      ],
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'box-shadow .2s ease, border-color .2s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(NEON.blue, 0.5) },
          '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(79, 125, 255, 0.16)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: NEON.blue },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color .2s ease, box-shadow .2s ease',
          '&.Mui-active, &.active': {
            backgroundColor: 'rgba(79, 125, 255, 0.13)',
            boxShadow: 'inset 0 0 0 1px rgba(99, 140, 255, 0.28)',
            '& .MuiListItemText-primary': { color: NEON.blueSoft, fontWeight: 600 },
            '& .MuiListItemIcon-root svg': {
              color: NEON.blueSoft,
              filter: 'drop-shadow(0 0 6px rgba(79, 125, 255, 0.55))',
            },
          },
        },
      },
    },
  },
})

export const runStatusColor = (status: RunStatus): ChipProps['color'] =>
  status === 'completed'
    ? 'success'
    : status === 'completed_without_tools'
      ? 'info'
      : status === 'running'
        ? 'primary'
        : status === 'failed'
          ? 'error'
          : status === 'timeout'
            ? 'warning'
            : status === 'requires_approval'
              ? 'warning'
              : 'secondary' // max_iterations_reached

export const runStatusLabel = (status: RunStatus): string =>
  ({
    running: 'RUNNING',
    completed: 'COMPLETED',
    completed_without_tools: 'SIN TOOLS',
    requires_approval: 'REQUIERE APROBACIÓN',
    failed: 'FAILED',
    timeout: 'TIMEOUT',
    max_iterations_reached: 'LÍMITE ITERACIONES',
  })[status]

export const fmtDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' }) : '—'

export const fmtDuration = (ms?: number): string => {
  if (ms === undefined || ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(1)} s`
}
