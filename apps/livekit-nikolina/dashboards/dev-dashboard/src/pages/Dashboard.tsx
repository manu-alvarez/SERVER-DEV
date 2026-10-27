import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import {
    BookOnline as ReservationsIcon,
    Groups as GuestsIcon,
    SmartToy as AIIcon,
    Cancel as CancelIcon,
    TrendingUp as TrendIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { getStats } from '../api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatCardProps {
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    accentColor: string;
    glowColor: string;
    delay: number;
}

function StatCard({ title, value, subtitle, icon, accentColor, glowColor, delay }: StatCardProps) {
    return (
        <Card sx={{
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            animation: `fadeInUp 0.5s ease-out ${delay}ms both`,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                borderRadius: '20px 20px 0 0',
            },
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="overline" sx={{ color: accentColor, fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${accentColor}15`,
                        border: `1px solid ${accentColor}30`,
                        boxShadow: `0 0 20px ${glowColor}`,
                        color: accentColor,
                    }}>
                        {icon}
                    </Box>
                </Box>
                <Typography variant="h3" sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    background: `linear-gradient(135deg, #f1f5f9 0%, ${accentColor} 150%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

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
                                borderRadius: '20px',
                            }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: 4,
                animation: 'fadeInUp 0.4s ease-out',
            }}>
                <Box>
                    <Typography variant="h4" sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5,
                    }}>
                        Vista General
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '12px',
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                    <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                        animation: 'pulse 2s ease-in-out infinite',
                    }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        Sistema Operativo
                    </Typography>
                </Box>
            </Box>

            {/* Stat Cards */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Reservas Hoy"
                        value={stats?.reservations_today || 0}
                        subtitle={`${stats?.guests_today || 0} comensales`}
                        icon={<ReservationsIcon sx={{ fontSize: 20 }} />}
                        accentColor="#7c3aed"
                        glowColor="rgba(124, 58, 237, 0.15)"
                        delay={0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Próximos 7 días"
                        value={stats?.reservations_next_7_days || 0}
                        subtitle={`Total histórico: ${stats?.total_reservations || 0}`}
                        icon={<TrendIcon sx={{ fontSize: 20 }} />}
                        accentColor="#10b981"
                        glowColor="rgba(16, 185, 129, 0.15)"
                        delay={100}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Llamadas IA"
                        value={stats?.total_calls || 0}
                        subtitle="Registradas por Nikolina"
                        icon={<AIIcon sx={{ fontSize: 20 }} />}
                        accentColor="#3b82f6"
                        glowColor="rgba(59, 130, 246, 0.15)"
                        delay={200}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Cancelaciones Hoy"
                        value={stats?.cancellations_today || 0}
                        icon={<CancelIcon sx={{ fontSize: 20 }} />}
                        accentColor={stats?.cancellations_today > 0 ? '#f43f5e' : '#64748b'}
                        glowColor={stats?.cancellations_today > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(100, 116, 139, 0.1)'}
                        delay={300}
                    />
                </Grid>
            </Grid>

            {/* Quick Info Banner */}
            <Box sx={{
                mt: 4,
                p: 3,
                borderRadius: '20px',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                animation: 'fadeInUp 0.6s ease-out 0.4s both',
            }}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.2) 100%)',
                    border: '1px solid rgba(124,58,237,0.2)',
                }}>
                    <GuestsIcon sx={{ color: '#a78bfa' }} />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {stats?.total_tables || 0} mesas activas
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        Gestiona capacidad y disponibilidad desde la sección de Mesas
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
