import { analyzeIntent, type IntentAnalysisInput, type IntentAnalysisResult } from './intent';
import { synthesizeArchitecture, type ArchitectureSynthesisResult } from './architecture';
import { factoryEntity, type EntityFactoryResult } from './factory';
import { verifyEntity, type VerificationResult } from './verification';
import { generateArtifacts, type GeneratorResult } from './generator';

export interface PipelineInput extends IntentAnalysisInput {}

export interface PipelineResult {
  intent: IntentAnalysisResult;
  architecture: ArchitectureSynthesisResult;
  factory: EntityFactoryResult;
  verification: VerificationResult;
  generation: GeneratorResult;
}

export function runPipeline(input: PipelineInput): PipelineResult {
  const intent = analyzeIntent(input);
  const architecture = synthesizeArchitecture(intent);
  const factory = factoryEntity(intent, architecture);
  const verification = verifyEntity(intent, architecture, factory);
  const generation = generateArtifacts(intent, architecture, factory, verification);

  return {
    intent,
    architecture,
    factory,
    verification,
    generation,
  };
}

export { analyzeIntent } from './intent';
export type { IntentAnalysisInput, IntentAnalysisResult } from './intent';
export { synthesizeArchitecture } from './architecture';
export type { ArchitectureSynthesisResult } from './architecture';
export { factoryEntity } from './factory';
export type { EntityFactoryResult } from './factory';
export { verifyEntity } from './verification';
export type { VerificationResult, VerificationCheck } from './verification';
export { generateArtifacts } from './generator';
export type { GeneratorResult, GeneratedArtifact } from './generator';
