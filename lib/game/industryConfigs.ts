import {
  BusinessMetrics,
  BusinessStats,
  MovementConfig,
  MapConfig,
  SimulationLayoutConfig,
  IndustrySimulationConfig,
  IndustryId,
  DEFAULT_INDUSTRY_ID,
} from './types';

// -----------------------------------------------------------------------------
// Shared
// -----------------------------------------------------------------------------
const DEFAULT_BUSINESS_METRICS: BusinessMetrics = {
  startingCash: 15000,
  monthlyExpenses: 5000,
  startingSkillLevel: 10, // Previously: startingReputation
  startingFreedomScore: 360, // Previously: founderWorkHours - 12 hours * 30 days
} as const;

const DEFAULT_BUSINESS_STATS: BusinessStats = {
  ticksPerSecond: 10,
  monthDurationSeconds: 60,
  customerSpawnIntervalSeconds: 3,
  customerPatienceSeconds: 10,
  leavingAngryDurationTicks: 10,
  customerSpawnPosition: {
    x: 4,
    y: 9,
  },
  treatmentRooms: 2,
  skillLevelGainPerHappyCustomer: 1, // Previously: reputationGainPerHappyCustomer
  skillLevelLossPerAngryCustomer: 1, // Previously: reputationLossPerAngryCustomer
  // baseHappyProbability removed - not used in game mechanics
  eventTriggerSeconds: [15, 30, 45],
  serviceRevenueMultiplier: 1,
  serviceRevenueScale: 10,
} as const;

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  customerTilesPerTick: 0.25,
  animationReferenceTilesPerTick: 0.25,
  walkFrameDurationMs: 200,
  minWalkFrameDurationMs: 80,
  maxWalkFrameDurationMs: 320,
  celebrationFrameDurationMs: 200,
} as const;

export const DEFAULT_GLOBAL_SIMULATION_CONFIG: {
  businessMetrics: BusinessMetrics;
  businessStats: BusinessStats;
  movement: MovementConfig;
} = {
  businessMetrics: { ...DEFAULT_BUSINESS_METRICS },
  businessStats: { ...DEFAULT_BUSINESS_STATS },
  movement: { ...DEFAULT_MOVEMENT_CONFIG },
};

const DEFAULT_MAP_CONFIG: MapConfig = {
  width: 10,
  height: 10,
  walls: [

    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 3, y: 4 },
  ],
} as const;

const DEFAULT_LAYOUT: SimulationLayoutConfig = {
  entryPosition: { x: 4, y: 9 },
  waitingPositions: [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 1, y: 4 },
    { x: 1, y: 5 },
    { x: 1, y: 6 },
    { x: 1, y: 7 },
    { x: 1, y: 8 },
  ],
  serviceRoomPositions: [
    { x: 5, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 2 },
    { x: 8, y: 2 },
    { x: 9, y: 2 },
  ],
  staffPositions: [
    { x: 4, y: 0 },
    { x: 5, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
    { x: 8, y: 0 },
    { x: 9, y: 0 },
    { x: 4, y: 1 },
    { x: 5, y: 1 },
  ],
} as const;

const DEFAULT_CUSTOMER_IMAGES = [
  '/images/customer/customer1.png',
  '/images/customer/customer2.png',
  '/images/customer/customer3.png',
  '/images/customer/customer4.png',
  '/images/customer/customer5.png',
  '/images/customer/customer6.png',
  '/images/customer/customer7.png',
  '/images/customer/customer8.png',
  '/images/customer/customer9.png',
  '/images/customer/customer10.png',
];

function createSharedBase(): Omit<IndustrySimulationConfig, 'id' | 'services' | 'upgrades' | 'events'> {
  return {
    businessMetrics: { ...DEFAULT_GLOBAL_SIMULATION_CONFIG.businessMetrics },
    businessStats: { ...DEFAULT_GLOBAL_SIMULATION_CONFIG.businessStats },
    movement: { ...DEFAULT_GLOBAL_SIMULATION_CONFIG.movement },
    map: { ...DEFAULT_MAP_CONFIG, walls: [...DEFAULT_MAP_CONFIG.walls] },
    layout: {
      entryPosition: { ...DEFAULT_LAYOUT.entryPosition },
      waitingPositions: DEFAULT_LAYOUT.waitingPositions.map((pos) => ({ ...pos })),
      serviceRoomPositions: DEFAULT_LAYOUT.serviceRoomPositions.map((pos) => ({ ...pos })),
      staffPositions: DEFAULT_LAYOUT.staffPositions.map((pos) => ({ ...pos })),
    },
    customerImages: [...DEFAULT_CUSTOMER_IMAGES],
    defaultCustomerImage: DEFAULT_CUSTOMER_IMAGES[0],
  };
}

export function createDefaultSimulationConfig(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustrySimulationConfig {
  return {
    id: industryId,
    ...createSharedBase(),
    services: [],
    upgrades: [],
    events: [],
  };
}
