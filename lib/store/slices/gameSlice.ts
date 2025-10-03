import { StateCreator } from 'zustand';
import { getWeeklyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState } from '../types';
import { ECONOMY_CONFIG, getUpgradesForIndustry, DEFAULT_UPGRADE_VALUES } from '@/lib/config/gameConfig';

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
  resetGame: () => void;
  resetAllGame: () => void;
  updateGameTimer: () => void;
  tickGame: () => void;
}

export const createGameSlice: StateCreator<GameState, [], [], GameSlice> = (set, get) => ({
  isGameStarted: false,
  isPaused: false,
  gameTime: 0,
  gameTick: 0,
  currentWeek: 1,
  
  startGame: () => {
    set({ 
      isGameStarted: true, 
      isPaused: false, 
      gameTime: 0, 
      gameTick: 0, 
      currentWeek: 1,
      weeklyRevenue: 0,
      weeklyExpenses: getWeeklyBaseExpenses(),
      weeklyOneTimeCosts: 0,
      weeklyHistory: [],
      customers: [],
      metrics: {
        cash: ECONOMY_CONFIG.INITIAL_MONEY,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: ECONOMY_CONFIG.INITIAL_REPUTATION,
      },
      upgrades: {
        treatmentRooms: (getUpgradesForIndustry('dental') as any).treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
      }
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
  
  resetGame: () => {
    set((state) => ({
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
      metrics: {
        cash: ECONOMY_CONFIG.INITIAL_MONEY,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: ECONOMY_CONFIG.INITIAL_REPUTATION,
      },
      upgrades: {
        treatmentRooms: (getUpgradesForIndustry('dental') as any).treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
      },
      // Keep the selectedIndustry unchanged
      selectedIndustry: state.selectedIndustry,
    }));
  },
  
  resetAllGame: () => {
    set({
      selectedIndustry: null,
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
      metrics: {
        cash: ECONOMY_CONFIG.INITIAL_MONEY,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: ECONOMY_CONFIG.INITIAL_REPUTATION,
      },
      upgrades: {
        treatmentRooms: (getUpgradesForIndustry('dental') as any).treatmentRooms?.starting || DEFAULT_UPGRADE_VALUES.TREATMENT_ROOMS_STARTING,
      },
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
        });
      return { ...state, ...updated };
    });
  },
});
