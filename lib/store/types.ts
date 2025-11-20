/**
 * Shared types for the game store slices
 */

import { Industry } from '@/lib/features/industries';
import { Customer } from '@/lib/features/customers';
import { Lead } from '@/lib/features/leads';
import { UpgradeId } from '@/lib/game/config';

export interface Metrics {
  cash: number;
  time: number; // Monthly time budget (refreshes monthly)
  totalRevenue: number;
  totalExpenses: number;
  skillLevel: number; // Previously: reputation
  freedomScore: number; // Previously: founderWorkingHours
}

// Map of upgrade ID to current level
export type Upgrades = Record<UpgradeId, number>;

export enum RevenueCategory {
  Customer = 'customer',
  Event = 'event',
  Other = 'other',
}

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  [RevenueCategory.Customer]: 'Customer payments',
  [RevenueCategory.Event]: 'Event payouts',
  [RevenueCategory.Other]: 'Other income',
};

export interface RevenueEntry {
  amount: number;
  category: RevenueCategory;
  label?: string;
  sourceId?: string;
}

export enum OneTimeCostCategory {
  Upgrade = 'upgrade',
  Repair = 'repair',
  Event = 'event',
  Marketing = 'marketing',
  Staff = 'staff',
}

export interface OneTimeCost {
  label: string;
  amount: number;
  category: OneTimeCostCategory;
  alreadyDeducted?: boolean;
}

export interface MonthlyHistoryEntry {
  month: number;
  revenue: number;
  expenses: number;
  oneTimeCosts: OneTimeCost[];
  profit: number;
  skillLevel: number; // Previously: reputation
  skillLevelChange: number; // Previously: reputationChange
  freedomScore: number; // Previously: founderWorkingHours
  revenueBreakdown?: RevenueEntry[];
}

export interface GameState {
  // Game Control
  selectedIndustry: Industry | null;
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number;
  gameTick: number;
  currentMonth: number;
  isGameOver: boolean;
  gameOverReason: 'cash' | 'time' | 'victory' | null;
  
  // Business Metrics
  metrics: Metrics;
  
  // Upgrades
  upgrades: Upgrades;
  
  // Flags - Simple boolean state tracking
  flags: Record<string, boolean>;
  
  // Monthly Tracking
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number; // Total one-time costs amount
  monthlyOneTimeCostDetails: OneTimeCost[]; // Detailed list of one-time costs
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  monthlyExpenseAdjustments: number;

  // Customers
  customers: Customer[];

  // Leads
  leads: Lead[];
  leadProgress: number; // Progress toward converting a lead to customer (0-100)
  conversionRate: number; // How much progress each lead adds (default: 10)
}
