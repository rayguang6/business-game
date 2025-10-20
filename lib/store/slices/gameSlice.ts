import { StateCreator } from 'zustand';
import { getWeeklyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState, RevenueCategory, OneTimeCostCategory } from '../types';
import { getInitialMetrics } from './metricsSlice';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { GameStore } from '../gameStore';
import { IndustryId } from '@/lib/game/types';

// Shared initial game state - DRY principle
const getInitialGameState = (
  industryId: IndustryId,
  keepIndustry: boolean = false,
) => {
  const baseWeeklyExpenses = getWeeklyBaseExpenses(industryId);
  return {
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
    isGameOver: false,
    gameOverReason: null,
    weeklyRevenue: 0,
    weeklyExpenses: baseWeeklyExpenses,
    weeklyRevenueDetails: [],
    weeklyOneTimeCosts: 0,
    weeklyOneTimeCostDetails: [],
    weeklyOneTimeCostsPaid: 0,
    weeklyHistory: [],
    customers: [],
    metrics: getInitialMetrics(industryId),
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
  isGameOver: boolean;
  gameOverReason: 'cash' | 'reputation' | null;
  
  startGame: () => void;
  pauseGame: () => void;
  unpauseGame: () => void;
  resetAllGame: () => void;
  tickGame: () => void;
  applyCashChange: (amount: number) => void;
  applyReputationChange: (amount: number) => void;
  recordEventRevenue: (amount: number, label?: string) => void;
  recordEventExpense: (amount: number, label: string) => void;
  checkGameOver: () => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => {
  return ({
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentWeek: 1,
    isGameOver: false,
    gameOverReason: null,
  
  startGame: () => {
    // Reset to initial state but keep industry selection and start the game
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const baseWeeklyExpenses = getWeeklyBaseExpenses(industryId);
    set({
      ...getInitialGameState(industryId, true), // keepIndustry = true
      isGameStarted: true, // Override to start the game
      weeklyExpenses: baseWeeklyExpenses,
      weeklyExpenseAdjustments: 0,
    });
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
      ...getInitialGameState(DEFAULT_INDUSTRY_ID, false), // keepIndustry = false
      weeklyExpenses: getWeeklyBaseExpenses(DEFAULT_INDUSTRY_ID),
      weeklyExpenseAdjustments: 0,
    });
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
        weeklyRevenueDetails: state.weeklyRevenueDetails,
        weeklyOneTimeCosts: state.weeklyOneTimeCosts,
        weeklyOneTimeCostDetails: state.weeklyOneTimeCostDetails,
        weeklyOneTimeCostsPaid: state.weeklyOneTimeCostsPaid,
        upgrades: state.upgrades,
        weeklyHistory: state.weeklyHistory,
        industryId: (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId,
        weeklyExpenseAdjustments: state.weeklyExpenseAdjustments,
        marketingEffects: state.marketingEffects,
      });
      return { ...state, ...updated };
    });
    
    // Check for game over after tick updates
    const { tickMarketing, checkGameOver, gameTime } = get();
    tickMarketing(gameTime);
    checkGameOver();
  },

  //adjust cash or reputation immediately and run checkGameOver afterward.
  applyCashChange: (amount: number) => {
    set((state) => ({
      metrics: { ...state.metrics, cash: state.metrics.cash + amount },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },
  applyReputationChange: (amount: number) => {
    set((state) => ({
      metrics: { ...state.metrics, reputation: state.metrics.reputation + amount },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },

  //adds a revenue ledger entry, bumps weekly revenue, and updates cash/total revenue.
  recordEventRevenue: (amount: number, label: string = 'Event revenue') => {
    set((state) => ({
      weeklyRevenue: state.weeklyRevenue + amount,
      weeklyRevenueDetails: [
        ...state.weeklyRevenueDetails,
        {
          amount,
          category: RevenueCategory.Event,
          label,
        },
      ],
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash + amount,
        totalRevenue: state.metrics.totalRevenue + amount,
      },
    }));
  },

  // registers a one-time cost via weeklySlice.addOneTimeCost (with alreadyDeducted=true to note it’s immediate) and then subtracts cash.
  recordEventExpense: (amount: number, label: string) => {
    const { addOneTimeCost } = get();
    if (addOneTimeCost) {
      addOneTimeCost(
        { label, amount, category: OneTimeCostCategory.Event },
        true
      );
    }

    set((state) => ({
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash - amount,
      },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },

  checkGameOver: () => {
    const state = get();
    if (state.isGameOver) return; // Already game over
    
    const { cash, reputation } = state.metrics;
    
    if (cash <= 0) {
      set({ isGameOver: true, gameOverReason: 'cash', isPaused: true });
    } else if (reputation <= 0) {
      set({ isGameOver: true, gameOverReason: 'reputation', isPaused: true });
    }
  },
});
};
