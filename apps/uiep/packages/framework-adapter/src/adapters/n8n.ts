import type { Framework } from '@uiep/entity-schema';
import { FrameworkAdapter, type AdapterContext, type AdapterOutput } from '../base';

export class N8nAdapter extends FrameworkAdapter {
  readonly framework = 'n8n' as Framework;
  readonly name = 'n8n';
  readonly description = 'Adapter for n8n workflow automation';

  adapt(ctx: AdapterContext): AdapterOutput {
    const { pipelineResult } = ctx;
    const { intent, architecture } = pipelineResult;

    const nodes = architecture.architecture.components.map((comp, i) => ({
      id: comp.id,
      name: comp.name,
      type: comp.type === 'input' ? 'n8n-nodes-base.webhook' : 
            comp.type === 'output' ? 'n8n-nodes-base.respondToWebhook' :
            'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [i * 250, 300],
      parameters: {},
    }));

    const connections: Record<string, Record<string, Array<{ node: string; type: string; index: number }>>> = {};
    for (const conn of architecture.architecture.connections) {
      if (!connections[conn.from]) connections[conn.from] = {};
      if (!connections[conn.from].main) connections[conn.from].main = [];
      connections[conn.from].main.push({
        node: conn.to,
        type: 'main',
        index: 0,
      });
    }

    const workflow = {
      name: intent.refinedGoal,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1',
      },
      versionId: '1',
      meta: {
        templateCredsSetupCompleted: false,
      },
    };

    const workflowJson = JSON.stringify(workflow, null, 2);

    const readme = `# ${intent.refinedGoal}

${intent.goal}

## Import into n8n

1. Open n8n
2. Go to Workflows
3. Click "Import from File"
4. Select \`workflow.json\`

## Architecture

${architecture.architecture.components.map(c => `- **${c.name}**: ${c.description || c.type}`).join('\n')}

## Patterns

${architecture.architecture.patterns.join(', ')}
`;

    return {
      framework: this.framework,
      projectName: intent.refinedGoal,
      files: [
        this.createFile('workflow.json', workflowJson, 'config'),
        this.createFile('README.md', readme, 'documentation'),
      ],
      instructions: `Setup complete!

1. Open n8n
2. Import workflow.json
3. Configure credentials
4. Activate workflow`,
      dependencies: {},
    };
  }
}
