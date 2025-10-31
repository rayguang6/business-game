import { StateCreator } from 'zustand';
import { GameState, Upgrades, OneTimeCostCategory } from '../types';
import {
  DEFAULT_INDUSTRY_ID,
  UpgradeDefinition,
  UpgradeId,
  getAllUpgrades,
  getUpgradeById,
} from '@/lib/game/config';
import { calculateUpgradeMonthlyExpenses, getMonthlyBaseExpenses } from '@/lib/features/economy';
import { getUpgradeLevel, canUpgradeMore } from '@/lib/features/upgrades';
import { GameStore } from '../gameStore';
import type { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

export interface UpgradesSlice {
  upgrades: Upgrades;
  canAffordUpgrade: (cost: number) => boolean;
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

  canAffordUpgrade: (cost: number) => {
    const { metrics } = get();
    return metrics.cash >= cost;
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
    return getUpgradeById(upgradeId, industryId) ?? null;
  },

  getAvailableUpgrades: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    return getAllUpgrades(industryId);
  },

  purchaseUpgrade: (upgradeId: UpgradeId) => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const upgrade = getUpgradeById(upgradeId, industryId);

    if (!upgrade) {
      return { success: false, message: 'Upgrade not found.' };
    }

    const store = get() as GameState & UpgradesSlice;
    const currentLevel = store.getUpgradeLevel(upgradeId);

    if (currentLevel >= upgrade.maxLevel) {
      return { success: false, message: `${upgrade.name} is already at max level.` };
    }

    if (!store.canAffordUpgrade(upgrade.cost)) {
      return { success: false, message: `Need $${upgrade.cost} to purchase ${upgrade.name}.` };
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

    const levelText = upgrade.maxLevel > 1 ? ` Level ${newLevel}` : '';
    return { success: true, message: `${upgrade.name}${levelText} unlocked! Cost: $${upgrade.cost}` };
  },

  resetUpgrades: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    
    // Remove all upgrade effects from effectManager
    const availableUpgrades = getAllUpgrades(industryId);
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
