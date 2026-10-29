import { useEffect, useState } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
    EventSeat as TablesIcon,
    Add as AddIcon,
    People as PeopleIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { getTables, createTable, updateTable, deleteTable } from '../api';

const locationConfig: Record<string, { color: string; bg: string }> = {
    interior: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
    terraza: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    privado: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
};

export default function Tables() {
    const [tables, setTables] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [editTableId, setEditTableId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        table_number: '', capacity: '', location: 'interior', description: '', is_active: 1
    });

    const loadTables = () => {
        getTables().then((res) => setTables(res.data)).catch(console.error);
    };

    useEffect(() => { loadTables(); }, []);

    const handleOpen = (t?: any) => {
        if (t) {
            setEditTableId(t.id);
            setFormData({
                table_number: t.table_number.toString(),
                capacity: t.capacity.toString(),
                location: t.location,
                description: t.description || '',
                is_active: t.is_active
            });
        } else {
            setEditTableId(null);
            setFormData({ table_number: '', capacity: '', location: 'interior', description: '', is_active: 1 });
        }
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        const payload = {
            table_number: parseInt(formData.table_number),
            capacity: parseInt(formData.capacity),
            location: formData.location,
            description: formData.description,
            is_active: formData.is_active
        };

        try {
            if (editTableId) {
                await updateTable(editTableId, payload);
            } else {
                await createTable(payload);
            }
            handleClose();
            loadTables();
        } catch (err) {
            alert('Error al guardar la mesa.');
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar esta mesa del servicio? (Pasará a estar inactiva)')) {
            try {
                await deleteTable(id);
                loadTables();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {/* Header */}
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 42, height: 42, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.15) 100%)',
                        border: '1px solid rgba(6,182,212,0.2)',
                    }}>
                        <TablesIcon sx={{ color: '#22d3ee', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Gestión de Mesas</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Añadir Mesa</Button>
            </Box>

            {/* Grid of Table Cards */}
            <Grid container spacing={3}>
                {tables.map((t, idx) => {
                    const loc = locationConfig[t.location] || locationConfig.interior;
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={t.id}>
                            <Card sx={{
                                height: '100%', animation: `fadeInUp 0.4s ease-out ${idx * 60}ms both`, position: 'relative', overflow: 'visible',
                                '&::before': {
                                    content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                    background: t.is_active
                                        ? `linear-gradient(90deg, ${loc.color}, transparent)`
                                        : 'linear-gradient(90deg, #475569, transparent)',
                                },
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{
                                            fontWeight: 700, fontSize: '1.8rem',
                                            background: t.is_active
                                                ? `linear-gradient(135deg, #f1f5f9 0%, ${loc.color} 150%)`
                                                : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        }}>
                                            T{t.table_number}
                                        </Typography>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpen(t)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(t.id)}><DeleteIcon fontSize="small" /></IconButton>
                                        </Box>
                                    </Box>

                                    <Chip
                                        label={t.is_active ? 'Activa' : 'Inactiva'}
                                        size="small"
                                        sx={{
                                            bgcolor: t.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                                            color: t.is_active ? '#10b981' : '#64748b',
                                            border: `1px solid ${t.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
                                            fontWeight: 600, fontSize: '0.7rem', mb: 2, mr: 1
                                        }}
                                    />
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <PeopleIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {t.capacity} personas
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={t.location} size="small"
                                        sx={{
                                            bgcolor: loc.bg, color: loc.color, border: `1px solid ${loc.color}30`,
                                            fontWeight: 500, fontSize: '0.7rem', mt: 1, textTransform: 'capitalize',
                                        }}
                                    />
                                    {t.description && (
                                        <Typography sx={{ color: '#475569', fontSize: '0.75rem', mt: 1.5 }}>
                                            {t.description}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Modal CRUD Mesa */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', background: '#0f172a' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{editTableId ? 'Editar Mesa' : 'Añadir Nueva Mesa'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth label="Número de Mesa" name="table_number" type="number" 
                                           value={formData.table_number} onChange={(e) => setFormData({...formData, table_number: e.target.value})} />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField fullWidth label="Capacidad" name="capacity" type="number" 
                                           value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
                            </Grid>
                        </Grid>
                        
                        <FormControl fullWidth>
                            <InputLabel>Ubicación</InputLabel>
                            <Select label="Ubicación" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value as string})}>
                                <MenuItem value="interior">Interior</MenuItem>
                                <MenuItem value="terraza">Terraza</MenuItem>
                                <MenuItem value="privado">Salón Privado</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select label="Estado" value={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.value as number})}>
                                <MenuItem value={1}>Activa</MenuItem>
                                <MenuItem value={0}>Inactiva (Removida del plano)</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <TextField fullWidth multiline rows={2} label="Descripción (Opcional)" name="description" 
                                   value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.table_number || !formData.capacity}>
                        Guardar Mesa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
