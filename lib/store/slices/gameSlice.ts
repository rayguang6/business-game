import { StateCreator } from 'zustand';
import { getWeeklyBaseExpenses } from '@/lib/game/economy/mechanics';
import { tickOnce } from '@/lib/game/game/mechanics';
import { GameState } from '../types';

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
      weeklyHistory: [],
      customers: [],
      metrics: {
        cash: 1000,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: 0,
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
      weeklyHistory: [],
      customers: [],
      metrics: {
        cash: 1000,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: 0,
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
      weeklyHistory: [],
      customers: [],
      metrics: {
        cash: 1000,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: 0,
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
        weeklyHistory: state.weeklyHistory,
      });
      return { ...state, ...updated };
    });
  },
});
