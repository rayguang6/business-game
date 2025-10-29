import { supabase } from '@/lib/supabase/client';
import type { MarketingCampaign, CampaignEffect } from '@/lib/store/slices/marketingSlice';
import { EffectType, GameMetric } from '@/lib/game/effectManager';

interface MarketingCampaignRow {
  id: string;
  name: string;
  description: string;
  cost: number | string | null;
  duration_seconds: number | null;
  effects: unknown;
}

interface RawEffect {
  metric?: string;
  type?: string;
  value?: number;
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
    }));
};

export async function fetchMarketingCampaigns(): Promise<MarketingCampaign[] | null> {
  if (!supabase) {
    console.error('Supabase client not configured. Unable to fetch marketing campaigns.');
    return null;
  }

  const { data, error } = await supabase
    .from<MarketingCampaignRow>('marketing_campaigns')
    .select('id, name, description, cost, duration_seconds, effects')
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
      durationSeconds: parseNumber(row.duration_seconds),
      effects: mapEffects(row.effects),
    }));
}
