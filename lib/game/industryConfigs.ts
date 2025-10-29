// import { sampleEvents } from './events';
import type { GameEvent } from '@/lib/types/gameEvents';
import {
  BusinessMetrics,
  BusinessStats,
  MovementConfig,
  MapConfig,
  SimulationLayoutConfig,
  IndustryServiceDefinition,
  UpgradeDefinition,
  IndustrySimulationConfig,
  IndustryId,
  DEFAULT_INDUSTRY_ID,
} from './types';
import { GameMetric, EffectType } from './effectManager';

// -----------------------------------------------------------------------------
// Shared
// -----------------------------------------------------------------------------
const DEFAULT_BUSINESS_METRICS: BusinessMetrics = {
  startingCash: 15000,
  monthlyExpenses: 5000,
  startingReputation: 10,
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
  reputationGainPerHappyCustomer: 1,
  reputationLossPerAngryCustomer: 1,
  baseHappyProbability: 1,
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

let GLOBAL_BUSINESS_METRICS: BusinessMetrics = { ...DEFAULT_BUSINESS_METRICS };
let GLOBAL_BUSINESS_STATS: BusinessStats = { ...DEFAULT_BUSINESS_STATS };
let GLOBAL_MOVEMENT_CONFIG: MovementConfig = { ...DEFAULT_MOVEMENT_CONFIG };

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

// -----------------------------------------------------------------------------
// Industry Specific
// -----------------------------------------------------------------------------
/*
// NOTE: legacy service definitions retained for reference/seeding.
const SERVICE_DEFINITIONS: IndustryServiceDefinition[] = [
  { id: 'dental_cleaning', industryId: 'dental', name: 'Teeth Cleaning', duration: 5, price: 500 },
  { id: 'dental_filling', industryId: 'dental', name: 'Cavity Filling', duration: 5, price: 700 },
  { id: 'dental_root_canal', industryId: 'dental', name: 'Root Canal', duration: 5, price: 1000 },
  { id: 'restaurant_fast_meal', industryId: 'restaurant', name: 'Express Meal', duration: 5, price: 60 },
  { id: 'restaurant_full_course', industryId: 'restaurant', name: 'Full Course Dinner', duration: 9, price: 90 },
  { id: 'restaurant_family_combo', industryId: 'restaurant', name: 'Family Combo', duration: 12, price: 130 },
  { id: 'gym_quick_session', industryId: 'gym', name: 'Quick Training Session', duration: 5, price: 65 },
  { id: 'gym_group_class', industryId: 'gym', name: 'Group Fitness Class', duration: 8, price: 95 },
  { id: 'gym_personal_training', industryId: 'gym', name: 'Personal Training', duration: 11, price: 140 },
];

// NOTE: legacy upgrade definitions retained below for reference/seeding.
const DENTAL_UPGRADES: UpgradeDefinition[] = [
  ...
];

const RESTAURANT_UPGRADES: UpgradeDefinition[] = [
  ...
];

const GYM_UPGRADES: UpgradeDefinition[] = [
  ...
];

const DENTAL_EVENTS: GameEvent[] = [...sampleEvents];

const RESTAURANT_EVENTS: GameEvent[] = [
  {
    id: 'restaurant-food-critic',
    title: 'Food Critic Visit',
    category: 'opportunity',
    summary: 'A famous critic drops by for dinner without reservations.',
    choices: [
      {
        id: 'business-as-usual',
        label: 'Business as Usual',
        description: 'Treat them like any other guest.',
        consequences: [
          {
            id: 'pleasantly-surprised',
            label: 'Pleasantly Surprised',
            weight: 40,
            effects: [
              { type: 'reputation', amount: 1 },
            ],
          },
          {
            id: 'no-coverage',
            label: 'No Coverage',
            weight: 40,
            effects: [],
          },
          {
            id: 'critical-piece',
            label: 'Critical Piece',
            weight: 20,
            effects: [
              { type: 'reputation', amount: -3 },
            ],
          },
        ],
      },
      {
        id: 'comp-service',
        label: 'Comp an Elegant Meal',
        description: 'Pull out your best dishes and comp the meal.',
        cost: 200,
        consequences: [
          {
            id: 'rave-review',
            label: 'Rave Review Published',
            weight: 50,
            effects: [
              { type: 'cash', amount: 400 },
              { type: 'reputation', amount: 6 },
            ],
          },
          {
            id: 'pleasant-dinner',
            label: 'Pleasant Dinner',
            weight: 30,
            effects: [
              { type: 'reputation', amount: 4 },
            ],
          },
          {
            id: 'lukewarm-response',
            label: 'Lukewarm Response',
            weight: 20,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'restaurant-supply-shortage',
    title: 'Supply Shortage',
    category: 'risk',
    summary: 'Your seafood supplier calls to say shipments are delayed.',
    choices: [
      {
        id: 'limited-menu',
        label: 'Run a Limited Menu',
        description: 'Explain the shortage to diners and reduce your offerings.',
        cost: 100,
        consequences: [
          {
            id: 'understanding-guests',
            label: 'Guests Understand',
            weight: 50,
            effects: [
              { type: 'reputation', amount: -2 },
            ],
          },
          {
            id: 'walk-outs',
            label: 'Walk-Outs Increase',
            weight: 30,
            effects: [
              { type: 'reputation', amount: -4 },
              { type: 'cash', amount: -50 },
            ],
          },
          {
            id: 'make-the-best',
            label: 'Make the Best of It',
            weight: 20,
            effects: [
              { type: 'cash', amount: -200 },
            ],
          },
        ],
      },
      {
        id: 'source-locally',
        label: 'Source Locally',
        description: 'Pay a premium to replace ingredients locally.',
        cost: 300,
        consequences: [
          {
            id: 'fresh-flavors',
            label: 'Fresh New Flavors',
            weight: 60,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
          {
            id: 'supply-gap',
            label: 'Supply Gap',
            weight: 25,
            effects: [
              { type: 'reputation', amount: 1 },
              { type: 'cash', amount: -100 },
            ],
          },
          {
            id: 'mixed-feedback',
            label: 'Mixed Customer Feedback',
            weight: 15,
            effects: [],
          },
        ],
      },
    ],
  },
];

const GYM_EVENTS: GameEvent[] = [
  {
    id: 'gym-equipment-upgrade',
    title: 'Equipment Upgrade Offer',
    category: 'opportunity',
    summary: 'A vendor offers premium treadmills at a discount.',
    choices: [
      {
        id: 'decline',
        label: 'Decline for Now',
        description: 'Save money and stick with current equipment.',
        consequences: [
          {
            id: 'status-quo',
            label: 'Status Quo',
            weight: 60,
            effects: [],
          },
          {
            id: 'members-disappointed',
            label: 'Members Disappointed',
            weight: 25,
            effects: [
              { type: 'reputation', amount: -2 },
            ],
          },
          {
            id: 'membership-drop',
            label: 'Membership Drop',
            weight: 15,
            effects: [
              { type: 'reputation', amount: -1 },
              { type: 'cash', amount: -100 },
            ],
          },
        ],
      },
      {
        id: 'buy-upgrade',
        label: 'Upgrade Equipment',
        description: 'Invest in the new machines to impress your members.',
        cost: 400,
        consequences: [
          {
            id: 'members-thrilled',
            label: 'Members Are Thrilled',
            weight: 50,
            effects: [
              { type: 'reputation', amount: 4 },
            ],
          },
          {
            id: 'buzz-surge',
            label: 'Social Buzz Surge',
            weight: 30,
            effects: [
              { type: 'cash', amount: 200 },
              { type: 'reputation', amount: 5 },
            ],
          },
          {
            id: 'slow-adoption',
            label: 'Slow Adoption',
            weight: 20,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gym-trainer-conflict',
    title: 'Trainer Conflict',
    category: 'risk',
    summary: 'Two trainers argue about class schedules in front of clients.',
    choices: [
      {
        id: 'let-it-pass',
        label: 'Let It Pass',
        description: 'Trust them to resolve it on their own.',
        consequences: [
          {
            id: 'resentment-builds',
            label: 'Resentment Builds',
            weight: 50,
            effects: [
              { type: 'reputation', amount: -3 },
            ],
          },
          {
            id: 'full-blown-drama',
            label: 'Full-Blown Drama',
            weight: 30,
            effects: [
              { type: 'reputation', amount: -5 },
            ],
          },
          {
            id: 'self-resolution',
            label: 'They Self-Resolve',
            weight: 20,
            effects: [
              { type: 'reputation', amount: -1 },
            ],
          },
        ],
      },
      {
        id: 'mediate',
        label: 'Mediate Immediately',
        description: 'Bring them into your office and work out a plan.',
        cost: 50,
        consequences: [
          {
            id: 'team-unity',
            label: 'Team Unity Restored',
            weight: 60,
            effects: [
              { type: 'reputation', amount: 3 },
            ],
          },
          {
            id: 'mutual-compromise',
            label: 'Mutual Compromise',
            weight: 25,
            effects: [
              { type: 'reputation', amount: 2 },
            ],
          },
          {
            id: 'overtime-bill',
            label: 'Overtime Bill',
            weight: 15,
            effects: [
              { type: 'cash', amount: -150 },
            ],
          },
        ],
      },
    ],
  },
];
*/

const SERVICES_BY_INDUSTRY: Record<string, IndustryServiceDefinition[]> = {};
const UPGRADES_BY_INDUSTRY: Record<string, UpgradeDefinition[]> = {};
const EVENTS_BY_INDUSTRY: Record<string, GameEvent[]> = {};

function createSharedBase(): Omit<IndustrySimulationConfig, 'id' | 'services' | 'upgrades' | 'events'> {
  return {
    businessMetrics: { ...GLOBAL_BUSINESS_METRICS },
    businessStats: { ...GLOBAL_BUSINESS_STATS },
    movement: { ...GLOBAL_MOVEMENT_CONFIG },
    map: { ...DEFAULT_MAP_CONFIG, walls: [...DEFAULT_MAP_CONFIG.walls] },
    layout: {
      entryPosition: { ...DEFAULT_LAYOUT.entryPosition },
      waitingPositions: DEFAULT_LAYOUT.waitingPositions.map((pos) => ({ ...pos })),
      serviceRoomPositions: DEFAULT_LAYOUT.serviceRoomPositions.map((pos) => ({ ...pos })),
    },
    customerImages: [...DEFAULT_CUSTOMER_IMAGES],
    defaultCustomerImage: DEFAULT_CUSTOMER_IMAGES[0],
  };
}

function getStaticServicesForIndustry(industryId: IndustryId): IndustryServiceDefinition[] {
  const services = SERVICES_BY_INDUSTRY[industryId] ?? [];
  return services.map((service) => ({ ...service }));
}

function getStaticUpgradesForIndustry(industryId: IndustryId): UpgradeDefinition[] {
  const upgrades = UPGRADES_BY_INDUSTRY[industryId] ?? [];
  return upgrades.map((upgrade) => ({
    ...upgrade,
    effects: upgrade.effects.map((effect) => ({ ...effect })),
  }));
}

function getStaticEventsForIndustry(industryId: IndustryId): GameEvent[] {
  const events = EVENTS_BY_INDUSTRY[industryId] ?? [];
  return events.map((event) => ({
    ...event,
    choices: event.choices.map((choice) => ({
      ...choice,
      consequences: choice.consequences.map((consequence) => ({
        ...consequence,
        effects: consequence.effects.map((effect) => ({ ...effect })),
        temporaryEffects: (consequence.temporaryEffects ?? []).map((effect) => ({ ...effect })),
      })),
    })),
  }));
}

export function getGlobalSimulationConfigValues(): {
  businessMetrics: BusinessMetrics;
  businessStats: BusinessStats;
  movement: MovementConfig;
} {
  return {
    businessMetrics: { ...GLOBAL_BUSINESS_METRICS },
    businessStats: { ...GLOBAL_BUSINESS_STATS },
    movement: { ...GLOBAL_MOVEMENT_CONFIG },
  };
}

export function setGlobalSimulationConfigValues(
  config: Partial<{
    businessMetrics: BusinessMetrics;
    businessStats: BusinessStats;
    movement: MovementConfig;
  }>,
): void {
  if (config.businessMetrics) {
    GLOBAL_BUSINESS_METRICS = { ...config.businessMetrics };
  }

  if (config.businessStats) {
    GLOBAL_BUSINESS_STATS = { ...config.businessStats };
  }

  if (config.movement) {
    GLOBAL_MOVEMENT_CONFIG = { ...config.movement };
  }

  Object.values(INDUSTRY_SIMULATION_CONFIGS).forEach((entry) => {
    entry.businessMetrics = { ...GLOBAL_BUSINESS_METRICS };
    entry.businessStats = { ...GLOBAL_BUSINESS_STATS };
    entry.movement = { ...GLOBAL_MOVEMENT_CONFIG };
  });
}

export function getGlobalMovementConfig(): MovementConfig {
  return { ...GLOBAL_MOVEMENT_CONFIG };
}

const INDUSTRY_SIMULATION_CONFIGS: Record<string, IndustrySimulationConfig> = {
  [DEFAULT_INDUSTRY_ID]: {
    id: DEFAULT_INDUSTRY_ID,
    ...createSharedBase(),
    services: getStaticServicesForIndustry(DEFAULT_INDUSTRY_ID),
    upgrades: getStaticUpgradesForIndustry(DEFAULT_INDUSTRY_ID),
    events: getStaticEventsForIndustry(DEFAULT_INDUSTRY_ID),
  },
  restaurant: {
    id: 'restaurant',
    ...createSharedBase(),
    services: getStaticServicesForIndustry('restaurant'),
    upgrades: getStaticUpgradesForIndustry('restaurant'),
    events: getStaticEventsForIndustry('restaurant'),
  },
  gym: {
    id: 'gym',
    ...createSharedBase(),
    services: getStaticServicesForIndustry('gym'),
    upgrades: getStaticUpgradesForIndustry('gym'),
    events: getStaticEventsForIndustry('gym'),
  },
};

export function getIndustrySimulationConfig(industryId: IndustryId): IndustrySimulationConfig {
  return INDUSTRY_SIMULATION_CONFIGS[industryId] ?? INDUSTRY_SIMULATION_CONFIGS[DEFAULT_INDUSTRY_ID];
}

export function getAllSimulationConfigs(): IndustrySimulationConfig[] {
  return Object.values(INDUSTRY_SIMULATION_CONFIGS);
}

export function setIndustryServices(
  industryId: IndustryId,
  services: IndustryServiceDefinition[],
): void {
  const nextServices = services.map((service) => ({ ...service }));
  SERVICES_BY_INDUSTRY[industryId] = nextServices.map((service) => ({ ...service }));

  const config = INDUSTRY_SIMULATION_CONFIGS[industryId];
  if (config) {
    config.services = nextServices;
    return;
  }

  INDUSTRY_SIMULATION_CONFIGS[industryId] = {
    id: industryId,
    ...createSharedBase(),
    services: nextServices,
    upgrades: getStaticUpgradesForIndustry(industryId),
    events: getStaticEventsForIndustry(industryId),
  };
}

export function setIndustryUpgrades(
  industryId: IndustryId,
  upgrades: UpgradeDefinition[],
): void {
  const nextUpgrades = upgrades.map((upgrade) => ({
    ...upgrade,
    effects: upgrade.effects.map((effect) => ({ ...effect })),
  }));

  UPGRADES_BY_INDUSTRY[industryId] = nextUpgrades.map((upgrade) => ({
    ...upgrade,
    effects: upgrade.effects.map((effect) => ({ ...effect })),
  }));

  const config = INDUSTRY_SIMULATION_CONFIGS[industryId];
  if (config) {
    config.upgrades = nextUpgrades;
    return;
  }

  INDUSTRY_SIMULATION_CONFIGS[industryId] = {
    id: industryId,
    ...createSharedBase(),
    services: getStaticServicesForIndustry(industryId),
    upgrades: nextUpgrades,
    events: getStaticEventsForIndustry(industryId),
  };
}

export function setIndustryEvents(industryId: IndustryId, events: GameEvent[]): void {
  const nextEvents = events.map((event) => ({
    ...event,
    choices: event.choices.map((choice) => ({
      ...choice,
      consequences: choice.consequences.map((consequence) => ({
        ...consequence,
        effects: consequence.effects.map((effect) => ({ ...effect })),
        temporaryEffects: (consequence.temporaryEffects ?? []).map((effect) => ({ ...effect })),
      })),
    })),
  }));

  EVENTS_BY_INDUSTRY[industryId] = nextEvents.map((event) => ({
    ...event,
    choices: event.choices.map((choice) => ({
      ...choice,
      consequences: choice.consequences.map((consequence) => ({
        ...consequence,
        effects: consequence.effects.map((effect) => ({ ...effect })),
        temporaryEffects: (consequence.temporaryEffects ?? []).map((effect) => ({ ...effect })),
      })),
    })),
  }));

  const config = INDUSTRY_SIMULATION_CONFIGS[industryId];
  if (config) {
    config.events = nextEvents;
    return;
  }

  INDUSTRY_SIMULATION_CONFIGS[industryId] = {
    id: industryId,
    ...createSharedBase(),
    services: getStaticServicesForIndustry(industryId),
    upgrades: getStaticUpgradesForIndustry(industryId),
    events: nextEvents,
  };
}
