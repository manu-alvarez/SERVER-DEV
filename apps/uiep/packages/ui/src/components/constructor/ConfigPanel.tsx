'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import type { MemoryType, KnowledgeSource, Capability, OutputFormat } from '@uiep/entity-schema';

const MEMORY_TYPES: { value: MemoryType; label: string }[] = [
  { value: 'working', label: 'Working Memory' },
  { value: 'episodic', label: 'Episodic Memory' },
  { value: 'semantic', label: 'Semantic Memory' },
  { value: 'procedural', label: 'Procedural Memory' },
  { value: 'shared', label: 'Shared Memory' },
  { value: 'graph', label: 'Graph Memory' },
];

const KNOWLEDGE_SOURCES: { value: KnowledgeSource; label: string }[] = [
  { value: 'rag-local', label: 'RAG Local' },
  { value: 'web-search', label: 'Web Search' },
  { value: 'vector-db', label: 'Vector Database' },
  { value: 'graph-db', label: 'Graph Database' },
  { value: 'sql', label: 'SQL' },
  { value: 'document-repo', label: 'Document Repository' },
  { value: 'api-knowledge', label: 'API Knowledge' },
  { value: 'mcp-knowledge', label: 'MCP Knowledge' },
];

const CAPABILITIES: { value: Capability; label: string }[] = [
  { value: 'reasoning', label: 'Reasoning' },
  { value: 'planning', label: 'Planning' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'self-critique', label: 'Self Critique' },
  { value: 'verification', label: 'Verification' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'research', label: 'Research' },
  { value: 'coding', label: 'Coding' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'security', label: 'Security' },
  { value: 'testing', label: 'Testing' },
  { value: 'monitoring', label: 'Monitoring' },
];

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'mermaid', label: 'Mermaid' },
  { value: 'openapi', label: 'OpenAPI' },
  { value: 'mcp-manifest', label: 'MCP Manifest' },
  { value: 'source-code', label: 'Source Code' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'docker-compose', label: 'Docker Compose' },
];

function CheckboxGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</h3>
      <div className="space-y-1">
        {items.map((item) => {
          const isChecked = selected.includes(item.value);
          return (
            <label
              key={item.value}
              className={`flex items-center gap-2.5 text-xs px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                isChecked
                  ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(item.value)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function ConfigPanel() {
  const {
    memoryTypes,
    toggleMemoryType,
    knowledgeSources,
    toggleKnowledgeSource,
    capabilities,
    toggleCapability,
    outputs,
    toggleOutput,
  } = useConstructorStore();

  return (
    <div className="space-y-4">
      <CheckboxGroup
        label="Memory"
        items={MEMORY_TYPES}
        selected={memoryTypes}
        onToggle={(v) => toggleMemoryType(v as MemoryType)}
      />
      <CheckboxGroup
        label="Knowledge"
        items={KNOWLEDGE_SOURCES}
        selected={knowledgeSources}
        onToggle={(v) => toggleKnowledgeSource(v as KnowledgeSource)}
      />
      <CheckboxGroup
        label="Capabilities"
        items={CAPABILITIES}
        selected={capabilities}
        onToggle={(v) => toggleCapability(v as Capability)}
      />
      <CheckboxGroup
        label="Output Formats"
        items={OUTPUT_FORMATS}
        selected={outputs}
        onToggle={(v) => toggleOutput(v as OutputFormat)}
      />
    </div>
  );
}
