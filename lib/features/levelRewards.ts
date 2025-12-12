import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';
import { getExpPerLevel } from '@/lib/game/config';
import { getLevel } from '@/lib/store/types';
import { fetchLevelReward, fetchLevelRewards } from '@/lib/server/actions/adminActions';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import type { UpgradeEffect } from '@/lib/game/types';
import type { GameStore } from '@/lib/store/gameStore';
import type { Lead } from '@/lib/features/leads';
import { SourceType } from '@/lib/config/sourceTypes';

// Cache for level rewards per industry (loaded once per game session)
const levelRewardsCache = new Map<IndustryId, LevelReward[]>();

/**
 * Load all level rewards for an industry (cached)
 */
export async function loadLevelRewardsForIndustry(
  industryId: IndustryId,
): Promise<LevelReward[]> {
  // Check cache first
  if (levelRewardsCache.has(industryId)) {
    return levelRewardsCache.get(industryId)!;
  }

  // Use server action instead of direct repository import
  const rewards = await fetchLevelRewards(industryId);
  
  const result = rewards || [];
  levelRewardsCache.set(industryId, result);
  return result;
}

/**
 * Clear level rewards cache (useful for testing or when data changes)
 */
export function clearLevelRewardsCache(industryId?: IndustryId): void {
  if (industryId) {
    levelRewardsCache.delete(industryId);
  } else {
    levelRewardsCache.clear();
  }
}

/**
 * Check if an effect should be applied as a one-time bonus rather than a persistent effect
 */
function shouldApplyAsOneTimeBonus(metric: GameMetric, type: EffectType): boolean {
  // One-time bonuses: Add effects on spendable resources
  if (type === EffectType.Add) {
    return [
      GameMetric.Cash,
      GameMetric.MyTime,
      GameMetric.LeveragedTime,
      GameMetric.Exp,
      GameMetric.GenerateLeads,
    ].includes(metric);
  }

  // All other effects (Percent, Multiply, Set) are persistent modifiers
  return false;
}

/**
 * Apply effects from a level reward
 * Some effects are granted immediately (one-time bonuses), others are persistent modifiers
 */
export function applyLevelRewardEffects(
  levelReward: LevelReward,
  store: GameStore,
  gameTime: number,
): void {
  const sourceId = `level-${levelReward.level}`;
  const sourceName = levelReward.title;

  levelReward.effects.forEach((effect: UpgradeEffect, index: number) => {
    // Check if this should be a one-time bonus
    if (shouldApplyAsOneTimeBonus(effect.metric as GameMetric, effect.type as EffectType)) {
      // Apply as one-time bonus
      switch (effect.metric) {
        case GameMetric.Cash: {
          const { recordEventRevenue } = store;
          if (recordEventRevenue) {
            const sourceInfo = {
              type: SourceType.Event,
              id: sourceId,
              name: sourceName,
            };
            recordEventRevenue(effect.value, sourceInfo, `Level ${levelReward.level} reward: ${levelReward.title}`);
          }
          break;
        }

        case GameMetric.MyTime: {
          const { applyTimeChange } = store;
          if (applyTimeChange) {
            applyTimeChange(effect.value);
          }
          break;
        }

        case GameMetric.LeveragedTime: {
          // For leveraged time, we need to update the metrics directly
          const { updateMetrics } = store;
          if (updateMetrics) {
            updateMetrics({
              leveragedTime: store.metrics.leveragedTime + effect.value,
            });
          }
          break;
        }

        case GameMetric.Exp: {
          const { applyExpChange } = store;
          if (applyExpChange) {
            applyExpChange(effect.value);
          }
          break;
        }

        case GameMetric.GenerateLeads: {
          // Generate the specified number of leads immediately
          const { spawnLead, updateLeads, leads } = store;
          if (spawnLead && updateLeads) {
            const leadsToAdd: Lead[] = [];
            const count = Math.max(1, Math.floor(effect.value)); // Ensure at least 1 lead

            for (let i = 0; i < count; i++) {
              const lead = spawnLead();
              leadsToAdd.push(lead);
            }

            // Add all leads at once
            updateLeads([...leads, ...leadsToAdd]);

            console.log(`[LevelRewards] Generated ${count} leads for level ${levelReward.level} reward`);
          }
          break;
        }
      }

      return; // Don't apply through effectManager for one-time bonuses
    }

    // For persistent effects, apply through effectManager as before
    const effectId = `${sourceId}-effect-${index}`;

    effectManager.add(
      {
        id: effectId,
        source: {
          category: 'level',
          id: sourceId,
          name: sourceName,
        },
        metric: effect.metric as GameMetric,
        type: effect.type as EffectType,
        value: effect.value,
        priority: 0, // Level rewards use default priority (effects are applied by type order)
        durationMonths: null, // Level rewards are permanent
        createdAt: gameTime,
      },
      gameTime,
    );
  });
}

/**
 * Set flags from level reward unlocks
 */
export function applyLevelRewardFlags(
  levelReward: LevelReward,
  store: GameStore,
): void {
  levelReward.unlocksFlags.forEach((flagId: string) => {
    if (store.setFlag) {
      store.setFlag(flagId, true);
    }
  });
}

/**
 * Check for level changes and apply level rewards
 * Returns the level reward info if a level-up occurred, null otherwise
 */
export async function checkAndApplyLevelUp(
  currentExp: number,
  previousExp: number,
  industryId: IndustryId,
  store: GameStore,
  gameTime: number,
): Promise<LevelReward | null> {
  const expPerLevel = getExpPerLevel(industryId);
  const currentLevel = getLevel(currentExp, expPerLevel);
  const previousLevel = getLevel(previousExp, expPerLevel);

  // No level change
  if (currentLevel <= previousLevel) {
    return null;
  }

  // Level increased - apply rewards for all levels between previousLevel + 1 and currentLevel
  // (in case EXP jumped multiple levels at once)
  let lastReward: LevelReward | null = null;

  for (let level = previousLevel + 1; level <= currentLevel; level++) {
    // Load level reward from database
    const levelReward = await fetchLevelReward(industryId, level);
    
    if (!levelReward) {
      console.warn(`[LevelRewards] No reward found for level ${level} in industry ${industryId}`);
      continue;
    }

    // Apply effects
    applyLevelRewardEffects(levelReward, store, gameTime);

    // Set flags
    applyLevelRewardFlags(levelReward, store);

    // Track the last reward (for UI display)
    lastReward = levelReward;
  }

  return lastReward;
}

/**
 * Get level reward info for a specific level (for UI display)
 */
export async function getLevelRewardInfo(
  industryId: IndustryId,
  level: number,
): Promise<LevelReward | null> {
  return await fetchLevelReward(industryId, level);
}

/**
 * Get all level rewards for an industry (for admin UI)
 */
export async function getAllLevelRewards(
  industryId: IndustryId,
): Promise<LevelReward[]> {
  return await loadLevelRewardsForIndustry(industryId);
}
