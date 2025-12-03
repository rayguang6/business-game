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
// Shared - Global Defaults
// -----------------------------------------------------------------------------
// These are the recommended global defaults that work for most industries.
// Industries can override specific values that differ from these defaults.
//
// Global (set once, shared):
// - Game engine timing (ticksPerSecond, monthDurationSeconds, leavingAngryDurationTicks)
// - Game pacing (eventTriggerSeconds)
// - Default balance values (expGainPerHappyCustomer, expLossPerAngryCustomer, conversionRate)
// - Reasonable defaults (customerSpawnIntervalSeconds, customerPatienceSeconds, etc.)
//
// Industry-specific (commonly overridden):
// - Starting values (startingCash, monthlyExpenses) - vary significantly by industry
// - Customer behavior (customerSpawnIntervalSeconds, customerPatienceSeconds) - varies by industry
// - Revenue models (serviceRevenueMultiplier, serviceRevenueScale) - varies by industry
// - Risk levels (failureRate) - varies by industry
// - Map positions (customerSpawnPosition, serviceCapacity) - unique per industry
const DEFAULT_BUSINESS_METRICS: BusinessMetrics = {
  // Generic defaults - industries should override these
  startingCash: 10000, // Generic default - industries typically override (freelance: 3000, dental: 15000, restaurant: 20000)
  monthlyExpenses: 3000, // Generic default - industries typically override (freelance: 1000, dental: 5000, restaurant: 8000)
  // Global defaults - rarely overridden
  startingExp: 10, // Everyone starts at same skill level
  startingFreedomScore: 360, // Standard starting freedom (12 hours * 30 days) - industries can override for special cases
} as const;

const DEFAULT_BUSINESS_STATS: BusinessStats = {
  // Game engine timing (GLOBAL - never change)
  ticksPerSecond: 10,
  monthDurationSeconds: 60,
  leavingAngryDurationTicks: 10,
  
  // Game pacing (GLOBAL - shared across industries)
  eventTriggerSeconds: [15, 30, 45],
  
  // Default balance values (GLOBAL - override only if needed for balance)
  expGainPerHappyCustomer: 2, // Default EXP gain - industries can override if needed
  expLossPerAngryCustomer: 1, // Default EXP loss - industries can override if needed
  conversionRate: 10, // Default conversion rate - industries can override (freelance: 15, luxury: 5)
  
  // Reasonable defaults (GLOBAL - industries commonly override)
  customerSpawnIntervalSeconds: 3, // Default spawn rate - industries override (fast food: 1.5, consulting: 5)
  customerPatienceSeconds: 10, // Default patience - industries override (fast food: 5, spa: 15)
  serviceRevenueMultiplier: 1, // Default pricing - industries override (dental: 1.2, restaurant: 0.8)
  serviceRevenueScale: 10, // Default revenue scale - industries override (freelance: 5, restaurant: 15)
  failureRate: 0, // Default no failures - industries override (restaurant: 20, medical: 5)
  
  // Industry-specific defaults (industries should override)
  customerSpawnPosition: {
    x: 4,
    y: 9,
  }, // Map-specific - each industry has different layout
  serviceCapacity: 2, // Industry-specific - different concepts (chairs, tables, booths)
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
  // New structured format: service rooms with customer and staff positions
  serviceRooms: [
    { roomId: 1, customerPosition: { x: 5, y: 2 }, staffPosition: { x: 5, y: 1 } },
    { roomId: 2, customerPosition: { x: 6, y: 2 }, staffPosition: { x: 6, y: 1 } },
    { roomId: 3, customerPosition: { x: 7, y: 2 }, staffPosition: { x: 7, y: 1 } },
    { roomId: 4, customerPosition: { x: 8, y: 2 }, staffPosition: { x: 8, y: 1 } },
    { roomId: 5, customerPosition: { x: 9, y: 2 }, staffPosition: { x: 9, y: 1 } },
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
  mainCharacterPosition: { x: 4, y: 0 }, // Default main character position (first staff position)
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
      serviceRooms: DEFAULT_LAYOUT.serviceRooms?.map((room) => ({
        roomId: room.roomId,
        customerPosition: { ...room.customerPosition },
        staffPosition: { ...room.staffPosition },
      })),
      staffPositions: DEFAULT_LAYOUT.staffPositions.map((pos) => ({ ...pos })),
      mainCharacterPosition: DEFAULT_LAYOUT.mainCharacterPosition
        ? { ...DEFAULT_LAYOUT.mainCharacterPosition }
        : undefined,
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
