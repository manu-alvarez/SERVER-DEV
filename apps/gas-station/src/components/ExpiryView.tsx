import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PackagePlus, 
  Layers, 
  Trash2, 
  Edit3,
  Calendar,
  RefreshCcw,
  Search
} from 'lucide-react';
import { api } from '../api/client';
import { Card, Button, Input, Modal, Select, Badge, cn } from './ui';

export default function ExpiryView() {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'product' | 'batch' | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    try {
      const [p, b, a] = await Promise.all([
        api.getProducts(),
        api.getBatches(),
        api.getAlerts(),
      ]);
      setProducts(p);
      setBatches(b);
      setAlerts(a);
    } catch { setError('Error al cargar datos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDialog = (type: 'product' | 'batch', item?: any) => {
    setDialog(type);
    setEditItem(item || null);
    if (item) setForm(item);
    else setForm(type === 'product' ? { name: '', category: 'otros' } : { product_id: products[0]?.id || '', batch_code: '', quantity: 1, expiry_date: new Date().toISOString().split('T')[0] });
  };

  const save = async () => {
    try {
      if (editItem) {
        if (dialog === 'product') await api.updateProduct(editItem.id, form);
        else await api.updateBatch(editItem.id, form);
      } else {
        if (dialog === 'product') await api.createProduct(form);
        else await api.createBatch(form);
      }
      setDialog(null);
      setEditItem(null);
      await load();
    } catch {}
  };

  const remove = async (type: string, id: number) => {
    if (type === 'product') await api.deleteProduct(id);
    else await api.deleteBatch(id);
    await load();
  };

  const getProductName = (id: number) => products.find(p => p.id === id)?.name || `ID: ${id}`;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredBatches = batches.filter(b => getProductName(b.product_id).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control de Caducidades</h1>
          <p className="text-muted-foreground mt-1">Gestión de stock perecedero</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openDialog('product')}>
            <PackagePlus size={18} className="mr-2" /> Añadir Producto
          </Button>
          <Button variant="primary" onClick={() => openDialog('batch')}>
            <Layers size={18} className="mr-2" /> Registrar Lote
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-500">{alerts.length} producto{alerts.length > 1 ? 's' : ''} próximo{alerts.length > 1 ? 's' : ''} a caducar</h2>
          </div>
          <div className="space-y-2">
            {alerts.map((a: any, i: number) => {
              const aDaysLeft = a.expiry_date ? Math.ceil((new Date(a.expiry_date).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-sm font-medium">{a.product_name} <span className="text-muted-foreground ml-2">Lote #{a.id?.substring(0,6)}</span></span>
                  <Badge variant={aDaysLeft !== null && aDaysLeft <= 7 ? 'danger' : 'warning'}>
                    {aDaysLeft !== null ? `${aDaysLeft} días` : a.expiry_date}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 backdrop-blur-sm">
          <button onClick={() => setTab(0)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === 0 ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>Productos</button>
          <button onClick={() => setTab(1)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === 1 ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>Lotes</button>
        </div>
        <div className="w-full sm:w-64">
          <Input 
            icon={<Search size={16} />} 
            placeholder="Buscar..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/40 border-b border-white/10">
              {tab === 0 ? (
                <tr>
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">Categoría</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">Lote</th>
                  <th className="px-6 py-4 font-semibold text-center">Cantidad</th>
                  <th className="px-6 py-4 font-semibold">Caducidad</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="inline-block animate-spin text-brand-500"><RefreshCcw size={24} /></div></td></tr>
              ) : tab === 0 ? (
                filteredProducts.length > 0 ? filteredProducts.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{p.category || 'Otros'}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openDialog('product', p)}><Edit3 size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove('product', p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </motion.tr>
                )) : <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No hay productos registrados</td></tr>
              ) : (
                filteredBatches.length > 0 ? filteredBatches.map((b, i) => {
                  const daysLeft = b.expiry_date ? Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{getProductName(b.product_id)}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">{b.id?.substring(0,6) || '-'}</td>
                      <td className="px-6 py-4 text-center">{b.quantity}</td>
                      <td className="px-6 py-4">{b.expiry_date || '-'}</td>
                      <td className="px-6 py-4">
                        {daysLeft !== null ? (
                          <Badge variant={daysLeft <= 0 ? 'danger' : daysLeft <= 30 ? 'warning' : 'success'}>
                            {daysLeft <= 0 ? 'Caducado' : `${daysLeft} días`}
                          </Badge>
                        ) : <Badge variant="outline">Sin fecha</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openDialog('batch', b)}><Edit3 size={16} /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove('batch', b.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 size={16} /></Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                }) : <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No hay lotes registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={!!dialog} 
        onClose={() => setDialog(null)} 
        title={editItem ? `Editar ${dialog === 'product' ? 'Producto' : 'Lote'}` : `Nuevo ${dialog === 'product' ? 'Producto' : 'Lote'}`}
      >
        <div className="space-y-4 mt-2">
          {dialog === 'product' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                <Select value={form.category || 'otros'} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="bebidas">Bebidas</option>
                  <option value="snacks">Snacks</option>
                  <option value="aditivos">Aditivos</option>
                  <option value="tabaco">Tabaco</option>
                  <option value="otros">Otros</option>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Producto</label>
                <Select value={form.product_id || ''} onChange={e => setForm({...form, product_id: parseInt(e.target.value)})}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Cantidad (Unidades)</label>
                <Input type="number" value={form.quantity || ''} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} min="1" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Fecha de Caducidad</label>
                <Input type="date" value={form.expiry_date || ''} onChange={e => setForm({...form, expiry_date: e.target.value})} />
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>{editItem ? 'Guardar Cambios' : 'Registrar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
