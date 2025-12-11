import { StateCreator } from 'zustand';
import { GameState, Upgrades, OneTimeCostCategory } from '../types';
import {
  DEFAULT_INDUSTRY_ID,
  UpgradeDefinition,
  UpgradeId,
  getUpgradesForIndustry,
} from '@/lib/game/config';
import { calculateUpgradeMonthlyExpenses, getMonthlyBaseExpenses } from '@/lib/features/economy';
import { getUpgradeLevel, canUpgradeMore } from '@/lib/features/upgrades';
import { GameStore } from '../gameStore';
import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import { getAvailability } from '@/lib/game/requirementChecker';
import { SourceType, SourceInfo } from '@/lib/config/sourceTypes';
import { SourceHelpers } from '@/lib/utils/financialTracking';
import { updateLeveragedTimeCapacity } from '@/lib/utils/metricUpdates';
import { IndustryId } from '@/lib/game/types';

const findUpgradeDefinition = (industryId: IndustryId, upgradeId: UpgradeId): UpgradeDefinition | undefined => {
  return getUpgradesForIndustry(industryId).find((upgrade) => upgrade.id === upgradeId);
};

// Direct state metrics that are stored in game state and modified directly
// These bypass effectManager for Add effects to enable immediate updates and PnL tracking
const DIRECT_STATE_METRICS = [
  GameMetric.Cash,
  GameMetric.MyTime,
  GameMetric.Exp,
] as const;

/**
 * Check if a metric is a direct state metric
 */
function isDirectStateMetric(metric: GameMetric): boolean {
  return (DIRECT_STATE_METRICS as readonly GameMetric[]).includes(metric);
}

/**
 * Calculate the delta value for direct state metrics when leveling up upgrades
 * @param effectValue - The effect value per level
 * @param level - Current level
 * @param previousLevel - Previous level (0 if first purchase)
 * @returns The delta to apply (difference between new and old effect)
 */
function calculateDirectStateDelta(effectValue: number, level: number, previousLevel: number = 0): number {
  return effectValue * level - effectValue * previousLevel;
}

export interface UpgradesSlice {
  upgrades: Upgrades;
  upgradesActivatedThisMonth: Set<string>; // upgradeIds that were purchased this month
  canAffordUpgrade: (cost: number, timeCost?: number) => boolean;
  getUpgradeLevel: (upgradeId: UpgradeId) => number;
  canUpgradeMore: (upgradeId: UpgradeId) => boolean;
  getUpgradeDefinition: (upgradeId: UpgradeId) => UpgradeDefinition | null;
  getAvailableUpgrades: () => UpgradeDefinition[];
  purchaseUpgrade: (upgradeId: UpgradeId) => { success: boolean; message: string };
  wasUpgradeActivatedThisMonth: (upgradeId: string) => boolean;
  resetMonthlyUpgradeTracking: () => void;
  resetUpgrades: () => void;
}

/**
 * Register upgrade effects with effectManager
 * @param upgrade - The upgrade definition
 * @param level - The level of the upgrade (effects are multiplied by level)
 */
export interface UpgradeEffectStore {
  applyCashChange?: (amount: number) => void;
  applyTimeChange?: (amount: number) => void;
  applyExpChange?: (amount: number) => void;
  recordEventRevenue?: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => void;
  recordEventExpense?: (amount: number, labelOrSource: string | SourceInfo, label?: string) => void;
  previousLevel?: number; // Previous level for calculating delta (0 if first purchase)
}

/**
 * Register upgrade effects with effectManager
 * For direct state metrics (Cash, Time, Exp) with Add effects:
 *   - Applied directly to game state for immediate updates
 *   - Purely additive - each level adds its effect value directly (only the NEW level)
 * For other metrics or effect types:
 *   - Applied via effectManager (calculated on-demand)
 *   - Effects accumulate - all levels from 1 to target level are active
 * 
 * @param upgrade - The upgrade definition
 * @param level - The level of the upgrade (1-indexed)
 * @param store - Optional store functions for direct state metric updates
 */
