import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Tooltip,
} from '@mui/material';
import {
    Timer as TimerIcon,
    PhoneDisabled as EmptyIcon,
    Assignment as NoteIcon,
} from '@mui/icons-material';
import { getCalls } from '../api';
import { PageHeader } from '../components/PageShell';

const resultConfig: Record<string, { label: string; color: string; bg: string }> = {
    'Reserva': { label: 'Reserva', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    'Cancelación': { label: 'Cancelación', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
    'Modificación': { label: 'Modificación', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    'Nula/Consulta': { label: 'Consulta', color: '#d4af37', bg: 'rgba(212,175,55,0.1)' },
    'unknown': { label: 'En Curso...', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

export default function Calls() {
    const [calls, setCalls] = useState<any[]>([]);

    useEffect(() => {
        getCalls(100).then((res) => setCalls(res.data)).catch(console.error);
    }, []);

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Box>
            <PageHeader
                title="Llamadas IA"
                subtitle="Conversaciones gestionadas por Nikolina AI"
            />

            {/* Table — glass tokens + theme table overrides (gold uppercase heads) */}
            <TableContainer component={Paper} sx={{
                borderRadius: '14px',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>F. / HORA</TableCell>
                            <TableCell>IDENTIDAD</TableCell>
                            <TableCell>DURACIÓN</TableCell>
                            <TableCell>RESULTADO</TableCell>
                            <TableCell>RESUMEN</TableCell>
                            <TableCell>PETICIONES / NOTAS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {calls.map((c) => {
                            const res = resultConfig[c.result] || resultConfig.unknown;
                            return (
                                <TableRow key={c.id} sx={{ transition: 'all 0.2s ease' }}>
                                    <TableCell>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                            {new Date(c.started_at).toLocaleDateString('es-ES')}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: '"JetBrains Mono", monospace' }}>
                                            {new Date(c.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                                        {c.caller_id || 'Usuario Web'}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <TimerIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                            <Typography sx={{
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                fontFamily: '"JetBrains Mono", monospace',
                                                color: c.duration_seconds > 60 ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                            }}>
                                                {formatDuration(c.duration_seconds)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={res.label}
                                            size="small"
                                            sx={{
                                                bgcolor: res.bg,
                                                color: res.color,
                                                border: `1px solid ${res.color}40`,
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={c.summary || 'Sin resumen'}>
                                            <Typography sx={{
                                                color: 'rgba(255,255,255,0.5)',
                                                fontSize: '0.75rem',
                                                maxWidth: 220,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {c.summary || '—'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        {c.notes ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <NoteIcon sx={{ fontSize: 16, color: '#d4af37', opacity: 0.8 }} />
                                                <Typography sx={{
                                                    color: 'rgba(255,255,255,0.7)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    maxWidth: 250,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: '6px'
                                                }}>
                                                    {c.notes}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>—</Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {calls.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Box py={8} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <EmptyIcon sx={{ fontSize: 48, color: 'rgba(212, 175, 55, 0.1)' }} />
                                        <Typography sx={{ color: 'rgba(255,255,255,0.3)' }}>Sin llamadas registradas todavía</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
