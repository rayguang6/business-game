import { GameEvent } from '@/lib/types/gameEvents';

export type IndustryId = string;

export const DEFAULT_INDUSTRY_ID: IndustryId = 'freelance';

export interface BusinessMetrics {
  startingCash: number;
  startingTime?: number; // Optional monthly available time (hours)
  monthlyExpenses: number;
  startingExp: number; // Previously: startingSkillLevel
}

export interface BusinessStats {
  ticksPerSecond: number;
  monthDurationSeconds: number;
  leadsPerMonth: number; // Leads spawned per industry month (replaces spawnIntervalSeconds)
  customerPatienceSeconds: number;
  leavingAngryDurationTicks: number;
  customerSpawnPosition: {
    x: number;
    y: number;
  };
  serviceCapacity: number;
  expGainPerHappyCustomer: number; // Previously: skillLevelGainPerHappyCustomer
  expLossPerAngryCustomer: number; // Previously: skillLevelLossPerAngryCustomer
  expPerLevel: number | number[]; // Experience points required per level
  // If number: flat EXP requirement for all levels (backward compatible)
  // If array: EXP required to progress from level N to level N+1
  //   array[0] = EXP needed to go from level 1 to 2
  //   array[1] = EXP needed to go from level 2 to 3
  //   etc.
  // baseHappyProbability removed - customers are happy/angry based on patience, not probability
  eventTriggerSeconds?: number[];
  serviceRevenueMultiplier: number;
  serviceRevenueScale?: number;
  conversionRate?: number; // How much progress each lead adds toward customer conversion
  failureRate?: number; // Base failure rate percentage (0-100)
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
  // priority removed - effects are applied by type order (Add → Percent → Multiply → Set)
  // source removed - will be auto-generated when registering with effectManager
}

/**
 * Requirement with explicit type and value support
 * - type: specifies the requirement type (flag, upgrade, metric, staff)
 * - id: identifier for the requirement (flag ID, upgrade ID, metric name, staff role ID)
 * - expected: for flag - true means must be met, false means must NOT be met
 * - operator: for numeric types (upgrade, metric, staff) - comparison operator
 * - value: for numeric types - the value to compare against
 */
export interface Requirement {
  type: 'flag' | 'upgrade' | 'metric' | 'staff';
  id: string;
  expected?: boolean;  // For flag: true = must be met, false = must NOT be met
  operator?: '>=' | '<=' | '>' | '<' | '==';  // For numeric types: comparison operator
  value?: number;      // For numeric types: value to compare against
}

export interface UpgradeLevelConfig {
  level: number;
  name: string;
  description?: string;
  icon?: string;
  cost: number;
  timeCost?: number;
  effects: UpgradeEffect[];
}

export interface Category {
  id: string;
  industryId?: IndustryId; // Optional - categories are industry-specific
  name: string;
  orderIndex: number; // Display order (lower = shown first)
  description?: string;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  categoryId?: string; // Optional reference to categories table
  setsFlag?: string; // Optional flag to set when this upgrade is purchased
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
  levels: UpgradeLevelConfig[]; // Required - level-specific configs
  order?: number; // Display order (lower = shown first, defaults to 0)
}

export type UpgradeId = UpgradeDefinition['id'];

export interface BaseUpgradeMetrics {
  monthlyExpenses: number;
  leadsPerMonth: number; // Leads per month (replaces spawnIntervalSeconds)
  serviceSpeedMultiplier: number;
  exp: number; // Direct exp (effects modify this directly)
  serviceCapacity: number;
  // happyProbability removed - not used in game mechanics
  serviceRevenueMultiplier: number;
  serviceRevenueFlatBonus: number;
  // Tier-specific service modifiers (default to 1 if not specified)
  highTierServiceRevenueMultiplier?: number;
  highTierServiceWeightageMultiplier?: number;
  midTierServiceRevenueMultiplier?: number;
  midTierServiceWeightageMultiplier?: number;
  lowTierServiceRevenueMultiplier?: number;
  lowTierServiceWeightageMultiplier?: number;
}

export type FacingDirection = 'down' | 'left' | 'up' | 'right';

export type AnchorPoint = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'center-left'
  | 'center' 
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface GridPosition {
  x: number;
  y: number;
  facingDirection?: FacingDirection; // Optional: facing direction for this position (used for waiting/service positions)
  // Optional: for multi-tile graphics
  width?: number;  // Width in tiles (default: 1)
  height?: number; // Height in tiles (default: 1)
  anchor?: AnchorPoint; // Anchor point for positioning (default: 'top-left')
}

export interface ServiceRoomConfig {
  roomId: number;
  customerPosition: GridPosition;
  staffPosition: GridPosition;
}

export interface SimulationLayoutConfig {
  entryPosition: GridPosition;
  waitingPositions: GridPosition[];
  serviceRooms: ServiceRoomConfig[];
  staffPositions: GridPosition[];
  mainCharacterPosition?: GridPosition; // Optional position for main character (founder)
  mainCharacterSpriteImage?: string; // Optional sprite image path for main character
}

export type ServicePricingCategory = 'low' | 'mid' | 'high';

export type ServiceTier = 'small' | 'medium' | 'big';

export interface IndustryServiceDefinition {
  id: string;
  industryId: IndustryId;
  name: string;
  duration: number;
  price: number;
  tier?: ServiceTier; // Progression tier (basic/professional/enterprise)
  expGained?: number; // Experience points awarded on successful completion
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
  pricingCategory?: ServicePricingCategory; // low, mid, or high end pricing
  weightage?: number; // Weight for random selection (higher = more likely to be selected)
  requiredStaffRoleIds?: string[]; // Array of staff role IDs that can perform this service (if empty/null, any staff can perform)
  timeCost?: number; // Amount of time this service costs (0 = no time cost)
  order?: number; // Display order (lower = shown first, defaults to 0)
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
