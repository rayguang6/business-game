/**
 * Financial Tracking Utilities
 * Centralized helpers for recording revenue and expenses with proper source tracking
 * This ensures consistent source tracking across the entire codebase
 */

import { SourceType, SourceInfo, createSourceInfoSafe } from '@/lib/config/sourceTypes';
import { RevenueCategory, OneTimeCostCategory, REVENUE_CATEGORY_LABELS } from '@/lib/store/types';
import { RevenueEntry, OneTimeCost } from '@/lib/store/types';

/**
 * Maps SourceType to RevenueCategory for backward compatibility
 */
export function mapSourceTypeToRevenueCategory(sourceType: SourceType | string): RevenueCategory {
  switch (sourceType) {
    case SourceType.Customer:
      return RevenueCategory.Customer;
    case SourceType.Event:
    case SourceType.Upgrade:
    case SourceType.Staff:
    case SourceType.Marketing:
      return RevenueCategory.Event; // Non-customer revenue goes to Event category
    default:
      return RevenueCategory.Other;
  }
}

/**
 * Maps SourceType to OneTimeCostCategory
 */
export function mapSourceTypeToOneTimeCostCategory(sourceType: SourceType | string): OneTimeCostCategory {
  switch (sourceType) {
    case SourceType.Upgrade:
      return OneTimeCostCategory.Upgrade;
    case SourceType.Event:
      return OneTimeCostCategory.Event;
    case SourceType.Marketing:
      return OneTimeCostCategory.Marketing;
    case SourceType.Staff:
      return OneTimeCostCategory.Staff;
    default:
      return OneTimeCostCategory.Other;
  }
}

/**
 * Maps SourceType to ExpenseBreakdownCategory
 */
export function mapSourceTypeToExpenseCategory(sourceType: SourceType | string): 'base' | 'upgrade' | 'staff' | 'event' | 'other' {
  switch (sourceType) {
    case SourceType.Base:
      return 'base';
    case SourceType.Upgrade:
      return 'upgrade';
    case SourceType.Staff:
      return 'staff';
    case SourceType.Event:
      return 'event';
    default:
      return 'other';
  }
}

/**
 * Generate a standardized label from source info
 * Can be enhanced with industry-specific formatting later
 * 
 * @param source - Source information
 * @param customLabel - Optional custom label (takes precedence)
 * @param context - Optional context (e.g., "Purchase", "Monthly", "Severance")
 * @returns Formatted label string
 */
export function generateLabelFromSource(
  source: SourceInfo,
  customLabel?: string,
  context?: string,
): string {
  if (customLabel) {
    return customLabel;
  }
  
  // Add context if provided
  if (context) {
    return `${context}: ${source.name}`;
  }
  
  // Default label generation (can be made industry-specific later)
  return source.name;
}

/**
 * Generate display label for revenue entries
 * Uses sourceType and sourceName if available, falls back to label
 * For events with context, shows richer information
 */
export function getRevenueDisplayLabel(entry: RevenueEntry & { sourceType?: SourceType; sourceName?: string }): string {
  // For events with context, use the enhanced name (already includes choice/consequence)
  if (entry.sourceType === SourceType.Event && entry.sourceName) {
    return entry.sourceName;
  }
  
  // Prefer sourceName if available (more reliable)
  if (entry.sourceName) {
    return entry.sourceName;
  }
  
  // Fall back to label if provided
  if (entry.label) {
    return entry.label;
  }
  
  // Final fallback to category label
  return REVENUE_CATEGORY_LABELS[entry.category] || 'Unknown revenue';
}

/**
 * Generate display label for expense entries
 * Uses sourceName if available, falls back to label
 */
export function getExpenseDisplayLabel(expense: { label: string; sourceName?: string }): string {
  return expense.sourceName || expense.label;
}

/**
 * Create a RevenueEntry with proper source tracking
 */
export function createRevenueEntry(
  amount: number,
  source: SourceInfo,
  customLabel?: string,
): RevenueEntry {
  return {
    amount,
    category: mapSourceTypeToRevenueCategory(source.type),
    label: generateLabelFromSource(source, customLabel),
    sourceId: source.id,
    sourceType: source.type,
    sourceName: source.name,
  };
}

