import { StateCreator } from 'zustand';
import { WeeklyHistoryEntry } from '../types';
import { GameState } from '../types';

export interface WeeklySlice {
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyHistory: WeeklyHistoryEntry[];
  
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
  addWeeklyHistoryEntry: (entry: WeeklyHistoryEntry) => void;
  resetWeeklyTracking: () => void;
}

export const createWeeklySlice: StateCreator<GameState, [], [], WeeklySlice> = (set) => ({
  weeklyRevenue: 0,
  weeklyExpenses: 0,
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
  
  addWeeklyHistoryEntry: (entry: WeeklyHistoryEntry) => {
    set((state) => ({
      weeklyHistory: [...state.weeklyHistory, entry]
    }));
  },
  
  resetWeeklyTracking: () => {
    set({
      weeklyRevenue: 0,
      weeklyExpenses: 0,
      weeklyHistory: []
    });
  },
});
