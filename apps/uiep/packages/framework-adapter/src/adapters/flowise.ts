import type { Framework } from '@uiep/entity-schema';
import { FrameworkAdapter, type AdapterContext, type AdapterOutput } from '../base';

export class FlowiseAdapter extends FrameworkAdapter {
  readonly framework = 'flowise' as Framework;
  readonly name = 'Flowise';
  readonly description = 'Adapter for Flowise visual chatflow builder';

  adapt(ctx: AdapterContext): AdapterOutput {
    const { pipelineResult } = ctx;
    const { intent, architecture } = pipelineResult;

    const nodes = architecture.architecture.components.map((comp, i) => ({
      id: comp.id,
      type: comp.type === 'ai-model' ? 'ChatOpenAI' :
            comp.type === 'storage' ? 'BufferMemory' :
            comp.type === 'executor' ? 'AgentExecutor' :
            'ChatOpenAI',
      position: { x: i * 300, y: 300 },
      data: {
        label: comp.name,
        name: comp.name.toLowerCase().replace(/\s+/g, '_'),
        dtype: 'ChatOpenAI',
      },
      width: 200,
      height: 100,
    }));

    const edges = architecture.architecture.connections.map((conn, i) => ({
      id: `edge-${i}`,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep',
    }));

    const flow = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const flowJson = JSON.stringify(flow, null, 2);

    const readme = `# ${intent.refinedGoal}

${intent.goal}

## Import into Flowise

1. Open Flowise
2. Go to Chatflows
3. Click "Import"
4. Select \`flow.json\`

## Components

${architecture.architecture.components.map(c => `- **${c.name}**: ${c.description || c.type}`).join('\n')}
`;

    return {
      framework: this.framework,
      projectName: intent.refinedGoal,
      files: [
        this.createFile('flow.json', flowJson, 'config'),
        this.createFile('README.md', readme, 'documentation'),
      ],
      instructions: `Setup complete!

1. Open Flowise
2. Import flow.json
3. Configure API keys
4. Start chatting`,
      dependencies: {},
    };
  }
}
