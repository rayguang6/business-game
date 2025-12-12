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
  myTime: number; // Personal time (refreshes monthly)
  myTimeCapacity: number; // Personal time capacity (never changes, equals startingTime)
  leveragedTime: number; // Leveraged time from staff/upgrades (refreshes monthly)
  leveragedTimeCapacity: number; // Leveraged time capacity (updates when leveraged time is added)
  totalRevenue: number;
  totalExpenses: number;
  exp: number; // Previously: skillLevel (reputation)
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
// Level 1 is achieved at 0 EXP (starting level)

/**
 * Calculate cumulative EXP required to reach a specific level
 * @param level - Target level (1-indexed)
 * @param expPerLevel - Either a number (flat EXP per level) or array (EXP per level progression)
 * @returns Cumulative EXP needed to reach that level
 */
function getCumulativeExpForLevel(level: number, expPerLevel: number | number[]): number {
  if (level <= 1) return 0;

  if (typeof expPerLevel === 'number') {
    // Flat EXP per level: Level N requires (N-1) * expPerLevel EXP
    return (level - 1) * expPerLevel;
  } else {
    // Array-based: sum up EXP requirements for each level up to target
    const definedLevels = expPerLevel.length;
    const expForDefinedLevels = expPerLevel.slice(0, Math.min(level - 1, definedLevels)).reduce((sum, exp) => sum + exp, 0);

    // If level exceeds defined levels, add the remaining levels using the last value
    if (level - 1 > definedLevels) {
      const lastExpValue = expPerLevel[definedLevels - 1] ?? 200;
      const additionalLevels = level - 1 - definedLevels;
      return expForDefinedLevels + (additionalLevels * lastExpValue);
    }

    return expForDefinedLevels;
  }
}

/**
 * Get the EXP requirement for progressing from a specific level to the next
 * @param level - Current level (1-indexed)
 * @param expPerLevel - Either a number (flat EXP per level) or array (EXP per level progression)
 * @returns EXP needed to go from current level to next level
 */
function getExpForLevelProgression(level: number, expPerLevel: number | number[]): number {
  if (typeof expPerLevel === 'number') {
    return expPerLevel;
  } else {
    // Level 1 -> 2 uses array[0], Level 2 -> 3 uses array[1], etc.
    const index = level - 1;
    // If array doesn't have that index, use the last value in array (repeat for high levels)
    if (index >= expPerLevel.length) {
      return expPerLevel[expPerLevel.length - 1] ?? 200; // Fallback to 200 if array is empty
    }
    return expPerLevel[index];
  }
}

/**
 * Get the current level based on EXP
 * @param exp - Current experience points
 * @param expPerLevel - Either a number (flat EXP per level) or array (EXP per level progression)
 * @returns Current level (1-indexed, minimum 1)
 */
export function getLevel(exp: number, expPerLevel: number | number[] = 200): number {
  if (!Number.isFinite(exp) || exp < 0) return 1; // Minimum level is 1
  
  if (typeof expPerLevel === 'number') {
    // Flat EXP per level: original formula
    return Math.floor(exp / expPerLevel) + 1;
  } else {
    // Array-based: find which level this EXP reaches
    let cumulativeExp = 0;
    for (let level = 2; level <= expPerLevel.length + 1; level++) {
      cumulativeExp += expPerLevel[level - 2] ?? 200; // level-2 because level 2 uses index 0
      if (exp < cumulativeExp) {
        return level - 1; // Return previous level
      }
    }
    // EXP exceeds all defined levels - calculate using last value
    if (expPerLevel.length === 0) return 1;
    const lastExpPerLevel = expPerLevel[expPerLevel.length - 1];
    const expForDefinedLevels = cumulativeExp;
    const remainingExp = exp - expForDefinedLevels;
    const additionalLevels = Math.floor(remainingExp / lastExpPerLevel);
    return expPerLevel.length + 1 + additionalLevels;
  }
}

/**
 * Get progress within current level (EXP in current level, not total EXP)
 * @param exp - Current experience points
 * @param expPerLevel - Either a number (flat EXP per level) or array (EXP per level progression)
 * @returns EXP progress within current level (0 to exp needed for next level)
 */
export function getLevelProgress(exp: number, expPerLevel: number | number[] = 200): number {
  if (!Number.isFinite(exp) || exp < 0) return 0;
  
  const currentLevel = getLevel(exp, expPerLevel);
  const expRequiredForCurrentLevel = getCumulativeExpForLevel(currentLevel, expPerLevel);
  return exp - expRequiredForCurrentLevel;
}

/**
 * Get EXP remaining to reach next level
 * @param exp - Current experience points
 * @param expPerLevel - Either a number (flat EXP per level) or array (EXP per level progression)
 * @returns EXP needed to reach next level
 */
export function getExpToNextLevel(exp: number, expPerLevel: number | number[] = 200): number {
  const currentLevel = getLevel(exp, expPerLevel);
  const expForNextLevel = getCumulativeExpForLevel(currentLevel + 1, expPerLevel);
  return Math.max(0, expForNextLevel - exp);
}

/**
 * Get the EXP requirement for progressing from current level to next
 * @param exp - Current experience points
 * @param expPerLevel - Either a number (flat EXP per level) or array (EXP per level progression)
 * @returns EXP needed to go from current level to next level
 */
export function getExpRequiredForCurrentLevel(exp: number, expPerLevel: number | number[] = 200): number {
  const currentLevel = getLevel(exp, expPerLevel);
  return getExpForLevelProgression(currentLevel, expPerLevel);
}

/**
 * Get the background color class for a level rank based on its position in the rank hierarchy
 * Follows RPG color progression: Green > Blue > Purple > Orange > Red
 * Colors are assigned dynamically based on rank order, not hardcoded names
 * @param rank - The level rank name
 * @param allRanks - Array of all available rank names in order
 * @returns Tailwind CSS background color class (solid colors)
 */
export function getRankBackgroundColor(rank: string, allRanks: string[] = []): string {
  // If no ranks provided, default to solid red
  if (allRanks.length === 0) {
    return 'bg-red-500';
  }

  const rankIndex = allRanks.indexOf(rank);
  if (rankIndex === -1) return 'bg-red-500'; // Default to solid red for unknown ranks

  // RPG color progression based on rank position - solid colors
  const rankColors = [
    'bg-green-500',    // 0: Green (Novice)
    'bg-blue-500',     // 1: Blue (Rising Freelancer)
    'bg-purple-500',    // 2: Purple (Professional Marketer)
    'bg-orange-500',    // 3: Orange (Elite Agency Builder)
    'bg-red-500',       // 4+: Red (Millionaire Marketer and beyond)
  ];

  return rankColors[Math.min(rankIndex, rankColors.length - 1)];
}

/**
 * Get the text color class for a level rank
 * White text for known ranks, black text for defaults
 * @param rank - The level rank name
 * @param allRanks - Array of all available rank names in order
 * @returns Tailwind CSS text color class
 */
export function getRankTextColor(rank: string, allRanks: string[] = []): string {
  // Black text for defaults (no ranks available or unknown rank)
  if (allRanks.length === 0 || allRanks.indexOf(rank) === -1) {
    return 'text-black';
  }

  // White text for all known ranks
  return 'text-white';
}

