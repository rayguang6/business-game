/**
 * Shared types for the game store slices
 */

import { Industry } from '@/lib/features/industries';
import { Customer } from '@/lib/features/customers';
import { Lead } from '@/lib/features/leads';
import { UpgradeId } from '@/lib/game/config';
import { SourceType } from '@/lib/config/sourceTypes';

export interface Metrics {
  cash: number;
  time: number; // Monthly available time (refreshes monthly)
  totalRevenue: number;
  totalExpenses: number;
  exp: number; // Previously: skillLevel (reputation)
  freedomScore: number; // Previously: founderWorkingHours
  totalLeadsSpawned: number; // Lifetime count of leads spawned
  totalCustomersGenerated: number; // Lifetime count of customers spawned
  totalTimeSpent: number; // Lifetime time spent (in hours)
}

// Map of upgrade ID to current level
export type Upgrades = Record<UpgradeId, number>;

export enum RevenueCategory {
  Customer = 'customer',
  Event = 'event',
  Other = 'other', // Fallback for unregistered revenue sources
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
  sourceId?: string;        // ID of the source (event.id, upgrade.id, staff.id, etc.)
  sourceType?: SourceType;  // SourceType enum value (for better tracking)
  sourceName?: string;      // Display name of the source
}

export enum OneTimeCostCategory {
  Upgrade = 'upgrade',
  Event = 'event',
  Marketing = 'marketing',
  Staff = 'staff',
  Other = 'other', // Fallback for unregistered one-time cost sources
  // Repair = 'repair', // Reserved for future use, not currently implemented
}

export interface OneTimeCost {
  label: string;
  amount: number;
  category: OneTimeCostCategory;
  sourceId?: string;        // ID of the source (upgrade.id, event.id, staff.id, etc.)
  sourceType?: SourceType;  // SourceType enum value (for better tracking)
  sourceName?: string;      // Display name of the source
  alreadyDeducted?: boolean;
}

export interface MonthlyHistoryEntry {
  month: number;
  revenue: number;
  expenses: number;
  oneTimeCosts: OneTimeCost[];
  profit: number;
  exp: number; // Previously: skillLevel (reputation)
  expChange: number; // Previously: skillLevelChange
  level: number; // Current level at end of month
  levelChange: number; // Level change during the month
  freedomScore: number; // Previously: founderWorkingHours
  revenueBreakdown?: RevenueEntry[];
  expenseBreakdown?: ExpenseBreakdownItem[]; // Individual operating expenses breakdown
  leadsSpawned?: number; // Leads spawned in this month
  customersGenerated?: number; // Customers generated in this month
  customersServed?: number; // Customers served in this month
  customersLeftImpatient?: number; // Customers left impatient in this month
  customersServiceFailed?: number; // Customers service failed in this month
  timeSpent?: number; // Time spent in this month
  timeSpentDetails?: TimeSpentEntry[]; // Breakdown of time spent
}

export interface ExpenseBreakdownItem {
  label: string;
  amount: number;
  category: 'base' | 'upgrade' | 'staff' | 'event' | 'other'; // Added 'other' fallback
  sourceId?: string;
  sourceType?: SourceType;  // SourceType enum value (for better tracking)
  sourceName?: string;      // Display name of the source
}

export interface TimeSpentEntry {
  amount: number; // hours spent
  label: string;
  sourceId?: string;
  sourceType?: SourceType;
  sourceName?: string;
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

  // Customer Tracking
  customersServed: number; // Customers who completed service successfully
  customersLeftImpatient: number; // Customers who left due to impatience
  customersServiceFailed: number; // Customers whose service failed

  // Time Tracking
  monthlyTimeSpent: number; // Time spent in current month
  monthlyTimeSpentDetails: TimeSpentEntry[]; // Detailed breakdown of time spent this month

  // Monthly Tracking (reset each month)
  monthlyLeadsSpawned: number; // Leads spawned in current month
  monthlyCustomersGenerated: number; // Customers generated in current month
  monthlyCustomersServed: number; // Customers served in current month
  monthlyCustomersLeftImpatient: number; // Customers left impatient in current month
  monthlyCustomersServiceFailed: number; // Customers service failed in current month
}

// Helper functions for EXP/level system
export function getLevel(exp: number, expPerLevel: number = 200): number {
  if (!Number.isFinite(exp) || exp < 0) return 0;
  return Math.floor(exp / expPerLevel);
}

export function getLevelProgress(exp: number, expPerLevel: number = 200): number {
  if (!Number.isFinite(exp) || exp < 0) return 0;
  return exp % expPerLevel;
}

export function getExpToNextLevel(exp: number, expPerLevel: number = 200): number {
  return expPerLevel - getLevelProgress(exp, expPerLevel);
}
