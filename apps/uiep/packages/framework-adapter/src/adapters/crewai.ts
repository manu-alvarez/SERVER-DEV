import type { Framework } from '@uiep/entity-schema';
import { FrameworkAdapter, type AdapterContext, type AdapterOutput } from '../base';

export class CrewAIAdapter extends FrameworkAdapter {
  readonly framework = 'crewai' as Framework;
  readonly name = 'CrewAI';
  readonly description = 'Adapter for CrewAI multi-agent orchestration';

  adapt(ctx: AdapterContext): AdapterOutput {
    const { pipelineResult } = ctx;
    const { intent, factory } = pipelineResult;

    const agentDefs = factory.roles.map(role => `class ${role.name.replace(/\s+/g, '')}Agent:
    name = "${role.name}"
    role = "${role.description}"
    goal = "Complete tasks efficiently"
    backstory = """${role.systemPrompt || 'You are a helpful assistant.'}"""
    
    def __init__(self):
        self.tools = []
    
    def execute(self, task: str) -> str:
        return f"[{self.name}] Completed: {task}"
`).join('\n');

    const crewCode = `from crewai import Agent, Task, Crew, Process

${agentDefs}

${factory.roles.map(role => `${role.name.replace(/\s+/g, '').toLowerCase()}_agent = ${role.name.replace(/\s+/g, '')}Agent()
`).join('')}

tasks = [
${factory.roles.map((role, i) => `    Task(
        description="Task ${i + 1}: Process the input",
        agent=${role.name.replace(/\s+/g, '').toLowerCase()}_agent,
        expected_output="Processed result"
    )`).join(',\n')}
]

crew = Crew(
    agents=[${factory.roles.map(r => `${r.name.replace(/\s+/g, '').toLowerCase()}_agent`).join(', ')}],
    tasks=tasks,
    process=Process.sequential,
    verbose=True
)

def run(input_text: str) -> str:
    result = crew.kickoff(inputs={"input": input_text})
    return str(result)
`;

    const pyproject = `[project]
name = "${intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "crewai>=0.86.0",
    "langchain-openai>=0.2.0"
]

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.backends._legacy:_Backend"
`;

    return {
      framework: this.framework,
      projectName: intent.refinedGoal,
      files: [
        this.createFile('src/crew.py', crewCode, 'code'),
        this.createFile('pyproject.toml', pyproject, 'config'),
        this.createFile('README.md', `# ${intent.refinedGoal}\n\n${intent.goal}\n`, 'documentation'),
      ],
      instructions: `Setup complete!

1. cd ${intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
2. pip install -e .
3. python src/crew.py`,
      dependencies: {
        'crewai': '>=0.86.0',
        'langchain-openai': '>=0.2.0',
      },
    };
  }
}
