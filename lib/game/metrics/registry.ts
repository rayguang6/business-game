/**
 * Metric Registry - Single Source of Truth for All Game Metrics
 * 
 * This registry defines all game metrics with their metadata, display configuration,
 * default values, and constraints. This enables:
 * - Easy addition of new metrics (just add to registry)
 * - Consistent display across HUD, details panel, and admin UI
 * - Auto-generation of admin forms
 * - Industry-specific HUD configuration (Phase 2)
 * 
 * To change a metric's display name, just update the `displayLabel` field in the registry entry.
 */

import { GameMetric } from '../effectManager';
import { IndustryId, BusinessMetrics, BusinessStats } from '../types';
import { getBusinessMetrics, getBusinessStats } from '../config';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';
import { EventEffectType } from '@/lib/types/gameEvents';
import { EventCategoryType } from '../constants/eventCategories';

/**
 * Where the default value comes from
 */
export type DefaultValueSource = 
  | 'businessMetrics'  // From BusinessMetrics interface (startingCash, startingExp, etc.)
  | 'businessStats'   // From BusinessStats interface (serviceCapacity, serviceRevenueMultiplier, etc.)
  | 'calculated';     // Calculated value (always same, like ServiceSpeedMultiplier = 1.0)

/**
 * Complete metric definition with all metadata
 */
export interface MetricDefinition {
  id: GameMetric;
  displayLabel: string;        // What to show in UI
  description: string;          // What it does

  // Default values
  defaultValueSource: DefaultValueSource;
  defaultValuePath?: string;   // e.g., 'startingCash'
  calculatedDefaultValue?: number; // For calculated metrics

  // Constraints
  constraints?: {
    min?: number;
    max?: number;
    roundToInt?: boolean;
  };

  // Display configuration
  display: {
    showOnHUD: boolean;
    showInDetails: boolean;
    showInAdmin: boolean;
    priority?: number;         // Display order
    unit?: string;             // Optional unit: "h", "x", "%", etc.
  };

  // Icon configuration
  iconPath?: string | null;    // Path to icon image (optional, for UI display)

  // Effect system
  canBeModifiedByEffects: boolean;
}

/**
 * Central registry - ALL metrics defined here
 * 
 * To add a new metric:
 * 1. Add to GameMetric enum in effectManager.ts
 * 2. Add entry here with all metadata
 * 3. That's it! (Phase 2 will auto-generate UI from this)
 */
