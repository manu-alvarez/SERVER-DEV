import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Settings, 
  DownloadCloud, 
  UploadCloud, 
  LogOut,
  RefreshCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { Card, Button, Input, Modal, cn } from './ui';

interface Props {
  user: any;
  onLogout: () => void;
}

export default function SettingsView({ user, onLogout }: Props) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [pinDialog, setPinDialog] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', newPin: '', confirmPin: '' });

  useEffect(() => {
    api.getSettings().then(s => setSettings(s || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showMessage = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      showMessage('Ajustes guardados correctamente');
    } catch { 
      showMessage('Error al guardar ajustes', true); 
    }
    setSaving(false);
  };

  const changePin = async () => {
    if (pinForm.newPin !== pinForm.confirmPin) { showMessage('Los nuevos PINs no coinciden', true); return; }
    if (pinForm.newPin.length < 4) { showMessage('El PIN debe tener al menos 4 dígitos', true); return; }
    try {
      await api.changePin(pinForm.pin, pinForm.newPin);
      setPinDialog(false);
      setPinForm({ pin: '', newPin: '', confirmPin: '' });
      showMessage('PIN actualizado correctamente');
    } catch (e: any) { 
      showMessage(e.message || 'Error al cambiar PIN', true); 
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gas-station-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Datos exportados correctamente');
    } catch { 
      showMessage('Error al exportar datos', true); 
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      try {
        const text = await e.target.files[0].text();
        await api.importData(JSON.parse(text));
        showMessage('Datos importados correctamente. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
      } catch { 
        showMessage('Error al importar datos', true); 
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin text-brand-500"><RefreshCcw size={48} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
        <p className="text-muted-foreground mt-1">Configuración y mantenimiento</p>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={cn(
          "flex items-center gap-2 p-4 rounded-lg border",
          isError ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        )}>
          {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{message}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500"><ShieldCheck size={24} /></div>
              <h2 className="text-xl font-semibold">Seguridad</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5">
                <div>
                  <p className="text-sm text-muted-foreground">Usuario Actual</p>
                  <p className="font-medium text-foreground">{user?.name}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold border border-brand-500/30">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => setPinDialog(true)}>
                Cambiar PIN de Acceso
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Data Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><DownloadCloud size={24} /></div>
              <h2 className="text-xl font-semibold">Gestión de Datos</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <p className="text-sm text-muted-foreground">Crea copias de seguridad de la base de datos local o restaura desde un archivo JSON.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleExport} className="flex-col h-auto py-4 gap-2">
                  <DownloadCloud size={20} />
                  <span>Exportar Backup</span>
                </Button>
                <Button variant="outline" onClick={handleImport} className="flex-col h-auto py-4 gap-2">
                  <UploadCloud size={20} />
                  <span>Importar Datos</span>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Preferences Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Settings size={24} /></div>
              <h2 className="text-xl font-semibold">Preferencias de la Estación</h2>
            </div>
            
            <div className="space-y-4">
              {Object.keys(settings).filter(k => !k.startsWith('_')).length === 0 ? (
                <div className="p-4 rounded-lg bg-black/40 border border-white/5 text-center text-muted-foreground">
                  No hay ajustes configurados actualmente.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(settings).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                      {typeof val === 'boolean' ? (
                        <div className="flex items-center h-10 px-3 rounded-lg border border-white/10 bg-black/40">
                          <input 
                            type="checkbox" 
                            checked={val} 
                            onChange={e => setSettings({...settings, [key]: e.target.checked})}
                            className="w-4 h-4 rounded border-white/20 bg-black text-brand-500 focus:ring-brand-500 focus:ring-offset-background"
                          />
                          <span className="ml-2 text-sm">{val ? 'Activado' : 'Desactivado'}</span>
                        </div>
                      ) : (
                        <Input 
                          value={val as string || ''} 
                          onChange={e => setSettings({...settings, [key]: e.target.value})} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                <Button variant="primary" onClick={saveSettings} isLoading={saving}>
                  Guardar Preferencias
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2">
          <Card className="border-red-500/20 bg-red-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-red-400">Finalizar Sesión</h3>
              <p className="text-sm text-muted-foreground">Cierra la sesión actual de forma segura en este terminal.</p>
            </div>
            <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10 w-full sm:w-auto" onClick={onLogout}>
              <LogOut size={18} className="mr-2" /> Cerrar Sesión
            </Button>
          </Card>
        </motion.div>
      </div>

      <Modal isOpen={pinDialog} onClose={() => setPinDialog(false)} title="Cambiar PIN de Seguridad">
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">PIN Actual</label>
            <Input 
              type="password" 
              value={pinForm.pin} 
              onChange={e => setPinForm({...pinForm, pin: e.target.value})} 
              autoFocus 
              className="font-mono tracking-widest"
              maxLength={4}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Nuevo PIN (4 dígitos)</label>
            <Input 
              type="password" 
              value={pinForm.newPin} 
              onChange={e => setPinForm({...pinForm, newPin: e.target.value})} 
              className="font-mono tracking-widest"
              maxLength={4}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Confirmar Nuevo PIN</label>
            <Input 
              type="password" 
              value={pinForm.confirmPin} 
              onChange={e => setPinForm({...pinForm, confirmPin: e.target.value})} 
              onKeyDown={e => e.key === 'Enter' && changePin()}
              className="font-mono tracking-widest"
              maxLength={4}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setPinDialog(false)}>Cancelar</Button>
            <Button variant="primary" onClick={changePin}>Actualizar PIN</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
