import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId, UpgradeDefinition, UpgradeEffect, UpgradeLevelConfig } from '@/lib/game/types';
import { validateAndParseUpgradeEffects, isValidGameMetric, isValidEffectType } from '@/lib/utils/effectValidation';

// Helper function to check if a value is a valid number
function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Interface matching the columns we actually select from upgrades table
// Note: cost, time_cost, and effects have been moved to upgrade_levels table
interface UpgradeRow {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  icon: string;
  max_level: number;
  sets_flag: string | null;
  requirements: unknown;
}

function parseNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchUpgradesForIndustry(
  industryId: IndustryId,
): Promise<UpgradeDefinition[] | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch upgrades.');
    return null;
  }

  // Fetch base upgrades
  const { data: upgradesData, error: upgradesError } = await supabaseServer
    .from('upgrades')
    .select('id, industry_id, name, description, icon, max_level, sets_flag, requirements')
    .eq('industry_id', industryId);

  if (upgradesError) {
    console.error(`[Upgrades] Failed to fetch upgrades for industry "${industryId}":`, upgradesError);
    return null;
  }

  if (!upgradesData || upgradesData.length === 0) {
    return [];
  }

  // Fetch levels for all upgrades (required)
  // Use a more specific query to avoid any caching issues and ensure we get the latest data
  const { data: levelsData, error: levelsError } = await supabaseServer
    .from('upgrade_levels')
    .select('upgrade_id, level, name, description, icon, cost, time_cost, effects, created_at, updated_at')
    .eq('industry_id', industryId)
    .order('upgrade_id', { ascending: true })
    .order('level', { ascending: true });

  if (levelsError) {
    console.error(`[Upgrades] Failed to fetch upgrade levels for industry "${industryId}":`, levelsError);
    return null;
  }

  // Group levels by upgrade_id
  const levelsMap = new Map<string, UpgradeLevelConfig[]>();
  if (levelsData) {
    levelsData.forEach((levelRow: any) => {
      try {
        // Parse effects JSONB with error handling
        let parsedEffects: UpgradeEffect[] = [];
        if (levelRow.effects) {
          try {
            parsedEffects = validateAndParseUpgradeEffects(levelRow.effects);
          } catch (err) {
            console.error(`[Upgrades] Failed to parse effects for upgrade "${levelRow.upgrade_id}" level ${levelRow.level}:`, err);
            parsedEffects = [];
          }
        }
        
        const levelConfig: UpgradeLevelConfig = {
          level: levelRow.level,
          name: levelRow.name,
          description: levelRow.description || undefined,
          icon: levelRow.icon || undefined,
          cost: parseNumber(levelRow.cost),
          timeCost: levelRow.time_cost !== null && levelRow.time_cost !== undefined ? parseNumber(levelRow.time_cost) : undefined,
          effects: parsedEffects,
        };

        const existing = levelsMap.get(levelRow.upgrade_id) || [];
        existing.push(levelConfig);
        levelsMap.set(levelRow.upgrade_id, existing);
      } catch (err) {
        console.error(`[Upgrades] Failed to process level for upgrade "${levelRow.upgrade_id}":`, err);
        // Continue processing other levels
      }
    });
    
    // Sort levels by level number to ensure correct order (levels array is 0-indexed, level property is 1-indexed)
    levelsMap.forEach((levels, upgradeId) => {
      levels.sort((a, b) => a.level - b.level);
      
      // Validate that levels are sequential starting from 1
      for (let i = 0; i < levels.length; i++) {
        if (levels[i].level !== i + 1) {
          console.warn(`[Upgrades] Upgrade "${upgradeId}" has non-sequential levels. Expected level ${i + 1} at index ${i}, but found level ${levels[i].level}. This may cause issues.`);
        }
      }
    });
  }

  const result: UpgradeDefinition[] = [];
  
  for (const row of upgradesData) {
    if (!row.id || !row.name) continue;
    
    // Convert nested map to array if we're using the new deduplication logic
    let levels: UpgradeLevelConfig[] = [];
    if (levelsMap.has(row.id)) {
      const upgradeLevelsMap = levelsMap.get(row.id)!;
      levels = Array.from(upgradeLevelsMap.values()).sort((a, b) => a.level - b.level);
    } else {
      // Fallback to old logic if nested map wasn't created
      levels = [];
    }
    
    if (levels.length === 0) {
      console.warn(`[Upgrades] Upgrade "${row.id}" has no levels configured. Skipping.`);
      continue;
    }
    
    // Validate maxLevel matches number of levels
    if (row.max_level !== levels.length) {
      console.warn(`[Upgrades] Upgrade "${row.id}" has max_level=${row.max_level} but ${levels.length} levels. Using ${levels.length} as maxLevel.`);
    }

    result.push({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      maxLevel: levels.length, // Use actual number of levels instead of row.max_level
      setsFlag: row.sets_flag || undefined,
      requirements: Array.isArray(row.requirements) ? row.requirements as any[] : [],
      levels: levels,
    });
  }
  
  return result;
}

