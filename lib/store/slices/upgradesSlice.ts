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
import type { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';

const findUpgradeDefinition = (industryId: IndustryId, upgradeId: UpgradeId): UpgradeDefinition | undefined => {
  return getUpgradesForIndustry(industryId).find((upgrade) => upgrade.id === upgradeId);
};

// Direct state metrics that are stored in game state and modified directly
// These bypass effectManager for Add effects to enable immediate updates and PnL tracking
const DIRECT_STATE_METRICS = [
  GameMetric.Cash,
  GameMetric.Time,
  GameMetric.SkillLevel,
  GameMetric.FreedomScore,
] as const;

/**
 * Check if a metric is a direct state metric
 */
function isDirectStateMetric(metric: GameMetric): boolean {
  return DIRECT_STATE_METRICS.includes(metric as any);
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
  canAffordUpgrade: (cost: number, timeCost?: number) => boolean;
  getUpgradeLevel: (upgradeId: UpgradeId) => number;
  canUpgradeMore: (upgradeId: UpgradeId) => boolean;
  getUpgradeDefinition: (upgradeId: UpgradeId) => UpgradeDefinition | null;
  getAvailableUpgrades: () => UpgradeDefinition[];
  purchaseUpgrade: (upgradeId: UpgradeId) => { success: boolean; message: string };
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
  applySkillLevelChange?: (amount: number) => void;
  applyFreedomScoreChange?: (amount: number) => void;
  recordEventRevenue?: (amount: number, label?: string) => void;
  recordEventExpense?: (amount: number, label: string) => void;
  previousLevel?: number; // Previous level for calculating delta (0 if first purchase)
}

/**
 * Register upgrade effects with effectManager
 * For direct state metrics (Cash, Time, SkillLevel, FreedomScore) with Add effects:
 *   - Applied directly to game state for immediate updates
 *   - Delta calculation prevents stacking when leveling up
 * For other metrics or effect types:
 *   - Applied via effectManager (calculated on-demand)
 * 
 * @param upgrade - The upgrade definition
 * @param level - The level of the upgrade (effects are multiplied by level)
 * @param store - Optional store functions for direct state metric updates
 */
export function addUpgradeEffects(upgrade: UpgradeDefinition, level: number, store?: UpgradeEffectStore): void {
  upgrade.effects.forEach((effect, index) => {
    const effectValue = effect.value * level;
    
    // Direct state metrics with Add effects: apply directly to state
    // This enables immediate updates for game over checks and PnL tracking
    if (isDirectStateMetric(effect.metric) && effect.type === EffectType.Add && store) {
      // Calculate delta to prevent stacking when leveling up
      const previousLevel = store.previousLevel ?? 0;
      const delta = calculateDirectStateDelta(effect.value, level, previousLevel);
      
      // Only apply if there's a change
      if (delta !== 0) {
        switch (effect.metric) {
          case GameMetric.Cash:
            if (store.recordEventRevenue && store.recordEventExpense) {
              if (delta >= 0) {
                store.recordEventRevenue(delta, `Upgrade: ${upgrade.name}`);
              } else {
                store.recordEventExpense(Math.abs(delta), `Upgrade: ${upgrade.name}`);
              }
            } else if (store.applyCashChange) {
              store.applyCashChange(delta);
            }
            break;
          case GameMetric.Time:
            if (store.applyTimeChange) {
              store.applyTimeChange(delta);
            }
            break;
          case GameMetric.SkillLevel:
            if (store.applySkillLevelChange) {
              store.applySkillLevelChange(delta);
            }
            break;
          case GameMetric.FreedomScore:
            if (store.applyFreedomScoreChange) {
              store.applyFreedomScoreChange(delta);
            }
            break;
        }
      }
      // Direct state metrics bypass effectManager for Add effects
      // (they're permanent one-time changes, not calculated metrics)
      return;
    }
    
    // Calculated metrics: add to effectManager for on-demand calculation
    effectManager.add({
      id: `upgrade_${upgrade.id}_${index}`,
      source: {
        category: 'upgrade',
        id: upgrade.id,
        name: upgrade.name,
      },
      metric: effect.metric,
      type: effect.type,
      value: effectValue, // Multiply by level
    });
  });
}

/**
 * Remove all effects for a specific upgrade
 */
function removeUpgradeEffects(upgradeId: string): void {
  effectManager.removeBySource('upgrade', upgradeId);
}

export const createUpgradesSlice: StateCreator<GameStore, [], [], UpgradesSlice> = (set, get) => ({
  upgrades: {},

  canAffordUpgrade: (cost: number, timeCost?: number) => {
    const { metrics } = get();
    // Check both cash and time if both are required
    const hasCash = cost === 0 || metrics.cash >= cost;
    const hasTime = timeCost === undefined || timeCost === 0 || metrics.time >= timeCost;
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

    // Check affordability for both cash and time costs
    const needsCash = upgrade.cost > 0;
    const needsTime = upgrade.timeCost !== undefined && upgrade.timeCost > 0;
    const { metrics } = get();
    
    if (needsCash && metrics.cash < upgrade.cost) {
      return { success: false, message: `Need $${upgrade.cost} to purchase ${upgrade.name}.` };
    }
    
    if (needsTime && metrics.time < upgrade.timeCost!) {
      return { success: false, message: `Need ${upgrade.timeCost}h to purchase ${upgrade.name}.` };
    }
    
    // If both are needed, check both
    if (needsCash && needsTime && (metrics.cash < upgrade.cost || metrics.time < upgrade.timeCost!)) {
      return { success: false, message: `Need $${upgrade.cost} and ${upgrade.timeCost}h to purchase ${upgrade.name}.` };
    }

    // Check requirements
    if (upgrade.requirements && upgrade.requirements.length > 0) {
      const requirementsMet = checkRequirements(upgrade.requirements, get() as GameStore);
      if (!requirementsMet) {
        return { success: false, message: `Requirements not met to purchase ${upgrade.name}.` };
      }
    }

    // Define next upgrades state
    const nextUpgrades: Upgrades = {
      ...currentStore.upgrades,
      [upgradeId]: currentLevel + 1,
    };

    // Calculate expense delta by temporarily adding the new upgrade effect
    const baseExpenses = getMonthlyBaseExpenses(industryId);
    const currentExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);

    // Temporarily add the new upgrade effect to calculate new expenses
    // Note: We don't pass store here because we're only calculating expenses, not applying direct state changes
    addUpgradeEffects(upgrade, currentLevel + 1);
    const newExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);
    removeUpgradeEffects(upgradeId); // Remove the temporary effect

    const monthlyExpenseDelta = newExpenses - currentExpenses;

    const newLevel = currentLevel + 1;
    const upgradeLabel = upgrade.maxLevel > 1 
      ? `${upgrade.name} (Lvl ${newLevel})`
      : upgrade.name;

    // Deduct both cash and time if both are required
    if (needsCash) {
      const { addOneTimeCost } = get();
      if (addOneTimeCost) {
        addOneTimeCost(
          {
            label: upgradeLabel,
            amount: upgrade.cost,
            category: OneTimeCostCategory.Upgrade,
          },
          { deductNow: true },
        );
      }
    }
    
    if (needsTime) {
      set((state) => ({
        metrics: {
          ...state.metrics,
          time: state.metrics.time - upgrade.timeCost!,
        },
      }));
    }

    set((state) => {
      return {
        upgrades: nextUpgrades,
        metrics: {
          ...state.metrics,
          totalExpenses: state.metrics.totalExpenses + Math.max(0, monthlyExpenseDelta),
        },
        monthlyExpenses: effectManager.calculate(GameMetric.MonthlyExpenses, getMonthlyBaseExpenses(industryId)),
        monthlyExpenseAdjustments: state.monthlyExpenseAdjustments + Math.max(0, monthlyExpenseDelta),
      };
    });

    // Register upgrade effects with effectManager
    // Remove old effects first (if upgrading from previous level)
    removeUpgradeEffects(upgradeId);
    // Add new effects with multiplied values based on new level
    // Pass previousLevel to calculate delta for direct state metrics (prevents stacking)
    const store = get() as GameStore;
    addUpgradeEffects(upgrade, newLevel, {
      applyCashChange: store.applyCashChange,
      applyTimeChange: store.applyTimeChange,
      applySkillLevelChange: store.applySkillLevelChange,
      applyFreedomScoreChange: store.applyFreedomScoreChange,
      recordEventRevenue: store.recordEventRevenue,
      recordEventExpense: store.recordEventExpense,
      previousLevel: currentLevel, // Pass previous level to calculate delta
    });

    // Set flag if upgrade sets one
    if (upgrade.setsFlag) {
      get().setFlag(upgrade.setsFlag, true);
      // console.log(`[Flag System] Flag "${upgrade.setsFlag}" set to true by purchasing upgrade "${upgrade.name}"`);
    }

    const levelText = upgrade.maxLevel > 1 ? ` (Level ${newLevel})` : '';
    const costParts: string[] = [];
    if (needsCash) costParts.push(`$${upgrade.cost}`);
    if (needsTime) costParts.push(`${upgrade.timeCost}h`);
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
      monthlyExpenses: getMonthlyBaseExpenses(industryId),
      monthlyExpenseAdjustments: 0,
    });
  },
});
