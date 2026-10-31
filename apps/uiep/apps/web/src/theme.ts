import { createTheme, alpha } from '@mui/material/styles'
import type { ChipProps } from '@mui/material/Chip'
import type { RunStatus } from './lib/api'

/** Tema del Control Center — oscuro, sobrio, operacional (referencia del mockup). */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c8cff' },
    secondary: { main: '#22d3ee' },
    success: { main: '#2fbf71' },
    warning: { main: '#f5a524' },
    error: { main: '#e5484d' },
    info: { main: '#38bdf8' },
    background: { default: '#0a0f1c', paper: '#111827' },
    divider: 'rgba(148, 163, 184, 0.16)',
    text: { primary: '#e6e9f2', secondary: '#94a3b8' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: alpha('#94a3b8', 0.18) },
      },
    },
    MuiChip: {
      variants: [
        {
          props: { variant: 'status' } as never,
          style: { fontWeight: 600, letterSpacing: '0.01em' },
        },
      ],
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: 'outlined' },
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
