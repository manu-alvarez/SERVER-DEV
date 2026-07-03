'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput, Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import Modal from '@/components/ui/Modal';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { cn } from '@/lib/utils';
import { getProducts } from '@/app/actions';

interface CatalogItem {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  size: string;
  format: string;
  gender: string;
  ean: string;
  stock: number;
  price: number;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

export default function CatalogPage() {
  const [catalogData, setCatalogData] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProducts().then(data => {
      const items = data.map((p: any) => ({
        id: p.id,
        brand: p.brand.name,
        name: p.name,
        concentration: p.concentration,
        size: `${p.sizeMl}ml`,
        format: p.format,
        gender: p.gender,
        ean: p.ean,
        stock: p.inventory?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0,
        price: p.marketPrice
      }));
      setCatalogData(items);
      setIsLoading(false);
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [newProduct, setNewProduct] = useState({
    brand: '', name: '', concentration: 'EDP', size: '100', format: 'Regular',
    gender: 'Unisex', ean: '', price: 0,
  });

  const filtered = catalogData.filter(
    (i) => !search || i.brand.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase()) || i.ean.includes(search)
  );

  const handleSearchBarcode = async () => {
    if (!newProduct.ean) return;
    setIsSearchingBarcode(true);

    try {
      // 1. Fetch from OpenBeautyFacts (API Abierta compatible con CORS)
      const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${newProduct.ean}`);
      const data = await res.json();
      
      if (data && data.status === 1 && data.product) {
        const brand = data.product.brands || data.product.brands_tags?.[0] || "";
        const name = data.product.product_name || data.product.generic_name || "";
        
        if (!brand && !name) {
           alert("EAN encontrado en OpenBeautyFacts, pero sin marca ni nombre registrados.");
        } else {
          setNewProduct(prev => ({
            ...prev,
            brand: brand || prev.brand,
            name: name || prev.name,
          }));
        }
      } else {
        alert("El EAN no se encuentra en la base de datos de OpenBeautyFacts ni en el catálogo maestro local.");
      }
    } catch (error) {
      console.error("Error fetching barcode:", error);
      alert("Error de conexión al contactar con la API externa (bloqueo CORS o red).");
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.brand || !newProduct.name || !newProduct.ean) return;
    const id = crypto.randomUUID();
    setCatalogData([{
      id, brand: newProduct.brand, name: newProduct.name,
      concentration: newProduct.concentration, size: `${newProduct.size}ml`,
      format: newProduct.format, gender: newProduct.gender,
      ean: newProduct.ean, stock: 0, price: newProduct.price,
    }, ...catalogData]);
    setIsModalOpen(false);
    setNewProduct({ brand: '', name: '', concentration: 'EDP', size: '100', format: 'Regular', gender: 'Unisex', ean: '', price: 0 });
  };

  const handleExportCSV = () => {
    const headers = ['Marca', 'Producto', 'Conc.', 'Tamaño', 'Formato', 'Género', 'EAN', 'Stock', 'Precio'];
    const rows = filtered.map((p) => [p.brand, p.name, p.concentration, p.size, p.format, p.gender, `="${p.ean}"`, p.stock, p.price]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `teringo-catalogo-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const columns = [
    { key: 'brand', label: 'Marca', render: (item: CatalogItem) => (
      <span className="font-semibold text-[#f43f5e] dark:text-[#fb7185]">{item.brand}</span>
    )},
    { key: 'name', label: 'Producto' },
    { key: 'concentration', label: 'Conc.' },
    { key: 'size', label: 'Tamaño' },
    { key: 'format', label: 'Formato', render: (item: CatalogItem) => (
      <Badge variant={item.format === 'Tester' ? 'warning' : 'info'}>{item.format}</Badge>
    )},
    { key: 'gender', label: 'Género' },
    { key: 'ean', label: 'EAN', render: (item: CatalogItem) => (
      <span className="font-mono text-[11px] text-[#605E5C]">{item.ean}</span>
    )},
    { key: 'stock', label: 'Stock', align: 'right' as const, render: (item: CatalogItem) => (
      <span className={cn('font-medium', item.stock < 20 ? 'text-red-600 dark:text-red-400' : '')}>{item.stock}</span>
    )},
    { key: 'price', label: 'Precio', align: 'right' as const, render: (item: CatalogItem) => (
      <CurrencyDisplay amountUSD={item.price} size="sm" />
    )},
    { key: 'actions', label: '', render: () => (
      <button className="p-1 hover:bg-[#EDEBE9] dark:hover:bg-[#333] rounded opacity-0 group-hover:opacity-100">
        <MoreHorizontal size={16} />
      </button>
    )},
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Catálogo Maestro</h2>
          <p className="text-xs text-[#605E5C] dark:text-[#888]">{catalogData.length} productos</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Nuevo Producto</Button>
          <Button variant="secondary" icon={Download} onClick={handleExportCSV}>Exportar</Button>
        </div>
      </div>

      {/* Search */}
      <Card padding={false}>
        <div className="p-3 flex justify-between items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por Marca, EAN o Nombre..." className="max-w-md" />
          <Button variant="ghost" icon={Filter}>Filtros</Button>
        </div>
      </Card>

      {/* Table */}
      <Table columns={columns} data={filtered} rowKey={(item) => item.id} emptyMessage="No se encontraron productos" />

      {/* Pagination */}
      <div className="flex justify-between items-center text-[11px] text-[#605E5C] dark:text-[#888] px-2">
        <p>Mostrando {filtered.length} de {catalogData.length} productos</p>
        <div className="flex space-x-4">
          <button className="hover:text-[#f43f5e] disabled:opacity-50" disabled>Anterior</button>
          <span className="font-medium">Pág. 1</span>
          <button className="hover:text-[#f43f5e] disabled:opacity-50" disabled>Siguiente</button>
        </div>
      </div>

      {/* Modal: Nuevo Producto */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Producto" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleAddProduct}
              disabled={!newProduct.brand || !newProduct.name || !newProduct.ean}
            >Crear Producto</Button>
          </>
        }>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex space-x-2 items-end">
            <div className="flex-1">
              <Input label="EAN (Auto API) *" placeholder="3145891073607" value={newProduct.ean}
                onChange={(e) => setNewProduct({ ...newProduct, ean: e.target.value })} />
            </div>
            <Button variant="secondary" onClick={handleSearchBarcode} disabled={isSearchingBarcode || !newProduct.ean}>
              {isSearchingBarcode ? "Buscando..." : "Autocompletar con API"}
            </Button>
          </div>
          <Input label="Marca *" placeholder="Chanel, Dior..." value={newProduct.brand}
            onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} />
          <Input label="Nombre *" placeholder="Bleu de Chanel..." value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
          <Select label="Concentración" value={newProduct.concentration}
            onChange={(e) => setNewProduct({ ...newProduct, concentration: e.target.value })}
            options={[{ value: 'EDP', label: 'EDP' }, { value: 'EDT', label: 'EDT' }, { value: 'EDC', label: 'EDC' }, { value: 'Parfum', label: 'Parfum' }]} />
          <Input label="Tamaño (ml)" type="number" value={newProduct.size}
            onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })} />
          <Select label="Formato" value={newProduct.format}
            onChange={(e) => setNewProduct({ ...newProduct, format: e.target.value })}
            options={[{ value: 'Regular', label: 'Regular' }, { value: 'Tester', label: 'Tester' }, { value: 'Set', label: 'Set' }]} />
          <Select label="Género" value={newProduct.gender}
            onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
            options={[{ value: 'Male', label: 'Hombre' }, { value: 'Female', label: 'Mujer' }, { value: 'Unisex', label: 'Unisex' }]} />
          <Input label="Precio ($)" type="number" value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })} />
        </div>
      </Modal>
    </div>
  );
}