export const METRIC_REGISTRY: Record<GameMetric, MetricDefinition> = {
  [GameMetric.Cash]: {
    id: GameMetric.Cash,
    displayLabel: 'Cash',
    description: 'Available cash currency',
    defaultValueSource: 'businessMetrics',
    defaultValuePath: 'startingCash',
    constraints: {
      min: 0,
      roundToInt: true,
    },
    display: {
      showOnHUD: true,
      showInDetails: true,
      showInAdmin: true,
      priority: 1,
    },
    iconPath: '/images/icons/cash.png',
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.Exp]: {
    id: GameMetric.Exp,
    displayLabel: 'EXP', // Experience points
    description: 'Experience points that determine player level',
    defaultValueSource: 'businessMetrics',
    defaultValuePath: 'startingExp',
    constraints: {
      min: 0,
      roundToInt: true,
    },
    display: {
      showOnHUD: true,
      showInDetails: true,
      showInAdmin: true,
      priority: 2,
      unit: ' EXP',
    },
    iconPath: '/images/icons/exp.png',
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.ServiceSpeedMultiplier]: {
    id: GameMetric.ServiceSpeedMultiplier,
    displayLabel: 'Service Speed',
    description: 'Multiplier for how fast services are completed (1.0 = normal speed)',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
      max: 10,
    },
    display: {
      showOnHUD: false,
      showInDetails: true,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.ServiceCapacity]: {
    id: GameMetric.ServiceCapacity,
    displayLabel: 'Service Capacity',
    description: 'Maximum number of customers that can be served simultaneously',
    defaultValueSource: 'businessStats',
    defaultValuePath: 'serviceCapacity',
    constraints: {
      min: 1,
      roundToInt: true,
    },
    display: {
      showOnHUD: false,
      showInDetails: true,
      showInAdmin: true,
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.ServiceRevenueMultiplier]: {
    id: GameMetric.ServiceRevenueMultiplier,
    displayLabel: 'Revenue Bonus Percentage',
    description: 'Percentage bonus for all service revenue',
    defaultValueSource: 'businessStats',
    defaultValuePath: 'serviceRevenueMultiplier',
    constraints: {
      min: 0, // 10% minimum (equivalent to previous 0.1x)
    },
    display: {
      showOnHUD: false,
      showInDetails: true,
      showInAdmin: true,
      unit: '%',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.ServiceRevenueFlatBonus]: {
    id: GameMetric.ServiceRevenueFlatBonus,
    displayLabel: 'Revenue Bonus Flat',
    description: 'Flat bonus added to all service revenue (treated as regular metric, not special buff)',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 0,
    display: {
      showOnHUD: false,
      showInDetails: true,
      showInAdmin: true,
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.LeadsPerMonth]: {
    id: GameMetric.LeadsPerMonth,
    displayLabel: 'Leads/Month',
    description: 'Number of leads spawned per industry month. Internally converted to spawn interval for game mechanics.',
    defaultValueSource: 'businessStats',
    defaultValuePath: 'leadsPerMonth',
    constraints: {
      min: 0,
      roundToInt: true,
    },
    display: {
      showOnHUD: true,
      showInDetails: false,
      showInAdmin: false,
      unit: '/m',
    },
    iconPath: '/images/icons/leads-per-month.png',
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.ConversionRate]: {
    id: GameMetric.ConversionRate,
    displayLabel: 'Conversion Rate',
    description: 'How much progress each lead adds toward customer conversion (0-100)',
    defaultValueSource: 'businessStats',
    defaultValuePath: 'conversionRate',
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: true, // NEW: Add to HUD in Phase 2
      showInDetails: true,
      showInAdmin: true,
      priority: 5,
      unit: '%',
    },
    iconPath: null, // No specific icon for conversion rate
    canBeModifiedByEffects: true,
  },

  [GameMetric.CustomerPatienceSeconds]: {
    id: GameMetric.CustomerPatienceSeconds,
    displayLabel: 'Customer Patience',
    description: 'How long customers wait before getting angry (seconds)',
    defaultValueSource: 'businessStats',
    defaultValuePath: 'customerPatienceSeconds',
    constraints: {
      min: 1,
      roundToInt: true,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 's',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.FailureRate]: {
    id: GameMetric.FailureRate,
    displayLabel: 'Failure Rate',
    description: 'Base chance of business operations failing (0-100%)',
    defaultValueSource: 'businessStats',
    defaultValuePath: 'failureRate',
    constraints: {
      min: 0,
      max: 100,
      roundToInt: true,
    },
    display: {
      showOnHUD: false,
      showInDetails: true,
      showInAdmin: true,
      unit: '%',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.MonthlyExpenses]: {
    id: GameMetric.MonthlyExpenses,
    displayLabel: 'Monthly Expenses',
    description: 'Base monthly expenses (before upgrades)',
    defaultValueSource: 'businessMetrics',
    defaultValuePath: 'monthlyExpenses',
    constraints: {
      min: 0,
      roundToInt: true,
    },
    display: {
      showOnHUD: false,
      showInDetails: true,
      showInAdmin: true,
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.MyTime]: {
    id: GameMetric.MyTime,
    displayLabel: 'My Time',
    description: 'Personal time (hours)',
    defaultValueSource: 'businessMetrics',
    defaultValuePath: 'startingTime',
    constraints: {
      min: 0,
      roundToInt: true,
    },
    display: {
      showOnHUD: true,
      showInDetails: true,
      showInAdmin: true,
      unit: 'h',
    },
    iconPath: '/images/icons/my-time.png',
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.LeveragedTime]: {
    id: GameMetric.LeveragedTime,
    displayLabel: 'Leveraged Time',
    description: 'Leveraged time from staff/upgrades (hours)',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 0,
    constraints: {
      min: 0,
      roundToInt: true,
    },
    display: {
      showOnHUD: true, // Show on HUD when leveraged time exists
      showInDetails: true,
      showInAdmin: true,
      priority: 3, // Display after MyTime
      unit: 'h',
    },
    iconPath: '/images/icons/leveraged-time.png',
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.HighTierServiceRevenueMultiplier]: {
    id: GameMetric.HighTierServiceRevenueMultiplier,
    displayLabel: 'High-Tier Revenue',
    description: 'Multiplier for high-tier service revenue',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.HighTierServiceWeightageMultiplier]: {
    id: GameMetric.HighTierServiceWeightageMultiplier,
    displayLabel: 'High-Tier Weightage',
    description: 'Multiplier for high-tier service spawn weightage',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.MidTierServiceRevenueMultiplier]: {
    id: GameMetric.MidTierServiceRevenueMultiplier,
    displayLabel: 'Mid-Tier Revenue',
    description: 'Multiplier for mid-tier service revenue',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.MidTierServiceWeightageMultiplier]: {
    id: GameMetric.MidTierServiceWeightageMultiplier,
    displayLabel: 'Mid-Tier Weightage',
    description: 'Multiplier for mid-tier service spawn weightage',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.LowTierServiceRevenueMultiplier]: {
    id: GameMetric.LowTierServiceRevenueMultiplier,
    displayLabel: 'Low-Tier Revenue',
    description: 'Multiplier for low-tier service revenue',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.LowTierServiceWeightageMultiplier]: {
    id: GameMetric.LowTierServiceWeightageMultiplier,
    displayLabel: 'Low-Tier Weightage',
    description: 'Multiplier for low-tier service spawn weightage',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 1.0,
    constraints: {
      min: 0.1,
    },
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
      unit: 'x',
    },
    canBeModifiedByEffects: true,
  },
  
  [GameMetric.GenerateLeads]: {
    id: GameMetric.GenerateLeads,
    displayLabel: 'Leads',
    description: 'Immediate lead generation (one-time action, not a displayable metric)',
    defaultValueSource: 'calculated',
    calculatedDefaultValue: 0,
    display: {
      showOnHUD: false,
      showInDetails: false,
      showInAdmin: true,
    },
    canBeModifiedByEffects: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get metric definition by ID
 */
export function getMetricDefinition(metric: GameMetric): MetricDefinition {
  const definition = METRIC_REGISTRY[metric];
  if (!definition) {
    throw new Error(`Metric definition not found for: ${metric}`);
  }
  return definition;
}

/**
 * Get all metrics
 */
export function getAllMetrics(): MetricDefinition[] {
  return Object.values(METRIC_REGISTRY);
}

/**
 * Get merged metric definition (code + database display config)
 * Database display config overrides code defaults
 */
export function getMergedMetricDefinition(
  metric: GameMetric,
  displayConfig: MetricDisplayConfig | null,
): MetricDefinition {
  const codeDef = getMetricDefinition(metric);
  
  // If no DB config, return code definition as-is
  if (!displayConfig) {
    return codeDef;
  }
  
  // Merge: DB overrides code for display properties
  return {
    ...codeDef,
    displayLabel: displayConfig.displayLabel,
    description: displayConfig.description || codeDef.description,
    display: {
      showOnHUD: displayConfig.showOnHUD,
      showInDetails: displayConfig.showInDetails,
      showInAdmin: codeDef.display.showInAdmin, // Keep from code definition (not in DB)
      priority: displayConfig.priority ?? codeDef.display.priority,
      unit: displayConfig.unit || codeDef.display.unit,
    },
    iconPath: displayConfig.iconPath ?? codeDef.iconPath, // DB overrides registry default
  };
}

/**
 * Get metrics that should be shown on HUD
 * (Phase 2: will filter by industry-specific config from DB)
 */
export function getMetricsForHUD(): MetricDefinition[] {
  return getAllMetrics()
    .filter(m => m.display.showOnHUD)
    .sort((a, b) => (a.display.priority ?? 999) - (b.display.priority ?? 999));
}

/**
 * Get metrics that should be shown in details panel
 */
export function getMetricsForDetails(): MetricDefinition[] {
  return getAllMetrics()
    .filter(m => m.display.showInDetails)
    .sort((a, b) => (a.display.priority ?? 999) - (b.display.priority ?? 999));
}

/**
 * Get metrics that can be modified by effects
 */
export function getModifiableMetrics(): MetricDefinition[] {
  return getAllMetrics().filter(m => m.canBeModifiedByEffects);
}

/**
 * Get default value for a metric from config
 * 
 * @param metric The metric to get default value for
 * @param industryId Industry ID to fetch config for
 * @returns Default value for the metric
 */
export function getDefaultValue(metric: GameMetric, industryId: IndustryId = 'freelance'): number {
  const definition = getMetricDefinition(metric);
  
  if (definition.defaultValueSource === 'calculated') {
    return definition.calculatedDefaultValue ?? 0;
  }
  
  if (definition.defaultValueSource === 'businessMetrics') {
    const metrics = getBusinessMetrics(industryId);
    if (!metrics || !definition.defaultValuePath) {
      return 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (metrics as any)[definition.defaultValuePath];
    return typeof value === 'number' ? value : 0;
  }
  
  if (definition.defaultValueSource === 'businessStats') {
    const stats = getBusinessStats(industryId);
    if (!stats || !definition.defaultValuePath) {
      return 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (stats as any)[definition.defaultValuePath];
    return typeof value === 'number' ? value : 0;
  }
  
  return 0;
}

/**
 * Get the standard emoji icon for a metric (for consistency across UI)
 * This centralizes icon definitions so all components use the same icons
 */
export function getMetricIcon(metric: GameMetric): string {
  switch (metric) {
    case GameMetric.Cash: return '💵';
    case GameMetric.Exp: return '💎'; // Diamond for experience/leveling
    case GameMetric.MyTime: return '⏱️'; // Timer for personal time
    case GameMetric.LeveragedTime: return '⏳'; // Hourglass for leveraged time
    case GameMetric.ServiceSpeedMultiplier: return '⚡'; // Lightning for speed
    case GameMetric.ServiceCapacity: return '👥'; // People for capacity
    case GameMetric.ServiceRevenueMultiplier: return '💰'; // Money bag for revenue
    case GameMetric.ServiceRevenueFlatBonus: return '💵'; // Bills for flat bonus
    case GameMetric.LeadsPerMonth: return '👥'; // People for leads
    case GameMetric.ConversionRate: return '📊'; // Chart for conversion
    case GameMetric.FailureRate: return '⚠️'; // Warning for failure
    case GameMetric.MonthlyExpenses: return '💸'; // Money with wings for expenses
    case GameMetric.CustomerPatienceSeconds: return '⏳'; // Hourglass for patience
    default: return '✨'; // Sparkles for unknown
  }
}

/**
 * Get the standard emoji icon for event effects (for consistency with HUD)
 * This centralizes icon definitions so all components use the same icons
 */
export function getEventEffectIcon(effectType: EventEffectType): string {
  switch (effectType) {
    case EventEffectType.Cash: return '💴'; // Money bag for cash effects
    case EventEffectType.Exp: return '⭐'; // Star for experience points
    case EventEffectType.DynamicCash: return '💰'; // Money bag for dynamic cash (same as cash)
    case EventEffectType.Metric: return '📊'; // Chart for metric effects
    default: return '✨'; // Sparkles for unknown
  }
}

/**
 * Get the standard emoji icon for event categories
 * This centralizes icon definitions so all components use the same icons
 */
export function getEventCategoryIcon(category: EventCategoryType): string {
  switch (category) {
    case 'opportunity': return '✨'; // Sparkles for opportunities
    case 'good-bad': return '⚠️'; // Warning for good/bad events
    default: return '📝'; // Document for unknown categories
  }
}

/**
 * Calculate Customers Per Month from Spawn Interval Seconds
 * Formula: customersPerMonth = monthDurationSeconds / spawnIntervalSeconds
 *
 * @param spawnIntervalSeconds Seconds between customer spawns
 * @param monthDurationSeconds Duration of a month in seconds
 * @returns Number of customers per month (rounded down)
 */
export function calculateCustomersPerMonth(
  spawnIntervalSeconds: number,
  monthDurationSeconds: number,
): number {
  if (spawnIntervalSeconds <= 0 || monthDurationSeconds <= 0) {
    return 0;
  }
  return Math.floor(monthDurationSeconds / spawnIntervalSeconds);
}

/**
 * Format SpawnIntervalSeconds as Customers Per Month for display
 * 
 * @param spawnIntervalSeconds Seconds between customer spawns
 * @param monthDurationSeconds Duration of a month in seconds (optional, will fetch from config if not provided)
 * @param industryId Industry ID to fetch month duration from config (default: 'freelance')
 * @returns Formatted string like "60 customers/month"
 */
export function formatCustomersPerMonth(
  spawnIntervalSeconds: number,
  monthDurationSeconds?: number,
  industryId: IndustryId = 'freelance',
): string {
  const monthDuration = monthDurationSeconds ?? getBusinessStats(industryId)?.monthDurationSeconds ?? 0;
  const customersPerMonth = calculateCustomersPerMonth(spawnIntervalSeconds, monthDuration);
  return `${customersPerMonth} customers/month`;
}
