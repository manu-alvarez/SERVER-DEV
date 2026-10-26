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

    const typeColors: Record<string, string> = {
      'ai-model': '#dbe4ff',
      'agent': '#d3f9d8',
      'storage': '#fff3bf',
      'executor': '#ffe3e3',
      'controller': '#c5f6fa',
      'infrastructure': '#f3d9fa',
      'input': '#d3f9d8',
      'output': '#ffe3e3',
      'logic': '#fff3bf',
      'transform': '#c5f6fa',
      'processor': '#dbe4ff',
    };

    return {
      id: comp.id,
      position: {
        x: indexInLayer * 240 + 50,
        y: layerIndex * 140 + 50,
      },
      data: {
        label: (
          <div className="text-center min-w-[120px]">
            <div className="text-xs font-bold text-gray-800">{comp.name}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{comp.type}</div>
            {comp.description && (
              <div className="text-[9px] text-gray-400 mt-0.5 max-w-[140px] truncate">{comp.description}</div>
            )}
          </div>
        ),
      },
      style: {
        background: typeColors[comp.type] || '#f1f3f5',
        border: '2px solid #dee2e6',
        borderRadius: '12px',
        padding: '10px 14px',
        width: 180,
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
      stroke: conn.type === 'control' ? '#4c6ef5' : conn.type === 'event' ? '#f06595' : '#868e96',
      strokeWidth: 2,
    },
    labelStyle: { fontSize: 10, fill: '#495057' },
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
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <p className="text-sm">Configure and click Generate to see visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Visualization</h2>
          <p className="text-xs text-gray-500 mt-1">
            {result.architecture.architecture.components.length} components
            {' '}&middot;{' '}
            {result.architecture.architecture.connections.length} connections
            {' '}&middot;{' '}
            Quality: {result.verification.overallScore}/100
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['architecture', 'flow', 'layers'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap nodeColor={() => '#dee2e6'} />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
