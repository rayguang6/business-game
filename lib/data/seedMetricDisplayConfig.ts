/**
 * Seed Metric Display Config
 * 
 * Populates the metric_display_config table with values from the code registry.
 * Run this after creating the table to initialize it with current registry values.
 * 
 * Usage:
 *   - Run manually: npx tsx lib/data/seedMetricDisplayConfig.ts
 *   - Or call from admin panel: seedMetricDisplayConfig()
 */

import { METRIC_REGISTRY, getAllMetrics } from '@/lib/game/metrics/registry';
import { upsertMetricDisplayConfig } from './metricDisplayConfigRepository';

/**
 * Seed the database with current registry values
 * Creates global defaults (industry_id = null) for all metrics
 */
export async function seedMetricDisplayConfig(): Promise<{
  success: boolean;
  seeded: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let seeded = 0;

  const allMetrics = getAllMetrics();

  for (const metric of allMetrics) {
    try {
      const result = await upsertMetricDisplayConfig({
        industryId: 'global', // Global default
        metricId: metric.id,
        displayLabel: metric.displayLabel,
        description: metric.description,
        unit: metric.display.unit || null,
        iconPath: null, // Not in registry yet
        showOnHUD: metric.display.showOnHUD,
        showInDetails: metric.display.showInDetails,
        priority: metric.display.priority || null,
      });

      if (result.success) {
        seeded++;
      } else {
        errors.push(`Failed to seed ${metric.id}: ${result.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Error seeding ${metric.id}: ${message}`);
    }
  }

  return {
    success: errors.length === 0,
    seeded,
    errors,
  };
}

// Allow running directly
if (require.main === module) {
  seedMetricDisplayConfig()
    .then((result) => {
      if (result.success) {
        console.log(`✅ Successfully seeded ${result.seeded} metric display configs`);
      } else {
        console.error(`❌ Seeded ${result.seeded} configs with ${result.errors.length} errors:`);
        result.errors.forEach((error) => console.error(`  - ${error}`));
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Fatal error seeding metric display config:', error);
      process.exit(1);
    });
}
