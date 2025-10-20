import { StateCreator } from 'zustand';
import { GameState, Upgrades, OneTimeCostCategory } from '../types';
import {
  DEFAULT_INDUSTRY_ID,
  UpgradeDefinition,
  UpgradeId,
  getAllUpgrades,
  getUpgradeById,
} from '@/lib/game/config';
import { calculateUpgradeWeeklyExpenses, getWeeklyBaseExpenses } from '@/lib/features/economy';
import { getUpgradeLevel, canUpgradeMore } from '@/lib/features/upgrades';
import { GameStore } from '../gameStore';
import type { IndustryId } from '@/lib/game/types';

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

    const previousUpgradeExpenses = calculateUpgradeWeeklyExpenses(store.upgrades, industryId);
    const nextUpgrades: Upgrades = {
      ...store.upgrades,
      [upgradeId]: currentLevel + 1,
    };
    const newUpgradeExpenses = calculateUpgradeWeeklyExpenses(nextUpgrades, industryId);
    const weeklyExpenseDelta = newUpgradeExpenses - previousUpgradeExpenses;

    const newLevel = currentLevel + 1;
    const upgradeLabel = upgrade.maxLevel > 1 
      ? `${upgrade.name} (Lvl ${newLevel})`
      : upgrade.name;

    set((state) => {
      // Add upgrade purchase as a one-time cost (this will be tracked in weekly history)
      const { addOneTimeCost } = state;
      if (addOneTimeCost) {
        addOneTimeCost({
          label: upgradeLabel,
          amount: upgrade.cost,
          category: OneTimeCostCategory.Upgrade,
        });
      }

      return {
        upgrades: nextUpgrades,
        metrics: {
          ...state.metrics,
          totalExpenses: state.metrics.totalExpenses + Math.max(0, weeklyExpenseDelta),
        },
        weeklyExpenses:
          getWeeklyBaseExpenses(industryId) + newUpgradeExpenses,
        weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + Math.max(0, weeklyExpenseDelta),
      };
    });

    // Deduct cash after the upgrade is processed (this will trigger game over check)
    const { applyCashChange } = get();
    if (applyCashChange) {
      applyCashChange(-upgrade.cost);
    }

    const levelText = upgrade.maxLevel > 1 ? ` Level ${newLevel}` : '';
    return { success: true, message: `${upgrade.name}${levelText} unlocked! Cost: $${upgrade.cost}` };
  },

  resetUpgrades: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    set({
      upgrades: {},
      weeklyExpenses: getWeeklyBaseExpenses(industryId),
      weeklyExpenseAdjustments: 0,
    });
  },
});
