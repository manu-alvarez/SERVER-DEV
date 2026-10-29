import type { Framework } from '@uiep/entity-schema';
import { FrameworkAdapter, type AdapterContext, type AdapterOutput } from '../base';

export class OpenAIAdapter extends FrameworkAdapter {
  readonly framework = 'openai-agents' as Framework;
  readonly name = 'OpenAI Agents SDK';
  readonly description = 'Adapter for OpenAI Agents SDK (formerly Swarm)';

  adapt(ctx: AdapterContext): AdapterOutput {
    const { pipelineResult } = ctx;
    const { intent, architecture, factory } = pipelineResult;

    const mainRole = factory.roles.find(r => r.name === 'Main Agent') || factory.roles[0];

    const agentCode = `import { Agent, handoff, tool } from 'openai-agents';

${factory.roles.map((role) => `const ${role.name.replace(/\s+/g, '')}Agent = new Agent({
  name: '${role.name}',
  instructions: \`${role.systemPrompt || 'You are a helpful assistant.'}\`,
  tools: [],
});`).join('\n\n')}

const ${mainRole?.name.replace(/\s+/g, '') || 'Main'}Agent = new Agent({
  name: '${mainRole?.name || 'Main'}',
  instructions: \`${mainRole?.systemPrompt || 'You are a helpful assistant.'}\`,
  handoffs: [${factory.roles.filter(r => r.name !== mainRole?.name).map(r => `${r.name.replace(/\s+/g, '')}Agent`).join(', ')}],
  tools: [
${architecture.toolRecommendations.map(t => `    tool('${t}', '${t.replace(/-/g, ' ')}'),`).join('\n')}
  ],
});

export async function run(input: string) {
  const result = await ${mainRole?.name.replace(/\s+/g, '') || 'Main'}Agent.run(input);
  return result;
}
`;

    const packageJson = `{
  "name": "${intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "openai-agents": "latest",
    "openai": "latest"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.0.0",
    "@types/node": "^22.0.0"
  }
}`;

    const tsConfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`;

    return {
      framework: this.framework,
      projectName: intent.refinedGoal,
      files: [
        this.createFile('src/agent.ts', agentCode, 'code'),
        this.createFile('package.json', packageJson, 'config'),
        this.createFile('tsconfig.json', tsConfig, 'config'),
        this.createFile('README.md', `# ${intent.refinedGoal}\n\n${intent.goal}\n`, 'documentation'),
      ],
      instructions: `Setup complete!

1. cd ${intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
2. npm install
3. npm run dev`,
      dependencies: {
        'openai-agents': 'latest',
        'openai': 'latest',
      },
    };
  }
}
