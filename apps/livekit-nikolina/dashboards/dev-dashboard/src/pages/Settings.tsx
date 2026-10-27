import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button, Alert, Fade,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { getRestaurantInfo, updateRestaurantInfo } from '../api';

export default function Settings() {
    const [info, setInfo] = useState<any>({});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getRestaurantInfo().then(res => setInfo(res.data)).catch(console.error);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            await updateRestaurantInfo(info);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx={{ maxWidth: '900px', animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Box sx={{
                    width: 42, height: 42, borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(212,168,83,0.15) 100%)',
                    border: '1px solid rgba(245,158,11,0.2)',
                }}>
                    <SettingsIcon sx={{ color: '#fbbf24', fontSize: 22 }} />
                </Box>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Configuración</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Datos del restaurante y horarios
                    </Typography>
                </Box>
            </Box>

            <Fade in={saved}>
                <Alert
                    severity="success"
                    icon={<CheckIcon />}
                    sx={{
                        mb: 3,
                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        '& .MuiAlert-icon': { color: '#10b981' },
                    }}
                >
                    Configuración guardada correctamente
                </Alert>
            </Fade>

            <Paper sx={{ p: 4, borderRadius: '20px' }}>
                {/* Section: Info */}
                <Typography variant="overline" sx={{ color: '#7c3aed', mb: 2, display: 'block' }}>
                    Información General
                </Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Nombre del Restaurante" name="name" value={info.name || ''} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Teléfono Público" name="phone" value={info.phone || ''} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Dirección" name="address" value={info.address || ''} onChange={handleChange} />
                    </Grid>
                </Grid>

                {/* Section: Horarios */}
                <Typography variant="overline" sx={{ color: '#3b82f6', mb: 2, display: 'block' }}>
                    Horarios
                </Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Apertura Comidas" type="time" name="opening_time_lunch" value={info.opening_time_lunch || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Cierre Comidas" type="time" name="closing_time_lunch" value={info.closing_time_lunch || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Apertura Cenas" type="time" name="opening_time_dinner" value={info.opening_time_dinner || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Cierre Cenas" type="time" name="closing_time_dinner" value={info.closing_time_dinner || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Días Abierto" name="days_open" value={info.days_open || ''} onChange={handleChange} helperText="Ej: Lunes a Sábado" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Días Cerrado" name="days_closed" value={info.days_closed || ''} onChange={handleChange} helperText="Ej: Domingo" />
                    </Grid>
                </Grid>

                {/* Section: Capacidad */}
                <Typography variant="overline" sx={{ color: '#10b981', mb: 2, display: 'block' }}>
                    Capacidad y Reglas
                </Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth type="number" label="Capacidad máxima por grupo" name="max_party_size" value={info.max_party_size || 10} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth type="number" label="Duración del turno (min)" name="reservation_slot_minutes" value={info.reservation_slot_minutes || 30} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth multiline rows={3} label="Reglas Especiales" name="special_notes" value={info.special_notes || ''} onChange={handleChange} />
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            sx={{ px: 5 }}
                        >
                            Guardar Configuración
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
