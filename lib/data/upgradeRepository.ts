import { supabase } from '@/lib/supabase/client';
import type { IndustryId, UpgradeDefinition, UpgradeEffect } from '@/lib/game/types';
import { EffectType, GameMetric } from '@/lib/game/effectManager';

interface RawEffectRow {
  metric?: string;
  type?: string;
  value?: number | string | null;
  priority?: number | null;
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

function mapEffects(raw: unknown): UpgradeEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((row): row is RawEffectRow => Boolean(row) && typeof row === 'object')
    .filter((row) => typeof row.metric === 'string' && typeof row.type === 'string')
    .map((row) => ({
      metric: row.metric as GameMetric,
      type: row.type as EffectType,
      value: parseNumber(row.value ?? 0),
      priority: typeof row.priority === 'number' ? row.priority : undefined,
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
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      cost: parseNumber(row.cost),
      timeCost: row.time_cost !== null && row.time_cost !== undefined ? parseNumber(row.time_cost) : undefined,
      maxLevel: row.max_level,
      effects: mapEffects(row.effects),
      setsFlag: row.sets_flag || undefined,
      requirements: Array.isArray(row.requirements) ? row.requirements as any[] : [],
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
    time_cost: upgrade.timeCost ?? null,
    max_level: upgrade.maxLevel,
    sets_flag: upgrade.setsFlag || null,
    requirements: upgrade.requirements || [],
    effects: (upgrade.effects ?? []).map((effect) => ({
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
      priority: effect.priority ?? null,
    })),
  } as const;

  const { error: upsertError } = await supabase
    .from('upgrades')
    .upsert(basePayload, { onConflict: 'industry_id,id' });

  if (upsertError) {
    console.error('Failed to upsert upgrade', upsertError);
    return { success: false, message: upsertError.message };
  }

  return { success: true };
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
