'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import { useDesignEngine } from '@/hooks/useDesignEngine';
import { useState } from 'react';

type ExportFormat = 'json' | 'yaml' | 'openapi' | 'docker' | 'kubernetes' | 'zip';

export function ExportPanel() {
  const { result } = useConstructorStore();
  const { adapt } = useDesignEngine();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [exported, setExported] = useState(false);

  if (!result) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-sm">Generate an entity first to export</p>
      </div>
    );
  }

  const formats: { id: ExportFormat; label: string; icon: string }[] = [
    { id: 'json', label: 'JSON', icon: '{ }' },
    { id: 'yaml', label: 'YAML', icon: '---' },
    { id: 'openapi', label: 'OpenAPI', icon: 'API' },
    { id: 'docker', label: 'Docker', icon: '🐳' },
    { id: 'kubernetes', label: 'K8s', icon: '☸' },
    { id: 'zip', label: 'ZIP', icon: '📦' },
  ];

  const generateExport = (format: ExportFormat): string => {
    const adapterOutput = adapt(result);
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          entity: result.intent,
          architecture: result.architecture.architecture,
          artifacts: result.generation.artifacts,
          adapter: {
            framework: adapterOutput.framework,
            files: adapterOutput.files.map(f => ({ path: f.path, type: f.type })),
          },
        }, null, 2);

      case 'yaml':
        return `# UIEP Export
entity:
  type: ${result.intent.entityType}
  name: ${result.intent.refinedGoal}
  framework: ${result.intent.framework}
  
architecture:
  components: ${result.architecture.architecture.components.length}
  connections: ${result.architecture.architecture.connections.length}
  patterns:
${result.architecture.architecture.patterns.map(p => `    - ${p}`).join('\n')}

quality:
  score: ${result.verification.overallScore}
  passed: ${result.verification.passed}
`;

      case 'openapi':
        return JSON.stringify({
          openapi: '3.0.0',
          info: {
            title: result.intent.refinedGoal,
            version: '0.1.0',
            description: result.intent.goal,
          },
          paths: {
            '/generate': {
              post: {
                summary: 'Generate entity',
                requestBody: {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          goal: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                responses: {
                  '200': { description: 'Generated entity' },
                },
              },
            },
          },
        }, null, 2);

      case 'docker':
        return `version: '3.8'

services:
  ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
`;

      case 'kubernetes':
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
  labels:
    app: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
  template:
    metadata:
      labels:
        app: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
    spec:
      containers:
      - name: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
        image: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai
---
apiVersion: v1
kind: Service
metadata:
  name: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
spec:
  selector:
    app: ${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
`;

      case 'zip':
        return `ZIP Export Contents:
${result.generation.artifacts.map(a => `  - ${a.name} (${a.format})`).join('\n')}
  - package.json
  - tsconfig.json
  - README.md

Total files: ${result.generation.artifacts.length + 3}
Use the download button to get the ZIP file.`;

      default:
        return '';
    }
  };

  const handleExport = () => {
    const content = generateExport(selectedFormat);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}.${selectedFormat === 'zip' ? 'txt' : selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Export</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {formats.map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => setSelectedFormat(fmt.id)}
            className={`p-2 text-center rounded-lg border transition-colors ${
              selectedFormat === fmt.id
                ? 'border-uiep-500 bg-uiep-50 text-uiep-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <div className="text-lg">{fmt.icon}</div>
            <div className="text-xs mt-1">{fmt.label}</div>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-auto">
        <pre className="text-[10px] text-gray-300 whitespace-pre-wrap">
          {generateExport(selectedFormat).slice(0, 500)}
          {generateExport(selectedFormat).length > 500 && '\n...'}
        </pre>
      </div>

      <button
        onClick={handleExport}
        className="w-full py-2 px-4 bg-uiep-600 text-white text-sm font-medium rounded-lg hover:bg-uiep-700 transition-colors"
      >
        {exported ? 'Exported!' : `Export as ${selectedFormat.toUpperCase()}`}
      </button>
    </div>
  );
}
