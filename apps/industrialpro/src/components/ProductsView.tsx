import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import api from '../api/client';
import { Card, Button, Input, Modal, Select } from './ui';

export default function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: 'Zumos', color: '#3b82f6' });

  const load = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) { alert("Error al cargar productos"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditItem(null); setForm({ name: '', category: 'Zumos', color: '#3b82f6' }); setDialog(true); };
  const openEdit = (p: any) => { setEditItem(p); setForm({ name: p.name, category: p.category, color: p.color }); setDialog(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      if (editItem) await api.put(`/products/${editItem.id}`, form);
      else await api.post('/products', form);
      setDialog(false);
      await load();
    } catch (err) { alert("Error al guardar el producto"); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (err) { alert("Error al eliminar el producto"); }
  };

  const categories = ['Zumos', 'Concentrados', 'Cremas'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-msb-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Productos</h1>
          <p className="text-slate-400">Gestión de catálogo</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={18} className="mr-2" /> Nuevo Producto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 group hover:border-msb-primary/50 transition-colors">
              <div className="flex items-start gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ backgroundColor: `${p.color}33`, color: p.color, border: `1px solid ${p.color}66` }}
                >
                  <Package size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate pr-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{p.category}</p>
                </div>
                
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 text-slate-400 hover:text-msb-error hover:bg-msb-error/10 rounded-md transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {products.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center border-dashed border-2 border-slate-700 bg-white/5">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-4">
                <Package size={32} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Catálogo Vacío</h3>
              <p className="text-slate-400 mb-4">Aún no hay productos registrados en el sistema.</p>
              <Button onClick={openNew} variant="outline">Crear el primero</Button>
            </Card>
          </div>
        )}
      </div>

      <Modal isOpen={dialog} onClose={() => setDialog(false)} title={editItem ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <Input autoFocus value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre del producto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Color Identificativo</label>
            <div className="flex gap-3">
              <input 
                type="color" 
                value={form.color} 
                onChange={e => setForm({...form, color: e.target.value})} 
                className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="font-mono uppercase flex-1" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
