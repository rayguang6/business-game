import { StateCreator } from 'zustand';
import { WeeklyHistoryEntry, OneTimeCost, RevenueEntry } from '../types';
import { GameState } from '../types';

export interface WeeklySlice {
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyRevenueDetails: RevenueEntry[];
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyOneTimeCostsPaid: number;
  weeklyHistory: WeeklyHistoryEntry[];
  
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
  addOneTimeCost: (cost: OneTimeCost, alreadyDeducted?: boolean) => void;
  addRevenueEntry: (entry: RevenueEntry) => void;
  addWeeklyHistoryEntry: (entry: WeeklyHistoryEntry) => void;
  resetWeeklyTracking: () => void;
}

export const createWeeklySlice: StateCreator<GameState, [], [], WeeklySlice> = (set) => ({
  weeklyRevenue: 0,
  weeklyExpenses: 0,
  weeklyRevenueDetails: [],
  weeklyOneTimeCosts: 0,
  weeklyOneTimeCostDetails: [],
  weeklyOneTimeCostsPaid: 0,
  weeklyHistory: [],
  
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
  
  addOneTimeCost: (cost: OneTimeCost, alreadyDeducted: boolean = false) => {
    set((state) => ({
      weeklyOneTimeCosts: state.weeklyOneTimeCosts + cost.amount,
      weeklyOneTimeCostDetails: [
        ...state.weeklyOneTimeCostDetails,
        { ...cost, alreadyDeducted },
      ],
      weeklyOneTimeCostsPaid: alreadyDeducted
        ? state.weeklyOneTimeCostsPaid + cost.amount
        : state.weeklyOneTimeCostsPaid,
    }));
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
    set({
      weeklyRevenue: 0,
      weeklyExpenses: 0,
      weeklyRevenueDetails: [],
      weeklyOneTimeCosts: 0,
      weeklyOneTimeCostDetails: [],
      weeklyOneTimeCostsPaid: 0,
      weeklyHistory: []
    });
  },
});
