import { useAppStore } from '../store';
import { Trash2, X } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HistoryPanel({ open, onClose }: Props) {
  const history = useAppStore(state => state.history);
  const clearHistory = useAppStore(state => state.clearHistory);
  const deleteItem = useAppStore(state => state.deleteHistoryItem);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#0a0a0f] border-l border-white/10 z-[110] shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white">Historial</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={clearHistory} title="Borrar historial" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <Trash2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center text-white/40 mt-10">Sin historial</div>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="relative group p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-400"
                  onClick={() => deleteItem(entry.id)}
                >
                  <X size={14} />
                </Button>
                
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {entry.type.split(':')[0]}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {entry.provider}
                  </span>
                </div>
                <div className="text-sm text-white/80 line-clamp-2 mb-1">{entry.input}</div>
                <div className="text-xs text-white/40 line-clamp-3">{entry.output}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
