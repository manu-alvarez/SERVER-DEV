import { useState, useEffect } from 'react'
import {
    Drawer, Box, Typography, List, ListItem, ListItemButton,
    ListItemText, ListItemIcon, IconButton, Chip, Divider, Stack,
    CircularProgress,
} from '@mui/material'
import {
    Close as CloseIcon,
    DirectionsBoat as ShipIcon,
    Flight as PlaneIcon,
    LocalShipping as TruckIcon,
    ArrowForward as ArrowIcon,
    History as HistoryIcon,
} from '@mui/icons-material'
import { getSearchHistory, type SearchQuery } from '../lib/storage'

interface SearchHistoryProps {
    open: boolean
    onClose: () => void
    onSelectSearch: (query: string) => void
}

const MODE_ICONS: Record<string, typeof ShipIcon> = {
    mar: ShipIcon,
    aire: PlaneIcon,
    tierra: TruckIcon,
}

const MODE_LABELS: Record<string, string> = {
    mar: 'Marítimo',
    aire: 'Aéreo',
    tierra: 'Terrestre',
}

export default function SearchHistory({ open, onClose, onSelectSearch }: SearchHistoryProps) {
    const [history, setHistory] = useState<SearchQuery[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setLoading(true)
            getSearchHistory()
                .then(setHistory)
                .finally(() => setLoading(false))
        }
    }, [open])

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const handleSelect = (item: SearchQuery) => {
        const query = `${item.origin} → ${item.destination} ${item.transport_mode === 'mar' ? 'por mar' : item.transport_mode === 'aire' ? 'aéreo' : 'terrestre'}`
        onSelectSearch(query)
        onClose()
    }

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            slotProps={{ paper: {
                sx: {
                    width: { xs: '100%', sm: 420 },
                    bgcolor: 'background.paper',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                },
            }}}
        >
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HistoryIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h5">Historial</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Loading */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}

                {/* Empty state */}
                {!loading && history.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No hay búsquedas anteriores
                        </Typography>
                    </Box>
                )}

                {/* History list */}
                {!loading && history.length > 0 && (
                    <List disablePadding>
                        {history.map((item, idx) => {
                            const ModeIcon = MODE_ICONS[item.transport_mode] || ShipIcon
                            return (
                                <ListItem
                                    key={item.id || idx}
                                    disablePadding
                                    sx={{
                                        mb: 1,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <ListItemButton
                                        onClick={() => handleSelect(item)}
                                        sx={{
                                            py: 1.5,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <ModeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                                        {item.origin}
                                                    </Typography>
                                                    <ArrowIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                                        {item.destination}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                                                    <Chip
                                                        label={MODE_LABELS[item.transport_mode] || item.transport_mode}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.65rem', borderColor: 'rgba(255,255,255,0.1)' }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                                        {formatDate(item.created_at)}
                                                    </Typography>
                                                </Stack>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )
                        })}
                    </List>
                )}
            </Box>
        </Drawer>
    )
}
