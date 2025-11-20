import { supabase } from '@/lib/supabase/client';
import type { IndustryId, UpgradeDefinition, UpgradeEffect } from '@/lib/game/types';
import { validateAndParseUpgradeEffects, isValidGameMetric, isValidEffectType } from '@/lib/utils/effectValidation';

// Helper function to check if a value is a valid number
function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

interface UpgradeRow {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  icon: string;
  cost: number | string;
  time_cost?: number | string | null; // Optional time cost column
  max_level: number;
  effects: unknown;
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
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch upgrades.');
    return null;
  }

  const { data, error } = await supabase
    .from('upgrades')
    .select('id, industry_id, name, description, icon, cost, time_cost, max_level, effects, sets_flag, requirements')
    .eq('industry_id', industryId);

  if (error) {
    console.error('Failed to fetch upgrades from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => Boolean(row.id) && Boolean(row.name))
    .map((row) => {
      const parsedEffects = validateAndParseUpgradeEffects(row.effects);
      if (parsedEffects.length === 0 && Array.isArray(row.effects) && row.effects.length > 0) {
        console.warn(`Upgrade ${row.id} has ${row.effects.length} effects but all were filtered out during validation`);
        console.warn('Raw effects data:', JSON.stringify(row.effects, null, 2));
        // Log each effect to see why it's failing
        row.effects.forEach((effect: unknown, idx: number) => {
          const e = effect as Record<string, unknown>;
          console.warn(`Effect ${idx}:`, {
            hasMetric: 'metric' in e,
            metric: e.metric,
            metricValid: isValidGameMetric(e.metric),
            hasType: 'type' in e,
            type: e.type,
            typeValid: isValidEffectType(e.type),
            hasValue: 'value' in e,
            value: e.value,
            valueValid: isValidNumber(e.value),
            keys: Object.keys(e),
            unexpectedKeys: Object.keys(e).filter(k => !['metric', 'type', 'value'].includes(k)),
          });
        });
      }
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        cost: parseNumber(row.cost),
        timeCost: row.time_cost !== null && row.time_cost !== undefined ? parseNumber(row.time_cost) : undefined,
        maxLevel: row.max_level,
        effects: parsedEffects,
        setsFlag: row.sets_flag || undefined,
        requirements: Array.isArray(row.requirements) ? row.requirements as any[] : [],
      };
    });
}

export async function upsertUpgradeForIndustry(
  industryId: IndustryId,
  upgrade: Omit<UpgradeDefinition, 'effects'> & { effects: UpgradeEffect[] },
): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const basePayload = {
    id: upgrade.id,
    industry_id: industryId,
    name: upgrade.name,
    description: upgrade.description,
    icon: upgrade.icon,
    cost: upgrade.cost,
    time_cost: upgrade.timeCost ?? null,
    max_level: upgrade.maxLevel,
    sets_flag: upgrade.setsFlag || null,
    requirements: upgrade.requirements || [],
    effects: (upgrade.effects ?? []).map((effect) => ({
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
    })),
  } as const;

  // Log the payload being sent for debugging
  console.log('[Upgrade Save] Upserting upgrade with payload:', JSON.stringify(basePayload, null, 2));
  console.log('[Upgrade Save] Industry ID:', industryId);
  console.log('[Upgrade Save] Upgrade ID:', upgrade.id);
  
  const { data: upsertData, error: upsertError } = await supabase
    .from('upgrades')
    .upsert(basePayload, { onConflict: 'industry_id,id' })
    .select();

  if (upsertError) {
    console.error('[Upgrade Save] Failed to upsert upgrade:', upsertError);
    console.error('[Upgrade Save] Error details:', JSON.stringify(upsertError, null, 2));
    console.error('[Upgrade Save] Payload that failed:', JSON.stringify(basePayload, null, 2));
    return { success: false, message: `Failed to save: ${upsertError.message}` };
  }

  console.log('[Upgrade Save] Upsert successful, returned data:', upsertData);

  // Verify the data was saved correctly
  const { data: verifyData, error: verifyError } = await supabase
    .from('upgrades')
    .select('*')
    .eq('industry_id', industryId)
    .eq('id', upgrade.id)
    .single();

  if (verifyError) {
    console.error('[Upgrade Save] Verification failed:', verifyError);
    console.error('[Upgrade Save] Verification error details:', JSON.stringify(verifyError, null, 2));
    // Still return success if upsert succeeded, but log the verification issue
    return { success: true, message: 'Saved but verification failed. Please refresh to confirm.' };
  }

  console.log('[Upgrade Save] Verification successful. Saved data:', JSON.stringify(verifyData, null, 2));
  
  if (verifyData) {
    const parsedEffects = validateAndParseUpgradeEffects(verifyData.effects);
    console.log('[Upgrade Save] Parsed effects from DB:', parsedEffects);
    console.log('[Upgrade Save] Expected effects:', upgrade.effects);
    
    if (parsedEffects.length !== upgrade.effects.length) {
      console.warn(`[Upgrade Save] Effect count mismatch: saved ${parsedEffects.length}, expected ${upgrade.effects.length}`);
      console.warn('[Upgrade Save] Saved effects:', parsedEffects);
      console.warn('[Upgrade Save] Expected effects:', upgrade.effects);
      return { 
        success: true, 
        message: `Saved, but ${upgrade.effects.length - parsedEffects.length} effects were filtered out during validation.` 
      };
    }
  }

  return { success: true, message: 'Upgrade saved successfully.' };
}

export async function deleteUpgradeById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabase.from('upgrades').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete upgrade', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}