export function addUpgradeEffects(upgrade: UpgradeDefinition, level: number, store?: UpgradeEffectStore): void {
  // Get level config by level number (more robust than array index)
  // level is 1-indexed (1 = level 1, 2 = level 2, etc.)
  const levelConfig = upgrade.levels.find(l => l.level === level);
  
  // Fallback to array index if level property doesn't match (for backward compatibility)
  const levelConfigByIndex = upgrade.levels[level - 1];
  
  // Use levelConfig if found by level property, otherwise fall back to index-based access
  const finalLevelConfig = levelConfig || levelConfigByIndex;
  
  if (!finalLevelConfig) {
    console.warn(`[UpgradeEffects] Level ${level} not found for upgrade ${upgrade.id}`);
    return;
  }
  
  // Warn if there's a mismatch between level property and expected level number
  if (finalLevelConfig.level !== level) {
    console.warn(`[UpgradeEffects] Level mismatch for ${upgrade.id}: Expected level ${level} but found level ${finalLevelConfig.level} at index ${level - 1}. This may indicate a data issue.`);
  }
  
  // Get level-specific name for labels
  const levelName = finalLevelConfig.name;
  const sourceName = `${upgrade.name} - ${levelName}`;
  
  finalLevelConfig.effects.forEach((effect, index) => {
    // Use effect value directly (no multiplication) - each level has its own effects
    const effectValue = effect.value;
    
    // Direct state metrics with Add effects: apply directly to state
    // Only apply the NEW level's effects (don't re-apply previous levels)
    if (isDirectStateMetric(effect.metric) && effect.type === EffectType.Add && store) {
      switch (effect.metric) {
        case GameMetric.Cash:
          if (store.recordEventRevenue && store.recordEventExpense) {
            const sourceInfo: SourceInfo = SourceHelpers.fromUpgrade(upgrade.id, upgrade.name, level);
            const label = levelName;
            if (effectValue >= 0) {
              store.recordEventRevenue(effectValue, sourceInfo, label);
            } else {
              store.recordEventExpense(Math.abs(effectValue), sourceInfo, label);
            }
          } else if (store.applyCashChange) {
            store.applyCashChange(effectValue);
          }
          break;
        case GameMetric.MyTime:
          if (store.applyTimeChange) {
            store.applyTimeChange(effectValue);
          }
          break;
        case GameMetric.Exp:
          if (store.applyExpChange) {
            store.applyExpChange(effectValue);
          }
          break;
      }
      // Direct state metrics bypass effectManager for Add effects
      // (they're permanent one-time changes, not calculated metrics)
      return;
    }
    
    // Calculated metrics: add to effectManager for on-demand calculation
    effectManager.add({
      id: `upgrade_${upgrade.id}_${level}_${index}`,
      source: {
        category: 'upgrade',
        id: upgrade.id,
        name: sourceName,
      },
      metric: effect.metric,
      type: effect.type,
      value: effectValue,
    });
  });
}

/**
 * Add effects for all levels from 1 to targetLevel (inclusive)
 * This ensures that all previous level effects are kept when upgrading
 * 
 * @param upgrade - The upgrade definition
 * @param targetLevel - The target level (1-indexed, effects will be added for levels 1 through targetLevel)
 * @param store - Optional store functions for direct state metric updates
 */
