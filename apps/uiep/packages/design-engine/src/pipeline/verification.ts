import type { IntentAnalysisResult } from './intent';
import type { ArchitectureSynthesisResult } from './architecture';
import type { EntityFactoryResult } from './factory';

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  overallScore: number;
  recommendations: string[];
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  score: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

function checkConsistency(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult
): VerificationCheck {
  const issues: string[] = [];

  if (factory.roles.length === 0) {
    issues.push('No roles defined');
  }

  if (arch.architecture.components.length === 0) {
    issues.push('No architecture components defined');
  }

  const hasOrchestrator = arch.architecture.components.some(c => c.type === 'controller' || c.type === 'agent');
  if (intent.entityType === 'multi-agent-system' && !hasOrchestrator) {
    issues.push('Multi-agent system missing orchestrator component');
  }

  return {
    name: 'Consistency Check',
    passed: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25),
    message: issues.length === 0 ? 'All consistency checks passed' : issues.join('; '),
    severity: issues.length > 0 ? 'error' : 'info',
  };
}

function checkDependencies(
  _intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult
): VerificationCheck {
  const issues: string[] = [];

  const componentIds = new Set(arch.architecture.components.map(c => c.id));

  for (const conn of arch.architecture.connections) {
    if (!componentIds.has(conn.from)) {
      issues.push(`Connection references missing component: ${conn.from}`);
    }
    if (!componentIds.has(conn.to)) {
      issues.push(`Connection references missing component: ${conn.to}`);
    }
  }

  for (const comp of arch.architecture.components) {
    for (const dep of comp.dependencies) {
      if (!componentIds.has(dep)) {
        issues.push(`Component ${comp.id} depends on missing component: ${dep}`);
      }
    }
  }

  return {
    name: 'Dependency Check',
    passed: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20),
    message: issues.length === 0 ? 'All dependencies resolved' : issues.join('; '),
    severity: issues.length > 0 ? 'error' : 'info',
  };
}

function checkSecurity(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult
): VerificationCheck {
  const warnings: string[] = [];

  if (intent.entityType === 'saas' || intent.entityType === 'agentic-app') {
    if (!arch.securityConsiderations.some(s => s.toLowerCase().includes('auth'))) {
      warnings.push('Application-type entity should include authentication');
    }
  }

  if (intent.entityType === 'multi-agent-system') {
    if (!arch.securityConsiderations.some(s => s.toLowerCase().includes('permission'))) {
      warnings.push('Multi-agent system should define agent permission boundaries');
    }
  }

  if (arch.securityConsiderations.length < 2) {
    warnings.push('Consider adding more security measures');
  }

  return {
    name: 'Security Check',
    passed: warnings.length === 0,
    score: warnings.length === 0 ? 100 : Math.max(0, 100 - warnings.length * 15),
    message: warnings.length === 0 ? 'Security review passed' : warnings.join('; '),
    severity: warnings.length > 0 ? 'warning' : 'info',
  };
}

function checkQuality(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult
): VerificationCheck {
  const issues: string[] = [];

  if (factory.roles.length > 0 && factory.roles.every(r => !r.systemPrompt)) {
    issues.push('Some roles missing system prompts');
  }

  if (arch.architecture.layers.length < 2) {
    issues.push('Architecture could benefit from more layer separation');
  }

  if (intent.quality === 'enterprise' || intent.quality === 'mission-critical') {
    if (!arch.observabilityPlan.some(o => o.toLowerCase().includes('metric'))) {
      issues.push('High-quality entities require observability metrics');
    }
  }

  return {
    name: 'Quality Check',
    passed: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20),
    message: issues.length === 0 ? 'Quality standards met' : issues.join('; '),
    severity: issues.length > 0 ? 'warning' : 'info',
  };
}

function checkOutput(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult
): VerificationCheck {
  const warnings: string[] = [];

  if (intent.expectedOutputs.length === 0) {
    warnings.push('No expected outputs defined');
  }

  if (arch.architecture.patterns.length === 0) {
    warnings.push('No architectural patterns identified');
  }

  return {
    name: 'Output Check',
    passed: warnings.length === 0,
    score: warnings.length === 0 ? 100 : Math.max(0, 100 - warnings.length * 25),
    message: warnings.length === 0 ? 'Output validation passed' : warnings.join('; '),
    severity: warnings.length > 0 ? 'warning' : 'info',
  };
}

export function verifyEntity(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult
): VerificationResult {
  const checks = [
    checkConsistency(intent, arch, factory),
    checkDependencies(intent, arch),
    checkSecurity(intent, arch),
    checkQuality(intent, arch, factory),
    checkOutput(intent, arch),
  ];

  const overallScore = Math.round(
    checks.reduce((sum, c) => sum + c.score, 0) / checks.length
  );

  const recommendations: string[] = [];
  if (overallScore < 80) {
    recommendations.push('Review failed checks and address issues');
  }
  if (arch.architecture.components.length > 10) {
    recommendations.push('Consider simplifying architecture for maintainability');
  }
  if (factory.roles.length > 7) {
    recommendations.push('Large team of agents may have coordination overhead');
  }

  return {
    passed: checks.every(c => c.passed),
    checks,
    overallScore,
    recommendations,
  };
}
