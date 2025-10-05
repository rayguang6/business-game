import { StateCreator } from 'zustand';
import { calculateUpgradeWeeklyExpenses, getWeeklyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState } from '../types';
import { getInitialMetrics } from './metricsSlice';
import { getUpgradesForIndustry, DEFAULT_UPGRADE_VALUES, IndustryUpgradeConfig } from '@/lib/config/gameConfig';


const DEFAULT_INDUSTRY_ID = 'dental';

const buildStartingUpgrades = (config: IndustryUpgradeConfig) => ({
  treatmentRooms: config.treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
  equipment: config.equipment?.starting || 0,
  staff: config.staff?.starting || 0,
  marketing: config.marketing?.starting || 0,
});

const getStartingUpgrades = (industryId: string) => buildStartingUpgrades(getUpgradesForIndustry(industryId));

const getStartingWeeklyExpenses = (industryId: string) => {
  const startingUpgrades = getStartingUpgrades(industryId);
  return getWeeklyBaseExpenses() + calculateUpgradeWeeklyExpenses(startingUpgrades, industryId);
};

// Shared initial game state - DRY principle
const getInitialGameState = (keepIndustry: boolean = false) => {
  const industryId = DEFAULT_INDUSTRY_ID;
  const startingUpgrades = getStartingUpgrades(industryId);

  return {
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
    weeklyRevenue: 0,
    weeklyExpenses: getStartingWeeklyExpenses(industryId),
    weeklyOneTimeCosts: 0,
    weeklyHistory: [],
    customers: [],
    metrics: getInitialMetrics(),
    upgrades: startingUpgrades,
    weeklyExpenseAdjustments: 0,
    ...(keepIndustry ? {} : { selectedIndustry: null }),
  };
};

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
  return ({
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
  
  startGame: () => {
    const selectedIndustry = get().selectedIndustry;
    const industryId = selectedIndustry?.id ?? 'dental';
    const startingUpgrades = getStartingUpgrades(industryId);
    const startingWeeklyExpenses = getStartingWeeklyExpenses(industryId);

    // Reset to initial state but keep industry selection and start the game
    set({
      ...getInitialGameState(true), // keepIndustry = true
      isGameStarted: true, // Override to start the game
      upgrades: startingUpgrades,
      weeklyExpenses: startingWeeklyExpenses,
      weeklyExpenseAdjustments: 0,
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
    const startingUpgrades = getStartingUpgrades(industryId);
    const startingWeeklyExpenses = getStartingWeeklyExpenses(industryId);
    // Reset everything to initial state including industry selection
    set({
      ...getInitialGameState(false), // keepIndustry = false
      upgrades: startingUpgrades,
      weeklyExpenses: startingWeeklyExpenses,
      weeklyExpenseAdjustments: 0,
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
        weeklyExpenseAdjustments: state.weeklyExpenseAdjustments,
      });
      return { ...state, ...updated };
    });
  },
});
};
