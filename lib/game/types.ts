import { GameEvent } from '@/lib/types/gameEvents';

export type IndustryId = 'dental' | 'restaurant' | 'gym';

export interface BusinessMetrics {
  startingCash: number;
  weeklyExpenses: number;
  startingReputation: number;
}

export interface BusinessStats {
  ticksPerSecond: number;
  weekDurationSeconds: number;
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

export type UpgradeMetric =
  | 'weeklyExpenses'
  | 'spawnIntervalSeconds'
  | 'serviceSpeedMultiplier'
  | 'reputationMultiplier'
  | 'treatmentRooms';

export type UpgradeEffectType = 'add' | 'percent';

export interface UpgradeEffect {
  metric: UpgradeMetric;
  type: UpgradeEffectType;
  value: number;
  source: string;
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
  weeklyExpenses: number;
  spawnIntervalSeconds: number;
  serviceSpeedMultiplier: number;
  reputationMultiplier: number;
  treatmentRooms: number;
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
