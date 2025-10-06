import { StateCreator } from 'zustand';
import { WeeklyHistoryEntry, OneTimeCost } from '../types';
import { GameState } from '../types';

export interface WeeklySlice {
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyHistory: WeeklyHistoryEntry[];
  
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
  addOneTimeCost: (cost: OneTimeCost) => void;
  addWeeklyHistoryEntry: (entry: WeeklyHistoryEntry) => void;
  resetWeeklyTracking: () => void;
}

export const createWeeklySlice: StateCreator<GameState, [], [], WeeklySlice> = (set) => ({
  weeklyRevenue: 0,
  weeklyExpenses: 0,
  weeklyOneTimeCosts: 0,
  weeklyOneTimeCostDetails: [],
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
  
  addOneTimeCost: (cost: OneTimeCost) => {
    set((state) => ({
      weeklyOneTimeCosts: state.weeklyOneTimeCosts + cost.amount,
      weeklyOneTimeCostDetails: [...state.weeklyOneTimeCostDetails, cost]
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
      weeklyOneTimeCosts: 0,
      weeklyOneTimeCostDetails: [],
      weeklyHistory: []
    });
  },
});
