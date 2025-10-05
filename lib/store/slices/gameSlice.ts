import { StateCreator } from 'zustand';
import { getWeeklyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState } from '../types';
import { getInitialMetrics } from './metricsSlice';
import { ECONOMY_CONFIG, getUpgradesForIndustry, DEFAULT_UPGRADE_VALUES, IndustryUpgradeConfig } from '@/lib/config/gameConfig';


// Shared initial game state - DRY principle
const getInitialGameState = (keepIndustry: boolean = false) => ({
  isGameStarted: false,
  isPaused: false,
  gameTime: 0,
  gameTick: 0,
  currentWeek: 1,
  weeklyRevenue: 0,
  weeklyExpenses: getWeeklyBaseExpenses(),
  weeklyOneTimeCosts: 0,
  weeklyHistory: [],
  customers: [],
  metrics: getInitialMetrics(),
  upgrades: {
    treatmentRooms: (getUpgradesForIndustry('dental') as any).treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
    equipment: 0,
    staff: 0,
    marketing: 0,
  },
  ...(keepIndustry ? {} : { selectedIndustry: null }),
});

export interface GameSlice {
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number;
  gameTick: number;
  currentWeek: number;
  
  startGame: () => void;
  stopGame: () => void;
  pauseGame: () => void;
  unpauseGame: () => void;
  resetAllGame: () => void;
  updateGameTimer: () => void;
  tickGame: () => void;
}

export const createGameSlice: StateCreator<GameState, [], [], GameSlice> = (set, get) => {
  const buildStartingUpgrades = (config: IndustryUpgradeConfig) => ({
    treatmentRooms: config.treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
    equipment: config.equipment?.starting || 0,
    staff: config.staff?.starting || 0,
    marketing: config.marketing?.starting || 0,
  });

  return ({
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
  
  startGame: () => {
    const selectedIndustry = get().selectedIndustry;
    const industryId = selectedIndustry?.id ?? 'dental';
    const industryUpgrades = getUpgradesForIndustry(industryId);
    const startingUpgrades = buildStartingUpgrades(industryUpgrades);

    // Reset to initial state but keep industry selection and start the game
    set({ 
      ...getInitialGameState(true), // keepIndustry = true
      isGameStarted: true, // Override to start the game
      upgrades: startingUpgrades,
    });
  },
  
  stopGame: () => {
    set({ isGameStarted: false, isPaused: false });
  },
  
  pauseGame: () => {
    set({ isPaused: true });
  },
  
  unpauseGame: () => {
    set({ isPaused: false });
  },
  
  resetAllGame: () => {
    const selectedIndustry = get().selectedIndustry;
    const industryId = selectedIndustry?.id ?? 'dental';
    const industryUpgrades = getUpgradesForIndustry(industryId);
    const startingUpgrades = buildStartingUpgrades(industryUpgrades);
    // Reset everything to initial state including industry selection
    set({
      ...getInitialGameState(false), // keepIndustry = false
      upgrades: startingUpgrades,
    });
  },
  
  updateGameTimer: () => {
    set((state) => ({ gameTime: state.gameTime + 1 }));
  },
  
  tickGame: () => {
    const { isPaused } = get();
    
    if (isPaused) {
      return;
    }
    
    set((state) => {
      const updated = tickOnce({
        gameTick: state.gameTick,
        gameTime: state.gameTime,
        currentWeek: state.currentWeek,
        customers: state.customers,
        metrics: state.metrics,
        weeklyRevenue: state.weeklyRevenue,
        weeklyExpenses: state.weeklyExpenses,
        weeklyOneTimeCosts: state.weeklyOneTimeCosts,
        weeklyHistory: state.weeklyHistory,
        upgrades: state.upgrades,
        industryId: state.selectedIndustry?.id ?? 'dental',
      });
      return { ...state, ...updated };
    });
  },
});
};
