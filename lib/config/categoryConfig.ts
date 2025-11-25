/**
 * Centralized configuration for expense and revenue category icons and labels
 * This makes it easy to update icons and labels in one place
 * Supports industry-specific customization
 */

import { OneTimeCostCategory, RevenueCategory } from '@/lib/store/types';
import { SourceType } from './sourceTypes';

// Expense breakdown categories (for monthly recurring expenses)
export type ExpenseBreakdownCategory = 'base' | 'upgrade' | 'staff' | 'event' | 'other';

export interface CategoryConfig {
  icon: string;
  label?: string;
}

// One-time cost category configuration
export const ONE_TIME_COST_CATEGORY_CONFIG: Record<OneTimeCostCategory, CategoryConfig> = {
  [OneTimeCostCategory.Upgrade]: {
    icon: '🔧',
    label: 'Upgrade',
  },
  [OneTimeCostCategory.Event]: {
    icon: '📋',
    label: 'Event',
  },
  [OneTimeCostCategory.Marketing]: {
    icon: '📢',
    label: 'Marketing',
  },
  [OneTimeCostCategory.Staff]: {
    icon: '👋',
    label: 'Staff',
  },
  [OneTimeCostCategory.Other]: {
    icon: '💰',
    label: 'Other',
  },
};

// Extended config for future categories (repair, etc.)
const EXTENDED_ONE_TIME_COST_CONFIG: Record<string, CategoryConfig> = {
  repair: {
    icon: '🔨',
    label: 'Repair',
  },
};

// Expense breakdown category configuration (monthly recurring expenses)
export const EXPENSE_BREAKDOWN_CATEGORY_CONFIG: Record<ExpenseBreakdownCategory, CategoryConfig> = {
  base: {
    icon: '🏢',
    label: 'Base Operations',
  },
  upgrade: {
    icon: '⚙️',
    label: 'Upgrade',
  },
  staff: {
    icon: '👤',
    label: 'Staff',
  },
  event: {
    icon: '📋',
    label: 'Event',
  },
  other: {
    icon: '💰',
    label: 'Other',
  },
};

// Revenue category configuration
export const REVENUE_CATEGORY_CONFIG: Record<RevenueCategory, CategoryConfig> = {
  [RevenueCategory.Customer]: {
    icon: '💵',
    label: 'Customer payments',
  },
  [RevenueCategory.Event]: {
    icon: '📋',
    label: 'Event payouts',
  },
  [RevenueCategory.Other]: {
    icon: '💰',
    label: 'Other income',
  },
};

// Revenue label pattern configuration (for special cases based on label content)
// These patterns are checked before falling back to category config
export const REVENUE_LABEL_PATTERN_CONFIG: Array<{ pattern: string | RegExp; icon: string }> = [
  { pattern: 'Staff:', icon: '👤' },
  { pattern: 'Upgrade:', icon: '⚙️' },
  { pattern: /Marketing:|Campaign/, icon: '📢' },
];

// Helper function to get icon for one-time cost category (with extended support)
export function getOneTimeCostIcon(category: OneTimeCostCategory | string): string {
  // Check main config first
  const mainConfig = ONE_TIME_COST_CATEGORY_CONFIG[category as OneTimeCostCategory];
  if (mainConfig) {
    return mainConfig.icon;
  }
  
  // Check extended config (for future categories)
  const extendedConfig = EXTENDED_ONE_TIME_COST_CONFIG[category];
  if (extendedConfig) {
    return extendedConfig.icon;
  }
  
  // Fallback to 'other'
  return ONE_TIME_COST_CATEGORY_CONFIG[OneTimeCostCategory.Other].icon;
}

// Helper function to get icon for expense breakdown category
export function getExpenseBreakdownIcon(category: ExpenseBreakdownCategory | string): string {
  const config = EXPENSE_BREAKDOWN_CATEGORY_CONFIG[category as ExpenseBreakdownCategory];
  return config?.icon || EXPENSE_BREAKDOWN_CATEGORY_CONFIG.other.icon;
}

// Source type to icon mapping (primary source of truth for icons)
const SOURCE_TYPE_ICON_MAP: Record<SourceType, string> = {
  [SourceType.Customer]: '💵',
  [SourceType.Event]: '📋',
  [SourceType.Upgrade]: '⚙️',
  [SourceType.Staff]: '👤',
  [SourceType.Marketing]: '📢',
  [SourceType.Base]: '🏢',
  [SourceType.Other]: '💰',
};

/**
 * Get icon for a source type (primary method - most reliable)
 */
export function getIconForSourceType(sourceType: SourceType | string): string {
  // Check if it's a valid SourceType enum value
  if (Object.values(SourceType).includes(sourceType as SourceType)) {
    return SOURCE_TYPE_ICON_MAP[sourceType as SourceType] || SOURCE_TYPE_ICON_MAP[SourceType.Other];
  }
  
  // Fallback to 'other'
  return SOURCE_TYPE_ICON_MAP[SourceType.Other];
}

// Helper function to get icon for revenue category
export function getRevenueIcon(category: RevenueCategory, label?: string, sourceType?: string): string {
  // PRIORITY 1: Use sourceType if provided (most reliable)
  if (sourceType) {
    const icon = getIconForSourceType(sourceType);
    if (icon !== SOURCE_TYPE_ICON_MAP[SourceType.Other]) {
      return icon; // Return if we found a specific icon
    }
    // If sourceType maps to 'other', continue to fallback logic
  }
  
  // PRIORITY 2: Check for special cases in label (backward compatibility)
  if (label) {
    for (const { pattern, icon } of REVENUE_LABEL_PATTERN_CONFIG) {
      if (typeof pattern === 'string' && label.includes(pattern)) {
        return icon;
      }
      if (pattern instanceof RegExp && pattern.test(label)) {
        return icon;
      }
    }
  }
  
  // PRIORITY 3: Fall back to category config (with 'other' as final fallback)
  return REVENUE_CATEGORY_CONFIG[category]?.icon || REVENUE_CATEGORY_CONFIG[RevenueCategory.Other].icon;
}

