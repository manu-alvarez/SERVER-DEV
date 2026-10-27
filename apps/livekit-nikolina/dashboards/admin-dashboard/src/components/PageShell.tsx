import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

/**
 * Admin design system — canonical tokens, the same visual pattern every
 * Dev Panel page uses, so both dashboards read as one product:
 *   - PageHeader: Playfair gold h5 title + gray body2 subtitle (+ actions)
 *   - SectionLabel: uppercase caption, 0.1em tracking (card labels)
 *   - Panel: the card every section lives in (glass, radius 14)
 *   - StatTile: KPI card (gold icon chip + gold Playfair number)
 */

export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
            }}
        >
            <Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {actions}
                </Box>
            )}
        </Box>
    );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            letterSpacing="0.1em"
        >
            {children}
        </Typography>
    );
}

export function Panel({
    children,
    sx,
}: {
    children: React.ReactNode;
    sx?: object;
}) {
    return (
        <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.02)', ...sx }}>
            {children}
        </Paper>
    );
}

export function StatTile({
    label,
    value,
    subtitle,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    subtitle?: string;
    icon?: React.ReactNode;
}) {
    return (
        <Panel sx={{ p: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                }}
            >
                <SectionLabel>{label}</SectionLabel>
                {icon && (
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(212, 175, 55, 0.08)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            color: '#d4af37',
                        }}
                    >
                        {icon}
                    </Box>
                )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {value}
            </Typography>
            {subtitle && (
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {subtitle}
                </Typography>
            )}
        </Panel>
    );
}
