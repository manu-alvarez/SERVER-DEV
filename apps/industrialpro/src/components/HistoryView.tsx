import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../api/client';

export default function HistoryView() {
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/operations?status=completed').then(r => setOperations(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Historial de Operaciones</Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell>Inicio</TableCell>
            <TableCell>Fin</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {operations.map((op, i) => (
            <motion.tr key={op.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <TableCell><Typography fontWeight={600}>{op.name}</Typography></TableCell>
              <TableCell>{op.product_name || '-'}</TableCell>
              <TableCell>{op.start_time ? new Date(op.start_time).toLocaleString('es-ES') : '-'}</TableCell>
              <TableCell>{op.end_time ? new Date(op.end_time).toLocaleString('es-ES') : '-'}</TableCell>
              <TableCell><Chip size="small" label="Completada" color="success" /></TableCell>
            </motion.tr>
          ))}
          {operations.length === 0 && (
            <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">Sin historial</Typography></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
