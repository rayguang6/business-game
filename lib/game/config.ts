/**
 * Centralized game configuration
 * ------------------------------
 * This module is the single source of truth for all balance numbers that drive the
 * business simulation. The most important business metrics live right at the top so
 * designers can tweak them without hunting through the file.
 */

// -----------------------------------------------------------------------------
// TOP-LEVEL BUSINESS METRICS (edit these first!)
// -----------------------------------------------------------------------------

export const BUSINESS_METRICS = {
  startingCash: 3000,
  weeklyExpenses: 800,
  startingReputation: 0,
} as const;

export const BUSINESS_STATS = {
  ticksPerSecond: 10,
  weekDurationSeconds: 30,
  customerSpawnIntervalSeconds: 3,
  customerPatienceSeconds: 10,
  leavingAngryDurationTicks: 10,
  customerSpawnArea: {
    x: { min: 50, max: 350 },
    y: { min: 50, max: 250 },
  },
  waitingChairs: 4,
  treatmentRooms: 2,
  reputationGainPerHappyCustomer: 1,
  reputationLossPerAngryCustomer: 1,
  baseHappyProbability: 0.7,
} as const;

// -----------------------------------------------------------------------------
// CORE GAME TIMING (derived from BUSINESS_STATS)
// -----------------------------------------------------------------------------

export const TICKS_PER_SECOND = BUSINESS_STATS.ticksPerSecond;
export const TICK_INTERVAL_MS = Math.round((1 / BUSINESS_STATS.ticksPerSecond) * 1000);
export const ROUND_DURATION_SECONDS = BUSINESS_STATS.weekDurationSeconds;

// -----------------------------------------------------------------------------
// CUSTOMER CONFIGURATION
// -----------------------------------------------------------------------------

export const CUSTOMER_CONFIG = {
  SPAWN_AREA: BUSINESS_STATS.customerSpawnArea,
  MAX_WAITING_CHAIRS: BUSINESS_STATS.waitingChairs,
  MAX_TREATMENT_ROOMS: BUSINESS_STATS.treatmentRooms,
  IMAGES: [
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
  ],
  DEFAULT_IMAGE: '/images/customer/customer1.png',
} as const;

// -----------------------------------------------------------------------------
// SERVICES
// -----------------------------------------------------------------------------

export const SERVICE_CONFIG = {
  DENTAL_SERVICES: [
    {
      id: 'dental_cleaning',
      name: 'Teeth Cleaning',
      duration: 6,
      price: 100,
    },
    {
      id: 'dental_filling',
      name: 'Cavity Filling',
      duration: 8,
      price: 200,
    },
    {
      id: 'dental_root_canal',
      name: 'Root Canal',
      duration: 10,
      price: 300,
    },
  ],
  RESTAURANT_SERVICES: [
    {
      id: 'restaurant_fast_meal',
      name: 'Express Meal',
      duration: 5,
      price: 60,
    },
    {
      id: 'restaurant_full_course',
      name: 'Full Course Dinner',
      duration: 9,
      price: 90,
    },
    {
      id: 'restaurant_family_combo',
      name: 'Family Combo',
      duration: 12,
      price: 130,
    },
  ],
  GYM_SERVICES: [
    {
      id: 'gym_quick_session',
      name: 'Quick Training Session',
      duration: 5,
      price: 65,
    },
    {
      id: 'gym_group_class',
      name: 'Group Fitness Class',
      duration: 8,
      price: 95,
    },
    {
      id: 'gym_personal_training',
      name: 'Personal Training',
      duration: 11,
      price: 140,
    },
  ],
} as const;

// -----------------------------------------------------------------------------
// UPGRADE DEFINITIONS (SINGLE-LEVEL, DENTAL-FOCUSED)
// -----------------------------------------------------------------------------

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
  effects: UpgradeEffect[];
}

export type UpgradeId = UpgradeDefinition['id'];

export const BASE_UPGRADE_METRICS: Record<UpgradeMetric, number> = {
  weeklyExpenses: BUSINESS_METRICS.weeklyExpenses,
  spawnIntervalSeconds: BUSINESS_STATS.customerSpawnIntervalSeconds,
  serviceSpeedMultiplier: 1,
  reputationMultiplier: 1,
  treatmentRooms: BUSINESS_STATS.treatmentRooms,
};

