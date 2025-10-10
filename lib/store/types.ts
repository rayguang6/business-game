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

export type RevenueCategory = 'customer' | 'event' | 'other';

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  customer: 'Customer payments',
  event: 'Event payouts',
  other: 'Other income',
};

export interface RevenueEntry {
  amount: number;
  category: RevenueCategory;
  label?: string;
  sourceId?: string;
}

export interface OneTimeCost {
  label: string;
  amount: number;
  category: 'upgrade' | 'repair' | 'event';
  alreadyDeducted?: boolean;
}

export interface WeeklyHistoryEntry {
  week: number;
  revenue: number;
  expenses: number;
  oneTimeCosts: OneTimeCost[];
  profit: number;
  reputation: number;
  reputationChange: number;
  revenueBreakdown?: RevenueEntry[];
}

export interface GameState {
  // Game Control
  selectedIndustry: Industry | null;
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number;
  gameTick: number;
  currentWeek: number;
  isGameOver: boolean;
  gameOverReason: 'cash' | 'reputation' | null;
  
  // Business Metrics
  metrics: Metrics;
  
  // Upgrades
  upgrades: Upgrades;
  
  // Weekly Tracking
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyRevenueDetails: RevenueEntry[];
  weeklyOneTimeCosts: number; // Total one-time costs amount
  weeklyOneTimeCostDetails: OneTimeCost[]; // Detailed list of one-time costs
  weeklyOneTimeCostsPaid: number;
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;

  // Customers
  customers: Customer[];
}
