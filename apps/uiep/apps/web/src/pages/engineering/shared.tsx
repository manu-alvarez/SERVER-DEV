import type { ReactNode } from 'react'
import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { CAPACITY_LABELS, lifecycleColor, executionStatusColor } from '../../lib/engineering'
import type { CatalogEntry, CapabilityMatrix } from '../../lib/api'

/** Cabecera de sección con título y acción opcional. */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }): ReactNode {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 1, mb: 2 }}>
      <Box>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  )
}

/** Las 4 capacidades reales de un tipo del catálogo. */
export function CapacityChips({ entry, compact }: { entry: CatalogEntry; compact?: boolean }): ReactNode {
  const c: CapabilityMatrix = entry.capabilities ?? { schema: false, generator: false, execution: false, validation: false }
  return (
    <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
      {CAPACITY_LABELS.filter(({ key }) => !compact || key !== 'schema').map(({ key, label, hint }) => (
        <Tooltip key={key} title={hint} arrow>
          <Chip
            size="small"
            label={label}
            variant="outlined"
            sx={{
              fontSize: 11,
              height: 20,
              ...(c[key]
                ? key === 'execution'
                  ? { color: 'success.main', borderColor: 'success.main' }
                  : { color: 'primary.light', borderColor: 'primary.light' }
                : { color: 'text.disabled', borderColor: 'divider', textDecoration: 'line-through' }),
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  )
}

/** Chip de ciclo de vida / estado de ejecución. */
export function StateChip({ state, kind }: { state: string | undefined; kind: 'lifecycle' | 'execution' }): ReactNode {
  const color = kind === 'lifecycle' ? lifecycleColor(state) : executionStatusColor(state)
  return (
    <Chip size="small" label={state ?? '—'} color={color} sx={{ fontSize: 11, height: 20 }} />
  )
}

/** Caja JSON plegable con formato. */
export function JsonBox({ data, max }: { data: unknown; max?: number }): ReactNode {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: 'rgba(5, 7, 15, 0.75)',
        border: '1px solid',
        borderColor: 'divider',
        fontSize: 11.5,
        lineHeight: 1.5,
        overflow: 'auto',
        maxHeight: max ?? 320,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'text.secondary',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </Box>
  )
}

/** Par etiqueta/valor compacto. */
export function KV({ k, v }: { k: string; v: ReactNode }): ReactNode {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 118 }}>
        {k}
      </Typography>
      <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', wordBreak: 'break-all' }}>
        {v}
      </Typography>
    </Stack>
  )
}

/** Panel de fondo elevado consistente. */
export function Panel({ children, sx }: { children: ReactNode; sx?: object }): ReactNode {
  return (
    <Paper
      sx={{
        p: { xs: 1.6, sm: 2.4 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'none',
        ...sx,
      }}
    >
      {children}
    </Paper>
  )
}
