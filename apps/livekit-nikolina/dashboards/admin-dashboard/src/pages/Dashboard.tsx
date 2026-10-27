import { useEffect, useState } from 'react';
import { Grid, Typography, Box, Skeleton, Chip } from '@mui/material';
import {
    BookOnline as ReservationsIcon,
    Groups as GuestsIcon,
    SmartToy as AIIcon,
    Cancel as CancelIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { getStats } from '../api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader, Panel, StatTile } from '../components/PageShell';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const date = format(new Date(), 'yyyy-MM-dd');
                const res = await getStats(date);
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Grid container spacing={3} mt={2}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                            <Skeleton variant="rounded" height={160} sx={{
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderRadius: '14px',
                            }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Vista General"
                subtitle={format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                actions={
                    <Chip
                        size="small"
                        color="success"
                        label="Sistema Operativo"
                        sx={{ fontWeight: 700 }}
                    />
                }
            />

            {/* Stat Cards — unified tokens: same card, same gold accent, same type scale */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatTile
                        label="RESERVAS HOY"
                        value={stats?.reservations_today || 0}
                        subtitle={`${stats?.guests_today || 0} comensales`}
                        icon={<ReservationsIcon sx={{ fontSize: 20 }} />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatTile
                        label="PRÓXIMOS 7 DÍAS"
                        value={stats?.reservations_next_7_days || 0}
                        subtitle={`Total histórico: ${stats?.total_reservations || 0}`}
                        icon={<TrendIcon sx={{ fontSize: 20 }} />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatTile
                        label="LLAMADAS IA"
                        value={stats?.total_calls || 0}
                        subtitle="Registradas por Nikolina"
                        icon={<AIIcon sx={{ fontSize: 20 }} />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatTile
                        label="CANCELACIONES HOY"
                        value={stats?.cancellations_today || 0}
                        icon={<CancelIcon sx={{ fontSize: 20 }} />}
                    />
                </Grid>
            </Grid>

            {/* Quick Info Banner */}
            <Panel sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                }}>
                    <GuestsIcon sx={{ color: '#d4af37' }} />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {stats?.total_tables || 0} mesas activas
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        Gestiona capacidad y disponibilidad desde la sección de Mesas
                    </Typography>
                </Box>
            </Panel>
        </Box>
    );
}
