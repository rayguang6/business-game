import { StateCreator } from 'zustand';
import { Upgrades } from '../types';
import { GameState } from '../types';
import { getUpgradesForIndustry, DEFAULT_UPGRADE_VALUES } from '@/lib/config/gameConfig';

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
  getUpgradeConfig: (upgradeType: keyof Upgrades) => any;
}

export const createUpgradesSlice: StateCreator<GameState, [], [], UpgradesSlice> = (set, get) => ({
  upgrades: {
    treatmentRooms: (getUpgradesForIndustry('dental') as any).treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
    equipment: 0,
    staff: 0,
    marketing: 0,
  },
  
  canAffordUpgrade: (cost: number) => {
    const { metrics } = get();
    return metrics.cash >= cost;
  },
  
  getUpgradeConfig: (upgradeType: keyof Upgrades) => {
    // For now, we'll get dental upgrades (can be made dynamic later)
    const industryUpgrades = getUpgradesForIndustry('dental') as any;
    const config = industryUpgrades[upgradeType];
    
    if (!config) {
      console.warn(`Upgrade config not found for ${upgradeType} in dental industry`);
      return null;
    }
    
    return config;
  },
  
  getUpgradeCost: (upgradeType: keyof Upgrades) => {
    const { upgrades } = get();
    const config = (get() as any).getUpgradeConfig(upgradeType);
    
    if (!config) {
      return 0;
    }
    
    const currentLevel = upgrades[upgradeType];
    
    // Calculate which upgrade level we're on
    const upgradeIndex = currentLevel - config.starting;
    
    // If we're at max level, return 0
    if (currentLevel >= config.max) {
      return 0;
    }
    
    return config.costs[upgradeIndex] || 0;
  },
  
  upgradeTreatmentRooms: () => {
    const { upgrades } = get();
    const cost = (get() as any).getUpgradeCost('treatmentRooms');
    const config = (get() as any).getUpgradeConfig('treatmentRooms');
    
    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }
    
    // Check if already at max rooms
    if (upgrades.treatmentRooms >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} reached!` };
    }
    
    // Check if can afford upgrade
    if (!(get() as any).canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }
    
    // Perform upgrade
    set((state) => ({
      upgrades: { ...state.upgrades, treatmentRooms: state.upgrades.treatmentRooms + 1 },
      metrics: { ...state.metrics, cash: state.metrics.cash - cost }
    }));
    
    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
  
  upgradeEquipment: () => {
    const { upgrades } = get();
    const cost = (get() as any).getUpgradeCost('equipment');
    const config = (get() as any).getUpgradeConfig('equipment');
    
    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }
    
    if (upgrades.equipment >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} level reached!` };
    }
    
    if (!(get() as any).canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }
    
    set((state) => ({
      upgrades: { ...state.upgrades, equipment: state.upgrades.equipment + 1 },
      metrics: { ...state.metrics, cash: state.metrics.cash - cost }
    }));
    
    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
  
  upgradeStaff: () => {
    const { upgrades } = get();
    const cost = (get() as any).getUpgradeCost('staff');
    const config = (get() as any).getUpgradeConfig('staff');
    
    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }
    
    if (upgrades.staff >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} level reached!` };
    }
    
    if (!(get() as any).canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }
    
    set((state) => ({
      upgrades: { ...state.upgrades, staff: state.upgrades.staff + 1 },
      metrics: { ...state.metrics, cash: state.metrics.cash - cost }
    }));
    
    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
  
  upgradeMarketing: () => {
    const { upgrades } = get();
    const cost = (get() as any).getUpgradeCost('marketing');
    const config = (get() as any).getUpgradeConfig('marketing');
    
    if (!config) {
      return { success: false, message: 'Upgrade configuration not found!' };
    }
    
    if (upgrades.marketing >= config.max) {
      return { success: false, message: `Maximum ${config.name.toLowerCase()} level reached!` };
    }
    
    if (!(get() as any).canAffordUpgrade(cost)) {
      return { success: false, message: `Need $${cost} to upgrade ${config.name.toLowerCase()}!` };
    }
    
    set((state) => ({
      upgrades: { ...state.upgrades, marketing: state.upgrades.marketing + 1 },
      metrics: { ...state.metrics, cash: state.metrics.cash - cost }
    }));
    
    return { success: true, message: `${config.name} upgraded! Cost: $${cost}` };
  },
});
