import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UnsupportedFrameworkError, runPipeline } from '@uiep/design-engine';
import type { Framework } from '@uiep/entity-schema';

/**
 * Selección de framework (Fase 0.1) — contrato del motor:
 *   1. targetFrameworks explícito → respetado.
 *   2. Primer elemento de la lista cuando hay varios.
 *   3. Sin selección → heurística por defecto (openai-agents).
 *   4. No soportado → error explícito, sin fallback silencioso.
 *   5. El framework elegido se refleja en el resultado y en los artefactos.
 */
const CODE_ARTIFACT = (goal: string, frameworks: Framework[]) =>
  runPipeline({ goal, targetFrameworks: frameworks });

test('selección: targetFrameworks explícito se respeta (langgraph)', () => {
  const r = CODE_ARTIFACT('Research assistant', ['langgraph']);
  assert.equal(r.intent.framework, 'langgraph');
  const config = r.generation.artifacts.find((a) => a.name === 'config.json');
  assert.ok(config && config.content.includes('langgraph'), 'config.json refleja el framework');
  const readme = r.generation.artifacts.find((a) => a.name === 'README.md');
  assert.ok(readme && readme.content.includes('langgraph'), 'README.md refleja el framework');
});

test('selección: primer framework cuando la lista trae varios', () => {
  const r = CODE_ARTIFACT('Research assistant', ['crewai', 'n8n']);
  assert.equal(r.intent.framework, 'crewai');
});

test('selección: sin targetFrameworks actúa el default del motor', () => {
  assert.equal(runPipeline({ goal: 'Research assistant' }).intent.framework, 'openai-agents');
});

test('selección: framework no soportado → UnsupportedFrameworkError explícito', () => {
  assert.throws(
    () => CODE_ARTIFACT('Research assistant', ['my-custom-xyz'] as unknown as Framework[]),
    (err: unknown) => {
      assert.ok(err instanceof UnsupportedFrameworkError, 'tipo de error explícito');
      assert.match((err as Error).message, /my-custom-xyz/, 'menciona el solicitado');
      assert.match((err as Error).message, /langgraph/, 'lista los soportados');
      return true;
    }
  );
});

test('selección: primer elemento no soportado → error (sin fallback silencioso)', () => {
  assert.throws(
    () => CODE_ARTIFACT('Research assistant', ['malo', 'langgraph'] as unknown as Framework[]),
    UnsupportedFrameworkError
  );
});

test('selección: framework elegido no genera artefactos de otro framework', () => {
  const r = CODE_ARTIFACT('Research assistant', ['crewai']);
  const config = r.generation.artifacts.find((a) => a.name === 'config.json');
  assert.ok(config);
  const parsed = JSON.parse(config.content) as { framework: string };
  assert.equal(parsed.framework, 'crewai');
  assert.equal(r.intent.framework, 'crewai');
});
