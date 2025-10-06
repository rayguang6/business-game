import { StateCreator } from 'zustand';
import { GameState } from '../types';
import { UpgradeDefinition, UpgradeId, getAllUpgrades, getUpgradeById } from '@/lib/game/config';
import { ActiveUpgradeIds } from '@/lib/features/upgrades';
import { calculateUpgradeWeeklyExpenses, getWeeklyBaseExpenses } from '@/lib/features/economy';

const BASE_WEEKLY_EXPENSES = getWeeklyBaseExpenses();
import { DEFAULT_UPGRADE_VALUES, IndustryUpgradeConfig, UpgradeDefinition, UpgradeKey, getUpgradesForIndustry } from '@/lib/game/config';

export interface UpgradesSlice {
  upgrades: ActiveUpgradeIds;
  canAffordUpgrade: (cost: number) => boolean;
  isUpgradePurchased: (upgradeId: UpgradeId) => boolean;
  getUpgradeDefinition: (upgradeId: UpgradeId) => UpgradeDefinition | null;
  getAvailableUpgrades: () => UpgradeDefinition[];
  purchaseUpgrade: (upgradeId: UpgradeId) => { success: boolean; message: string };
  resetUpgrades: () => void;
}

export const createUpgradesSlice: StateCreator<GameState, [], [], UpgradesSlice> = (set, get) => ({
  upgrades: [],

  canAffordUpgrade: (cost: number) => {
    const { metrics } = get();
    return metrics.cash >= cost;
  },

  isUpgradePurchased: (upgradeId: UpgradeId) => {
    return get().upgrades.includes(upgradeId);
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

    if (store.isUpgradePurchased(upgradeId)) {
      return { success: false, message: `${upgrade.name} is already purchased.` };
    }

    if (!store.canAffordUpgrade(upgrade.cost)) {
      return { success: false, message: `Need $${upgrade.cost} to purchase ${upgrade.name}.` };
    }

    const previousUpgradeExpenses = calculateUpgradeWeeklyExpenses(store.upgrades);
    const nextActiveUpgrades: ActiveUpgradeIds = [...store.upgrades, upgradeId];
    const newUpgradeExpenses = calculateUpgradeWeeklyExpenses(nextActiveUpgrades);
    const weeklyExpenseDelta = newUpgradeExpenses - previousUpgradeExpenses;

    set((state) => ({
      upgrades: nextActiveUpgrades,
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash - upgrade.cost,
        totalExpenses: state.metrics.totalExpenses + Math.max(0, weeklyExpenseDelta),
      },
      weeklyExpenses: BASE_WEEKLY_EXPENSES + newUpgradeExpenses,
      weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + Math.max(0, weeklyExpenseDelta),
    }));

    return { success: true, message: `${upgrade.name} unlocked! Cost: $${upgrade.cost}` };
  },

  resetUpgrades: () => {
    set({
      upgrades: [],
      weeklyExpenses: BASE_WEEKLY_EXPENSES,
      weeklyExpenseAdjustments: 0,
    });
  },
});
