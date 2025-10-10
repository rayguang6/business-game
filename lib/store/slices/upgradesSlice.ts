import { StateCreator } from 'zustand';
import { GameState, Upgrades } from '../types';
import { UpgradeDefinition, UpgradeId, getAllUpgrades, getUpgradeById } from '@/lib/game/config';
import { calculateUpgradeWeeklyExpenses, getWeeklyBaseExpenses } from '@/lib/features/economy';
import { getUpgradeLevel, canUpgradeMore } from '@/lib/features/upgrades';

const BASE_WEEKLY_EXPENSES = getWeeklyBaseExpenses();

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

export const createUpgradesSlice: StateCreator<GameState, [], [], UpgradesSlice> = (set, get) => ({
  upgrades: {},

  canAffordUpgrade: (cost: number) => {
    const { metrics } = get();
    return metrics.cash >= cost;
  },

  getUpgradeLevel: (upgradeId: UpgradeId) => {
    return getUpgradeLevel(get().upgrades, upgradeId);
  },

  canUpgradeMore: (upgradeId: UpgradeId) => {
    return canUpgradeMore(get().upgrades, upgradeId);
  },

  getUpgradeDefinition: (upgradeId: UpgradeId) => {
    return getUpgradeById(upgradeId) ?? null;
  },

  getAvailableUpgrades: () => getAllUpgrades(),

  purchaseUpgrade: (upgradeId: UpgradeId) => {
    const upgrade = getUpgradeById(upgradeId);

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

    const previousUpgradeExpenses = calculateUpgradeWeeklyExpenses(store.upgrades);
    const nextUpgrades: Upgrades = {
      ...store.upgrades,
      [upgradeId]: currentLevel + 1,
    };
    const newUpgradeExpenses = calculateUpgradeWeeklyExpenses(nextUpgrades);
    const weeklyExpenseDelta = newUpgradeExpenses - previousUpgradeExpenses;

    const newLevel = currentLevel + 1;
    const upgradeLabel = upgrade.maxLevel > 1 
      ? `${upgrade.name} (Lvl ${newLevel})`
      : upgrade.name;

    set((state) => {
      // Add upgrade purchase as a one-time cost (this will be tracked in weekly history)
      const addOneTimeCost = (state as any).addOneTimeCost;
      if (addOneTimeCost) {
        addOneTimeCost({
          label: upgradeLabel,
          amount: upgrade.cost,
          category: 'upgrade' as const,
        });
      }

      return {
        upgrades: nextUpgrades,
        metrics: {
          ...state.metrics,
          totalExpenses: state.metrics.totalExpenses + Math.max(0, weeklyExpenseDelta),
        },
        weeklyExpenses: BASE_WEEKLY_EXPENSES + newUpgradeExpenses,
        weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + Math.max(0, weeklyExpenseDelta),
      };
    });

    // Deduct cash after the upgrade is processed (this will trigger game over check)
    const applyCashChange = (get() as any).applyCashChange;
    if (applyCashChange) {
      applyCashChange(-upgrade.cost);
    }

    const levelText = upgrade.maxLevel > 1 ? ` Level ${newLevel}` : '';
    return { success: true, message: `${upgrade.name}${levelText} unlocked! Cost: $${upgrade.cost}` };
  },

  resetUpgrades: () => {
    set({
      upgrades: {},
      weeklyExpenses: BASE_WEEKLY_EXPENSES,
      weeklyExpenseAdjustments: 0,
    });
  },
});
