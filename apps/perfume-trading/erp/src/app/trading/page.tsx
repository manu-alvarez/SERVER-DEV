'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Calculator, TrendingUp, Percent, DollarSign, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Table } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import Modal from '@/components/ui/Modal';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { cn } from '@/lib/utils';
import { calculateNetMargin, calculateTargetPrice } from '@/lib/trading-calculator';
import type { Incoterm } from '@/types';
import { getTrades } from '@/app/actions';

type TradeOp = 'Offer' | 'Bid';

// ─── Mock Data Removed ───
interface TradingRow {
  id: string;
  type: TradeOp;
  brand: string;
  product: string;
  partner: string;
  quantity: number;
  priceUnit: number;
  total: number;
  incoterm: Incoterm;
  marketPrice: number;
  marginPct: number;
  status: string;
  validUntil: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  Active: 'success', Draft: 'warning', Accepted: 'info',
  Expired: 'default', Rejected: 'error', Negotiating: 'warning',
};

const INCOTERM_LABELS: Record<Incoterm, string> = {
  EXW: 'EXW (En Fábrica)',
  FOB: 'FOB (Puerto Origen)',
  CIF: 'CIF (Seguro+Flete)',
  DDP: 'DDP (Puesto Destino)',
  CIP: 'CIP (Transporte+Aseg)',
  CPT: 'CPT (Transporte Pagado)',
  DAP: 'DAP (Entrega Destino)',
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

export default function TradingPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [trades, setTrades] = useState<TradingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTrades().then(data => {
      const items = data.map((t: any) => ({
        id: t.id,
        type: t.type as TradeOp,
        brand: t.product?.brand?.name || '',
        product: t.product?.name || '',
        partner: t.partner?.name || '',
        quantity: t.quantity,
        priceUnit: t.priceUnit,
        total: t.totalAmount,
        incoterm: t.incoterm as Incoterm,
        marketPrice: t.product?.marketPrice || 0,
        marginPct: t.marginPct,
        status: t.status,
        validUntil: new Date(t.validUntil).toISOString().split('T')[0]
      }));
      setTrades(items);
      setIsLoading(false);
    });
  }, []);

  const [isNewTradeOpen, setIsNewTradeOpen] = useState(false);
  const [newTrade, setNewTrade] = useState<{
    type: TradeOp; partner: string; product: string; brand: string;
    quantity: number; priceUnit: number; incoterm: Incoterm; marketPrice: number;
  }>({
    type: 'Offer', partner: '', product: '', brand: '',
    quantity: 100, priceUnit: 50, incoterm: 'FOB', marketPrice: 100,
  });

  const handleCreateTrade = () => {
    if (!newTrade.partner || !newTrade.product) return;
    const id = crypto.randomUUID();
    const total = newTrade.quantity * newTrade.priceUnit;
    const margin = newTrade.marketPrice > 0
      ? Math.round(((newTrade.marketPrice - newTrade.priceUnit) / newTrade.marketPrice) * 1000) / 10
      : 0;
    setTrades([{
      id, type: newTrade.type, brand: newTrade.brand || 'Nueva',
      product: newTrade.product, partner: newTrade.partner,
      quantity: newTrade.quantity, priceUnit: newTrade.priceUnit,
      total, incoterm: newTrade.incoterm,
      marketPrice: newTrade.marketPrice, marginPct: margin,
      status: 'Active', validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }, ...trades]);
    setIsNewTradeOpen(false);
  };

  // ─── Calculator State ───
  const [calcPrice, setCalcPrice] = useState(100);
  const [calcQty, setCalcQty] = useState(50);
  const [calcIncoterm, setCalcIncoterm] = useState<Incoterm>('FOB');
  const [calcMarketPrice, setCalcMarketPrice] = useState(130);
  const [calcBrokerFee, setCalcBrokerFee] = useState(2);
  const [calcTargetMargin, setCalcTargetMargin] = useState(25);

  const marginResult = useMemo(
    () => calculateNetMargin(calcPrice, calcQty, calcIncoterm, calcMarketPrice, calcBrokerFee),
    [calcPrice, calcQty, calcIncoterm, calcMarketPrice, calcBrokerFee]
  );

  const targetPrice = useMemo(
    () => calculateTargetPrice(calcTargetMargin, calcPrice, calcQty, calcIncoterm, calcBrokerFee),
    [calcTargetMargin, calcPrice, calcQty, calcIncoterm, calcBrokerFee]
  );

  // ─── Table ───
  const tabs = [
    { key: 'all', label: 'Todas', count: trades.length },
    { key: 'Offer', label: 'Offers', count: trades.filter((o) => o.type === 'Offer').length },
    { key: 'Bid', label: 'Bids', count: trades.filter((o) => o.type === 'Bid').length },
  ];

  const filtered = useMemo(() =>
    trades.filter((row) => {
      if (activeTab !== 'all' && row.type !== activeTab) return false;
      if (search && !row.brand.toLowerCase().includes(search.toLowerCase()) &&
          !row.product.toLowerCase().includes(search.toLowerCase()) &&
          !row.partner.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [activeTab, search, trades]
  );

  const columns = [
    { key: 'type', label: 'Tipo', render: (item: TradingRow) => (
      <span className={cn('text-xs font-bold uppercase', item.type === 'Offer' ? 'text-blue-600' : 'text-purple-600')}>{item.type}</span>
    )},
    { key: 'brand', label: 'Marca', render: (item: TradingRow) => <span className="font-semibold text-[#f43f5e]">{item.brand}</span> },
    { key: 'product', label: 'Producto' },
    { key: 'partner', label: 'Socio' },
    { key: 'quantity', label: 'Cant.', align: 'right' as const },
    { key: 'priceUnit', label: 'P/U', align: 'right' as const, render: (item: TradingRow) => <CurrencyDisplay amountUSD={item.priceUnit} size="sm" /> },
    { key: 'total', label: 'Total', align: 'right' as const, render: (item: TradingRow) => <CurrencyDisplay amountUSD={item.total} size="sm" /> },
    { key: 'incoterm', label: 'Incoterm', render: (item: TradingRow) => (
      <span className="font-mono text-xs font-bold bg-[#F3F2F1] dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded">{item.incoterm}</span>
    )},
    { key: 'marginPct', label: 'Margen', align: 'right' as const, render: (item: TradingRow) => (
      <span className={cn('font-medium', item.marginPct >= 20 ? 'text-green-600' : 'text-yellow-600')}>{item.marginPct}%</span>
    )},
    { key: 'status', label: 'Estado', render: (item: TradingRow) => <Badge variant={statusVariant[item.status] ?? 'default'} dot>{item.status}</Badge> },
    { key: 'validUntil', label: 'Válido Hasta' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Trading B2B</h2>
          <p className="text-xs text-[#605E5C] dark:text-[#888]">Offers, Bids y cálculo de márgenes con ajustes logísticos por Incoterm</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsNewTradeOpen(true)}>Nueva Operación</Button>
      </div>

      {/* ─── PROFESSIONAL MARGIN CALCULATOR ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Calculator size={18} className="mr-2 text-[#f43f5e]" />
            Calculadora de Margen Profesional
            <Badge variant="info" className="ml-3">Tiempo Real</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Precio Unitario ($)" type="number" value={calcPrice} onChange={(e) => setCalcPrice(Number(e.target.value))} />
                <Input label="Cantidad" type="number" value={calcQty} onChange={(e) => setCalcQty(Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Incoterm"
                  value={calcIncoterm}
                  onChange={(e) => setCalcIncoterm(e.target.value as Incoterm)}
                  options={Object.entries(INCOTERM_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
                <Input label="Precio Mercado ($)" type="number" value={calcMarketPrice} onChange={(e) => setCalcMarketPrice(Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Comisión Bróker (%)" type="number" value={calcBrokerFee} onChange={(e) => setCalcBrokerFee(Number(e.target.value))} />
                <Input label="Margen Objetivo (%)" type="number" value={calcTargetMargin} onChange={(e) => setCalcTargetMargin(Number(e.target.value))} />
              </div>
            </div>

            {/* Results */}
            <div className="bg-[#F3F2F1] dark:bg-[#2a2a2a] p-4 border border-[#EDEBE9] dark:border-[#333]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold flex items-center">
                  <TrendingUp size={16} className="mr-1.5 text-[#f43f5e]" />
                  Resultado del Cálculo
                </h4>
                <Badge variant={marginResult.grossMarginPct >= 20 ? 'success' : marginResult.grossMarginPct > 0 ? 'warning' : 'error'} dot>
                  {marginResult.grossMarginPct >= 20 ? 'Saludable' : marginResult.grossMarginPct > 0 ? 'Ajustado' : 'Pérdida'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#605E5C]">Base Total</span>
                  <span className="font-semibold">{formatCurrency(marginResult.baseTotal)}</span>
                </div>
                <div className="flex justify-between text-[#605E5C] text-xs">
                  <span>Logística ({calcIncoterm}: +{(INCOTERM_LOGISTICS_FACTORS[calcIncoterm] * 100).toFixed(0)}%)</span>
                  <span className="text-orange-600">+{formatCurrency(marginResult.logisticsCost)}</span>
                </div>
                {calcBrokerFee > 0 && (
                  <div className="flex justify-between text-[#605E5C] text-xs">
                    <span>Comisión Bróker ({calcBrokerFee}%)</span>
                    <span className="text-purple-600">+{formatCurrency(marginResult.brokerCost)}</span>
                  </div>
                )}
                <div className="border-t border-[#EDEBE9] dark:border-[#444] pt-2 flex justify-between font-bold">
                  <span>Total Neto</span>
                  <span className="text-[#f43f5e]">{formatCurrency(marginResult.netTotal)}</span>
                </div>
                <div className="border-t border-[#EDEBE9] dark:border-[#444] pt-2 flex justify-between">
                  <span>Margen Bruto</span>
                  <span className={cn(
                    'font-bold text-lg',
                    marginResult.grossMarginPct >= 20 ? 'text-green-600' : marginResult.grossMarginPct > 0 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {marginResult.grossMarginPct}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#605E5C]">
                  <span>Precio recomendado para {calcTargetMargin}% de margen</span>
                  <span className="font-bold text-[#f43f5e]">{formatCurrency(targetPrice)}/ud</span>
                </div>
              </div>

              {/* Visual indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-[#605E5C] mb-1">
                  <span>0%</span>
                  <span>Margen: {marginResult.grossMarginPct}%</span>
                  <span>50%</span>
                </div>
                <div className="h-2 bg-[#EDEBE9] dark:bg-[#444] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      marginResult.grossMarginPct >= 20 ? 'bg-green-500' :
                      marginResult.grossMarginPct > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(marginResult.grossMarginPct * 2, 100)}%` }}
                  />
                </div>
              </div>

              {/* Save Action */}
              <div className="mt-4 pt-4 border-t border-[#EDEBE9] dark:border-[#444]">
                <Button
                  variant={marginResult.grossMarginPct >= 15 ? 'primary' : 'secondary'}
                  icon={DollarSign}
                  className="w-full"
                  onClick={() => {
                    // Offline fallback: store to localStorage as a draft offer
                    const draft = {
                      id: Date.now(),
                      type: 'Offer' as const,
                      brand: 'Nuevo',
                      product: `Lote #${Date.now().toString(36)}`,
                      partner: 'Pendiente de asignar',
                      quantity: calcQty,
                      priceUnit: calcPrice,
                      total: marginResult.netTotal,
                      incoterm: calcIncoterm,
                      marketPrice: calcMarketPrice,
                      marginPct: marginResult.grossMarginPct,
                      status: marginResult.grossMarginPct >= 15 ? 'Active' : 'Draft',
                      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                    };
                    // In production: TradingService.create(draft)
                    const existing = JSON.parse(localStorage.getItem('perfume-draft-offers') ?? '[]');
                    existing.unshift(draft);
                    localStorage.setItem('perfume-draft-offers', JSON.stringify(existing.slice(0, 10)));
                    alert('✅ Oferta guardada como borrador. Con Supabase conectado se creará en la BD.');
                  }}
                >
                  {marginResult.grossMarginPct >= 15 ? '✓ Guardar como Oferta Activa' : 'Guardar como Borrador'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center"><Percent size={14} className="mr-1 text-[#f43f5e]" />Margen Promedio</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">19.8%</span></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center"><DollarSign size={14} className="mr-1 text-[#f43f5e]" />Volumen Total</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{formatCurrency(trades.reduce((s, r) => s + r.total, 0))}</span></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center">📦 SKUs en Trading</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{trades.length}</span></CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <div className="flex justify-between items-center gap-4">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="flex-1" />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." className="max-w-xs" />
      </div>

      {/* Table */}
      <Table columns={columns} data={filtered} rowKey={(item) => item.id} emptyMessage="No se encontraron operaciones" />

      {/* Pagination */}
      <div className="flex justify-between items-center text-[11px] text-[#605E5C] dark:text-[#888] px-2">
        <p>Mostrando {filtered.length} de {trades.length} operaciones</p>
        <div className="flex space-x-4">
          <button className="hover:text-[#f43f5e] disabled:opacity-50" disabled>Anterior</button>
          <span className="font-medium">Pág. 1</span>
          <button className="hover:text-[#f43f5e] disabled:opacity-50" disabled>Siguiente</button>
        </div>
      </div>

      {/* Modal: Nueva Operación */}
      <Modal isOpen={isNewTradeOpen} onClose={() => setIsNewTradeOpen(false)} title="Nueva Operación de Trading" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewTradeOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreateTrade}
              disabled={!newTrade.partner || !newTrade.product}>
              {!newTrade.partner || !newTrade.product ? 'Completa los campos' : 'Crear Operación'}
            </Button>
          </>
        }>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={newTrade.type}
            onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value as TradeOp })}
            options={[{ value: 'Offer', label: 'Offer (Venta)' }, { value: 'Bid', label: 'Bid (Compra)' }]} />
          <Select label="Incoterm" value={newTrade.incoterm}
            onChange={(e) => setNewTrade({ ...newTrade, incoterm: e.target.value as Incoterm })}
            options={Object.entries(INCOTERM_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          <Input label="Socio *" placeholder="GlobalFragance GmbH" value={newTrade.partner}
            onChange={(e) => setNewTrade({ ...newTrade, partner: e.target.value })} />
          <Input label="Marca" placeholder="Chanel" value={newTrade.brand}
            onChange={(e) => setNewTrade({ ...newTrade, brand: e.target.value })} />
          <Input label="Producto *" placeholder="Bleu de Chanel EDP 100ml" value={newTrade.product}
            onChange={(e) => setNewTrade({ ...newTrade, product: e.target.value })} />
          <Input label="Precio Mercado ($)" type="number" value={newTrade.marketPrice}
            onChange={(e) => setNewTrade({ ...newTrade, marketPrice: Number(e.target.value) })} />
          <Input label="Cantidad" type="number" value={newTrade.quantity}
            onChange={(e) => setNewTrade({ ...newTrade, quantity: Number(e.target.value) })} />
          <Input label="Precio Unitario ($)" type="number" value={newTrade.priceUnit}
            onChange={(e) => setNewTrade({ ...newTrade, priceUnit: Number(e.target.value) })} />
        </div>
        {newTrade.marketPrice > 0 && newTrade.priceUnit > 0 && (
          <div className="mt-4 p-3 bg-[#F3F2F1] dark:bg-[#2a2a2a] text-xs rounded">
            <span className="font-semibold">Margen estimado: </span>
            <span className={cn(
              'font-bold',
              ((newTrade.marketPrice - newTrade.priceUnit) / newTrade.marketPrice * 100) >= 20
                ? 'text-green-600' : 'text-yellow-600'
            )}>
              {Math.round((newTrade.marketPrice - newTrade.priceUnit) / newTrade.marketPrice * 1000) / 10}%
            </span>
            <span className="text-[#605E5C] ml-2">
              ({newTrade.incoterm}: +{((INCOTERM_LOGISTICS_FACTORS[newTrade.incoterm] ?? 0) * 100).toFixed(0)}% logística)
            </span>
          </div>
        )}
      </Modal>
    </div>
  );
}

const INCOTERM_LOGISTICS_FACTORS: Record<Incoterm, number> = {
  EXW: 0, FOB: 0.03, CIF: 0.07, DDP: 0.12, CIP: 0.08, CPT: 0.05, DAP: 0.10,
};