export const DENTAL_UPGRADES: UpgradeDefinition[] = [
  {
    id: 'extra_treatment_room',
    name: 'Extra Treatment Room',
    description: 'Add another treatment room so more patients can be helped at once.',
    icon: '🦷',
    cost: 1200,
    effects: [
      { metric: 'treatmentRooms', type: 'add', value: 1, source: 'Extra Treatment Room' },
      { metric: 'weeklyExpenses', type: 'add', value: 150, source: 'Extra Treatment Room' },
    ],
  },
  {
    id: 'modern_equipment',
    name: 'Modern Equipment',
    description: 'Speed up service time with modern dental equipment.',
    icon: '⚡',
    cost: 900,
    effects: [
      { metric: 'serviceSpeedMultiplier', type: 'percent', value: -0.2, source: 'Modern Equipment' },
      { metric: 'weeklyExpenses', type: 'add', value: 90, source: 'Modern Equipment' },
    ],
  },
  {
    id: 'staff_training',
    name: 'Staff Training Program',
    description: 'Improve customer experience and reputation gains with staff coaching.',
    icon: '👩‍⚕️',
    cost: 700,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 0.25, source: 'Staff Training Program' },
      { metric: 'weeklyExpenses', type: 'add', value: 80, source: 'Staff Training Program' },
    ],
  },
  {
    id: 'marketing_blitz',
    name: 'Local Marketing Blitz',
    description: 'Bring patients in faster with a short marketing campaign.',
    icon: '📣',
    cost: 600,
    effects: [
      { metric: 'spawnIntervalSeconds', type: 'percent', value: -0.15, source: 'Local Marketing Blitz' },
      { metric: 'weeklyExpenses', type: 'add', value: 70, source: 'Local Marketing Blitz' },
    ],
  },
  {
    id: 'spa_waiting_area',
    name: 'Spa Waiting Area',
    description: 'Create a relaxing environment that keeps customers calm and patient.',
    icon: '🛋️',
    cost: 450,
    effects: [
      { metric: 'reputationMultiplier', type: 'percent', value: 0.15, source: 'Spa Waiting Area' },
      { metric: 'weeklyExpenses', type: 'add', value: 60, source: 'Spa Waiting Area' },
    ],
  },
];

const UPGRADE_LOOKUP: Record<UpgradeId, UpgradeDefinition> = DENTAL_UPGRADES.reduce(
  (lookup, upgrade) => {
    lookup[upgrade.id] = upgrade;
    return lookup;
  },
  {} as Record<UpgradeId, UpgradeDefinition>,
);

export function getUpgradeById(id: UpgradeId): UpgradeDefinition | undefined {
  return UPGRADE_LOOKUP[id];
}

export function getAllUpgrades(): UpgradeDefinition[] {
  return [...DENTAL_UPGRADES];
}

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds * TICKS_PER_SECOND);
}

export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

export function getCurrentWeek(gameTimeSeconds: number): number {
  return Math.floor(gameTimeSeconds / ROUND_DURATION_SECONDS) + 1;
}

export function getWeekProgress(gameTimeSeconds: number): number {
  const currentWeekTime = gameTimeSeconds % ROUND_DURATION_SECONDS;
  return (currentWeekTime / ROUND_DURATION_SECONDS) * 100;
}

export function isNewWeek(gameTimeSeconds: number, previousGameTime: number): boolean {
  return getCurrentWeek(gameTimeSeconds) > getCurrentWeek(previousGameTime);
}

export function calculateWeeklyRevenuePotential(): {
  customersPerWeek: number;
  averageServicePrice: number;
  potentialRevenue: number;
  realisticTarget: number;
} {
  const weekDurationSeconds = BUSINESS_STATS.weekDurationSeconds;
  const spawnIntervalSeconds = BUSINESS_STATS.customerSpawnIntervalSeconds;

  const customersPerWeek = Math.floor(weekDurationSeconds / spawnIntervalSeconds);
  const services = SERVICE_CONFIG.DENTAL_SERVICES;
  const averageServicePrice =
    services.reduce((sum, service) => sum + service.price, 0) / services.length;
  const potentialRevenue = customersPerWeek * averageServicePrice;
  const realisticTarget = potentialRevenue * 0.7;

  return {
    customersPerWeek,
    averageServicePrice,
    potentialRevenue,
    realisticTarget,
  };
}