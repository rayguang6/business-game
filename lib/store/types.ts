/**
 * Shared types for the game store slices
 */

import { Industry } from '@/lib/game/industry/types';
import { Customer } from '@/lib/game/customers/types';

export interface Metrics {
  cash: number;
  totalRevenue: number;
  totalExpenses: number;
  reputation: number;
}

export interface WeeklyHistoryEntry {
  week: number;
  revenue: number;
  expenses: number;
  profit: number;
  reputation: number;
  reputationChange: number;
}

export interface GameState {
  // Game Control
  selectedIndustry: Industry | null;
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number;
  gameTick: number;
  currentWeek: number;
  
  // Business Metrics
  metrics: Metrics;
  
  // Weekly Tracking
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyHistory: WeeklyHistoryEntry[];
  
  // Customers
  customers: Customer[];
}
