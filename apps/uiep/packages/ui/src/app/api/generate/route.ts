import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@uiep/design-engine';
import { adaptToFramework } from '@uiep/framework-adapter';
import type { EntityType, AbstractionLevel, Framework } from '@uiep/entity-schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      goal,
      entityType = 'agent',
      abstractionLevel = 'engineering',
      framework = 'openai-agents',
    } = body;

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    const pipelineResult = runPipeline({
      goal,
      entityType: entityType as EntityType,
      abstractionLevel: abstractionLevel as AbstractionLevel,
      targetFrameworks: [framework as Framework],
    });

    const adapterOutput = adaptToFramework({
      pipelineResult,
      framework: framework as Framework,
      entityType: entityType as EntityType,
    });

    return NextResponse.json({
      pipeline: pipelineResult,
      adapter: adapterOutput,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
