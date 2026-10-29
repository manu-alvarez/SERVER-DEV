import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Tooltip,
} from '@mui/material';
import {
    PhoneInTalk as CallsIcon,
    Timer as TimerIcon,
    PhoneDisabled as EmptyIcon,
    Assignment as NoteIcon,
} from '@mui/icons-material';
import { getCalls } from '../api';

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
        <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Header MSB Premium Style */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 6 }}>
                <Box sx={{
                    width: 52, height: 52, borderRadius: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(212, 175, 55, 0.05)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    boxShadow: '0 0 40px rgba(212, 175, 55, 0.05)',
                }}>
                    <CallsIcon sx={{ color: '#d4af37', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h4" sx={{ 
                        fontFamily: '"Playfair Display", serif', 
                        fontWeight: 700, 
                        color: '#d4af37', 
                        letterSpacing: '1px' 
                    }}>
                        HISTORIAL DE LLAMADAS
                    </Typography>
                    <Typography variant="body2" sx={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        fontSize: '0.7rem' 
                    }}>
                        Conversaciones gestionadas por Nikolina AI
                    </Typography>
                </Box>
            </Box>

            {/* Table MSB Glassmorphic Style */}
            <TableContainer component={Paper} sx={{
                borderRadius: 0,
                backgroundImage: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                animation: 'fadeInUp 0.6s ease-out 0.2s both',
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.7)',
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '1px' }}>F. / HORA</TableCell>
                            <TableCell sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '1px' }}>IDENTIDAD</TableCell>
                            <TableCell sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '1px' }}>DURACIÓN</TableCell>
                            <TableCell sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '1px' }}>RESULTADO</TableCell>
                            <TableCell sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '1px' }}>RESUMEN</TableCell>
                            <TableCell sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '1px' }}>PETICIONES / NOTAS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {calls.map((c, idx) => {
                            const res = resultConfig[c.result] || resultConfig.unknown;
                            return (
                                <TableRow key={c.id} sx={{
                                    animation: `fadeInUp 0.3s ease-out ${idx * 30}ms both`,
                                    '&:hover': {
                                        backgroundColor: 'rgba(212, 175, 55, 0.03) !important',
                                    },
                                    transition: 'all 0.2s ease',
                                }}>
                                    <TableCell>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>
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
                                            <TimerIcon sx={{ fontSize: 14, color: '#d4af37', opacity: 0.6 }} />
                                            <Typography sx={{
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                fontFamily: '"JetBrains Mono", monospace',
                                                color: c.duration_seconds > 60 ? '#d4af37' : 'rgba(255,255,255,0.5)',
                                            }}>
                                                {formatDuration(c.duration_seconds)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={res.label.toUpperCase()}
                                            size="small"
                                            sx={{
                                                bgcolor: res.bg,
                                                color: res.color,
                                                border: `1px solid ${res.color}40`,
                                                borderRadius: '2px',
                                                fontWeight: 800,
                                                fontSize: '0.65rem',
                                                letterSpacing: '1px',
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
                                                whiteSpace: 'nowrap',
                                                fontStyle: 'italic'
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
                                                    color: '#d4af37',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    maxWidth: 250,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: '2px'
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
                                        <Typography sx={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>PÁGINA SIN REGISTROS ACTIVOS</Typography>
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
