/**
 * Shared types for the game store slices
 */

import { Industry } from '@/lib/features/industries';
import { Customer } from '@/lib/features/customers';

export interface Metrics {
  cash: number;
  totalRevenue: number;
  totalExpenses: number;
  reputation: number;
}

export interface Upgrades {
  treatmentRooms: number; // For dental: 2-5 rooms
  equipment: number; // 0-3 levels
  staff: number; // 0-3 levels  
  marketing: number; // 0-3 levels
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
  
  // Upgrades
  upgrades: Upgrades;
  
  // Weekly Tracking
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number; // One-time costs (events, marketing campaigns, etc.)
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;

  // Customers
  customers: Customer[];
}
