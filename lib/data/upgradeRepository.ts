import { supabase } from '@/lib/supabase/client';
import type { IndustryId, UpgradeDefinition, UpgradeEffect } from '@/lib/game/types';
import { EffectType, GameMetric } from '@/lib/game/effectManager';

interface UpgradeRow {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  icon: string;
  cost: number | string;
  max_level: number;
  upgrade_effects: {
    id: number;
    metric: string;
    type: string;
    value: number | string;
    priority: number | null;
  }[] | null;
  sets_flag: string | null;
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

function mapEffects(effectRows: UpgradeRow['upgrade_effects']): UpgradeEffect[] {
  const safeRows = effectRows ?? [];

  return safeRows
    .filter((row) => row.metric && row.type)
    .map((row) => ({
      metric: row.metric as GameMetric,
      type: row.type as EffectType,
      value: parseNumber(row.value),
      priority: row.priority ?? undefined,
    }));
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
    .select('id, industry_id, name, description, icon, cost, max_level, upgrade_effects(id, metric, type, value, priority), sets_flag')
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
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      cost: parseNumber(row.cost),
      maxLevel: row.max_level,
      effects: mapEffects(row.upgrade_effects),
      setsFlag: row.sets_flag || undefined,
    }));
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
    max_level: upgrade.maxLevel,
    sets_flag: upgrade.setsFlag || null,
  } as const;

  const { error: upsertError } = await supabase
    .from('upgrades')
    .upsert(basePayload, { onConflict: 'industry_id,id' });

  if (upsertError) {
    console.error('Failed to upsert upgrade', upsertError);
    return { success: false, message: upsertError.message };
  }

  // Replace effects for this upgrade id
  const { error: deleteEffectsError } = await supabase
    .from('upgrade_effects')
    .delete()
    .eq('upgrade_id', upgrade.id);

  if (deleteEffectsError) {
    console.error('Failed to clear upgrade effects', deleteEffectsError);
    return { success: false, message: deleteEffectsError.message };
  }

  const effectRows = (upgrade.effects ?? []).map((e) => ({
    upgrade_id: upgrade.id,
    metric: e.metric,
    type: e.type,
    value: e.value,
    priority: e.priority ?? null,
  }));

  if (effectRows.length > 0) {
    const { error: insertEffectsError } = await supabase
      .from('upgrade_effects')
      .insert(effectRows);

    if (insertEffectsError) {
      console.error('Failed to insert upgrade effects', insertEffectsError);
      return { success: false, message: insertEffectsError.message };
    }
  }

  return { success: true };
}

export async function deleteUpgradeById(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Remove effects then upgrade
  const { error: effErr } = await supabase.from('upgrade_effects').delete().eq('upgrade_id', id);
  if (effErr) {
    console.error('Failed to delete upgrade effects', effErr);
    return { success: false, message: effErr.message };
  }

  const { error } = await supabase.from('upgrades').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete upgrade', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}
