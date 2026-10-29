import { useCallback } from 'react';
import { useConstructorStore } from '@/stores/constructor-store';
import { runPipeline } from '@uiep/design-engine';
import { adaptToFramework } from '@uiep/framework-adapter';
import type { PipelineResult } from '@uiep/design-engine';

export function useDesignEngine() {
  const {
    goal,
    entityType,
    abstractionLevel,
    framework,
    deployment,
    autonomyLevel,
    quality,
    setResult,
    setIsGenerating,
  } = useConstructorStore();

  const generate = useCallback(async () => {
    if (!goal.trim()) return;

    setIsGenerating(true);

    try {
      const result = runPipeline({
        goal: goal.trim(),
        entityType,
        abstractionLevel,
        targetFrameworks: [framework],
      });

      setResult(result);
    } catch (error) {
      console.error('Pipeline error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    goal,
    entityType,
    abstractionLevel,
    framework,
    deployment,
    autonomyLevel,
    quality,
    setResult,
    setIsGenerating,
  ]);

  const adapt = useCallback(
    (result: PipelineResult) => {
      return adaptToFramework({
        pipelineResult: result,
        framework,
        entityType,
      });
    },
    [framework, entityType]
  );

  return { generate, adapt };
}
