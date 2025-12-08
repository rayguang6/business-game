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
  order: number | null;
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
    .select('id, industry_id, name, description, cost, time_cost, cooldown_seconds, effects, sets_flag, requirements, order')
    .eq('industry_id', industryId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    console.error(`[Marketing] Failed to fetch campaigns for industry "${industryId}":`, error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const campaigns: MarketingCampaign[] = [];
  
  for (const row of data) {
    if (!row.id || !row.name) {
      console.warn(`[Marketing] Skipping campaign with missing required fields: id=${row.id}, name=${row.name}`);
      continue;
    }
    
    try {
      // Parse effects JSONB with error handling
      let effects: CampaignEffect[] = [];
      if (row.effects) {
        try {
          effects = mapEffects(row.effects);
        } catch (err) {
          console.error(`[Marketing] Failed to parse effects for campaign "${row.id}":`, err);
          effects = [];
        }
      }
      
      // Parse requirements JSONB with error handling
      let requirements: any[] = [];
      if (row.requirements) {
        if (Array.isArray(row.requirements)) {
          requirements = row.requirements;
        } else {
          console.warn(`[Marketing] Invalid requirements format for campaign "${row.id}": expected array, got ${typeof row.requirements}`);
        }
      }
      
      campaigns.push({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        cost: parseNumber(row.cost),
        timeCost: row.time_cost !== null && row.time_cost !== undefined ? parseNumber(row.time_cost) : undefined,
        cooldownSeconds: parseNumber(row.cooldown_seconds, 60), // Default to 60s if not set
        effects,
        setsFlag: row.sets_flag || undefined,
        requirements,
        order: row.order ?? 0,
      });
    } catch (err) {
      console.error(`[Marketing] Failed to process campaign "${row.id}":`, err);
      // Continue processing other campaigns
    }
  }

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
    order: campaign.order ?? 0,
  };

  const { error } = await supabaseServer
    .from('marketing_campaigns')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error(`[Marketing] Failed to upsert campaign "${campaign.id}" for industry "${industryId}":`, error);
    return { success: false, message: `Failed to save campaign: ${error.message}` };
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
    console.error(`[Marketing] Failed to delete campaign "${id}" for industry "${industryId}":`, error);
    return { success: false, message: `Failed to delete campaign: ${error.message}` };
  }
  return { success: true };
}
