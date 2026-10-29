import type { EntityType, Framework } from '@uiep/entity-schema';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  default?: unknown;
  options?: string[];
  required?: boolean;
}

export interface EntityTemplate {
  id: string;
  name: string;
  description: string;
  entityType: EntityType;
  framework: Framework;
  variables: TemplateVariable[];
  goalTemplate: string;
  configOverrides: Record<string, unknown>;
  tags: string[];
}

export interface TemplateRenderResult {
  goal: string;
  config: Record<string, unknown>;
}

export class TemplateEngine {
  private templates: Map<string, EntityTemplate> = new Map();

  registerTemplate(template: EntityTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): EntityTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(filter?: { entityType?: EntityType; framework?: Framework }): EntityTemplate[] {
    let results = Array.from(this.templates.values());

    if (filter?.entityType) {
      results = results.filter(t => t.entityType === filter.entityType);
    }
    if (filter?.framework) {
      results = results.filter(t => t.framework === filter.framework);
    }

    return results;
  }

  render(templateId: string, variables: Record<string, unknown>): TemplateRenderResult | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const resolvedVars: Record<string, unknown> = {};
    for (const v of template.variables) {
      resolvedVars[v.name] = variables[v.name] ?? v.default;
    }

    let goal = template.goalTemplate;
    for (const [key, value] of Object.entries(resolvedVars)) {
      goal = goal.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }

    return {
      goal,
      config: {
        entityType: template.entityType,
        framework: template.framework,
        ...template.configOverrides,
        ...resolvedVars,
      },
    };
  }

  validateVariables(templateId: string, variables: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];

    for (const v of template.variables) {
      if (v.required && variables[v.name] === undefined && v.default === undefined) {
        errors.push(`Required variable missing: ${v.name}`);
      }
      if (v.type === 'select' && v.options && variables[v.name] !== undefined) {
        if (!v.options.includes(String(variables[v.name]))) {
          errors.push(`Invalid option for ${v.name}: ${variables[v.name]}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
