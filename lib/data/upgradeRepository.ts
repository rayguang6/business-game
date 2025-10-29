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
    .from<UpgradeRow>('upgrades')
    .select('id, industry_id, name, description, icon, cost, max_level, upgrade_effects(id, metric, type, value, priority)')
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
    }));
}
