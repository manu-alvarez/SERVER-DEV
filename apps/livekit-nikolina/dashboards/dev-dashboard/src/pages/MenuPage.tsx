import { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Select,
    MenuItem, FormControlLabel, Switch, Alert, Tooltip, Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Restaurant as RestaurantIcon,
    Star as StarIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../api';

interface MenuItemData {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    allergens: string;
    is_available: boolean;
    is_daily_special: boolean;
}

const CATEGORIES = [
    { value: 'entrante', label: '🥗 Entrantes' },
    { value: 'principal', label: '🍽️ Principales' },
    { value: 'postre', label: '🍰 Postres' },
    { value: 'bebida', label: '🍷 Bebidas' },
    { value: 'tapa', label: '🧂 Tapas' },
    { value: 'especial', label: '⭐ Especiales' },
];

const emptyItem: Omit<MenuItemData, 'id'> = {
    name: '',
    description: '',
    category: 'principal',
    price: 0,
    allergens: '',
    is_available: true,
    is_daily_special: false,
};

export default function MenuPage() {
    const [items, setItems] = useState<MenuItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<MenuItemData> | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadMenu = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMenu(filter || undefined, false);
            setItems(res.data);
        } catch (e) {
            console.error('Error loading menu', e);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { loadMenu(); }, [loadMenu]);

    const handleAdd = () => {
        setEditingItem({ ...emptyItem });
        setIsNew(true);
        setDialogOpen(true);
    };

    const handleEdit = (item: MenuItemData) => {
        setEditingItem({ ...item });
        setIsNew(false);
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que quieres eliminar este plato de la carta?')) return;
        try {
            await deleteMenuItem(id);
            setAlert({ type: 'success', message: 'Plato eliminado correctamente' });
            loadMenu();
        } catch {
            setAlert({ type: 'error', message: 'Error al eliminar el plato' });
        }
    };

    const handleSave = async () => {
        if (!editingItem?.name) return;
        try {
            if (isNew) {
                await createMenuItem(editingItem);
                setAlert({ type: 'success', message: 'Plato añadido a la carta' });
            } else {
                await updateMenuItem(editingItem.id!, editingItem);
                setAlert({ type: 'success', message: 'Plato actualizado correctamente' });
            }
            setDialogOpen(false);
            loadMenu();
        } catch {
            setAlert({ type: 'error', message: 'Error al guardar el plato' });
        }
    };

    const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;

    const stats = {
        total: items.length,
        available: items.filter(i => Boolean(i.is_available)).length,
        specials: items.filter(i => Boolean(i.is_daily_special)).length,
        categories: new Set(items.map(i => i.category)).size,
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RestaurantIcon sx={{ color: '#d4a853' }} /> Carta del Restaurante
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gestiona los platos, precios y alérgenos que Nikolina ofrece a los clientes
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    sx={{
                        background: 'linear-gradient(135deg, #d4a853 0%, #e8c97a 100%)',
                        color: '#1a1a2e',
                        fontWeight: 600,
                        '&:hover': {
                            background: 'linear-gradient(135deg, #e8c97a 0%, #d4a853 100%)',
                        },
                    }}
                >
                    Añadir Plato
                </Button>
            </Box>

            {alert && (
                <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
                    {alert.message}
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Platos', value: stats.total, color: '#7c3aed' },
                    { label: 'Disponibles', value: stats.available, color: '#10b981' },
                    { label: 'Especiales', value: stats.specials, color: '#f59e0b' },
                    { label: 'Categorías', value: stats.categories, color: '#3b82f6' },
                ].map(s => (
                    <Grid size={{ xs: 6, md: 3 }} key={s.label}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                            <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filter */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <FilterIcon sx={{ color: 'text.secondary' }} />
                <Chip
                    label="Todos"
                    onClick={() => setFilter('')}
                    color={filter === '' ? 'primary' : 'default'}
                    variant={filter === '' ? 'filled' : 'outlined'}
                />
                {CATEGORIES.map(cat => (
                    <Chip
                        key={cat.value}
                        label={cat.label}
                        onClick={() => setFilter(cat.value)}
                        color={filter === cat.value ? 'primary' : 'default'}
                        variant={filter === cat.value ? 'filled' : 'outlined'}
                    />
                ))}
            </Box>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Plato</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Precio</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Alérgenos</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">Cargando carta...</TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No hay platos en esta categoría</TableCell>
                            </TableRow>
                        ) : (
                            items.map(item => (
                                <TableRow key={item.id} sx={{ opacity: Boolean(item.is_available) ? 1 : 0.5 }}>
                                    <TableCell>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {Boolean(item.is_daily_special) && <StarIcon sx={{ fontSize: 16, color: '#f59e0b', mr: 0.5, verticalAlign: 'text-bottom' }} />}
                                                {item.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.description}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={getCategoryLabel(item.category)} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#10b981' }}>{item.price.toFixed(2)}€</TableCell>
                                    <TableCell>
                                        {item.allergens ? (
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {item.allergens.split(',').map(a => (
                                                    <Chip key={a} label={a.trim()} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={Boolean(item.is_available) ? 'Disponible' : 'No disponible'}
                                            size="small"
                                            color={Boolean(item.is_available) ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: '#7c3aed' }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: '#ef4444' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit/Create Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {isNew ? '🍽️ Nuevo Plato' : '✏️ Editar Plato'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField
                        label="Nombre del plato"
                        fullWidth
                        value={editingItem?.name || ''}
                        onChange={e => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <TextField
                        label="Descripción"
                        fullWidth
                        multiline
                        rows={2}
                        value={editingItem?.description || ''}
                        onChange={e => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <Select
                                fullWidth
                                value={editingItem?.category || 'principal'}
                                onChange={e => setEditingItem(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {CATEGORIES.map(c => (
                                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Precio (€)"
                                type="number"
                                fullWidth
                                value={editingItem?.price ?? 0}
                                onChange={e => setEditingItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                inputProps={{ step: 0.5, min: 0 }}
                            />
                        </Grid>
                    </Grid>
                    <TextField
                        label="Alérgenos (separados por coma)"
                        fullWidth
                        value={editingItem?.allergens || ''}
                        onChange={e => setEditingItem(prev => ({ ...prev, allergens: e.target.value }))}
                        placeholder="gluten, lácteos, huevo..."
                    />
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editingItem?.is_available ?? true}
                                    onChange={e => setEditingItem(prev => ({ ...prev, is_available: e.target.checked }))}
                                />
                            }
                            label="Disponible"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editingItem?.is_daily_special ?? false}
                                    onChange={e => setEditingItem(prev => ({ ...prev, is_daily_special: e.target.checked }))}
                                />
                            }
                            label="⭐ Especial del día"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!editingItem?.name}
                        sx={{
                            background: 'linear-gradient(135deg, #d4a853 0%, #e8c97a 100%)',
                            color: '#1a1a2e',
                            fontWeight: 600,
                        }}
                    >
                        {isNew ? 'Añadir' : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
