/**
 * Shared types for the game store slices
 */

import { Industry } from '@/lib/features/industries';
import { Customer } from '@/lib/features/customers';
import { UpgradeId } from '@/lib/game/config';

export interface Metrics {
  cash: number;
  totalRevenue: number;
  totalExpenses: number;
  reputation: number;
}

// Map of upgrade ID to current level
export type Upgrades = Record<UpgradeId, number>;

export interface OneTimeCost {
  label: string;
  amount: number;
  category: 'upgrade' | 'repair' | 'event';
}

export interface WeeklyHistoryEntry {
  week: number;
  revenue: number;
  expenses: number;
  oneTimeCosts: OneTimeCost[];
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
  weeklyOneTimeCosts: number; // Total one-time costs amount
  weeklyOneTimeCostDetails: OneTimeCost[]; // Detailed list of one-time costs
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;

  // Customers
  customers: Customer[];
}
