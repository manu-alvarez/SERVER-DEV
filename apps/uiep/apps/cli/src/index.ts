#!/usr/bin/env node

import { Command } from 'commander';
import { runPipeline } from '@uiep/design-engine';
import { registry, adaptToFramework } from '@uiep/framework-adapter';
import { MetaGenerator } from '@uiep/meta-generator';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('uiep')
  .description('Universal Intelligence Engineering Platform CLI')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate an entity from a goal')
  .argument('<goal>', 'Description of what to generate')
  .option('-t, --type <type>', 'Entity type', 'agent')
  .option('-f, --framework <framework>', 'Target framework', 'openai-agents')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--json', 'Output as JSON')
  .action(async (goal: string, options: { type: string; framework: string; output: string; json: boolean }) => {
    console.log(`\n  UIEP - Generating: ${goal}\n`);

    const result = runPipeline({
      goal,
      entityType: options.type as any,
      targetFrameworks: [options.framework as any],
    });

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const adapterOutput = adaptToFramework({
      pipelineResult: result,
      framework: options.framework as any,
      entityType: options.type as any,
    });

    console.log(`  Entity Type: ${result.intent.entityType}`);
    console.log(`  Framework:   ${result.intent.framework}`);
    console.log(`  Quality:     ${result.verification.overallScore}/100`);
    console.log(`  Components:  ${result.architecture.architecture.components.length}`);
    console.log(`  Roles:       ${result.factory.roles.length}`);
    console.log(`  Artifacts:   ${result.generation.artifacts.length}`);
    console.log();

    if (result.verification.passed) {
      console.log('  ✓ Verification passed');
    } else {
      console.log('  ✗ Verification failed');
      for (const check of result.verification.checks) {
        if (!check.passed) {
          console.log(`    - ${check.name}: ${check.message}`);
        }
      }
    }

    console.log();

    const outputDir = path.resolve(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const file of adapterOutput.files) {
      const filePath = path.join(outputDir, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content);
      console.log(`  Created: ${file.path}`);
    }

    console.log(`\n  Output: ${outputDir}`);
    console.log(`\n  ${adapterOutput.instructions}\n`);
  });

program
  .command('list-frameworks')
  .description('List available frameworks')
  .action(() => {
    console.log('\n  Available Frameworks:\n');
    for (const adapter of registry.list()) {
      console.log(`  ${adapter.framework.padEnd(20)} ${adapter.description}`);
    }
    console.log();
  });

program
  .command('templates')
  .description('List meta-generation templates')
  .option('-t, --type <type>', 'Filter by entity type')
  .option('-f, --framework <framework>', 'Filter by framework')
  .action((options: { type?: string; framework?: string }) => {
    const metaGen = new MetaGenerator();
    const templates = metaGen.listTemplates({
      entityType: options.type as any,
      framework: options.framework as any,
    });

    console.log('\n  Available Templates:\n');
    for (const template of templates) {
      console.log(`  ${template.id.padEnd(25)} ${template.name}`);
      console.log(`  ${''.padEnd(25)} ${template.description}`);
      console.log(`  ${''.padEnd(25)} Type: ${template.entityType} | Framework: ${template.framework}`);
      console.log();
    }
  });

program
  .command('generate-template')
  .description('Generate from a template')
  .argument('<template-id>', 'Template ID')
  .option('-g, --goal <goal>', 'Custom goal (overrides template)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action((templateId: string, options: { goal?: string; output: string }) => {
    const metaGen = new MetaGenerator();
    const generator = metaGen.generate(templateId, options.goal);

    if (!generator) {
      console.error(`\n  Template not found: ${templateId}\n`);
      process.exit(1);
    }

    console.log(`\n  Generated from template: ${generator.name}\n`);

    const outputDir = path.resolve(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'generator.ts'), generator.output.code);
    fs.writeFileSync(path.join(outputDir, 'config.json'), generator.output.config);
    fs.writeFileSync(path.join(outputDir, 'README.md'), generator.output.documentation);

    console.log(`  Created: generator.ts`);
    console.log(`  Created: config.json`);
    console.log(`  Created: README.md`);
    console.log(`\n  Output: ${outputDir}\n`);
  });

program.parse();
