import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Server, Wifi, WifiOff, Activity } from 'lucide-react';
import { Button } from './Button';
import { Orb } from 'orb-ui';

interface NodeInfo {
  id: string;
  name: string;
  status: string;
  last_seen?: string;
  metadata?: Record<string, unknown>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function C2Monitor({ isOpen, onClose }: Props) {
  const { data: nodeData, isLoading } = useQuery({
    queryKey: ['nodes-detail'],
    queryFn: async () => {
      const res = await fetch('/_msbross/api/nodes');
      return res.json();
    },
    refetchInterval: 3000,
    enabled: isOpen,
  });

  const { data: healthData } = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      const res = await fetch('/_msbross/api/status');
      return res.json();
    },
    refetchInterval: 5000,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const nodes: NodeInfo[] = nodeData?.nodes || [];
  const nodeCount = nodeData?.count || 0;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0c10]/95 backdrop-blur-2xl border-l border-[#00ffcc]/10 z-50 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#00ffcc]/10">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#00ffcc]" />
          <h2 className="text-lg font-bold text-white tracking-tight">C2 Monitor</h2>
          <span className="text-[10px] bg-[#00ffcc]/10 text-[#00ffcc] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
            Live
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Orb Status */}
      <div className="flex flex-col items-center py-8 border-b border-white/5">
        <div style={{ filter: `drop-shadow(0 0 ${nodeCount > 0 ? 30 : 10}px ${nodeCount > 0 ? '#00ffcc' : '#ef4444'})` }}>
          <Orb
            state={isLoading ? 'connecting' : nodeCount > 0 ? 'idle' : 'error'}
            theme="circle"
            size={80}
            disabled
          />
        </div>
        <div className="mt-4 text-center">
          <div className="text-[#00ffcc] text-2xl font-bold font-mono">{nodeCount}</div>
          <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Active Nodes</div>
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Backend Status */}
        <div className="bg-[#161a22] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#ffcc00]" />
              <span className="text-white font-semibold text-sm">Backend Core</span>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${healthData ? 'bg-[#00ffcc]/10 text-[#00ffcc]' : 'bg-red-500/10 text-red-400'}`}>
              {healthData ? 'Online' : 'Offline'}
            </span>
          </div>
          {healthData && (
            <div className="text-[11px] text-white/30 font-mono space-y-1">
              {Object.entries(healthData).slice(0, 5).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-white/50">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connected Nodes */}
        {nodes.length > 0 ? nodes.map((node: NodeInfo) => (
          <div key={node.id} className="bg-[#161a22] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#aa3bff]" />
                <span className="text-white font-semibold text-sm">{node.name || node.id}</span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#aa3bff]/10 text-[#aa3bff]">
                {node.status || 'Connected'}
              </span>
            </div>
            {node.last_seen && (
              <div className="text-[10px] text-white/25 mt-2 font-mono">
                Last seen: {new Date(node.last_seen).toLocaleTimeString()}
              </div>
            )}
          </div>
        )) : (
          <div className="text-center py-8">
            <WifiOff className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No C2 nodes connected</p>
            <p className="text-white/15 text-xs mt-1">Nodes auto-register via WebSocket</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 text-center text-[10px] text-white/20 font-mono uppercase tracking-widest">
        MSBrOSs C2 Protocol // Refresh 3s
      </div>
    </motion.div>
  );
}
