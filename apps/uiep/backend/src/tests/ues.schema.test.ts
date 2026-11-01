import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  UES_API_VERSION,
  UESProjectV1Schema,
  validateUESProject,
  validateBlueprint,
  BlueprintV1Schema,
  satisfiesRange,
  API_VERSION,
} from '@uiep/agent-spec';

/**
 * Misión 11 — UES (Universal Engineering Specification, uiep.io/ues/v1):
 * validación de proyectos compuestos, catálogo de tipos, rangos de versión
 * y blueprint v1 (artefacto compuesto formal).
 */

function proyectoValido(overrides: Record<string, unknown> = {}): any {
  return {
    apiVersion: UES_API_VERSION,
    kind: 'Project',
    metadata: { id: 'proyecto-demo', name: 'Proyecto demo', version: '1.0.0' },
    artifacts: [
      { ref: 'agente-a', type: 'agent', specRef: { id: 'agente-a', kind: 'Agent' } },
      { ref: 'flujo-b', type: 'workflow', dependencies: [{ ref: 'agente-a', required: true }] },
    ],
    ...overrides,
  };
}

test('UES: proyecto válido parsea con lifecycle por defecto draft y versiones por defecto', () => {
  const r = validateUESProject(proyectoValido());
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.spec.lifecycle.state, 'draft');
    assert.equal(r.spec.artifacts[0].version, '1.0.0');
    assert.deepEqual(r.spec.dependencies, []);
  }
});

test('UES: apiVersion u kind incorrectos → rechazo explícito', () => {
  const malApi = validateUESProject({ ...proyectoValido(), apiVersion: API_VERSION });
  assert.equal(malApi.ok, false);
  const malKind = validateUESProject({ ...proyectoValido(), kind: 'Agent' });
  assert.equal(malKind.ok, false);
});

test('UES: sin artefactos → rechazo (proyecto compuesto exige al menos uno)', () => {
  const r = validateUESProject(proyectoValido({ artifacts: [] }));
  assert.equal(r.ok, false);
  assert.ok(JSON.stringify(r).includes('al menos un artefacto'));
});

test('UES: ref de artefacto duplicada → rechazo', () => {
  const p = proyectoValido();
  p.artifacts.push({ ref: 'agente-a', type: 'agent' });
  const r = validateUESProject(p);
  assert.equal(r.ok, false);
  assert.ok(JSON.stringify(r).includes('duplicado'));
});

test('UES: dependencia interna inexistente y auto-dependencia → rechazo', () => {
  const r1 = validateUESProject({
    ...proyectoValido(),
    artifacts: [{ ref: 'a', type: 'agent', dependencies: [{ ref: 'fantasma', required: true }] }, { ref: 'b', type: 'agent' }],
  });
  assert.equal(r1.ok, false);
  assert.ok(JSON.stringify(r1).includes('fantasma'));
  const r2 = validateUESProject({
    ...proyectoValido(),
    artifacts: [{ ref: 'a', type: 'agent', dependencies: [{ ref: 'a', required: true }] }],
  });
  assert.equal(r2.ok, false);
});

test('UES: los 19 tipos del catálogo aceptan artefactos; un tipo inventado se rechaza', () => {
  const tipos = [
    'agent','multi-agent-system','workflow','framework','mcp-server','skill-pack',
    'prompt-system','knowledge-base','rag-system','tool-collection','harness',
    'evaluation','application','agentic-app','api-platform','saas',
    'enterprise-architecture','infrastructure-stack','deployment-architecture',
  ];
  for (const t of tipos) {
    const r = UESProjectV1Schema.safeParse(proyectoValido({ artifacts: [{ ref: 'x', type: t }] }));
    assert.equal(r.success, true, `tipo ${t} debe aceptarse`);
  }
  const inventado = UESProjectV1Schema.safeParse(proyectoValido({ artifacts: [{ ref: 'x', type: 'warp-drive' }] }));
  assert.equal(inventado.success, false);
});

test('UES: procedencia acepta generator/model/hashes/validaciones sin secretos en el contrato', () => {
  const r = validateUESProject(
    proyectoValido({
      generation: {
        generator: { id: 'design-engine', version: '0.5.0' },
        model: { provider: 'ollama', model: 'qwen3.5:4b' },
        inputHash: 'abc123',
        outputHash: 'def456',
        generatedAt: new Date().toISOString(),
        validations: [{ name: 'schema', passed: true }],
        evidence: [{ type: 'run', ref: 'run-demo-1' }],
      },
    }),
  );
  assert.equal(r.ok, true);
});

