import { StateCreator } from 'zustand';
import { Upgrades } from '../types';
import { GameState } from '../types';
import { getUpgradesForIndustry, DEFAULT_UPGRADE_VALUES, IndustryUpgradeConfig, UpgradeDefinition, UpgradeKey } from '@/lib/config/gameConfig';

export interface UpgradesSlice {
  upgrades: Upgrades;
  
  // Upgrade actions
  upgradeTreatmentRooms: () => { success: boolean; message: string };
  upgradeEquipment: () => { success: boolean; message: string };
  upgradeStaff: () => { success: boolean; message: string };
  upgradeMarketing: () => { success: boolean; message: string };
  
  // Helper functions
  canAffordUpgrade: (cost: number) => boolean;
  getUpgradeCost: (upgradeType: keyof Upgrades) => number;
  getUpgradeConfig: (upgradeType: keyof Upgrades) => UpgradeDefinition | null;

}

export const createUpgradesSlice: StateCreator<GameState, [], [], UpgradesSlice> = (set, get) => {
  const buildStartingUpgrades = (config: IndustryUpgradeConfig) => ({
    treatmentRooms: config.treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
    equipment: config.equipment?.starting || 0,
    staff: config.staff?.starting || 0,
    marketing: config.marketing?.starting || 0,
  });

  const resolveIndustryId = () => get().selectedIndustry?.id ?? 'dental';
  const resolveIndustryConfig = (): IndustryUpgradeConfig => getUpgradesForIndustry(resolveIndustryId());

  const defaultUpgrades = buildStartingUpgrades(getUpgradesForIndustry('dental'));

  return {
    upgrades: defaultUpgrades,

    canAffordUpgrade: (cost: number) => {
      const { metrics } = get();
      return metrics.cash >= cost;
    },

    getUpgradeConfig: (upgradeType: keyof Upgrades): UpgradeDefinition | null => {
      const industryUpgrades = resolveIndustryConfig();
      const config = industryUpgrades[upgradeType as UpgradeKey];

      if (!config) {
        const industryId = get().selectedIndustry?.id ?? 'dental';
        console.warn(`Upgrade config not found for ${upgradeType} in ${industryId} industry`);
        return null;
      }

      return config;
    },

    getUpgradeCost: (upgradeType: keyof Upgrades) => {
      const store = get() as GameState & UpgradesSlice;
      const { upgrades } = store;
      const config = store.getUpgradeConfig(upgradeType);

      if (!config) {
        return 0;
      }

      const currentLevel = upgrades[upgradeType];
      const startingLevel = config.starting ?? 0;

      // Calculate which upgrade level we're on
      const upgradeIndex = currentLevel - startingLevel;

      // If we're at max level, return 0
      if (currentLevel >= config.max) {
        return 0;
      }

      return config.costs?.[upgradeIndex] || 0;
    },

    upgradeTreatmentRooms: () => {
    const store = get() as GameState & UpgradesSlice;
    const { upgrades } = store;
    const cost = store.getUpgradeCost('treatmentRooms');
    const config = store.getUpgradeConfig('treatmentRooms');

    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }

    // Check if already at max rooms
    if (upgrades.treatmentRooms >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} reached!` };
    }

    // Check if can afford upgrade
    if (!store.canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }

    // Perform upgrade
    const weeklyExpenseDelta = config.weeklyExpenses ?? 0;

    set((state) => {
      const metricsUpdate = {
        ...state.metrics,
        cash: state.metrics.cash - cost,
        ...(weeklyExpenseDelta > 0
          ? { totalExpenses: state.metrics.totalExpenses + weeklyExpenseDelta }
          : {}),
      };

      return {
        upgrades: { ...state.upgrades, treatmentRooms: state.upgrades.treatmentRooms + 1 },
        metrics: metricsUpdate,
        ...(weeklyExpenseDelta > 0
          ? {
              weeklyExpenses: state.weeklyExpenses + weeklyExpenseDelta,
              weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + weeklyExpenseDelta,
            }
          : {}),
      };
    });

    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },

  upgradeEquipment: () => {
    const store = get() as GameState & UpgradesSlice;
    const { upgrades } = store;
    const cost = store.getUpgradeCost('equipment');
    const config = store.getUpgradeConfig('equipment');

    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }

    if (upgrades.equipment >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} level reached!` };
    }

    if (!store.canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }

    const weeklyExpenseDelta = config.weeklyExpenses ?? 0;

    set((state) => {
      const metricsUpdate = {
        ...state.metrics,
        cash: state.metrics.cash - cost,
        ...(weeklyExpenseDelta > 0
          ? { totalExpenses: state.metrics.totalExpenses + weeklyExpenseDelta }
          : {}),
      };

      return {
        upgrades: { ...state.upgrades, equipment: state.upgrades.equipment + 1 },
        metrics: metricsUpdate,
        ...(weeklyExpenseDelta > 0
          ? {
              weeklyExpenses: state.weeklyExpenses + weeklyExpenseDelta,
              weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + weeklyExpenseDelta,
            }
          : {}),
      };
    });

    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
  
  
  upgradeStaff: () => {
    const store = get() as GameState & UpgradesSlice;
    const { upgrades } = store;
    const cost = store.getUpgradeCost('staff');
    const config = store.getUpgradeConfig('staff');

    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }

    if (upgrades.staff >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} level reached!` };
    }

    if (!store.canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }

    const weeklyExpenseDelta = config.weeklyExpenses ?? 0;

    set((state) => {
      const metricsUpdate = {
        ...state.metrics,
        cash: state.metrics.cash - cost,
        ...(weeklyExpenseDelta > 0
          ? { totalExpenses: state.metrics.totalExpenses + weeklyExpenseDelta }
          : {}),
      };

      return {
        upgrades: { ...state.upgrades, staff: state.upgrades.staff + 1 },
        metrics: metricsUpdate,
        ...(weeklyExpenseDelta > 0
          ? {
              weeklyExpenses: state.weeklyExpenses + weeklyExpenseDelta,
              weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + weeklyExpenseDelta,
            }
          : {}),
      };
    });

    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
  
  upgradeMarketing: () => {
    const store = get() as GameState & UpgradesSlice;
    const { upgrades } = store;
    const cost = store.getUpgradeCost('marketing');
    const config = store.getUpgradeConfig('marketing');

    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }

    if (upgrades.marketing >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} level reached!` };
    }

    if (!store.canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }

    const weeklyExpenseDelta = config.weeklyExpenses ?? 0;

    set((state) => {
      const metricsUpdate = {
        ...state.metrics,
        cash: state.metrics.cash - cost,
        ...(weeklyExpenseDelta > 0
          ? { totalExpenses: state.metrics.totalExpenses + weeklyExpenseDelta }
          : {}),
      };

      return {
        upgrades: { ...state.upgrades, marketing: state.upgrades.marketing + 1 },
        metrics: metricsUpdate,
        ...(weeklyExpenseDelta > 0
          ? {
              weeklyExpenses: state.weeklyExpenses + weeklyExpenseDelta,
              weeklyExpenseAdjustments: state.weeklyExpenseAdjustments + weeklyExpenseDelta,
            }
          : {}),
      };
    });

    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
};
};
