import { supabaseServer } from '@/lib/server/supabaseServer';
import type { MarketingCampaign, CampaignEffect, MarketingCampaignLevelConfig } from '@/lib/store/slices/marketingSlice';
import type { IndustryId } from '@/lib/game/types';
import { validateAndParseCampaignEffects } from '@/lib/utils/effectValidation';

interface MarketingCampaignRow {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  campaign_type: string | null; // 'leveled' or 'unlimited'
  max_level: number | null; // For leveled campaigns
  cost: number | string | null; // For unlimited campaigns
  time_cost?: number | string | null; // For unlimited campaigns
  cooldown_seconds: number | null;
  effects: unknown; // For unlimited campaigns
  category_id: string | null;
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

  // Fetch base campaigns
  const { data: campaignsData, error: campaignsError } = await supabaseServer
    .from('marketing_campaigns')
    .select('id, industry_id, name, description, campaign_type, max_level, cost, time_cost, cooldown_seconds, effects, category_id, sets_flag, requirements, order')
    .eq('industry_id', industryId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (campaignsError) {
    console.error(`[Marketing] Failed to fetch campaigns for industry "${industryId}":`, campaignsError);
    return null;
  }

  if (!campaignsData || campaignsData.length === 0) {
    return [];
  }

  // Fetch levels for leveled campaigns
  const { data: levelsData, error: levelsError } = await supabaseServer
    .from('marketing_campaign_levels')
    .select('campaign_id, level, name, description, icon, cost, time_cost, effects')
    .eq('industry_id', industryId)
    .order('campaign_id', { ascending: true })
    .order('level', { ascending: true });

  if (levelsError) {
    console.error(`[Marketing] Failed to fetch campaign levels for industry "${industryId}":`, levelsError);
    return null;
  }

  // Group levels by campaign_id
  const levelsMap = new Map<string, MarketingCampaignLevelConfig[]>();
  if (levelsData) {
    levelsData.forEach((levelRow: any) => {
      try {
        let parsedEffects: CampaignEffect[] = [];
        if (levelRow.effects) {
          try {
            parsedEffects = mapEffects(levelRow.effects);
          } catch (err) {
            console.error(`[Marketing] Failed to parse effects for campaign "${levelRow.campaign_id}" level ${levelRow.level}:`, err);
            parsedEffects = [];
          }
        }

        const levelConfig: MarketingCampaignLevelConfig = {
          level: levelRow.level,
          name: levelRow.name,
          description: levelRow.description || undefined,
          icon: levelRow.icon || undefined,
          cost: parseNumber(levelRow.cost),
          timeCost: levelRow.time_cost !== null && levelRow.time_cost !== undefined ? parseNumber(levelRow.time_cost) : undefined,
          effects: parsedEffects,
        };

        const existing = levelsMap.get(levelRow.campaign_id) || [];
        existing.push(levelConfig);
        levelsMap.set(levelRow.campaign_id, existing);
      } catch (err) {
        console.error(`[Marketing] Failed to process level for campaign "${levelRow.campaign_id}":`, err);
      }
    });

    // Sort levels by level number
    levelsMap.forEach((levels, campaignId) => {
      levels.sort((a, b) => a.level - b.level);
    });
  }

  const campaigns: MarketingCampaign[] = [];
  
  for (const row of campaignsData) {
    if (!row.id || !row.name) {
      console.warn(`[Marketing] Skipping campaign with missing required fields: id=${row.id}, name=${row.name}`);
      continue;
    }
    
    try {
      const campaignType = (row.campaign_type || 'unlimited') as 'leveled' | 'unlimited';
      
      // Parse requirements JSONB with error handling
      let requirements: any[] = [];
      if (row.requirements) {
        if (Array.isArray(row.requirements)) {
          requirements = row.requirements;
        } else {
          console.warn(`[Marketing] Invalid requirements format for campaign "${row.id}": expected array, got ${typeof row.requirements}`);
        }
      }

      if (campaignType === 'leveled') {
        // Leveled campaign
        const levels = levelsMap.get(row.id) || [];
        if (levels.length === 0) {
          console.warn(`[Marketing] Leveled campaign "${row.id}" has no levels configured. Skipping.`);
          continue;
        }

        campaigns.push({
          id: row.id,
          name: row.name,
          description: row.description ?? '',
          type: 'leveled',
          maxLevel: row.max_level || levels.length,
          cooldownSeconds: parseNumber(row.cooldown_seconds, 60),
          categoryId: row.category_id || undefined,
          setsFlag: row.sets_flag || undefined,
          requirements,
          order: row.order ?? 0,
          levels,
        });
      } else {
        // Unlimited campaign
        let effects: CampaignEffect[] = [];
        if (row.effects) {
          try {
            effects = mapEffects(row.effects);
          } catch (err) {
            console.error(`[Marketing] Failed to parse effects for campaign "${row.id}":`, err);
            effects = [];
          }
        }

        campaigns.push({
          id: row.id,
          name: row.name,
          description: row.description ?? '',
          type: 'unlimited',
          cost: parseNumber(row.cost),
          timeCost: row.time_cost !== null && row.time_cost !== undefined ? parseNumber(row.time_cost) : undefined,
          cooldownSeconds: parseNumber(row.cooldown_seconds, 60),
          effects,
          categoryId: row.category_id || undefined,
          setsFlag: row.sets_flag || undefined,
          requirements,
          order: row.order ?? 0,
        });
      }
    } catch (err) {
      console.error(`[Marketing] Failed to process campaign "${row.id}":`, err);
      // Continue processing other campaigns
    }
  }

  return campaigns;
}

export async function upsertMarketingCampaignForIndustry(industryId: string, campaign: MarketingCampaign): Promise<{ success: boolean; message?: string }>
{
  console.log(`[Marketing Repository] Upserting campaign "${campaign.id}" for industry "${industryId}"`);
  if (!supabaseServer) {
    console.error('[Marketing Repository] Supabase client not configured');
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Base campaign payload
  const basePayload: MarketingCampaignRow = {
    id: campaign.id,
    industry_id: industryId,
    name: campaign.name,
    description: campaign.description,
    campaign_type: campaign.type,
    max_level: campaign.type === 'leveled' ? (campaign.maxLevel || null) : null,
    // For leveled campaigns, cost is NULL (cost is at level level)
    // For unlimited campaigns, cost is required
    cost: campaign.type === 'leveled' 
      ? null 
      : (campaign.cost ?? 0), // Default to 0 for unlimited campaigns if not specified
    time_cost: campaign.type === 'leveled' 
      ? null 
      : (campaign.timeCost ?? null), // NULL for leveled, optional for unlimited
    cooldown_seconds: campaign.cooldownSeconds,
    effects: campaign.type === 'unlimited' && campaign.effects 
      ? campaign.effects.map((e) => ({ metric: e.metric, type: e.type, value: e.value, durationSeconds: e.durationSeconds }))
      : null,
    category_id: campaign.categoryId || null,
    sets_flag: campaign.setsFlag || null,
    requirements: campaign.requirements || [],
    order: campaign.order ?? 0,
  };

  console.log('[Marketing Repository] Base payload:', JSON.stringify(basePayload, null, 2));

  // Upsert base campaign (using industry_id,id as conflict resolution like upgrades)
  const { error: upsertError } = await supabaseServer
    .from('marketing_campaigns')
    .upsert(basePayload, { onConflict: 'industry_id,id' });

  if (upsertError) {
    console.error(`[Marketing Repository] Failed to upsert campaign "${campaign.id}" for industry "${industryId}":`, upsertError);
    return { success: false, message: `Failed to save campaign: ${upsertError.message}` };
  }

  console.log('[Marketing Repository] Base campaign upserted successfully');

  // Handle leveled campaigns - delete and reinsert levels
  if (campaign.type === 'leveled') {
    console.log('[Marketing Repository] Processing leveled campaign with', campaign.levels?.length || 0, 'levels');
    if (!campaign.levels || campaign.levels.length === 0) {
      console.error('[Marketing Repository] Leveled campaign has no levels');
      return { success: false, message: 'Leveled campaign must have at least one level.' };
    }

    // Delete all existing levels for this campaign
    console.log('[Marketing Repository] Deleting existing levels...');
    const { error: deleteError } = await supabaseServer
      .from('marketing_campaign_levels')
      .delete()
      .eq('campaign_id', campaign.id)
      .eq('industry_id', industryId);

    if (deleteError) {
      console.error(`[Marketing Repository] Failed to delete existing levels for campaign "${campaign.id}":`, deleteError);
      return { success: false, message: `Failed to delete existing levels: ${deleteError.message}` };
    }
    console.log('[Marketing Repository] Existing levels deleted successfully');

    // Insert new levels
    const levelsToInsert = campaign.levels.map((level) => ({
      campaign_id: campaign.id,
      industry_id: industryId,
      level: level.level,
      name: level.name,
      description: level.description || null,
      icon: level.icon || null,
      cost: level.cost,
      time_cost: level.timeCost ?? null,
      effects: (level.effects || []).map((effect) => ({
        metric: effect.metric,
        type: effect.type,
        value: effect.value,
        durationSeconds: effect.durationSeconds,
      })),
    }));

    console.log('[Marketing Repository] Inserting levels:', JSON.stringify(levelsToInsert, null, 2));
    const { error: levelsError } = await supabaseServer
      .from('marketing_campaign_levels')
      .insert(levelsToInsert);

    if (levelsError) {
      console.error(`[Marketing Repository] Failed to insert levels for campaign "${campaign.id}":`, levelsError);
      return { success: false, message: `Failed to save levels: ${levelsError.message}` };
    }
    console.log('[Marketing Repository] Levels inserted successfully');
  }

  console.log('[Marketing Repository] Upsert completed successfully');
  return { success: true };
}

export async function deleteMarketingCampaignById(id: string, industryId: IndustryId): Promise<{ success: boolean; message?: string }>
{
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  // Delete levels first (if any)
  const { error: levelsError } = await supabaseServer
    .from('marketing_campaign_levels')
    .delete()
    .eq('campaign_id', id)
    .eq('industry_id', industryId);

  if (levelsError) {
    console.error(`[Marketing] Failed to delete levels for campaign "${id}":`, levelsError);
    return { success: false, message: `Failed to delete campaign levels: ${levelsError.message}` };
  }

  // Delete campaign
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
