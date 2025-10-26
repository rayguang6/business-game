import { StateCreator } from 'zustand';
import { WeeklyHistoryEntry, OneTimeCost, RevenueEntry } from '../types';
import { GameStore } from '../gameStore';

type OneTimeCostInput = Omit<OneTimeCost, 'alreadyDeducted'>;

export interface WeeklySlice {
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyRevenueDetails: RevenueEntry[];
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyOneTimeCostsPaid: number;
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;
  
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
  /**
   * Track a one-off cost for history/finance views.
   * Set `deductNow` to true to also pull the cash immediately.
   */
  addOneTimeCost: (
    cost: OneTimeCostInput,
    options?: { deductNow?: boolean },
  ) => void;
  addRevenueEntry: (entry: RevenueEntry) => void;
  addWeeklyHistoryEntry: (entry: WeeklyHistoryEntry) => void;
  resetWeeklyTracking: () => void;
}

export const getInitialWeeklyState = () => ({
  weeklyRevenue: 0,
  weeklyExpenses: 0,
  weeklyRevenueDetails: [],
  weeklyOneTimeCosts: 0,
  weeklyOneTimeCostDetails: [],
  weeklyOneTimeCostsPaid: 0,
  weeklyHistory: [],
  weeklyExpenseAdjustments: 0,
});

export const createWeeklySlice: StateCreator<GameStore, [], [], WeeklySlice> = (set, get) => ({
  ...getInitialWeeklyState(),
  
  updateWeeklyRevenue: (amount: number) => {
    set((state) => ({
      weeklyRevenue: state.weeklyRevenue + amount
    }));
  },
  
  updateWeeklyExpenses: (amount: number) => {
    set((state) => ({
      weeklyExpenses: state.weeklyExpenses + amount
    }));
  },
  
  // Central place to log one-off expenses; optionally deducts cash immediately.
  addOneTimeCost: (cost: OneTimeCostInput, options = {}) => {
    const { deductNow = false } = options;

    set((state) => ({
      weeklyOneTimeCosts: state.weeklyOneTimeCosts + cost.amount,
      weeklyOneTimeCostDetails: [
        ...state.weeklyOneTimeCostDetails,
        { ...cost, alreadyDeducted: deductNow },
      ],
      weeklyOneTimeCostsPaid: deductNow
        ? state.weeklyOneTimeCostsPaid + cost.amount
        : state.weeklyOneTimeCostsPaid,
    }));

    if (deductNow) {
      const { applyCashChange } = get();
      if (applyCashChange) {
        applyCashChange(-cost.amount);
      }
    }
  },
  
  addRevenueEntry: (entry: RevenueEntry) => {
    set((state) => ({
      weeklyRevenueDetails: [
        ...state.weeklyRevenueDetails,
        entry,
      ],
    }));
  },
  
  addWeeklyHistoryEntry: (entry: WeeklyHistoryEntry) => {
    set((state) => ({
      weeklyHistory: [...state.weeklyHistory, entry]
    }));
  },
  
  resetWeeklyTracking: () => {
    set(getInitialWeeklyState());
  },
});
