import type { Framework } from '@uiep/entity-schema';
import { FrameworkAdapter, type AdapterContext, type AdapterOutput } from '../base';

export class LangGraphAdapter extends FrameworkAdapter {
  readonly framework = 'langgraph' as Framework;
  readonly name = 'LangGraph';
  readonly description = 'Adapter for LangGraph stateful agent workflows';

  adapt(ctx: AdapterContext): AdapterOutput {
    const { pipelineResult } = ctx;
    const { intent, architecture } = pipelineResult;

    const agentCode = `from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from typing import TypedDict, Annotated
import operator

${architecture.toolRecommendations.map((t) => `@tool
def ${t.replace(/-/g, '_')}() -> str:
    """${t.replace(/-/g, ' ')} tool"""
    return f"Executed ${t}"
`).join('\n')}

tools = [${architecture.toolRecommendations.map(t => `${t.replace(/-/g, '_')}`).join(', ')}]

model = ChatOpenAI(model="gpt-4o").bind_tools(tools)

def agent_state(state: MessagesState):
    response = model.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: MessagesState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

workflow = StateGraph(MessagesState)
workflow.add_node("agent", agent_state)
workflow.add_node("tools", ToolNode(tools))
workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")

graph = workflow.compile()

async def run(input_text: str) -> str:
    result = await graph.ainvoke({"messages": [("user", input_text)]})
    return result["messages"][-1].content
`;

    const packageJson = `{
  "name": "${intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "python -m src.agent",
    "build": "echo 'No build needed for Python'"
  },
  "dependencies": {
    "langgraph": "latest",
    "langchain-openai": "latest",
    "langchain-core": "latest"
  }
}`;

    return {
      framework: this.framework,
      projectName: intent.refinedGoal,
      files: [
        this.createFile('src/agent.py', agentCode, 'code'),
        this.createFile('pyproject.toml', packageJson, 'config'),
        this.createFile('README.md', `# ${intent.refinedGoal}\n\n${intent.goal}\n`, 'documentation'),
      ],
      instructions: `Setup complete!

1. cd ${intent.refinedGoal.toLowerCase().replace(/\s+/g, '-')}
2. pip install -e .
3. python -m src.agent`,
      dependencies: {
        'langgraph': 'latest',
        'langchain-openai': 'latest',
        'langchain-core': 'latest',
      },
    };
  }
}