export async function upsertUpgradeForIndustry(
  industryId: IndustryId,
  upgrade: UpgradeDefinition,
): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  if (!upgrade.levels || upgrade.levels.length === 0) {
    return { success: false, message: 'Upgrade must have at least one level.' };
  }

  // Base upgrade payload (no cost/time_cost/effects - those are in levels table)
  const basePayload = {
    id: upgrade.id,
    industry_id: industryId,
    name: upgrade.name,
    description: upgrade.description,
    icon: upgrade.icon,
    max_level: upgrade.maxLevel,
    sets_flag: upgrade.setsFlag || null,
    requirements: upgrade.requirements || [],
  };

  // Upsert base upgrade
  const { error: upsertError } = await supabaseServer
    .from('upgrades')
    .upsert(basePayload, { onConflict: 'industry_id,id' });

  if (upsertError) {
    console.error('[Upgrade Save] Failed to upsert upgrade:', upsertError);
    console.error('[Upgrade Save] Error details:', JSON.stringify(upsertError, null, 2));
    console.error('[Upgrade Save] Payload that failed:', JSON.stringify(basePayload, null, 2));
    return { success: false, message: `Failed to save: ${upsertError.message}` };
  }

  // CRITICAL: Delete ALL existing levels for this upgrade first to avoid duplicates/caching issues
  // This ensures a clean slate before inserting new data
  console.log('[Upgrade Save] Deleting ALL existing levels for upgrade:', upgrade.id);
  const { data: deletedData, error: deleteError } = await supabaseServer
    .from('upgrade_levels')
    .delete()
    .eq('upgrade_id', upgrade.id)
    .eq('industry_id', industryId)
    .select();

  if (deleteError) {
    console.error('[Upgrade Save] Failed to delete existing levels:', deleteError);
    console.error('[Upgrade Save] Delete error details:', JSON.stringify(deleteError, null, 2));
    return { success: false, message: `Failed to delete existing levels: ${deleteError.message}` };
  }
  
  console.log('[Upgrade Save] Deleted', deletedData?.length || 0, 'existing level(s)');

  // Prepare levels data for insert (not upsert - we've already deleted everything)
  const levelsToInsert = upgrade.levels.map((level) => ({
    upgrade_id: upgrade.id,
    industry_id: industryId,
    level: level.level,
    name: level.name,
    description: level.description || null,
    icon: level.icon || null,
    cost: level.cost,
    time_cost: level.timeCost ?? null,
    effects: level.effects.map((effect) => ({
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
    })),
  }));

  console.log('[Upgrade Save] Inserting levels:', JSON.stringify(levelsToInsert, null, 2));

  // Insert new levels (we've already deleted all existing ones, so this is a clean insert)
  const { error: levelsError, data: insertedData } = await supabaseServer
    .from('upgrade_levels')
    .insert(levelsToInsert)
    .select();

  if (levelsError) {
    console.error('[Upgrade Save] Failed to insert levels:', levelsError);
    console.error('[Upgrade Save] Levels error details:', JSON.stringify(levelsError, null, 2));
    console.error('[Upgrade Save] Levels payload that failed:', JSON.stringify(levelsToInsert, null, 2));
    return { success: false, message: `Failed to save levels: ${levelsError.message}` };
  }

  console.log('[Upgrade Save] Successfully inserted levels:', insertedData?.length || 0);
  
  // Verify the upsert worked by fetching back what we just saved
  const { data: verifyData, error: verifyError } = await supabaseServer
    .from('upgrade_levels')
    .select('level, name, cost, time_cost, effects')
    .eq('upgrade_id', upgrade.id)
    .eq('industry_id', industryId)
    .order('level', { ascending: true });
  
  if (verifyError) {
    console.error('[Upgrade Save] Failed to verify upserted levels:', verifyError);
  } else {
    console.log('[Upgrade Save] Verified levels in database:', verifyData?.length || 0);
    console.log('[Upgrade Save] Verified levels data:', JSON.stringify(verifyData, null, 2));
    
    // Compare what we inserted vs what's in the database
    if (verifyData && verifyData.length !== levelsToInsert.length) {
      console.error('[Upgrade Save] MISMATCH: Inserted', levelsToInsert.length, 'but database has', verifyData.length);
    }
    
    // Check for any duplicate levels (shouldn't happen, but let's verify)
    const levelNumbers = verifyData?.map(v => v.level) || [];
    const duplicates = levelNumbers.filter((level, index) => levelNumbers.indexOf(level) !== index);
    if (duplicates.length > 0) {
      console.error('[Upgrade Save] WARNING: Found duplicate levels in database:', duplicates);
    }
  }

  return { success: true, message: 'Upgrade saved successfully.' };
}

export async function deleteUpgradeById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabaseServer.from('upgrades').delete().eq('id', id);
  if (error) {
    console.error(`[Upgrades] Failed to delete upgrade "${id}":`, error);
    return { success: false, message: `Failed to delete upgrade: ${error.message}` };
  }
  return { success: true };
}
