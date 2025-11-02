import { supabase } from '@/lib/supabase/client';
import type { MarketingCampaign, CampaignEffect } from '@/lib/store/slices/marketingSlice';
import { EffectType, GameMetric } from '@/lib/game/effectManager';

interface MarketingCampaignRow {
  id: string;
  name: string;
  description: string;
  cost: number | string | null;
  cooldown_seconds: number | null;
  effects: unknown;
  sets_flag: string | null;
  requirement_ids: unknown;
}

interface RawEffect {
  metric?: string;
  type?: string;
  value?: number;
  durationSeconds?: number | null;
}

const parseNumber = (value: number | string | null | undefined, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const mapEffects = (raw: unknown): CampaignEffect[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is RawEffect => !!item && typeof item === 'object')
    .filter((item) => typeof item.metric === 'string' && typeof item.type === 'string')
    .map((item) => ({
      metric: item.metric as GameMetric,
      type: item.type as EffectType,
      value: typeof item.value === 'number' ? item.value : 0,
      durationSeconds: item.durationSeconds ?? null,
    }));
};

export async function fetchMarketingCampaigns(): Promise<MarketingCampaign[] | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch marketing campaigns.');
    return null;
  }

  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('id, name, description, cost, cooldown_seconds, effects, sets_flag, requirement_ids')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch marketing campaigns from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      cost: parseNumber(row.cost),
      cooldownSeconds: parseNumber(row.cooldown_seconds, 60), // Default to 300s if not set
      effects: mapEffects(row.effects),
      setsFlag: row.sets_flag || undefined,
      requirementIds: Array.isArray(row.requirement_ids) ? row.requirement_ids as string[] : [],
    }));
}

export async function upsertMarketingCampaign(campaign: MarketingCampaign): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: MarketingCampaignRow = {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    cost: campaign.cost,
    cooldown_seconds: campaign.cooldownSeconds,
    effects: campaign.effects.map((e) => ({ metric: e.metric, type: e.type, value: e.value, durationSeconds: e.durationSeconds })),
    sets_flag: campaign.setsFlag || null,
    requirement_ids: campaign.requirementIds || [],
  };

  const { error } = await supabase
    .from('marketing_campaigns')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('Failed to upsert marketing campaign', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteMarketingCampaign(id: string): Promise<{ success: boolean; message?: string }>
{
  if (!supabase) {
    return { success: false, message: 'Supabase client not configured.' };
  }
  const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete marketing campaign', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}
