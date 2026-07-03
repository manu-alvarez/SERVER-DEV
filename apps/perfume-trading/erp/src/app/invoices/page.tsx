'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Table } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { getInvoices } from '@/app/actions';

// ─── Mock Data Removed ───
interface Invoice {
  id: string;
  invoiceNumber: string;
  partner: string;
  type: string;
  incoterm: string;
  totalNet: number;
  taxPercent: number;
  totalGross: number;
  status: string;
  dueDate: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  Paid: 'success', Pending: 'warning', Approved: 'info',
  Shipped: 'info', Cancelled: 'error', Proforma: 'default',
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getInvoices().then(data => {
      const items = data.map((i: any) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        partner: i.partner?.name || '',
        type: i.type,
        incoterm: i.incoterm,
        totalNet: i.totalNet,
        taxPercent: i.taxPercent,
        totalGross: i.totalGross,
        status: i.status,
        dueDate: new Date(i.dueDate).toISOString().split('T')[0]
      }));
      setInvoices(items);
      setIsLoading(false);
    });
  }, []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInv, setNewInv] = useState({
    partner: '', type: 'Offer', incoterm: 'EXW', totalNet: 0, taxPercent: 21,
  });

  const statuses = ['all', 'Proforma', 'Pending', 'Approved', 'Shipped', 'Paid', 'Cancelled'];
  const statusCounts = useMemo(() => ({
    all: invoices.length,
    ...Object.fromEntries(statuses.slice(1).map((s) => [s, invoices.filter((i) => i.status === s).length])),
  }), [invoices]);

  const filtered = useMemo(() =>
    invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (search && !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) &&
          !inv.partner.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [search, statusFilter, invoices]
  );

  const totals = useMemo(() => ({
    net: filtered.reduce((s, i) => s + i.totalNet, 0),
    gross: filtered.reduce((s, i) => s + i.totalGross, 0),
  }), [filtered]);

  const handleCreateInvoice = () => {
    if (!newInv.partner || newInv.totalNet <= 0) return;
    const id = crypto.randomUUID();
    const gross = newInv.totalNet * (1 + newInv.taxPercent / 100);
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;
    setInvoices([{
      id, invoiceNumber: invNum, partner: newInv.partner,
      type: newInv.type, incoterm: newInv.incoterm,
      totalNet: newInv.totalNet, taxPercent: newInv.taxPercent,
      totalGross: gross, status: 'Pending',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }, ...invoices]);
    setIsModalOpen(false);
    setNewInv({ partner: '', type: 'Offer', incoterm: 'EXW', totalNet: 0, taxPercent: 21 });
  };

  const tabs = statuses.map((s) => ({
    key: s, label: s === 'all' ? 'Todas' : s,
    count: statusCounts[s as keyof typeof statusCounts],
  }));

  const columns = [
    { key: 'invoiceNumber', label: 'N° Factura', render: (item: Invoice) => (
      <span className="font-mono text-xs font-semibold text-[#f43f5e] dark:text-[#fb7185]">{item.invoiceNumber}</span>
    )},
    { key: 'partner', label: 'Socio', render: (item: Invoice) => <span className="font-medium">{item.partner}</span> },
    { key: 'type', label: 'Tipo', render: (item: Invoice) => (
      <span className={cn('text-xs font-bold uppercase', item.type === 'Offer' ? 'text-blue-600' : 'text-purple-600')}>{item.type}</span>
    )},
    { key: 'incoterm', label: 'Incoterm', render: (item: Invoice) => (
      <span className="font-mono text-xs bg-[#F3F2F1] dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded">{item.incoterm}</span>
    )},
    { key: 'totalNet', label: 'Neto', align: 'right' as const, render: (item: Invoice) => formatCurrency(item.totalNet) },
    { key: 'taxPercent', label: 'IVA', align: 'right' as const, render: (item: Invoice) => `${item.taxPercent}%` },
    { key: 'totalGross', label: 'Total', align: 'right' as const, render: (item: Invoice) => <span className="font-bold">{formatCurrency(item.totalGross)}</span> },
    { key: 'status', label: 'Estado', render: (item: Invoice) => <Badge variant={statusVariant[item.status] ?? 'default'} dot>{item.status}</Badge> },
    { key: 'dueDate', label: 'Vencimiento' },
    { key: 'actions', label: '', render: (item: Invoice) => (
      <div className="flex space-x-1">
        <Link href={`/invoices/view?id=${item.id}`} className="p-1 hover:bg-[#EDEBE9] dark:hover:bg-[#333] rounded inline-flex" title="Ver proforma">
          <Eye size={14} />
        </Link>
        <button className="p-1 hover:bg-[#EDEBE9] dark:hover:bg-[#333] rounded"><Download size={14} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Facturación</h2>
          <p className="text-xs text-[#605E5C] dark:text-[#888]">Proformas, facturas y packing lists con Incoterms</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Nueva Factura</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center"><FileText size={14} className="mr-1 text-[#f43f5e]" />Total Neto</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{formatCurrency(totals.net)}</span></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center"><FileText size={14} className="mr-1 text-[#f43f5e]" />Total Bruto</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold text-[#f43f5e]">{formatCurrency(totals.gross)}</span></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center">📄 Facturas</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{filtered.length}</span></CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <div className="flex justify-between items-center gap-4">
        <Tabs tabs={tabs} active={statusFilter} onChange={setStatusFilter} className="flex-1 overflow-x-auto" />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar factura..." className="max-w-xs" />
      </div>

      {/* Table */}
      <Table columns={columns} data={filtered} rowKey={(item) => item.id} emptyMessage="No se encontraron facturas" />

      {/* Modal: Nueva Factura */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Factura" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreateInvoice}
              disabled={!newInv.partner || newInv.totalNet <= 0}>Crear Factura</Button>
          </>
        }>
        <div className="space-y-4">
          <Input label="Socio *" placeholder="GlobalFragance GmbH" value={newInv.partner}
            onChange={(e) => setNewInv({ ...newInv, partner: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={newInv.type}
              onChange={(e) => setNewInv({ ...newInv, type: e.target.value })}
              options={[{ value: 'Offer', label: 'Venta (Offer)' }, { value: 'Bid', label: 'Compra (Bid)' }]} />
            <Select label="Incoterm" value={newInv.incoterm}
              onChange={(e) => setNewInv({ ...newInv, incoterm: e.target.value })}
              options={[{ value: 'EXW', label: 'EXW' }, { value: 'FOB', label: 'FOB' }, { value: 'CIF', label: 'CIF' }, { value: 'DDP', label: 'DDP' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Neto ($) *" type="number" value={newInv.totalNet}
              onChange={(e) => setNewInv({ ...newInv, totalNet: Number(e.target.value) })} />
            <Input label="IVA (%)" type="number" value={newInv.taxPercent}
              onChange={(e) => setNewInv({ ...newInv, taxPercent: Number(e.target.value) })} />
          </div>
          {newInv.totalNet > 0 && (
            <div className="p-3 bg-[#F3F2F1] dark:bg-[#2a2a2a] text-sm rounded flex justify-between">
              <span className="text-[#605E5C]">Total Bruto estimado:</span>
              <span className="font-bold text-[#f43f5e]">{formatCurrency(newInv.totalNet * (1 + newInv.taxPercent / 100))}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
