import type { IntentAnalysisResult } from './intent';
import type { ArchitectureSynthesisResult } from './architecture';
import type { EntityFactoryResult } from './factory';
import type { VerificationResult } from './verification';

export interface GeneratedArtifact {
  name: string;
  type: 'code' | 'config' | 'documentation' | 'diagram' | 'prompt' | 'workflow' | 'project';
  format: string;
  content: string;
}

export interface GeneratorResult {
  artifacts: GeneratedArtifact[];
  projectStructure: string[];
  instructions: string;
}

function generateAgentCode(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult
): GeneratedArtifact[] {
  const artifacts: GeneratedArtifact[] = [];

  const mainRole = factory.roles.find(r => r.name === 'Main Agent') || factory.roles[0];

  artifacts.push({
    name: 'agent.ts',
    type: 'code',
    format: 'typescript',
    content: `import { openai } from 'openai';

const client = new openai.OpenAI();

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

const tools: Tool[] = [
  ${arch.toolRecommendations.map(t => `{
    name: '${t}',
    description: '${t.replace(/-/g, ' ')} tool',
    parameters: {},
    execute: async (args) => JSON.stringify(args),
  }`).join(',\n  ')}
];

const systemPrompt = \`${mainRole?.systemPrompt || 'You are a helpful assistant.'}\`;

export async function runAgent(userMessage: string): Promise<string> {
  const messages: openai.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    });

    const choice = response.choices[0];
    if (choice.finish_reason === 'stop') {
      return choice.message.content || '';
    }

    if (choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        const tool = tools.find(t => t.name === toolCall.function.name);
        if (tool) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await tool.execute(args);
          messages.push(choice.message);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      }
    }
  }
}
`,
  });

  artifacts.push({
    name: 'config.json',
    type: 'config',
    format: 'json',
    content: JSON.stringify({
      model: 'gpt-4o',
      maxIterations: 10,
      temperature: 0.7,
      tools: arch.toolRecommendations,
      framework: intent.framework,
      deployment: intent.deployment,
    }, null, 2),
  });

  return artifacts;
}

function generateMultiAgentCode(
  _intent: IntentAnalysisResult,
  _arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult
): GeneratedArtifact[] {
  const artifacts: GeneratedArtifact[] = [];

  const agentDefinitions = factory.roles.map(role => `
class ${role.name.replace(/\s+/g, '')}Agent {
  name = '${role.name}';
  systemPrompt = \`${role.systemPrompt || ''}\`;

  async execute(task: string, context: Record<string, unknown>): Promise<string> {
    // Agent execution logic
    return \`[\${this.name}] Completed: \${task}\`;
  }
}`).join('\n');

  artifacts.push({
    name: 'multi-agent.ts',
    type: 'code',
    format: 'typescript',
    content: `${agentDefinitions}

interface AgentMessage {
  from: string;
  to: string;
  content: string;
  type: 'task' | 'result' | 'feedback';
}

class SupervisorAgent {
  private agents: Map<string, ${factory.roles[0]?.name.replace(/\s+/g, '') || 'Main'}Agent> = new Map();
  private messageQueue: AgentMessage[] = [];

  constructor() {
${factory.roles.map(r => `    this.agents.set('${r.name.toLowerCase()}', new ${r.name.replace(/\s+/g, '')}Agent());`).join('\n')}
  }

  async dispatch(task: string): Promise<string> {
    const message: AgentMessage = {
      from: 'supervisor',
      to: 'planner',
      content: task,
      type: 'task',
    };
    this.messageQueue.push(message);
    return this.processQueue();
  }

  private async processQueue(): Promise<string> {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      const agent = this.agents.get(msg.to);
      if (agent) {
        const result = await agent.execute(msg.content, {});
        this.messageQueue.push({
          from: msg.to,
          to: 'supervisor',
          content: result,
          type: 'result',
        });
      }
    }
    return 'Task completed';
  }
}

export const supervisor = new SupervisorAgent();
`,
  });

  return artifacts;
}

function generateDocumentation(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult,
  verification: VerificationResult
): GeneratedArtifact[] {
  return [{
    name: 'README.md',
    type: 'documentation',
    format: 'markdown',
    content: `# ${intent.refinedGoal}

## Overview
${intent.goal}

## Architecture
${arch.architecture.patterns.join(', ')} pattern.

### Components
${arch.architecture.components.map(c => `- **${c.name}**: ${c.description || c.type}`).join('\n')}

### Layers
${arch.architecture.layers.map(l => `- **${l.name}**: ${l.components.join(', ')}`).join('\n')}

## Roles
${factory.roles.map(r => `- **${r.name}**: ${r.description}`).join('\n')}

## Interactions
${factory.interactionPatterns.join(', ')}

## Quality Score: ${verification.overallScore}/100

## Verification
${verification.checks.map(c => `- ${c.name}: ${c.passed ? 'PASSED' : 'FAILED'} (${c.score}/100)`).join('\n')}

## Recommendations
${verification.recommendations.length > 0
  ? verification.recommendations.map(r => `- ${r}`).join('\n')
  : 'No recommendations at this time.'}
`,
  }];
}

function generateDiagram(
  _intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult
): GeneratedArtifact[] {
  const nodes = arch.architecture.components.map(c => `  ${c.id}["${c.name}"]`).join('\n');
  const edges = arch.architecture.connections.map(c => `  ${c.from} -->|${c.label || ''}| ${c.to}`).join('\n');

  return [{
    name: 'architecture.mmd',
    type: 'diagram',
    format: 'mermaid',
    content: `graph TD
${nodes}
${edges}
`,
  }];
}

export function generateArtifacts(
  intent: IntentAnalysisResult,
  arch: ArchitectureSynthesisResult,
  factory: EntityFactoryResult,
  verification: VerificationResult
): GeneratorResult {
  let artifacts: GeneratedArtifact[] = [];

  switch (intent.entityType) {
    case 'agent':
      artifacts = [...generateAgentCode(intent, arch, factory)];
      break;
    case 'multi-agent-system':
      artifacts = [...generateMultiAgentCode(intent, arch, factory)];
      break;
    default:
      artifacts = [...generateAgentCode(intent, arch, factory)];
  }

  artifacts = [...artifacts, ...generateDocumentation(intent, arch, factory, verification)];
  artifacts = [...artifacts, ...generateDiagram(intent, arch)];

  const projectStructure = [
    'project/',
    '├── src/',
    ...artifacts.map(a => `│   ├── ${a.name}`),
    '├── package.json',
    '├── tsconfig.json',
    '└── README.md',
  ];

  const instructions = `Project generated successfully.

Quality Score: ${verification.overallScore}/100
Components: ${arch.architecture.components.length}
Roles: ${factory.roles.length}

Next steps:
1. Review generated code in src/
2. Install dependencies: npm install
3. Configure environment variables
4. Run the project`;

  return {
    artifacts,
    projectStructure,
    instructions,
  };
}
