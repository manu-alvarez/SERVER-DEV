'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';

function buildFlowData(result: import('@uiep/design-engine').PipelineResult | null) {
  if (!result) {
    return { nodes: [], edges: [] };
  }

  const components = result.architecture.architecture.components;
  const connections = result.architecture.architecture.connections;
  const layers = result.architecture.architecture.layers;

  const nodes: Node[] = components.map((comp) => {
    const layerIndex = layers.findIndex((l) => l.components.includes(comp.id));
    const nodesInLayer = components.filter((c) =>
      layers[layerIndex]?.components.includes(c.id)
    );
    const indexInLayer = nodesInLayer.indexOf(comp);

    return {
      id: comp.id,
      position: {
        x: indexInLayer * 220 + 50,
        y: layerIndex * 120 + 50,
      },
      data: {
        label: (
          <div className="text-center">
            <div className="text-xs font-semibold">{comp.name}</div>
            <div className="text-[10px] text-gray-500">{comp.type}</div>
          </div>
        ),
      },
      style: {
        background: layerIndex === 0 ? '#dbe4ff' : layerIndex === 1 ? '#d3f9d8' : '#fff3bf',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '8px 12px',
        width: 160,
      },
    };
  });

  const edges: Edge[] = connections.map((conn, i) => ({
    id: `edge-${i}`,
    source: conn.from,
    target: conn.to,
    label: conn.label || conn.type,
    animated: conn.type === 'event',
    style: { stroke: conn.type === 'control' ? '#4c6ef5' : '#868e96' },
  }));

  return { nodes, edges };
}

export function ArchitectureView() {
  const { result } = useConstructorStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildFlowData(result);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [result, setNodes, setEdges]);

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <p className="text-sm">Configure and click Generate to see architecture</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Architecture</h2>
        <p className="text-xs text-gray-500 mt-1">
          {result.architecture.architecture.components.length} components
          {' '}&middot;{' '}
          {result.architecture.architecture.connections.length} connections
          {' '}&middot;{' '}
          Quality: {result.verification.overallScore}/100
        </p>
      </div>
      <div className="h-[calc(100%-60px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
