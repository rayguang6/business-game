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
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';

const findUpgradeDefinition = (industryId: IndustryId, upgradeId: UpgradeId): UpgradeDefinition | undefined => {
  return getUpgradesForIndustry(industryId).find((upgrade) => upgrade.id === upgradeId);
};

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
export function addUpgradeEffects(upgrade: UpgradeDefinition, level: number): void {
  upgrade.effects.forEach((effect, index) => {
    effectManager.add({
      id: `upgrade_${upgrade.id}_${index}`,
      source: {
        category: 'upgrade',
        id: upgrade.id,
        name: upgrade.name,
      },
      metric: effect.metric,
      type: effect.type,
      value: effect.value * level, // Multiply by level
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

    const store = get() as GameState & UpgradesSlice;
    const currentLevel = store.getUpgradeLevel(upgradeId);

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
      ...store.upgrades,
      [upgradeId]: currentLevel + 1,
    };

    // Calculate expense delta by temporarily adding the new upgrade effect
    const baseExpenses = getMonthlyBaseExpenses(industryId);
    const currentExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);

    // Temporarily add the new upgrade effect to calculate new expenses
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
    addUpgradeEffects(upgrade, newLevel);

    // Set flag if upgrade sets one
    if (upgrade.setsFlag) {
      get().setFlag(upgrade.setsFlag, true);
      console.log(`[Flag System] Flag "${upgrade.setsFlag}" set to true by purchasing upgrade "${upgrade.name}"`);
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