export function addUpgradeEffectsUpToLevel(upgrade: UpgradeDefinition, targetLevel: number, store?: UpgradeEffectStore): void {
  // For direct state metrics, only apply the NEW level (don't re-apply previous levels)
  // For calculated metrics, apply all levels from 1 to targetLevel
  
  // First, add all calculated metrics for all levels (they accumulate)
  for (let level = 1; level <= targetLevel; level++) {
    const levelConfig = upgrade.levels.find(l => l.level === level) || upgrade.levels[level - 1];
    if (!levelConfig) {
      console.warn(`[UpgradeEffects] Level ${level} not found for upgrade ${upgrade.id}`);
      continue;
    }
    
    const levelName = levelConfig.name;
    const sourceName = `${upgrade.name} - ${levelName}`;
    
    levelConfig.effects.forEach((effect, index) => {
      // Skip direct state metrics - we'll handle those separately for only the new level
      if (isDirectStateMetric(effect.metric) && effect.type === EffectType.Add) {
        return;
      }
      
      // Add calculated metrics to effectManager (all levels accumulate)
      effectManager.add({
        id: `upgrade_${upgrade.id}_${level}_${index}`,
        source: {
          category: 'upgrade',
          id: upgrade.id,
          name: sourceName,
        },
        metric: effect.metric,
        type: effect.type,
        value: effect.value,
      });
    });
  }
  
  // Then, add direct state metrics only for the NEW level (targetLevel)
  // Previous levels' direct state effects were already applied when those levels were purchased
  if (store && targetLevel > 0) {
    const levelConfig = upgrade.levels.find(l => l.level === targetLevel) || upgrade.levels[targetLevel - 1];
    if (levelConfig) {
      const levelName = levelConfig.name;
      const sourceName = `${upgrade.name} - ${levelName}`;
      
      levelConfig.effects.forEach((effect) => {
        // Only handle direct state metrics with Add effects
        if (isDirectStateMetric(effect.metric) && effect.type === EffectType.Add) {
          const effectValue = effect.value;
          
          switch (effect.metric) {
            case GameMetric.Cash:
              if (store.recordEventRevenue && store.recordEventExpense) {
                const sourceInfo: SourceInfo = SourceHelpers.fromUpgrade(upgrade.id, upgrade.name, targetLevel);
                const label = levelName;
                if (effectValue >= 0) {
                  store.recordEventRevenue(effectValue, sourceInfo, label);
                } else {
                  store.recordEventExpense(Math.abs(effectValue), sourceInfo, label);
                }
              } else if (store.applyCashChange) {
                store.applyCashChange(effectValue);
              }
              break;
            case GameMetric.MyTime:
              if (store.applyTimeChange) {
                store.applyTimeChange(effectValue);
              }
              break;
            case GameMetric.Exp:
              if (store.applyExpChange) {
                store.applyExpChange(effectValue);
              }
              break;
          }
        }
      });
    }
  }
}

/**
 * Remove all effects for a specific upgrade
 */
function removeUpgradeEffects(upgradeId: string): void {
  effectManager.removeBySource('upgrade', upgradeId);
}

