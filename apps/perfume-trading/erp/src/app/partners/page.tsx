'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Globe, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Table } from '@/components/ui/table';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getPartners } from '@/app/actions';

interface Partner {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  isActive: boolean;
  creditLimit: number;
}

const typeVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  Supplier: 'info',
  Client: 'success',
  Both: 'warning',
  Broker: 'default',
};

const typeLabels: Record<string, string> = {
  all: 'Todos',
  Supplier: 'Proveedores',
  Client: 'Clientes',
  Both: 'Ambos',
  Broker: 'Brókers',
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
}

export default function PartnersPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPartners().then(data => {
      setPartners(data as Partner[]);
      setIsLoading(false);
    });
  }, []);

  const filtered = partners.filter((p) => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.country || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { key: 'all', label: 'Todos', count: partners.length },
    { key: 'Supplier', label: 'Proveedores', count: partners.filter((p) => p.type === 'Supplier').length },
    { key: 'Client', label: 'Clientes', count: partners.filter((p) => p.type === 'Client').length },
    { key: 'Broker', label: 'Brókers', count: partners.filter((p) => p.type === 'Broker').length },
  ];

  const columns = [
    { key: 'name', label: 'Nombre', render: (item: Partner) => <span className="font-semibold">{item.name}</span> },
    {
      key: 'type',
      label: 'Tipo',
      render: (item: Partner) => <Badge variant={typeVariant[item.type] ?? 'default'} dot>{item.type}</Badge>,
    },
    {
      key: 'country',
      label: 'País',
      render: (item: Partner) => (
        <span className="flex items-center text-xs"><Globe size={12} className="mr-1 text-[#605E5C]" />{item.country}</span>
      ),
    },
    { key: 'email', label: 'Email', render: (item: Partner) => <span className="text-xs text-[#605E5C]"><Mail size={12} className="inline mr-1" />{item.email}</span> },
    { key: 'phone', label: 'Teléfono', render: (item: Partner) => <span className="text-xs"><Phone size={12} className="inline mr-1" />{item.phone}</span> },
    {
      key: 'isActive',
      label: 'Estado',
      render: (item: Partner) => <Badge variant={item.isActive ? 'success' : 'error'} dot>{item.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
    { key: 'creditLimit', label: 'Crédito', align: 'right' as const, render: (item: Partner) => <span className="font-medium">{formatCurrency(item.creditLimit)}</span> },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Socios B2B</h2>
          <p className="text-xs text-[#605E5C] dark:text-[#888]">Proveedores, Clientes y Brókers internacionales</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Nuevo Socio</Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex justify-between items-center gap-4">
        <Tabs tabs={tabs} active={typeFilter} onChange={setTypeFilter} className="flex-1" />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." className="max-w-xs" />
      </div>

      {/* Table */}
      <Table columns={columns} data={filtered} rowKey={(item) => item.id} emptyMessage="No se encontraron socios" />

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Socio B2B" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Guardar Socio</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Razón social" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" options={[
              { value: 'Supplier', label: 'Proveedor' },
              { value: 'Client', label: 'Cliente' },
              { value: 'Both', label: 'Ambos' },
              { value: 'Broker', label: 'Bróker' },
            ]} />
            <Input label="País" placeholder="España" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="email@ejemplo.com" />
            <Input label="Teléfono" placeholder="+34 91 234 5678" />
          </div>
          <Input label="Dirección" placeholder="Calle, ciudad..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Límite de Crédito" type="number" placeholder="0" />
            <Select label="Términos de Pago" options={[
              { value: 'Net 15', label: 'Net 15' },
              { value: 'Net 30', label: 'Net 30' },
              { value: 'Net 45', label: 'Net 45' },
              { value: 'Net 60', label: 'Net 60' },
            ]} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
