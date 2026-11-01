import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip as MuiTooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import { api, type CatalogEntry } from '../../lib/api'
import { capacitySummary } from '../../lib/engineering'
import { CapacityChips, Panel, SectionHeader } from './shared'

/**
 * Engineering Catalog (Misión 15) — los 19 tipos de artefacto UES con sus
 * capacidades REALES (generable/ejecutable/validable), tal y como las
 * declara el catálogo honesto del backend. Sin capacidades inventadas.
 */

export default function Catalog(): ReactNode {
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api.eng
      .catalog()
      .then((list) => setEntries([...list].sort((a, b) => a.type.localeCompare(b.type))))
      .catch(() => setError('No se pudo cargar el catálogo de ingeniería.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  return (
    <Panel>
      <SectionHeader
        title="Catálogo de ingeniería"
        subtitle="Tipos de artefacto UES y capacidades REALES declaradas por el backend (nada simulado)."
        action={
          <RefreshIcon
            data-testid="catalog-refresh"
            onClick={loading ? undefined : load}
            color={loading ? 'disabled' : 'primary'}
            sx={{ cursor: loading ? 'default' : 'pointer' }}
          />
        }
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {entries && (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 260px)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Capacidades reales</TableCell>
                <TableCell>Cómo / hasta dónde</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e) => (
                <MuiTooltip
                  key={e.type}
                  placement="left"
                  arrow
                  title={capacitySummary(e)}
                  componentsProps={{ tooltip: { sx: { maxWidth: 320, fontSize: 12 } } }}
                >
                  <TableRow sx={{ cursor: 'default', '&:hover': { bgcolor: 'rgba(79,125,255,0.05)' } }}>
                    <TableCell sx={{ fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {e.type}
                    </TableCell>
                    <TableCell>
                      <CapacityChips entry={e} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 520 }}>
                        {e.via?.generator ?? e.via?.execution ?? e.via?.validation ?? '—'}
                        {e.notes ? ` — ${e.notes}` : ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </MuiTooltip>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  )
}
