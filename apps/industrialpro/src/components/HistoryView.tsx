import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Package, Clock, CalendarDays } from 'lucide-react';
import api from '../api/client';
import { Card, Badge } from './ui';

export default function HistoryView() {
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/operations?status=completed')
       .then(r => setOperations(r.data))
       .catch(() => {})
       .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-msb-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Historial</h1>
        <p className="text-slate-400">Registro de operaciones completadas</p>
      </div>

      <Card portal className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-black/40 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Operación</th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Inicio</th>
                <th className="px-6 py-4 font-semibold">Fin</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {operations.map((op, i) => (
                <motion.tr 
                  key={op.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {op.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-slate-400" />
                      {op.product_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CalendarDays size={14} />
                      {op.start_time ? new Date(op.start_time).toLocaleString('es-ES') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      {op.end_time ? new Date(op.end_time).toLocaleString('es-ES') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="success">Completada</Badge>
                  </td>
                </motion.tr>
              ))}
              
              {operations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <History size={32} className="mb-3 opacity-50" />
                      <p>No hay historial de operaciones.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
