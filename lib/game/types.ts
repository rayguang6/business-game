import { GameEvent } from '@/lib/types/gameEvents';

export enum IndustryId {
  Dental = 'dental',
  Restaurant = 'restaurant',
  Gym = 'gym',
}

export interface BusinessMetrics {
  startingCash: number;
  monthlyExpenses: number;
  startingReputation: number;
}

export interface BusinessStats {
  ticksPerSecond: number;
  monthDurationSeconds: number;
  customerSpawnIntervalSeconds: number;
  customerPatienceSeconds: number;
  leavingAngryDurationTicks: number;
  customerSpawnArea: {
    x: { min: number; max: number };
    y: { min: number; max: number };
  };
  waitingChairs: number;
  treatmentRooms: number;
  reputationGainPerHappyCustomer: number;
  reputationLossPerAngryCustomer: number;
  baseHappyProbability: number;
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

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  maxLevel: number;
  effects: UpgradeEffect[];
}

export type UpgradeId = UpgradeDefinition['id'];

export interface BaseUpgradeMetrics {
  monthlyExpenses: number;
  spawnIntervalSeconds: number;
  serviceSpeedMultiplier: number;
  reputationMultiplier: number;
  treatmentRooms: number;
  happyProbability: number;
  serviceRevenueMultiplier: number;
  serviceRevenueFlatBonus: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface SimulationLayoutConfig {
  entryPosition: GridPosition;
  waitingPositions: GridPosition[];
  serviceRoomPositions: GridPosition[];
}

export interface IndustryServiceDefinition {
  id: string;
  name: string;
  duration: number;
  price: number;
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
