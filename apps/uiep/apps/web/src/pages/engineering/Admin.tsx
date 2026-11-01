import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, Chip, IconButton, LinearProgress, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import { api, type IamUserPub } from '../../lib/api'
import { truncate } from '../../lib/engineering'
import { Panel, SectionHeader, StateChip } from './shared'

/**
 * Administración de identidad (Misión FINAL): usuarios/tenants/roles gestionados
 * SOLO por el admin de plataforma. Los roles dan permisos granulares reales
 * (read/write/run/cancel/manage) aplicados por el BFF en TODAS las rutas.
 */

export default function Admin(): ReactNode {
  const [users, setUsers] = useState<IamUserPub[] | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [role, setRole] = useState('operator')
  const [me, setMe] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    api.eng.iam.me().then((m) => setMe(`${m.principal.username} (${m.principal.role} · tenant ${m.principal.tenantId})`)).catch(() => setMe(null))
    api.eng
      .iam.users()
      .then((r) => setUsers(r.users))
      .catch((e) => {
        const status = (e as { status?: number }).status
        setError(status === 403 ? 'Solo el admin de plataforma puede gestionar usuarios.' : 'No se pudo cargar la lista de usuarios.')
        setUsers([])
      })
  }, [])

  useEffect(load, [load])

  const create = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await api.eng.iam.create({ username, password, tenantId, role })
      setMessage(`Usuario ${username} creado (${role} · tenant ${tenantId}).`)
      setUsername('')
      setPassword('')
      setTenantId('')
      load()
    } catch (e) {
      const payload = (e as { payload?: { error?: string } }).payload
      setError(truncate(JSON.stringify(payload ?? 'error'), 160))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (u: string) => {
    try {
      await api.eng.iam.remove(u)
      setMessage(`Usuario ${u} eliminado.`)
      load()
    } catch {
      setError(`No se pudo eliminar ${u}.`)
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Identidad y acceso (IAM)"
        subtitle="Usuarios por tenant con roles y permisos granulares aplicados por el BFF. El admin de plataforma gestiona el resto de cuentas."
        action={<RefreshIcon onClick={load} color="primary" sx={{ cursor: 'pointer' }} />}
      />
      {me && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Sesión: <b>{me}</b>
        </Typography>
      )}
      {busy && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 3, alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
        <TextField size="small" label="usuario" value={username} onChange={(e) => setUsername(e.target.value)} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
        <TextField size="small" label="contraseña (10+)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField size="small" label="tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
        <TextField
          size="small"
          select
          label="rol"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          sx={{ minWidth: 130 }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 200 } } } }}
        >
          {['viewer', 'operator', 'admin'].map((r) => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
        </TextField>
        <Button variant="contained" startIcon={<PersonAddIcon />} disabled={busy || !username || !password || !tenantId} onClick={create}>
          Crear usuario
        </Button>
      </Stack>

      <Stack spacing={1}>
        {(users ?? []).map((u) => (
          <Stack key={u.id} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ alignItems: { sm: 'center' } }}>
            <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Menlo, monospace', minWidth: 150 }}>{u.username}</Typography>
            <Chip size="small" label={`tenant: ${u.tenantId}`} variant="outlined" sx={{ fontSize: 11 }} />
            <StateChip kind="lifecycle" state={u.role === 'admin' ? 'deployed' : u.role === 'operator' ? 'ready' : 'draft'} />
            <Typography variant="caption" color="text.secondary">rol: {u.role}</Typography>
            <Tooltip title="Eliminar usuario">
              <IconButton size="small" onClick={() => remove(u.username)} aria-label={`eliminar ${u.username}`}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
        {users !== null && users.length === 0 && <Typography variant="body2" color="text.secondary">Sin usuarios IAM registrados (los operadores usan la sesión de plataforma).</Typography>}
      </Stack>
    </Panel>
  )
}
