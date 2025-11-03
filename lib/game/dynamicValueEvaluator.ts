export interface DynamicContext {
  expenses: number;
}

/**
 * Minimal evaluator for level-1 expressions.
 * Supported form: "expenses*<number>" (case-insensitive, flexible spaces).
 * Returns 0 for invalid expressions.
 */
export class DynamicValueEvaluator {
  private readonly context: DynamicContext;

  constructor(context: DynamicContext) {
    this.context = context;
  }

  evaluate(expression: string): number {
    const cleaned = expression.trim().toLowerCase();

    // Only support: "expenses*3", "expenses * 2.5", etc.
    const match = cleaned.match(/^expenses\s*\*\s*(\d+(?:\.\d+)?)$/);
    if (!match) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DynamicValue] Invalid expression: "${expression}". Expected "expenses*number"`);
      }
      return 0;
    }

    const multiplier = parseFloat(match[1]);
    if (Number.isNaN(multiplier)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DynamicValue] Invalid multiplier: ${match[1]}`);
      }
      return 0;
    }

    return this.context.expenses * multiplier;
  }
}


