import { StateCreator } from 'zustand';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState, RevenueCategory, OneTimeCostCategory } from '../types';
import { getInitialMetrics } from './metricsSlice';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { GameStore } from '../gameStore';
import { IndustryId } from '@/lib/game/types';
import { effectManager } from '@/lib/game/effectManager';

// Shared initial game state - DRY principle
const getInitialGameState = (
  industryId: IndustryId,
  keepIndustry: boolean = false,
) => {
  const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
  return {
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentMonth: 1,
    isGameOver: false,
    gameOverReason: null,
    monthlyRevenue: 0,
    monthlyExpenses: baseMonthlyExpenses,
    monthlyRevenueDetails: [],
    monthlyOneTimeCosts: 0,
    monthlyOneTimeCostDetails: [],
    monthlyOneTimeCostsPaid: 0,
    monthlyHistory: [],
    customers: [],
    metrics: getInitialMetrics(industryId),
    upgrades: {},
    monthlyExpenseAdjustments: 0,
    ...(keepIndustry ? {} : { selectedIndustry: null }),
  };
};

export interface GameSlice {
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number;
  gameTick: number;
  currentMonth: number;
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
    currentMonth: 1,
    isGameOver: false,
    gameOverReason: null,
  
  startGame: () => {
    // Reset to initial state but keep industry selection and start the game
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
    set({
      ...getInitialGameState(industryId, true), // keepIndustry = true
      isGameStarted: true, // Override to start the game
      monthlyExpenses: baseMonthlyExpenses,
      monthlyExpenseAdjustments: 0,
    });
  },
  
  pauseGame: () => {
    set({ isPaused: true });
  },
  
  unpauseGame: () => {
    set({ isPaused: false });
  },
  
  resetAllGame: () => {
    const {
      resetStaff,
      resetUpgrades,
      resetMarketing,
      setCurrentEvent,
      clearEventEffects,
    } = get();

    // Clear all active effects before rebuilding initial ones
    effectManager.clearAll();

    if (resetUpgrades) {
      resetUpgrades();
    }
    if (resetMarketing) {
      resetMarketing();
    }
    if (setCurrentEvent) {
      setCurrentEvent(null);
    }
    if (clearEventEffects) {
      clearEventEffects();
    }
    if (resetStaff) {
      resetStaff();
    }

    // Reset everything to initial state including industry selection
    set({
      ...getInitialGameState(DEFAULT_INDUSTRY_ID, false), // keepIndustry = false
      monthlyExpenses: getMonthlyBaseExpenses(DEFAULT_INDUSTRY_ID),
      monthlyExpenseAdjustments: 0,
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
        currentMonth: state.currentMonth,
        customers: state.customers,
        metrics: state.metrics,
        monthlyRevenue: state.monthlyRevenue,
        monthlyExpenses: state.monthlyExpenses,
        monthlyRevenueDetails: state.monthlyRevenueDetails,
        monthlyOneTimeCosts: state.monthlyOneTimeCosts,
        monthlyOneTimeCostDetails: state.monthlyOneTimeCostDetails,
        monthlyOneTimeCostsPaid: state.monthlyOneTimeCostsPaid,
        upgrades: state.upgrades,
        monthlyHistory: state.monthlyHistory,
        industryId: (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId,
        monthlyExpenseAdjustments: state.monthlyExpenseAdjustments,
      });
      return { ...state, ...updated };
    });
    
    // Check for game over after tick updates
    const { tickMarketing, tickEventEffects, checkGameOver, gameTime } = get();
    tickMarketing(gameTime);
    tickEventEffects(gameTime);
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

  //adds a revenue ledger entry, bumps monthly revenue, and updates cash/total revenue.
  recordEventRevenue: (amount: number, label: string = 'Event revenue') => {
    set((state) => ({
      monthlyRevenue: state.monthlyRevenue + amount,
      monthlyRevenueDetails: [
        ...state.monthlyRevenueDetails,
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

  // registers a one-time cost via monthlySlice.addOneTimeCost (which handles immediate deductions when requested).
  recordEventExpense: (amount: number, label: string) => {
    const { addOneTimeCost } = get();
    if (addOneTimeCost) {
      addOneTimeCost(
        { label, amount, category: OneTimeCostCategory.Event },
        { deductNow: true },
      );
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
