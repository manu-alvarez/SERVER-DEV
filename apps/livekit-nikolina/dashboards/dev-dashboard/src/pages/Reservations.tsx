import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    BookOnline as ReservationsIcon,
    SearchOff as EmptyIcon,
} from '@mui/icons-material';
import { getReservations, cancelReservation, createReservation } from '../api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: 'Confirmada', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    cancelled: { label: 'Cancelada', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
    completed: { label: 'Completada', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    no_show: { label: 'No Show', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
};

export default function Reservations() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    // Modal state
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '', customer_phone: '', date: format(new Date(), 'yyyy-MM-dd'),
        time: '14:00', num_guests: '2', notes: ''
    });

    const fetchReservations = async () => {
        try {
            const res = await getReservations(date);
            setReservations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [date]);

    const handleOpen = () => {
        setFormData({ ...formData, date });
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        try {
            await createReservation({
                ...formData,
                num_guests: parseInt(formData.num_guests)
            });
            handleClose();
            fetchReservations();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Error al crear la reserva. Posiblemente no haya mesas disponibles.');
            console.error(err);
        }
    };

    const handleCancel = async (id: number) => {
        if (confirm('¿Cancelar reserva?')) {
            await cancelReservation(id);
            fetchReservations();
        }
    };

    return (
        <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Header */}
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.15) 100%)',
                        border: '1px solid rgba(124,58,237,0.2)',
                    }}>
                        <ReservationsIcon sx={{ color: '#a78bfa', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>Reservas</Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {format(new Date(date), "EEEE, d MMM yyyy", { locale: es })}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        type="date" size="small" value={date} onChange={(e) => setDate(e.target.value)} sx={{ minWidth: 160 }}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
                        Nueva Reserva
                    </Button>
                </Box>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: '20px', animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Hora</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Teléfono</TableCell>
                            <TableCell>Mesa</TableCell>
                            <TableCell>Pax</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reservations.map((r, idx) => {
                            const st = statusConfig[r.status] || statusConfig.confirmed;
                            return (
                                <TableRow key={r.id} sx={{ animation: `fadeInUp 0.3s ease-out ${idx * 50}ms both` }}>
                                    <TableCell><Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.time}</Typography></TableCell>
                                    <TableCell>{r.customer_name}</TableCell>
                                    <TableCell sx={{ color: '#94a3b8' }}>{r.customer_phone}</TableCell>
                                    <TableCell>
                                        <Chip label={`T${r.table_number} · ${r.table_location}`} size="small"
                                            sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.15)', fontWeight: 700, fontSize: '0.8rem', color: '#a78bfa',
                                        }}>
                                            {r.num_guests}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.color, border: `1px solid ${st.color}30`, fontWeight: 600, fontSize: '0.7rem' }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        {r.status === 'confirmed' && (
                                            <IconButton size="small" onClick={() => handleCancel(r.id)} sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.1)' } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {reservations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Box py={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <EmptyIcon sx={{ fontSize: 48, color: '#334155' }} />
                                        <Typography sx={{ color: '#64748b', fontWeight: 500 }}>No hay reservas para esta fecha</Typography>
                                        <Typography variant="caption" sx={{ color: '#475569' }}>Cambia la fecha o crea una nueva reserva</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal Nueva Reserva */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', background: '#0f172a' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Añadir Reserva Manual</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField fullWidth label="Nombre del Cliente" name="customer_name" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
                        <TextField fullWidth label="Teléfono" name="customer_phone" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth label="Fecha" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth label="Hora" type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                            </Grid>
                        </Grid>
                        <TextField fullWidth label="Número de Personas" type="number" value={formData.num_guests} onChange={(e) => setFormData({...formData, num_guests: e.target.value})} />
                        <TextField fullWidth multiline rows={2} label="Notas (Opcional)" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.customer_name || !formData.date || !formData.time}>
                        Crear Reserva
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
