import { StateCreator } from 'zustand';
import { getWeeklyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState } from '../types';
import { getInitialMetrics } from './metricsSlice';

const BASE_WEEKLY_EXPENSES = getWeeklyBaseExpenses();

// Shared initial game state - DRY principle
const getInitialGameState = (keepIndustry: boolean = false) => {
  return {
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
    weeklyRevenue: 0,
    weeklyExpenses: BASE_WEEKLY_EXPENSES,
    weeklyOneTimeCosts: 0,
    weeklyOneTimeCostDetails: [],
    weeklyHistory: [],
    customers: [],
    metrics: getInitialMetrics(),
    upgrades: {},
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
  applyCashChange: (amount: number) => void;
  applyReputationChange: (amount: number) => void;
  applyOneTimeCost: (label: string, amount: number, category: OneTimeCostCategory) => void;
}

export const createGameSlice: StateCreator<GameState, [], [], GameSlice> = (
  set,
  get
) => {
  return ({
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
  
  startGame: () => {
    // Reset to initial state but keep industry selection and start the game
    set({
      ...getInitialGameState(true), // keepIndustry = true
      isGameStarted: true, // Override to start the game
      weeklyExpenses: BASE_WEEKLY_EXPENSES,
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
    // Reset everything to initial state including industry selection
    set({
      ...getInitialGameState(false), // keepIndustry = false
      weeklyExpenses: BASE_WEEKLY_EXPENSES,
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
        weeklyOneTimeCostDetails: state.weeklyOneTimeCostDetails,
        upgrades: state.upgrades,
        weeklyHistory: state.weeklyHistory,
        industryId: state.selectedIndustry?.id ?? 'dental',
        weeklyExpenseAdjustments: state.weeklyExpenseAdjustments,
      });
      return { ...state, ...updated };
    });
  },
  applyCashChange: (amount: number) => set((state) => ({
    metrics: { ...state.metrics, cash: state.metrics.cash + amount },
  })),
  applyReputationChange: (amount: number) => set((state) => ({
    metrics: { ...state.metrics, reputation: state.metrics.reputation + amount },
  })),
  applyOneTimeCost: (label: string, amount: number, category: OneTimeCostCategory) => set((state) => ({
    weeklyOneTimeCosts: state.weeklyOneTimeCosts + amount,
    weeklyOneTimeCostDetails: [
      ...state.weeklyOneTimeCostDetails,
      { label, amount, category },
    ],
  })),
});
};
