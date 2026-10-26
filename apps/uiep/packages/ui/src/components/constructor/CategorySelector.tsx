'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import type { EntityType, AbstractionLevel, Framework, DeploymentType, AutonomyLevel, QualityLevel } from '@uiep/entity-schema';

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'agent', label: 'Agent' },
  { value: 'multi-agent-system', label: 'Multi-Agent System' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'framework', label: 'Framework' },
  { value: 'mcp-server', label: 'MCP Server' },
  { value: 'skill-pack', label: 'Skill Pack' },
  { value: 'prompt-system', label: 'Prompt System' },
  { value: 'knowledge-base', label: 'Knowledge Base' },
  { value: 'rag-system', label: 'RAG System' },
  { value: 'tool-collection', label: 'Tool Collection' },
  { value: 'harness', label: 'Harness' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'application', label: 'Application' },
  { value: 'agentic-app', label: 'Agentic App' },
  { value: 'saas', label: 'SaaS' },
  { value: 'enterprise-arch', label: 'Enterprise Architecture' },
];

const ABSTRACTION_LEVELS: { value: AbstractionLevel; label: string }[] = [
  { value: 'conceptual', label: 'Conceptual' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'implementation', label: 'Implementation' },
  { value: 'production', label: 'Production' },
];

const FRAMEWORKS: { value: Framework; label: string }[] = [
  { value: 'openai-agents', label: 'OpenAI Agents' },
  { value: 'langgraph', label: 'LangGraph' },
  { value: 'crewai', label: 'CrewAI' },
  { value: 'n8n', label: 'n8n' },
  { value: 'flowise', label: 'Flowise' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'llamaindex', label: 'LlamaIndex' },
  { value: 'dspy', label: 'DSPy' },
  { value: 'custom', label: 'Custom' },
];

const DEPLOYMENTS: { value: DeploymentType; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'vps', label: 'VPS' },
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'hybrid', label: 'Hybrid' },
];

const AUTONOMY_LEVELS: { value: AutonomyLevel; label: string }[] = [
  { value: 'level-0-assistant', label: 'L0 - Assistant' },
  { value: 'level-1-tool-use', label: 'L1 - Tool Use' },
  { value: 'level-2-workflow', label: 'L2 - Workflow' },
  { value: 'level-3-planning', label: 'L3 - Planning' },
  { value: 'level-4-multiagent', label: 'L4 - Multi-Agent' },
  { value: 'level-5-autonomous', label: 'L5 - Autonomous' },
];

const QUALITY_LEVELS: { value: QualityLevel; label: string }[] = [
  { value: 'mvp', label: 'MVP' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'research', label: 'Research' },
  { value: 'mission-critical', label: 'Mission Critical' },
];

function SelectGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-uiep-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CategorySelector() {
  const {
    entityType,
    setEntityType,
    abstractionLevel,
    setAbstractionLevel,
    framework,
    setFramework,
    deployment,
    setDeployment,
    autonomyLevel,
    setAutonomyLevel,
    quality,
    setQuality,
  } = useConstructorStore();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-900">Configuration</h2>
      <SelectGroup label="Entity Type" value={entityType} onChange={(v) => setEntityType(v as EntityType)} options={ENTITY_TYPES} />
      <SelectGroup label="Abstraction Level" value={abstractionLevel} onChange={(v) => setAbstractionLevel(v as AbstractionLevel)} options={ABSTRACTION_LEVELS} />
      <SelectGroup label="Framework" value={framework} onChange={(v) => setFramework(v as Framework)} options={FRAMEWORKS} />
      <SelectGroup label="Deployment" value={deployment} onChange={(v) => setDeployment(v as DeploymentType)} options={DEPLOYMENTS} />
      <SelectGroup label="Autonomy Level" value={autonomyLevel} onChange={(v) => setAutonomyLevel(v as AutonomyLevel)} options={AUTONOMY_LEVELS} />
      <SelectGroup label="Quality" value={quality} onChange={(v) => setQuality(v as QualityLevel)} options={QUALITY_LEVELS} />
    </div>
  );
}