/* ── Rangos de versión (fail-closed) ─────────────────────────────────────── */

test('rango: indefinido/vacío/*/espacio → compatible con cualquier versión válida', () => {
  assert.equal(satisfiesRange('1.0.0', undefined), true);
  assert.equal(satisfiesRange('1.0.0', ''), true);
  assert.equal(satisfiesRange('1.0.0', '*'), true);
  assert.equal(satisfiesRange('1.0.0', '  '), true);
});

test('rango: exacto solo acepta la versión idéntica', () => {
  assert.equal(satisfiesRange('1.2.3', '1.2.3'), true);
  assert.equal(satisfiesRange('1.2.4', '1.2.3'), false);
  assert.equal(satisfiesRange('1.2.2', '1.2.3'), false);
});

test('rango: caret acepta patch/minor dentro del major; rechaza major distinto', () => {
  assert.equal(satisfiesRange('1.2.3', '^1.2.3'), true);
  assert.equal(satisfiesRange('1.9.0', '^1.2.3'), true);
  assert.equal(satisfiesRange('2.0.0', '^1.2.3'), false);
  assert.equal(satisfiesRange('1.2.2', '^1.2.3'), false);
});

test('rango: tilde fija major.minor; inválido o versión malformada → false (fail-closed)', () => {
  assert.equal(satisfiesRange('1.2.9', '~1.2.3'), true);
  assert.equal(satisfiesRange('1.3.0', '~1.2.3'), false);
  assert.equal(satisfiesRange('1.2.3', 'abc'), false);
  assert.equal(satisfiesRange('no-es-semver', '1.2.3'), false);
  assert.equal(satisfiesRange('1.2.3', '^abc'), false);
});

/* ── Blueprint v1 ────────────────────────────────────────────────────────── */

function blueprintValido(): any {
  return {
    apiVersion: UES_API_VERSION,
    kind: 'Blueprint',
    metadata: { id: 'bp-demo', name: 'Blueprint demo', version: '1.0.0' },
    title: 'Blueprint demo',
    artifacts: [
      {
        id: 'agente-x',
        type: 'agent',
        spec: {
          apiVersion: API_VERSION,
          kind: 'Agent',
          metadata: { id: 'agente-x', name: 'Agente X', version: '1.0.0' },
          spec: {
            identity: { role: 'asistente', objective: 'demo' },
            model: { profile: 'default' },
            instructions: { system: 'hola' },
            tools: [],
            memory: { enabled: false, strategy: 'none' },
            orchestration: { mode: 'single-agent', maxIterations: 2 },
            security: { approvalRequired: [] },
            evaluation: {},
          },
        },
        dependencies: [],
      },
    ],
    knowledge: [{ title: 'Fuente demo', text: 'contenido', bindTo: ['agente-x'] }],
  };
}

test('blueprint: válido parsea; knowledge puede no traer bindTo', () => {
  const r = validateBlueprint(blueprintValido());
  assert.equal(r.ok, true);
  const sinBind = validateBlueprint({ ...blueprintValido(), knowledge: [{ title: 'suelta', text: 'x' }] });
  assert.equal(sinBind.ok, true);
});

test('blueprint: artifact.id debe coincidir con spec.metadata.id', () => {
  const bp = blueprintValido();
  bp.artifacts[0].id = 'otro-id';
  const r = validateBlueprint(bp);
  assert.equal(r.ok, false);
  assert.ok(JSON.stringify(r).includes('mismo id'));
});

test('blueprint: binding a artefacto inexistente y dependencia fantasma → rechazo', () => {
  const bp = blueprintValido();
  bp.knowledge[0].bindTo = ['fantasma'];
  assert.equal(validateBlueprint(bp).ok, false);
  const bp2 = blueprintValido();
  bp2.artifacts[0].dependencies = [{ ref: 'fantasma', required: true }];
  assert.equal(validateBlueprint(bp2).ok, false);
});

test('blueprint: installOrder con id inexistente → rechazo', () => {
  const r = validateBlueprint({ ...blueprintValido(), installOrder: ['no-existe'] });
  assert.equal(r.ok, false);
  assert.ok(JSON.stringify(r).includes('installOrder'));
});
