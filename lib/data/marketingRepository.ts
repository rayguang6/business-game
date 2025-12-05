import { supabaseServer } from '@/lib/server/supabaseServer';
import type { MarketingCampaign, CampaignEffect } from '@/lib/store/slices/marketingSlice';
import type { IndustryId } from '@/lib/game/types';
import { validateAndParseCampaignEffects } from '@/lib/utils/effectValidation';

interface MarketingCampaignRow {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  cost: number | string | null;
  time_cost?: number | string | null; // Optional time cost column
  cooldown_seconds: number | null;
  effects: unknown;
  sets_flag: string | null;
  requirements: unknown;
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
  // Use centralized validation for CampaignEffect (includes durationSeconds)
  return validateAndParseCampaignEffects(raw);
};

export async function fetchMarketingCampaignsForIndustry(industryId: IndustryId): Promise<MarketingCampaign[] | null> {
  if (!supabaseServer) {
    console.error('Supabase client not configured. Unable to fetch marketing campaigns.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('marketing_campaigns')
    .select('id, industry_id, name, description, cost, time_cost, cooldown_seconds, effects, sets_flag, requirements')
    .eq('industry_id', industryId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch marketing campaigns from Supabase', error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const campaigns = data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: row.id,
      industryId: row.industry_id as any,
      name: row.name,
      description: row.description ?? '',
      cost: parseNumber(row.cost),
      timeCost: row.time_cost !== null && row.time_cost !== undefined ? parseNumber(row.time_cost) : undefined,
      cooldownSeconds: parseNumber(row.cooldown_seconds, 60), // Default to 60s if not set
      effects: mapEffects(row.effects),
      setsFlag: row.sets_flag || undefined,
      requirements: Array.isArray(row.requirements) ? row.requirements as any[] : [],
    }));

  return campaigns;
}

export async function upsertMarketingCampaignForIndustry(industryId: string, campaign: MarketingCampaign): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload: MarketingCampaignRow = {
    id: campaign.id,
    industry_id: industryId,
    name: campaign.name,
    description: campaign.description,
    cost: campaign.cost,
    time_cost: campaign.timeCost ?? null,
    cooldown_seconds: campaign.cooldownSeconds,
    effects: campaign.effects.map((e) => ({ metric: e.metric, type: e.type, value: e.value, durationSeconds: e.durationSeconds })),
    sets_flag: campaign.setsFlag || null,
    requirements: campaign.requirements || [],
  };

  const { error } = await supabaseServer
    .from('marketing_campaigns')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('Failed to upsert marketing campaign', error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteMarketingCampaignById(id: string, industryId: IndustryId): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }
  const { error } = await supabaseServer
    .from('marketing_campaigns')
    .delete()
    .eq('id', id)
    .eq('industry_id', industryId);
  if (error) {
    console.error('Failed to delete marketing campaign', error);
    return { success: false, message: error.message };
  }
  return { success: true };
}
