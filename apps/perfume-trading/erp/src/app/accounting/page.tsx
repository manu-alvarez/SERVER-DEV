'use client';

import React, { useState } from 'react';
import {
  Calculator, PieChart, TrendingUp, TrendingDown,
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Filter, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/ui/currency-display';

// ─── Mock Financial Data ───
const financialKPIs = [
  { title: 'Ingresos Netos (YTD)', value: 0, change: '0%', positive: true, icon: TrendingUp },
  { title: 'Margen Bruto', value: 0, change: '0%', positive: true, icon: PieChart },
  { title: 'Patrimonio Neto', value: 0, change: '0%', positive: true, icon: Wallet },
  { title: 'EBITDA', value: 0, change: '0%', positive: false, icon: Calculator },
];

const pnlData: any[] = [];
const cashFlowData: any[] = [];
const ledgerTransactions: any[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] border border-[#EDEBE9] dark:border-[#333] p-3 rounded-lg shadow-lg">
        <p className="font-bold text-sm mb-2 text-[#323130] dark:text-[#e0e0e0]">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center space-x-4 text-xs mb-1">
            <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
            <span className="font-mono"><CurrencyDisplay amountUSD={entry.value} size="sm" /></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AccountingDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Contabilidad Avanzada</h2>
          <p className="text-xs text-[#605E5C] dark:text-[#888]">
            Análisis financiero de Pérdidas y Ganancias, Flujo de Efectivo y Libro Mayor
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#EDEBE9] dark:border-[#333] rounded hover:border-[#f43f5e] dark:hover:border-[#fb7185] transition-colors text-xs font-semibold text-[#323130] dark:text-[#e0e0e0]">
            <FileSpreadsheet size={14} className="text-[#f43f5e] dark:text-[#fb7185]" />
            <span>Exportar Mayor</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialKPIs.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#605E5C] dark:text-[#888]">{kpi.title}</CardTitle>
              <kpi.icon size={16} className="text-[#f43f5e] dark:text-[#fb7185]" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-[#323130] dark:text-[#e0e0e0]">
                  <CurrencyDisplay amountUSD={kpi.value} />
                </span>
                <span className={cn('flex items-center text-xs font-bold', kpi.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                  {kpi.positive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                  {kpi.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="w-4 h-4 mr-2 text-[#f43f5e]" />
              Estado de Resultados (P&L)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#605E5C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#605E5C' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="ingresos" name="Ingresos Brutos" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cogs" name="COGS (Coste Bienes)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos Operativos" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-[#f43f5e]" />
              Flujo de Efectivo (30 Días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#605E5C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#605E5C' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="balance" name="Balance Neto Acumulado" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={3} />
                  <Line type="monotone" dataKey="entradas" name="Entradas (Cobros)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="salidas" name="Salidas (Pagos)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="p-4 border-b border-[#EDEBE9] dark:border-[#333] flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
          <CardTitle className="flex items-center text-sm">
            <DollarSign size={16} className="mr-2 text-[#f43f5e]" />
            Libro Mayor — Últimas Transacciones
          </CardTitle>
          <button className="flex items-center text-xs text-[#605E5C] dark:text-[#888] hover:text-[#f43f5e] dark:hover:text-[#fb7185] transition-colors">
            <Filter size={14} className="mr-1" /> Filtrar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F3F2F1] dark:bg-[#2a2a2a] text-[#605E5C] dark:text-[#888] font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID / Fecha</th>
                <th className="px-4 py-3">Cuenta Contable</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Débito</th>
                <th className="px-4 py-3 text-right">Crédito</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEBE9] dark:divide-[#333] bg-white dark:bg-[#1e1e1e]">
              {ledgerTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-[#FAF9F8] dark:hover:bg-[#222] transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-[#323130] dark:text-[#e0e0e0]">{trx.id}</p>
                    <p className="text-[10px] text-[#605E5C] dark:text-[#888]">{trx.date}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default" className="text-[10px] font-mono font-medium border border-[#EDEBE9] dark:border-[#444] text-[#605E5C] dark:text-[#ccc]">
                      {trx.account}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#323130] dark:text-[#e0e0e0] truncate max-w-[200px]" title={trx.desc}>
                    {trx.desc}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-red-600 dark:text-red-400">
                    {trx.type === 'debit' ? <CurrencyDisplay amountUSD={trx.amount} size="sm" /> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                    {trx.type === 'credit' ? <CurrencyDisplay amountUSD={trx.amount} size="sm" /> : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {trx.status === 'Completado' ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} className="mr-1" /> Completado
                      </span>
                    ) : trx.status === 'Procesando' ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        <TrendingUp size={12} className="mr-1" /> Procesando
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                        <AlertCircle size={12} className="mr-1" /> Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
