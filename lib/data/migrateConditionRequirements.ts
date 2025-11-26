/**
 * Migration script to convert condition-type requirements to metric-type requirements
 * 
 * This script:
 * 1. Finds all condition-type requirements in the database
 * 2. Looks up the corresponding GameCondition
 * 3. Converts them to metric-type requirements with proper operator/value
 * 4. Updates the database
 * 
 * Run this once to migrate existing data, then remove condition type support from code.
 */

import { createClient } from '@supabase/supabase-js';
import type { GameCondition } from '@/lib/types/conditions';
import type { Requirement } from '@/lib/game/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Converts ConditionOperator to Requirement operator format
 */
function convertOperator(operator: string): '>=' | '<=' | '>' | '<' | '==' {
  switch (operator) {
    case 'greater': return '>';
    case 'less': return '<';
    case 'equals': return '==';
    case 'greater_equal': return '>=';
    case 'less_equal': return '<=';
    default: return '>=';
  }
}

/**
 * Converts ConditionMetric to metric ID string
 */
function convertMetric(metric: string): string {
  // ConditionMetric enum values match our metric IDs
  return metric.toLowerCase();
}

/**
 * Converts a condition requirement to a metric requirement
 */
function convertConditionToMetric(
  conditionReq: Requirement & { type: 'condition' },
  condition: GameCondition
): Requirement {
  return {
    type: 'metric',
    id: convertMetric(condition.metric),
    operator: convertOperator(condition.operator),
    value: condition.value,
    // Preserve expected if it was set to false (NOT condition)
    expected: conditionReq.expected === false ? false : undefined,
  };
}

/**
 * Migrates requirements in a single table
 */
async function migrateTableRequirements(
  tableName: string,
  requirementsColumn: string = 'requirements'
): Promise<{ migrated: number; errors: number }> {
  console.log(`\n📋 Migrating ${tableName}.${requirementsColumn}...`);

  // Fetch all rows
  const { data: rows, error: fetchError } = await supabase
    .from(tableName)
    .select(`id, ${requirementsColumn}`);

  if (fetchError) {
    console.error(`❌ Error fetching ${tableName}:`, fetchError);
    return { migrated: 0, errors: 1 };
  }

  if (!rows || rows.length === 0) {
    console.log(`   No rows found in ${tableName}`);
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  // Fetch all conditions for lookup
  const { data: allConditions } = await supabase
    .from('conditions')
    .select('id, metric, operator, value');

  const conditionsMap = new Map<string, GameCondition>();
  if (allConditions) {
    allConditions.forEach((c: any) => {
      conditionsMap.set(c.id, {
        id: c.id,
        name: c.name || c.id,
        description: c.description || '',
        metric: c.metric,
        operator: c.operator,
        value: c.value,
      });
    });
  }

  // Process each row
  for (const row of rows) {
    const requirements = row[requirementsColumn];
    if (!requirements || !Array.isArray(requirements)) {
      continue;
    }

    let needsUpdate = false;
    const updatedRequirements = requirements.map((req: any) => {
      if (req.type === 'condition') {
        needsUpdate = true;
        const condition = conditionsMap.get(req.id);
        
        if (!condition) {
          console.warn(`   ⚠️  Condition "${req.id}" not found for ${tableName}.${row.id}`);
          errors++;
          // Keep the original requirement but mark it as invalid
          return { ...req, _migrationError: 'Condition not found' };
        }

        const converted = convertConditionToMetric(req, condition);
        migrated++;
        console.log(`   ✓ Converted condition "${req.id}" → metric "${converted.id} ${converted.operator} ${converted.value}"`);
        return converted;
      }
      return req;
    });

    // Update the row if any requirements were converted
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [requirementsColumn]: updatedRequirements })
        .eq('id', row.id);

      if (updateError) {
        console.error(`   ❌ Error updating ${tableName}.${row.id}:`, updateError);
        errors++;
      }
    }
  }

  return { migrated, errors };
}

/**
 * Main migration function
 */
export async function migrateConditionRequirements(): Promise<void> {
  console.log('🚀 Starting condition requirement migration...\n');

  const tables = [
    { name: 'services', column: 'requirements' },
    { name: 'upgrades', column: 'requirements' },
    { name: 'marketing_campaigns', column: 'requirements' },
    { name: 'events', column: 'requirements' },
    { name: 'staff_roles', column: 'requirements' },
  ];

  let totalMigrated = 0;
  let totalErrors = 0;

  for (const table of tables) {
    const result = await migrateTableRequirements(table.name, table.column);
    totalMigrated += result.migrated;
    totalErrors += result.errors;
  }

  console.log('\n✅ Migration complete!');
  console.log(`   Migrated: ${totalMigrated} requirements`);
  console.log(`   Errors: ${totalErrors}`);
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some requirements could not be migrated. Please review manually.');
  }
}

// Run if called directly
if (require.main === module) {
  migrateConditionRequirements()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

