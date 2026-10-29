import { create } from 'zustand';
import type {
  EntityType,
  AbstractionLevel,
  Framework,
  DeploymentType,
  AutonomyLevel,
  QualityLevel,
  MemoryType,
  KnowledgeSource,
  Capability,
  OutputFormat,
} from '@uiep/entity-schema';
import type { PipelineResult } from '@uiep/design-engine';

interface ConstructorState {
  goal: string;
  entityType: EntityType;
  abstractionLevel: AbstractionLevel;
  framework: Framework;
  deployment: DeploymentType;
  autonomyLevel: AutonomyLevel;
  quality: QualityLevel;
  memoryTypes: MemoryType[];
  knowledgeSources: KnowledgeSource[];
  capabilities: Capability[];
  outputs: OutputFormat[];

  result: PipelineResult | null;
  isGenerating: boolean;

  setGoal: (goal: string) => void;
  setEntityType: (type: EntityType) => void;
  setAbstractionLevel: (level: AbstractionLevel) => void;
  setFramework: (framework: Framework) => void;
  setDeployment: (deployment: DeploymentType) => void;
  setAutonomyLevel: (level: AutonomyLevel) => void;
  setQuality: (quality: QualityLevel) => void;
  toggleMemoryType: (type: MemoryType) => void;
  toggleKnowledgeSource: (source: KnowledgeSource) => void;
  toggleCapability: (cap: Capability) => void;
  toggleOutput: (output: OutputFormat) => void;
  setResult: (result: PipelineResult) => void;
  setIsGenerating: (generating: boolean) => void;
  reset: () => void;
}

const initialState = {
  goal: '',
  entityType: 'agent' as EntityType,
  abstractionLevel: 'engineering' as AbstractionLevel,
  framework: 'openai-agents' as Framework,
  deployment: 'local' as DeploymentType,
  autonomyLevel: 'level-1-tool-use' as AutonomyLevel,
  quality: 'professional' as QualityLevel,
  memoryTypes: [] as MemoryType[],
  knowledgeSources: [] as KnowledgeSource[],
  capabilities: [] as Capability[],
  outputs: [] as OutputFormat[],
  result: null as PipelineResult | null,
  isGenerating: false,
};

export const useConstructorStore = create<ConstructorState>((set) => ({
  ...initialState,

  setGoal: (goal) => set({ goal }),
  setEntityType: (entityType) => set({ entityType }),
  setAbstractionLevel: (abstractionLevel) => set({ abstractionLevel }),
  setFramework: (framework) => set({ framework }),
  setDeployment: (deployment) => set({ deployment }),
  setAutonomyLevel: (autonomyLevel) => set({ autonomyLevel }),
  setQuality: (quality) => set({ quality }),

  toggleMemoryType: (type) => set((state) => ({
    memoryTypes: state.memoryTypes.includes(type)
      ? state.memoryTypes.filter((t) => t !== type)
      : [...state.memoryTypes, type],
  })),

  toggleKnowledgeSource: (source) => set((state) => ({
    knowledgeSources: state.knowledgeSources.includes(source)
      ? state.knowledgeSources.filter((s) => s !== source)
      : [...state.knowledgeSources, source],
  })),

  toggleCapability: (cap) => set((state) => ({
    capabilities: state.capabilities.includes(cap)
      ? state.capabilities.filter((c) => c !== cap)
      : [...state.capabilities, cap],
  })),

  toggleOutput: (output) => set((state) => ({
    outputs: state.outputs.includes(output)
      ? state.outputs.filter((o) => o !== output)
      : [...state.outputs, output],
  })),

  setResult: (result) => set({ result }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  reset: () => set(initialState),
}));
