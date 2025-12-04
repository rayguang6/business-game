import type { GameStore } from '@/lib/store/gameStore';
import type { Requirement } from './types';
import { getUpgradeLevel } from '@/lib/features/upgrades';
import { getLevel } from '@/lib/store/types';
import { getExpPerLevel } from './config';
import { DEFAULT_INDUSTRY_ID } from './types';

/**
 * Compares two numeric values using the specified operator
 */
function compareNumericValues(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    case '>': return actual > expected;
    case '<': return actual < expected;
    case '==': return actual === expected;
    default: return actual >= expected; // Default to >=
  }
}

/**
 * Gets a metric value by its ID string
 */
function getMetricValueById(metricId: string, store: GameStore): number {
  const { metrics, gameTime } = store;
  const industryId = store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID;
  const expPerLevel = getExpPerLevel(industryId);

  switch (metricId) {
    case 'cash': return metrics.cash;
    case 'exp': return metrics.exp;
    case 'level': return getLevel(metrics.exp, expPerLevel);
    case 'expenses': return metrics.totalExpenses;
    case 'gameTime': return gameTime;
    case 'freedomScore': return metrics.freedomScore;
    default:
      console.warn(`[Requirements] Unknown metric: ${metricId}`);
      return 0;
  }
}

/**
 * Evaluates a single requirement
 * @param req - The requirement to check
 * @param store - The current game store state
 * @returns true if the requirement is met
 */
function evaluateRequirement(req: Requirement, store: GameStore): boolean {
  const { type, id, expected, operator, value } = req;

  if (type === 'flag') {
    // Flag requirement: check if flag is set
    const flagValue = store.flags?.[id];
    const isExpected = expected !== false; // Default to true
    return flagValue === isExpected;
  }
  
  if (type === 'upgrade') {
    // Upgrade requirement: check upgrade level
    const currentLevel = getUpgradeLevel(store.upgrades, id);
    const requiredLevel = value ?? 1;
    const op = operator ?? '>=';
    return compareNumericValues(currentLevel, op, requiredLevel);
  }
  
  if (type === 'metric') {
    // Metric requirement: check metric value
    const metricValue = getMetricValueById(id, store);
    const requiredValue = value ?? 0;
    const op = operator ?? '>=';
    return compareNumericValues(metricValue, op, requiredValue);
  }
  
  if (type === 'staff') {
    // Staff requirement: check staff count
    const staff = (store as any).hiredStaff || [];
    let count = 0;
    
    if (id === '*') {
      // Total staff count
      count = staff.length;
    } else {
      // Specific role count
      count = staff.filter((s: any) => s.roleId === id).length;
    }
    
    const requiredCount = value ?? 1;
    const op = operator ?? '>=';
    return compareNumericValues(count, op, requiredCount);
  }
  
  console.warn(`[Requirements] Unknown requirement type: ${type}`);
  return false;
}

/**
 * Checks if all requirements are met
 * @param requirements - Array of Requirement objects
 * @param store - The current game store state
 * @returns true if all requirements are met, false otherwise
 */
export function checkRequirements(requirements: Requirement[], store: GameStore): boolean {
  return requirements.every(req => evaluateRequirement(req, store));
}

/**
 * Gets a human-readable description of a requirement
 * @param req - The requirement to describe
 * @param store - The current game store state
 * @returns Human-readable description
 */
export function getRequirementDescription(req: Requirement, store: GameStore): string {
  const { type, id, expected, operator, value } = req;
  const prefix = expected === false ? "NOT " : "";

  if (type === 'flag') {
    // Flag requirement description
    if (store.availableFlags && Array.isArray(store.availableFlags)) {
      const flag = store.availableFlags.find(f => f.id === id);
      if (flag) {
        return `${prefix}${flag.name}`;
      }
    }
    return `${prefix}${id}`;
  }
  
  if (type === 'upgrade') {
    // Upgrade requirement description
    const upgrade = store.getAvailableUpgrades?.()?.find(u => u.id === id);
    const currentLevel = getUpgradeLevel(store.upgrades, id);
    const requiredLevel = value ?? 1;
    const op = operator ?? '>=';
    const upgradeName = upgrade?.name || id;
    return `${upgradeName} Level ${op} ${requiredLevel} (Current: ${currentLevel})`;
  }
  
  if (type === 'metric') {
    // Metric requirement description
    const metricValue = getMetricValueById(id, store);
    const requiredValue = value ?? 0;
    const op = operator ?? '>=';
    return `${id} ${op} ${requiredValue} (Current: ${metricValue})`;
  }
  
  if (type === 'staff') {
    // Staff requirement description
    const staff = (store as any).hiredStaff || [];
    let count = 0;
    let label = '';
    
    if (id === '*') {
      count = staff.length;
      const requiredCount = value ?? 1;
      const op = operator ?? '>=';
      return `Total Staff ${op} ${requiredCount} (Current: ${count})`;
    } else {
      const role = (store as any).availableStaffRoles?.find((r: any) => r.id === id);
      count = staff.filter((s: any) => s.roleId === id).length;
      const requiredCount = value ?? 1;
      const op = operator ?? '>=';
      label = role?.name || id;
      return `${label} ${op} ${requiredCount} (Current: ${count})`;
    }
  }

  return `${prefix}${id}`;
}