export const createUpgradesSlice: StateCreator<GameStore, [], [], UpgradesSlice> = (set, get) => ({
  upgrades: {},
  upgradesActivatedThisMonth: new Set<string>(),

  wasUpgradeActivatedThisMonth: (upgradeId: string) => {
    return get().upgradesActivatedThisMonth.has(upgradeId);
  },

  resetMonthlyUpgradeTracking: () => {
    set((state) => ({
      upgradesActivatedThisMonth: new Set<string>(),
    }));
  },

  canAffordUpgrade: (cost: number, timeCost?: number) => {
    const { metrics } = get();
    // Check both cash and time if both are required
    const hasCash = cost === 0 || metrics.cash >= cost;
    // Upgrades now only use myTime, not leveraged time
    const hasTime = timeCost === undefined || timeCost === 0 || metrics.myTime >= timeCost;
    return hasCash && hasTime;
  },

  getUpgradeLevel: (upgradeId: UpgradeId) => {
    return getUpgradeLevel(get().upgrades, upgradeId);
  },

  canUpgradeMore: (upgradeId: UpgradeId) => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    return canUpgradeMore(get().upgrades, upgradeId, industryId);
  },

  getUpgradeDefinition: (upgradeId: UpgradeId) => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    return findUpgradeDefinition(industryId, upgradeId) ?? null;
  },

  getAvailableUpgrades: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    return getUpgradesForIndustry(industryId);
  },

  purchaseUpgrade: (upgradeId: UpgradeId) => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const upgrade = findUpgradeDefinition(industryId, upgradeId);

    if (!upgrade) {
      return { success: false, message: 'Upgrade not found.' };
    }

    const currentStore = get() as GameState & UpgradesSlice;
    const currentLevel = currentStore.getUpgradeLevel(upgradeId);

    if (currentLevel >= upgrade.maxLevel) {
      return { success: false, message: `${upgrade.name} is already at max level.` };
    }

    // Get next level config
    // currentLevel is 1-indexed (0 = not purchased, 1 = level 1 purchased, 2 = level 2 purchased, etc.)
    // The next level number is (currentLevel + 1)
    // Find the level config by level number (more robust than array index)
    const nextLevelNumber = currentLevel + 1;
    const levelConfig = upgrade.levels.find(level => level.level === nextLevelNumber);
    
    // Fallback to array index if level property doesn't match (for backward compatibility)
    const levelConfigByIndex = upgrade.levels[currentLevel];
    
    // Use levelConfig if found by level property, otherwise fall back to index-based access
    // But log a warning if there's a mismatch
    const finalLevelConfig = levelConfig || levelConfigByIndex;
    
    if (!finalLevelConfig) {
      return { success: false, message: `Level ${nextLevelNumber} not found for ${upgrade.name}.` };
    }
    
    // Warn if there's a mismatch between level property and expected level number
    if (finalLevelConfig.level !== nextLevelNumber) {
      console.warn(`[UpgradePurchase] Level mismatch for ${upgrade.id}: Expected level ${nextLevelNumber} but found level ${finalLevelConfig.level} at index ${currentLevel}. This may indicate a data issue.`);
    }
    
    // Get cost and timeCost from level config
    const upgradeCost = finalLevelConfig.cost;
    const upgradeTimeCost = finalLevelConfig.timeCost;
    
    // Check affordability for both cash and time costs
    const needsCash = upgradeCost > 0;
    const needsTime = upgradeTimeCost !== undefined && upgradeTimeCost > 0;
    const { metrics } = get();
    
    if (needsCash && metrics.cash < upgradeCost) {
      return { success: false, message: `Need $${upgradeCost} to purchase ${upgrade.name}.` };
    }
    
    // Check myTime availability (upgrades only use personal time, not leveraged time)
    if (needsTime && metrics.myTime < upgradeTimeCost!) {
      return { success: false, message: `Need ${upgradeTimeCost}h personal time to purchase ${upgrade.name}.` };
    }

    // If both are needed, check both
    if (needsCash && needsTime && (metrics.cash < upgradeCost || metrics.myTime < upgradeTimeCost!)) {
      return { success: false, message: `Need $${upgradeCost} and ${upgradeTimeCost}h personal time to purchase ${upgrade.name}.` };
    }

    // Check requirements
    if (upgrade.requirements && upgrade.requirements.length > 0) {
      const availability = getAvailability(upgrade.requirements, get() as GameStore);
      if (availability === 'hidden') {
        return { success: false, message: `${upgrade.name} is not available due to requirements.` };
      }
      if (availability === 'locked') {
        return { success: false, message: `Requirements not met to purchase ${upgrade.name}.` };
      }
    }

    // Define next upgrades state
    const nextUpgrades: Upgrades = {
      ...currentStore.upgrades,
      [upgradeId]: currentLevel + 1,
    };

    const newLevel = currentLevel + 1;
    
    // Calculate expense delta by temporarily adding all levels' effects up to newLevel
    const baseExpenses = getMonthlyBaseExpenses(industryId);
    const currentExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);

    // Temporarily remove current effects, then add all effects from levels 1 to newLevel to calculate new expenses
    // Note: We don't pass store here because we're only calculating expenses, not applying direct state changes
    // We need to add all levels because effects accumulate
    removeUpgradeEffects(upgradeId); // Remove current effects first to avoid double-counting
    for (let level = 1; level <= newLevel; level++) {
      addUpgradeEffects(upgrade, level);
    }
    const newExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);
    removeUpgradeEffects(upgradeId); // Remove the temporary effects (restores original state)

    const monthlyExpenseDelta = newExpenses - currentExpenses;
    // Get level-specific name
    const levelName = finalLevelConfig.name;
    const upgradeLabel = levelName;

    // Deduct both cash and time if both are required
    if (needsCash) {
      const { addOneTimeCost } = get();
      if (addOneTimeCost) {
        const sourceInfo = SourceHelpers.fromUpgrade(upgrade.id, upgrade.name, newLevel);
        addOneTimeCost(
          {
            label: upgradeLabel,
            amount: upgradeCost,
            category: OneTimeCostCategory.Upgrade,
            sourceId: sourceInfo.id,
            sourceType: sourceInfo.type,
            sourceName: sourceInfo.name,
          },
          { deductNow: true },
        );
      }
    }
    
    if (needsTime) {
      const { recordMyTimeSpent } = get();
      if (recordMyTimeSpent) {
        const sourceInfo = SourceHelpers.fromUpgrade(upgrade.id, upgrade.name, newLevel);
        recordMyTimeSpent(-upgradeTimeCost!, sourceInfo, upgradeLabel);
      }
    }

    set((state) => {
      return {
        upgrades: nextUpgrades,
        // Don't update totalExpenses here - expenses are only added at month end
        monthlyExpenses: effectManager.calculate(GameMetric.MonthlyExpenses, getMonthlyBaseExpenses(industryId)),
      };
    });

    // Register upgrade effects with effectManager
    // Remove old effects first (effectManager handles replacement for calculated metrics)
    removeUpgradeEffects(upgradeId);
    
    // Add effects for all levels from 1 to newLevel (effects accumulate)
    const store = get() as GameStore;
    addUpgradeEffectsUpToLevel(upgrade, newLevel, {
      applyCashChange: store.applyCashChange,
      applyTimeChange: store.applyTimeChange,
      applyExpChange: store.applyExpChange,
      recordEventRevenue: store.recordEventRevenue,
      recordEventExpense: store.recordEventExpense,
    });

    // Immediately update leveraged time capacity from effects (don't wait for month transition)
    updateLeveragedTimeCapacity(store.metrics, set);

    // Set flag if upgrade sets one
    if (upgrade.setsFlag) {
      get().setFlag(upgrade.setsFlag, true);
    }

    // Mark upgrade as activated this month
    set((state) => ({
      upgradesActivatedThisMonth: new Set([...state.upgradesActivatedThisMonth]).add(upgradeId),
    }));

    // Add action notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storeForNotification = get() as any; // Cast to any to access addNotification
    if (storeForNotification.addNotification) {
      storeForNotification.addNotification({
        type: 'upgrade',
        title: upgrade.name,
        description: levelName,
        duration: 2500, // 2.5 seconds - faster disappearance
      });
    }

    const levelText = ` - ${levelName}`;
    const costParts: string[] = [];
    if (needsCash) costParts.push(`$${upgradeCost}`);
    if (needsTime) costParts.push(`${upgradeTimeCost}h`);
    const costText = costParts.join(' + ');
    return { success: true, message: `${upgrade.name}${levelText} unlocked! Cost: ${costText}` };
  },

  resetUpgrades: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

    // Remove all upgrade effects from effectManager
    const availableUpgrades = getUpgradesForIndustry(industryId);
    availableUpgrades.forEach(upgrade => {
      removeUpgradeEffects(upgrade.id);
    });

    set({
      upgrades: {},
      upgradesActivatedThisMonth: new Set<string>(),
      monthlyExpenses: getMonthlyBaseExpenses(industryId),
      monthlyExpenseAdjustments: 0,
    });
  },
});
