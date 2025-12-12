import { supabaseServer } from '@/lib/server/supabaseServer';
import type { IndustryId } from '@/lib/game/types';
import { validateAndParseUpgradeEffects } from '@/lib/utils/effectValidation';
import type { UpgradeEffect } from '@/lib/game/types';

// Interface matching the database row structure
interface LevelRewardRow {
  id: string;
  industry_id: string;
  level: number;
  title: string;
  narrative: string | null;
  rank: string | null;
  effects: unknown;
  unlocks_flags: unknown;
  created_at: string;
  updated_at: string;
}

// Level reward interface (matches database structure)
export interface LevelReward {
  id: string;
  industryId: IndustryId;
  level: number;
  title: string;
  narrative?: string;
  rank?: string;
  effects: UpgradeEffect[];
  unlocksFlags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all level rewards for an industry
 */
export async function fetchLevelRewardsForIndustry(
  industryId: IndustryId,
): Promise<LevelReward[] | null> {
  if (!supabaseServer) {
    console.error('[LevelRewards] Supabase client not configured. Unable to fetch level rewards.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('level_rewards')
    .select('*')
    .eq('industry_id', industryId)
    .order('level', { ascending: true });

  if (error) {
    console.error(`[LevelRewards] Failed to fetch level rewards for industry "${industryId}":`, error);
    return null;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const result: LevelReward[] = [];

  for (const row of data as LevelRewardRow[]) {
    try {
      // Parse effects JSONB with error handling
      let parsedEffects: UpgradeEffect[] = [];
      if (row.effects) {
        try {
          parsedEffects = validateAndParseUpgradeEffects(row.effects);
        } catch (err) {
          console.error(`[LevelRewards] Failed to parse effects for level ${row.level}:`, err);
          parsedEffects = [];
        }
      }

      // Parse unlocks_flags JSONB array
      let unlocksFlags: string[] = [];
      if (row.unlocks_flags) {
        try {
          if (Array.isArray(row.unlocks_flags)) {
            unlocksFlags = row.unlocks_flags
              .map((flag: unknown) => {
                if (typeof flag === 'string' && flag.length > 0) {
                  return flag;
                }
                return null;
              })
              .filter((flag): flag is string => flag !== null);
          }
        } catch (err) {
          console.error(`[LevelRewards] Failed to parse unlocks_flags for level ${row.level}:`, err);
          unlocksFlags = [];
        }
      }

      result.push({
        id: row.id,
        industryId: row.industry_id as IndustryId,
        level: row.level,
        title: row.title,
        narrative: row.narrative || undefined,
        rank: row.rank || undefined,
        effects: parsedEffects,
        unlocksFlags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (err) {
      console.error(`[LevelRewards] Failed to process level reward for level ${row.level}:`, err);
      // Continue processing other rewards
    }
  }

  // Sort by level to ensure correct order
  result.sort((a, b) => a.level - b.level);

  return result;
}

/**
 * Fetch a specific level reward
 */
export async function fetchLevelReward(
  industryId: IndustryId,
  level: number,
): Promise<LevelReward | null> {
  if (!supabaseServer) {
    console.error('[LevelRewards] Supabase client not configured. Unable to fetch level reward.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('level_rewards')
    .select('*')
    .eq('industry_id', industryId)
    .eq('level', level)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - level reward doesn't exist
      return null;
    }
    console.error(`[LevelRewards] Failed to fetch level reward for industry "${industryId}" level ${level}:`, error);
    return null;
  }

  const row = data as LevelRewardRow;

  try {
    // Parse effects JSONB
    let parsedEffects: UpgradeEffect[] = [];
    if (row.effects) {
      try {
        parsedEffects = validateAndParseUpgradeEffects(row.effects);
      } catch (err) {
        console.error(`[LevelRewards] Failed to parse effects for level ${row.level}:`, err);
        parsedEffects = [];
      }
    }

    // Parse unlocks_flags JSONB array
    let unlocksFlags: string[] = [];
    if (row.unlocks_flags) {
      try {
        if (Array.isArray(row.unlocks_flags)) {
          unlocksFlags = row.unlocks_flags
            .map((flag: unknown) => {
              if (typeof flag === 'string' && flag.length > 0) {
                return flag;
              }
              return null;
            })
            .filter((flag): flag is string => flag !== null);
        }
      } catch (err) {
        console.error(`[LevelRewards] Failed to parse unlocks_flags for level ${row.level}:`, err);
        unlocksFlags = [];
      }
    }

    return {
      id: row.id,
      industryId: row.industry_id as IndustryId,
      level: row.level,
      title: row.title,
      narrative: row.narrative || undefined,
      rank: row.rank || undefined,
      effects: parsedEffects,
      unlocksFlags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error(`[LevelRewards] Failed to process level reward for level ${row.level}:`, err);
    return null;
  }
}

/**
 * Upsert a level reward (insert or update)
 */
export async function upsertLevelRewardForIndustry(
  industryId: IndustryId,
  levelReward: LevelReward,
): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const payload = {
    id: levelReward.id,
    industry_id: industryId,
    level: levelReward.level,
    title: levelReward.title,
    narrative: levelReward.narrative || null,
    rank: levelReward.rank || null,
    effects: levelReward.effects.map((effect) => ({
      metric: effect.metric,
      type: effect.type,
      value: effect.value,
    })),
    unlocks_flags: levelReward.unlocksFlags.length > 0 ? levelReward.unlocksFlags : [],
  };

  const { error } = await supabaseServer
    .from('level_rewards')
    .upsert(payload, { onConflict: 'industry_id,level' });

  if (error) {
    console.error('[LevelRewards] Failed to upsert level reward:', error);
    return { success: false, message: `Failed to save: ${error.message}` };
  }

  return { success: true };
}

/**
 * Delete a level reward by ID
 */
export async function deleteLevelRewardById(id: string): Promise<{ success: boolean; message?: string }> {
  if (!supabaseServer) {
    return { success: false, message: 'Supabase client not configured.' };
  }

  const { error } = await supabaseServer
    .from('level_rewards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[LevelRewards] Failed to delete level reward:', error);
    return { success: false, message: `Failed to delete: ${error.message}` };
  }

  return { success: true };
}

/**
 * Get the rank for a specific level in an industry
 */
export async function getLevelRank(
  industryId: IndustryId,
  level: number,
): Promise<string | null> {
  if (!supabaseServer) {
    console.error('[LevelRewards] Supabase client not configured. Unable to get level rank.');
    return null;
  }

  const { data, error } = await supabaseServer
    .from('level_rewards')
    .select('rank')
    .eq('industry_id', industryId)
    .eq('level', level)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - level reward doesn't exist
      return null;
    }
    console.error(`[LevelRewards] Failed to get level rank for industry "${industryId}" level ${level}:`, error);
    return null;
  }

  return data.rank;
}
