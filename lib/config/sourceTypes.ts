/**
 * Unified Source Type System
 * Central definition of all source types for revenue, expenses, and tracking
 * Always includes 'other' as fallback for unregistered sources
 * 
 * NOTE: This enum represents the SOURCE of revenue/expenses, not the frequency.
 * The frequency (one-time vs monthly) is determined by which data structure it's stored in:
 * - OneTimeCost: One-time purchases/expenses
 * - ExpenseBreakdownItem: Monthly recurring expenses
 * 
 * Examples:
 * - SourceType.Staff can be:
 *   - One-time: Staff severance payment (stored in OneTimeCost)
 *   - Monthly: Staff salary (stored in ExpenseBreakdownItem)
 * - SourceType.Upgrade can be:
 *   - One-time: Upgrade purchase cost (stored in OneTimeCost)
 *   - Monthly: Upgrade subscription fee (stored in ExpenseBreakdownItem)
 */

export enum SourceType {
  // Generic Sources (can be revenue or expense, one-time or monthly)
  Customer = 'customer',      // Customer payments (revenue)
  Event = 'event',            // Event effects (can be revenue or expense, one-time or monthly)
  Upgrade = 'upgrade',        // Upgrade purchases/effects (can be revenue or expense, one-time or monthly)
  Staff = 'staff',            // Staff-related (can be revenue or expense, one-time or monthly)
  Marketing = 'marketing',    // Marketing campaigns (can be revenue or expense, one-time or monthly)
  Base = 'base',              // Rental (always monthly expense)
  
  // Fallback
  Other = 'other',            // Unknown/unregistered sources
}

/**
 * Source information for tracking revenue/expenses
 * 
 * @property type - The type of source (Event, Upgrade, Staff, etc.)
 * @property id - Unique identifier for the source
 * @property name - Display name (can include context like choice/consequence for events)
 * @property context - Optional additional context for richer tracking (e.g., choice, consequence, effect label)
 */
export interface SourceInfo {
  type: SourceType;
  id: string;
  name: string;
  context?: {
    choiceId?: string;
    choiceLabel?: string;
    consequenceId?: string;
    consequenceLabel?: string;
    effectLabel?: string;
    [key: string]: string | undefined; // Allow extensibility for future context
  };
}

/**
 * Helper to create SourceInfo with type safety
 */
export function createSourceInfo(
  type: SourceType,
  id: string,
  name: string,
  context?: SourceInfo['context'],
): SourceInfo {
  return { type, id, name, ...(context && { context }) };
}

/**
 * Helper to create SourceInfo with 'other' fallback
 */
export function createSourceInfoSafe(
  type: SourceType | string,
  id: string,
  name: string,
  context?: SourceInfo['context'],
): SourceInfo {
  // Validate type exists in enum, fallback to 'other'
  const validType = Object.values(SourceType).includes(type as SourceType)
    ? (type as SourceType)
    : SourceType.Other;
  
  return { type: validType, id, name, ...(context && { context }) };
}

