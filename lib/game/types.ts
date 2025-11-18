import { GameEvent } from '@/lib/types/gameEvents';

export type IndustryId = string;

export const DEFAULT_INDUSTRY_ID: IndustryId = 'dental';

export interface BusinessMetrics {
  startingCash: number;
  startingTime?: number; // Optional monthly time budget (hours)
  monthlyExpenses: number;
  startingSkillLevel: number; // Previously: startingReputation
  startingFreedomScore: number; // Previously: founderWorkHours - Base freedom score (monthly requirement)
}

export interface BusinessStats {
  ticksPerSecond: number;
  monthDurationSeconds: number;
  customerSpawnIntervalSeconds: number;
  customerPatienceSeconds: number;
  leavingAngryDurationTicks: number;
  customerSpawnPosition: {
    x: number;
    y: number;
  };
  treatmentRooms: number;
  skillLevelGainPerHappyCustomer: number; // Previously: reputationGainPerHappyCustomer
  skillLevelLossPerAngryCustomer: number; // Previously: reputationLossPerAngryCustomer
  // baseHappyProbability removed - customers are happy/angry based on patience, not probability
  eventTriggerSeconds?: number[];
  serviceRevenueMultiplier: number;
  serviceRevenueScale?: number;
}

export interface MapWall {
  x: number;
  y: number;
}

export interface MapConfig {
  width: number;
  height: number;
  walls: MapWall[];
}

export interface MovementConfig {
  customerTilesPerTick: number;
  animationReferenceTilesPerTick: number;
  walkFrameDurationMs: number;
  minWalkFrameDurationMs: number;
  maxWalkFrameDurationMs: number;
  celebrationFrameDurationMs: number;
}

// Upgrade effect now uses new effectManager enums
export interface UpgradeEffect {
  metric: import('@/lib/game/effectManager').GameMetric;
  type: import('@/lib/game/effectManager').EffectType;
  value: number;
  priority?: number;
  // source removed - will be auto-generated when registering with effectManager
}

/**
 * Requirement with explicit type and expected value support
 * - type: specifies whether this is a flag or condition requirement
 * - expected: true means the requirement must be met (YES), false means must NOT be met (NO)
 * - id: clean ID without prefixes (e.g., "staff_trained", not "flag_staff_trained")
 */
export interface Requirement {
  type: 'flag' | 'condition';  // Explicit type
  id: string;                  // Clean ID without prefixes
  expected?: boolean;          // true = must be met, false = must NOT be met
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number; // Cash cost (or time cost if timeCost is specified)
  timeCost?: number; // Optional time cost (hours) - if specified, uses time instead of cash
  maxLevel: number;
  effects: UpgradeEffect[];
  setsFlag?: string; // Optional flag to set when this upgrade is purchased
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
}

export type UpgradeId = UpgradeDefinition['id'];

export interface BaseUpgradeMetrics {
  monthlyExpenses: number;
  spawnIntervalSeconds: number;
  serviceSpeedMultiplier: number;
  skillLevel: number; // Direct skill level (effects modify this directly)
  treatmentRooms: number;
  // happyProbability removed - not used in game mechanics
  serviceRevenueMultiplier: number;
  serviceRevenueFlatBonus: number;
  founderWorkingHours: number;
  // Tier-specific service modifiers (default to 1 if not specified)
  highTierServiceRevenueMultiplier?: number;
  highTierServiceWeightageMultiplier?: number;
  midTierServiceRevenueMultiplier?: number;
  midTierServiceWeightageMultiplier?: number;
  lowTierServiceRevenueMultiplier?: number;
  lowTierServiceWeightageMultiplier?: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface SimulationLayoutConfig {
  entryPosition: GridPosition;
  waitingPositions: GridPosition[];
  serviceRoomPositions: GridPosition[];
  staffPositions: GridPosition[];
}

export type ServicePricingCategory = 'low' | 'mid' | 'high';

export interface IndustryServiceDefinition {
  id: string;
  industryId: IndustryId;
  name: string;
  duration: number;
  price: number;
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
  pricingCategory?: ServicePricingCategory; // low, mid, or high end pricing
  weightage?: number; // Weight for random selection (higher = more likely to be selected)
}

export interface IndustrySimulationConfig {
  id: IndustryId;
  businessMetrics: BusinessMetrics;
  businessStats: BusinessStats;
  movement: MovementConfig;
  map: MapConfig;
  layout: SimulationLayoutConfig;
  services: IndustryServiceDefinition[];
  upgrades: UpgradeDefinition[];
  events: GameEvent[];
  customerImages: string[];
  defaultCustomerImage: string;
}
