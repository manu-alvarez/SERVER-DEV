import { v4 as uuid } from 'uuid';
import { runPipeline } from '@uiep/design-engine';
import type { EntityType, Framework } from '@uiep/entity-schema';
import type { PipelineInput, PipelineResult } from '@uiep/design-engine';
import type { GeneratorTemplate, GeneratedGenerator, MetaGeneratorOutput } from './types';

const BUILTIN_TEMPLATES: GeneratorTemplate[] = [
  {
    id: 'agent-generator',
    name: 'Agent Generator',
    description: 'Generates AI agents with tool use and memory',
    entityType: 'agent',
    framework: 'openai-agents',
    template: {
      goal: 'Create a conversational AI agent with tool use capabilities',
      entityType: 'agent',
      targetFrameworks: ['openai-agents'],
    },
    tags: ['agent', 'conversational', 'tools'],
  },
  {
    id: 'multi-agent-generator',
    name: 'Multi-Agent System Generator',
    description: 'Generates multi-agent systems with supervisor pattern',
    entityType: 'multi-agent-system',
    framework: 'openai-agents',
    template: {
      goal: 'Create a multi-agent system with specialized agents',
      entityType: 'multi-agent-system',
      targetFrameworks: ['openai-agents'],
    },
    tags: ['multi-agent', 'orchestration', 'supervisor'],
  },
  {
    id: 'workflow-generator',
    name: 'Workflow Generator',
    description: 'Generates automated workflows',
    entityType: 'workflow',
    framework: 'n8n',
    template: {
      goal: 'Create an automated workflow for data processing',
      entityType: 'workflow',
      targetFrameworks: ['n8n'],
    },
    tags: ['workflow', 'automation', 'pipeline'],
  },
  {
    id: 'rag-generator',
    name: 'RAG System Generator',
    description: 'Generates RAG systems with vector search',
    entityType: 'rag-system',
    framework: 'langgraph',
    template: {
      goal: 'Create a RAG system for document retrieval and question answering',
      entityType: 'rag-system',
      targetFrameworks: ['langgraph'],
    },
    tags: ['rag', 'retrieval', 'vector-search'],
  },
  {
    id: 'mcp-server-generator',
    name: 'MCP Server Generator',
    description: 'Generates MCP servers for tool integration',
    entityType: 'mcp-server',
    framework: 'custom',
    template: {
      goal: 'Create an MCP server providing custom tools',
      entityType: 'mcp-server',
      targetFrameworks: ['custom'],
    },
    tags: ['mcp', 'tools', 'server'],
  },
  {
    id: 'skill-pack-generator',
    name: 'Skill Pack Generator',
    description: 'Generates skill packs for agent capabilities',
    entityType: 'skill-pack',
    framework: 'custom',
    template: {
      goal: 'Create a skill pack with reusable agent capabilities',
      entityType: 'skill-pack',
      targetFrameworks: ['custom'],
    },
    tags: ['skills', 'capabilities', 'reusable'],
  },
];

export class MetaGenerator {
  private templates: Map<string, GeneratorTemplate> = new Map();

  constructor() {
    for (const template of BUILTIN_TEMPLATES) {
      this.templates.set(template.id, template);
    }
  }

  registerTemplate(template: GeneratorTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): GeneratorTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(filter?: { entityType?: EntityType; framework?: Framework; tags?: string[] }): GeneratorTemplate[] {
    let results = Array.from(this.templates.values());

    if (filter?.entityType) {
      results = results.filter(t => t.entityType === filter.entityType);
    }
    if (filter?.framework) {
      results = results.filter(t => t.framework === filter.framework);
    }
    if (filter?.tags && filter.tags.length > 0) {
      results = results.filter(t => filter.tags!.some(tag => t.tags.includes(tag)));
    }

    return results;
  }

  generate(templateId: string, customGoal?: string): GeneratedGenerator | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const pipelineInput: PipelineInput = {
      ...template.template,
      goal: customGoal || template.template.goal,
    };

    const pipelineResult = runPipeline(pipelineInput);

    const code = this.generateCode(template, pipelineResult);
    const config = this.generateConfig(template, pipelineResult);
    const documentation = this.generateDocumentation(template, pipelineResult);

    return {
      id: uuid(),
      name: template.name,
      description: template.description,
      sourceTemplate: template,
      output: {
        pipelineResult,
        code,
        config,
        documentation,
      },
      metadata: {
        generatedAt: new Date(),
        version: '0.1.0',
      },
    };
  }

  generateAll(customGoal?: string): MetaGeneratorOutput {
    const generators: GeneratedGenerator[] = [];

    for (const [id] of this.templates) {
      const generator = this.generate(id, customGoal);
      if (generator) {
        generators.push(generator);
      }
    }

    return {
      generators,
      summary: `Generated ${generators.length} generators from ${this.templates.size} templates`,
      totalGenerated: generators.length,
    };
  }

  private generateCode(template: GeneratorTemplate, result: PipelineResult): string {
    const mainRole = result.factory.roles.find(r => r.name === 'Main Agent') || result.factory.roles[0];

    return `// Auto-generated by UIEP Meta Generator
// Template: ${template.name}
// Entity Type: ${template.entityType}
// Framework: ${template.framework}

${result.generation.artifacts.map(a => `// ${a.name} (${a.format})`).join('\n')}

export const config = {
  entityType: "${template.entityType}",
  framework: "${template.framework}",
  name: "${result.intent.refinedGoal}",
  quality: ${result.verification.overallScore},
};

export const systemPrompt = \`${mainRole?.systemPrompt || 'You are a helpful assistant.'}\`;

export const tools = ${JSON.stringify(result.architecture.toolRecommendations, null, 2)};
`;
  }

  private generateConfig(template: GeneratorTemplate, result: PipelineResult): string {
    return JSON.stringify({
      template: template.id,
      entityType: template.entityType,
      framework: template.framework,
      architecture: {
        components: result.architecture.architecture.components.length,
        connections: result.architecture.architecture.connections.length,
        patterns: result.architecture.architecture.patterns,
      },
      quality: result.verification.overallScore,
      roles: result.factory.roles.length,
    }, null, 2);
  }

  private generateDocumentation(template: GeneratorTemplate, result: PipelineResult): string {
    return `# ${template.name}

${template.description}

## Generated Configuration

- **Entity Type**: ${template.entityType}
- **Framework**: ${template.framework}
- **Quality Score**: ${result.verification.overallScore}/100

## Architecture

${result.architecture.architecture.components.map(c => `- **${c.name}**: ${c.description || c.type}`).join('\n')}

## Roles

${result.factory.roles.map(r => `- **${r.name}**: ${r.description}`).join('\n')}

## Patterns

${result.architecture.architecture.patterns.join(', ')}

## Verification

${result.verification.checks.map(c => `- ${c.name}: ${c.passed ? 'PASSED' : 'FAILED'} (${c.score}/100)`).join('\n')}

## Usage

\`\`\`typescript
import { config, systemPrompt, tools } from './generator';
\`\`\`
`;
  }
}
