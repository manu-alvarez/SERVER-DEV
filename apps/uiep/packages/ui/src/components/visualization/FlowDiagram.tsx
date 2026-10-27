'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useState } from 'react';

type ViewMode = 'architecture' | 'flow' | 'layers';

function buildArchitectureNodes(result: import('@uiep/design-engine').PipelineResult): { nodes: Node[]; edges: Edge[] } {
  const components = result.architecture.architecture.components;
  const connections = result.architecture.architecture.connections;
  const layers = result.architecture.architecture.layers;

  const nodes: Node[] = components.map((comp) => {
    const layerIndex = layers.findIndex((l) => l.components.includes(comp.id));
    const nodesInLayer = components.filter((c) =>
      layers[layerIndex]?.components.includes(c.id)
    );
    const indexInLayer = nodesInLayer.indexOf(comp);

    const typeColors: Record<string, { bg: string; border: string; text: string }> = {
      'ai-model': { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd' },
      'agent': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7' },
      'storage': { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fcd34d' },
      'executor': { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5' },
      'controller': { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', text: '#67e8f9' },
      'infrastructure': { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe' },
      'input': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7' },
      'output': { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6' },
      'logic': { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)', text: '#fde047' },
      'transform': { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', text: '#67e8f9' },
      'processor': { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', text: '#a5b4fc' },
    };

    const scheme = typeColors[comp.type] || { bg: 'rgba(30, 41, 59, 0.6)', border: 'rgba(51, 65, 85, 0.8)', text: '#cbd5e1' };

    return {
      id: comp.id,
      position: {
        x: indexInLayer * 240 + 50,
        y: layerIndex * 140 + 50,
      },
      data: {
        label: (
          <div className="text-center min-w-[120px]">
            <div className="text-xs font-bold text-white tracking-wide">{comp.name}</div>
            <div className="text-[10px] uppercase font-mono tracking-wider mt-0.5" style={{ color: scheme.text }}>{comp.type}</div>
            {comp.description && (
              <div className="text-[9px] text-slate-400 mt-1 max-w-[140px] truncate">{comp.description}</div>
            )}
          </div>
        ),
      },
      style: {
        background: scheme.bg,
        border: `1px solid ${scheme.border}`,
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        padding: '10px 14px',
        width: 180,
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
    };
  });

  const edges: Edge[] = connections.map((conn, i) => ({
    id: `edge-${i}`,
    source: conn.from,
    target: conn.to,
    label: conn.label || conn.type,
    animated: conn.type === 'event',
    style: { 
      stroke: conn.type === 'control' ? '#3b82f6' : conn.type === 'event' ? '#ec4899' : '#06b6d4',
      strokeWidth: 2,
    },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  }));

  return { nodes, edges };
}

function buildFlowNodes(_result: import('@uiep/design-engine').PipelineResult): { nodes: Node[]; edges: Edge[] } {
  const phases = [
    { id: 'intent', label: 'Intent Analysis', x: 50 },
    { id: 'architecture', label: 'Architecture', x: 280 },
    { id: 'factory', label: 'Entity Factory', x: 510 },
    { id: 'verification', label: 'Verification', x: 740 },
    { id: 'generator', label: 'Generator', x: 970 },
  ];

  const nodes: Node[] = phases.map((phase) => ({
    id: phase.id,
    position: { x: phase.x, y: 200 },
    data: {
      label: (
        <div className="text-center min-w-[140px]">
          <div className="text-xs font-bold text-white">{phase.label}</div>
          <div className="text-[10px] text-blue-100 mt-0.5">Phase</div>
        </div>
      ),
    },
    style: {
      background: 'linear-gradient(135deg, #4c6ef5, #3b5bdb)',
      borderRadius: '12px',
      padding: '14px 18px',
      width: 180,
    },
  }));

  const edges: Edge[] = phases.slice(0, -1).map((phase, i) => ({
    id: `flow-${i}`,
    source: phase.id,
    target: phases[i + 1].id,
    animated: true,
    style: { stroke: '#4c6ef5', strokeWidth: 2 },
  }));

  return { nodes, edges };
}

function buildLayerNodes(result: import('@uiep/design-engine').PipelineResult): { nodes: Node[]; edges: Edge[] } {
  const layers = result.architecture.architecture.layers;
  const components = result.architecture.architecture.components;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  layers.forEach((layer, layerIndex) => {
    nodes.push({
      id: `layer-${layerIndex}`,
      position: { x: 50, y: layerIndex * 120 + 50 },
      data: {
        label: (
          <div className="min-w-[200px]">
            <div className="text-sm font-bold text-gray-800 mb-2">{layer.name}</div>
            <div className="flex flex-wrap gap-1">
              {layer.components.map(compId => {
                const comp = components.find(c => c.id === compId);
                return comp ? (
                  <span key={compId} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {comp.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ),
      },
      style: {
        background: '#f8f9fa',
        border: '2px solid #dee2e6',
        borderRadius: '12px',
        padding: '14px 18px',
        width: 300,
      },
    });
  });

  return { nodes, edges };
}

export function FlowDiagram() {
  const { result } = useConstructorStore();
  const [viewMode, setViewMode] = useState<ViewMode>('architecture');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!result) return;
    
    let data: { nodes: Node[]; edges: Edge[] };
    switch (viewMode) {
      case 'flow':
        data = buildFlowNodes(result);
        break;
      case 'layers':
        data = buildLayerNodes(result);
        break;
      default:
        data = buildArchitectureNodes(result);
    }
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [result, viewMode, setNodes, setEdges]);

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 bg-[#070B14]">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/5">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Canvas Ready</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Configure your desired entity on the left panel and click <span className="text-blue-400 font-medium">Generate Architecture</span> to view interactive flow nodes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#070B14]">
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-sm flex items-center justify-between z-10">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Topology</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-blue-400 font-semibold">{result.architecture.architecture.components.length}</span> components
            {' '}&middot;{' '}
            <span className="text-cyan-400 font-semibold">{result.architecture.architecture.connections.length}</span> links
            {' '}&middot;{' '}
            Confidence: <span className="text-emerald-400 font-semibold">{result.verification.overallScore}%</span>
          </p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          {(['architecture', 'flow', 'layers'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          className="dark"
        >
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200" />
          <MiniMap nodeColor={() => '#3b82f6'} className="!bg-slate-950 !border-slate-800" maskColor="rgba(7, 11, 20, 0.7)" />
          <Background gap={18} color="#1e293b" />
        </ReactFlow>
      </div>
    </div>
  );
}