/**
 * Create a OneTimeCost with proper source tracking
 */
export function createOneTimeCost(
  amount: number,
  source: SourceInfo,
  customLabel?: string,
): OneTimeCost {
  return {
    amount,
    category: mapSourceTypeToOneTimeCostCategory(source.type),
    label: customLabel || generateLabelFromSource(source),
    sourceId: source.id,
    sourceType: source.type,
    sourceName: source.name,
  };
}

/**
 * Validate that SourceInfo is properly populated
 * @param sourceInfo - SourceInfo to validate
 * @returns true if valid, false otherwise
 */
export function validateSourceInfo(sourceInfo: SourceInfo): boolean {
  return !!(
    sourceInfo &&
    sourceInfo.type &&
    sourceInfo.id &&
    sourceInfo.name &&
    Object.values(SourceType).includes(sourceInfo.type)
  );
}

/**
 * Create a safe SourceInfo with validation and fallback
 * @param sourceInfo - SourceInfo to validate
 * @param fallbackId - Fallback ID if invalid
 * @param fallbackName - Fallback name if invalid
 * @returns Valid SourceInfo (original or fallback)
 */
export function ensureValidSourceInfo(
  sourceInfo: SourceInfo | undefined,
  fallbackId: string = 'unknown',
  fallbackName: string = 'Unknown source',
): SourceInfo {
  if (sourceInfo && validateSourceInfo(sourceInfo)) {
    return sourceInfo;
  }
  
  // Fallback to 'other' type
  return createSourceInfoSafe(SourceType.Other, fallbackId, fallbackName);
}

/**
 * Generate a meaningful name for event sources with context
 */
function generateEventSourceName(
  eventTitle: string,
  choiceLabel?: string,
  consequenceLabel?: string,
  effectLabel?: string,
): string {
  // Priority: effectLabel > consequenceLabel > choiceLabel > eventTitle
  if (effectLabel) {
    return effectLabel;
  }
  
  const parts: string[] = [eventTitle];
  
  if (choiceLabel) {
    parts.push(choiceLabel);
  }
  
  if (consequenceLabel && consequenceLabel !== choiceLabel) {
    parts.push(consequenceLabel);
  }
  
  return parts.join(' - ');
}

/**
 * Helper to create SourceInfo for common sources
 */
export const SourceHelpers = {
  /**
   * Create SourceInfo for an event with optional context
   * @param eventId - Event ID
   * @param eventTitle - Event title
   * @param context - Optional context (choice, consequence, effect label)
   */
  fromEvent: (
    eventId: string,
    eventTitle: string,
    context?: {
      choiceId?: string;
      choiceLabel?: string;
      consequenceId?: string;
      consequenceLabel?: string;
      effectLabel?: string;
    },
  ): SourceInfo => {
    const name = generateEventSourceName(
      eventTitle,
      context?.choiceLabel,
      context?.consequenceLabel,
      context?.effectLabel,
    );
    return createSourceInfoSafe(SourceType.Event, eventId, name, context);
  },
  
  fromUpgrade: (upgradeId: string, upgradeName: string, level?: number): SourceInfo => {
    const name = level && level > 1 ? `${upgradeName} (Lvl ${level})` : upgradeName;
    return createSourceInfoSafe(SourceType.Upgrade, upgradeId, name);
  },
  
  fromStaff: (staffId: string, staffName: string, context?: { action?: string }): SourceInfo => {
    const name = context?.action 
      ? `${context.action}: ${staffName}` 
      : staffName;
    return createSourceInfoSafe(SourceType.Staff, staffId, name, context);
  },
  
  fromMarketing: (campaignId: string, campaignName: string): SourceInfo =>
    createSourceInfoSafe(SourceType.Marketing, campaignId, campaignName),
  
  fromCustomer: (customerId: string, customerName: string): SourceInfo =>
    createSourceInfoSafe(SourceType.Customer, customerId, customerName),
  
  fromBase: (): SourceInfo =>
    createSourceInfoSafe(SourceType.Base, 'base', 'Base operations'),
  
  other: (id: string, name: string): SourceInfo =>
    createSourceInfoSafe(SourceType.Other, id, name),
};

