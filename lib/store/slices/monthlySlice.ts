import { StateCreator } from 'zustand';
import { MonthlyHistoryEntry, OneTimeCost, RevenueEntry } from '../types';
import { GameStore } from '../gameStore';

type OneTimeCostInput = Omit<OneTimeCost, 'alreadyDeducted'>;

export interface MonthlySlice {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  monthlyExpenseAdjustments: number;
  
  updateMonthlyRevenue: (amount: number) => void;
  updateMonthlyExpenses: (amount: number) => void;
  /**
   * Track a one-off cost for history/finance views.
   * Set `deductNow` to true to also pull the cash immediately.
   */
  addOneTimeCost: (
    cost: OneTimeCostInput,
    options?: { deductNow?: boolean },
  ) => void;
  addRevenueEntry: (entry: RevenueEntry) => void;
  addMonthlyHistoryEntry: (entry: MonthlyHistoryEntry) => void;
  resetMonthlyTracking: () => void;
}

export const getInitialMonthlyState = () => ({
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  monthlyRevenueDetails: [],
  monthlyOneTimeCosts: 0,
  monthlyOneTimeCostDetails: [],
  monthlyOneTimeCostsPaid: 0,
  monthlyHistory: [],
  monthlyExpenseAdjustments: 0,
});

export const createMonthlySlice: StateCreator<GameStore, [], [], MonthlySlice> = (set, get) => ({
  ...getInitialMonthlyState(),
  
  updateMonthlyRevenue: (amount: number) => {
    set((state) => ({
      monthlyRevenue: state.monthlyRevenue + amount
    }));
  },
  
  updateMonthlyExpenses: (amount: number) => {
    set((state) => ({
      monthlyExpenses: state.monthlyExpenses + amount
    }));
  },
  
  // Central place to log one-off expenses; optionally deducts cash immediately.
  addOneTimeCost: (cost: OneTimeCostInput, options = {}) => {
    const { deductNow = false } = options;

    set((state) => ({
      monthlyOneTimeCosts: state.monthlyOneTimeCosts + cost.amount,
      monthlyOneTimeCostDetails: [
        ...state.monthlyOneTimeCostDetails,
        { ...cost, alreadyDeducted: deductNow },
      ],
      monthlyOneTimeCostsPaid: deductNow
        ? state.monthlyOneTimeCostsPaid + cost.amount
        : state.monthlyOneTimeCostsPaid,
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
      monthlyRevenueDetails: [
        ...state.monthlyRevenueDetails,
        entry,
      ],
    }));
  },
  
  addMonthlyHistoryEntry: (entry: MonthlyHistoryEntry) => {
    set((state) => ({
      monthlyHistory: [...state.monthlyHistory, entry]
    }));
  },
  
  resetMonthlyTracking: () => {
    set(getInitialMonthlyState());
  },
});
