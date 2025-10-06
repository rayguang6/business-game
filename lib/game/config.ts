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
  weeklyRent: 400,
  weeklyUtilities: 200,
  weeklySupplies: 200,
  startingReputation: 0,
  reputationGainPerHappyCustomer: 1,
  reputationLossPerAngryCustomer: 1,
  baseHappyProbability: 0.7,
} as const;

export const WEEKLY_EXPENSES = {
  rent: BUSINESS_METRICS.weeklyRent,
  utilities: BUSINESS_METRICS.weeklyUtilities,
  supplies: BUSINESS_METRICS.weeklySupplies,
} as const;

export const INITIAL_CASH = BUSINESS_METRICS.startingCash;
export const STARTING_REPUTATION = BUSINESS_METRICS.startingReputation;
export const REPUTATION_GAIN_PER_HAPPY_CUSTOMER =
  BUSINESS_METRICS.reputationGainPerHappyCustomer;
export const REPUTATION_LOSS_PER_ANGRY_CUSTOMER =
  BUSINESS_METRICS.reputationLossPerAngryCustomer;
export const BASE_HAPPY_PROBABILITY = BUSINESS_METRICS.baseHappyProbability;

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
} as const;

// -----------------------------------------------------------------------------
// CORE GAME TIMING
// -----------------------------------------------------------------------------

export const GAME_TIMING = {
  TICKS_PER_SECOND: BUSINESS_STATS.ticksPerSecond,
  TICK_INTERVAL_MS: Math.round((1 / BUSINESS_STATS.ticksPerSecond) * 1000),
  WEEK_DURATION_SECONDS: BUSINESS_STATS.weekDurationSeconds,
  CUSTOMER_SPAWN_INTERVAL_SECONDS: BUSINESS_STATS.customerSpawnIntervalSeconds,
  DEFAULT_PATIENCE_SECONDS: BUSINESS_STATS.customerPatienceSeconds,
  LEAVING_ANGRY_DURATION_TICKS: BUSINESS_STATS.leavingAngryDurationTicks,
} as const;

export const TICKS_PER_SECOND = GAME_TIMING.TICKS_PER_SECOND;
export const TICK_INTERVAL_MS = GAME_TIMING.TICK_INTERVAL_MS;
export const ROUND_DURATION_SECONDS = GAME_TIMING.WEEK_DURATION_SECONDS;
export const SECONDS_PER_WEEK = ROUND_DURATION_SECONDS;
export const CUSTOMER_SPAWN_INTERVAL_SECONDS = GAME_TIMING.CUSTOMER_SPAWN_INTERVAL_SECONDS;

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
      price: 18,
    },
    {
      id: 'restaurant_full_course',
      name: 'Full Course Dinner',
      duration: 9,
      price: 32,
    },
    {
      id: 'restaurant_family_combo',
      name: 'Family Combo',
      duration: 12,
      price: 48,
    },
  ],
  GYM_SERVICES: [
    {
      id: 'gym_quick_session',
      name: 'Quick Training Session',
      duration: 5,
      price: 25,
    },
    {
      id: 'gym_group_class',
      name: 'Group Fitness Class',
      duration: 8,
      price: 40,
    },
    {
      id: 'gym_personal_training',
      name: 'Personal Training',
      duration: 11,
      price: 70,
    },
  ],
} as const;

// -----------------------------------------------------------------------------
// UPGRADE CONFIG TYPES
// -----------------------------------------------------------------------------

export type UpgradeKey = 'treatmentRooms' | 'equipment' | 'staff' | 'marketing';

export interface UpgradeDefinition {
  name: string;
  description: string;
  icon: string;
  starting: number;
  max: number;
  costs: number[];
  weeklyExpenses?: number;
  speedMultiplier?: number[];
  qualityMultiplier?: number[];
  spawnMultiplier?: number[];
}

export type IndustryUpgradeConfig = Partial<Record<UpgradeKey, UpgradeDefinition>>;

// -----------------------------------------------------------------------------
// INDUSTRY-SPECIFIC UPGRADE CONFIGS
// -----------------------------------------------------------------------------

export const DENTAL_UPGRADES: IndustryUpgradeConfig = {
  treatmentRooms: {
    name: 'Treatment Rooms',
    description: 'More rooms for simultaneous dental procedures',
    icon: '🦷',
    starting: BUSINESS_STATS.treatmentRooms,
    max: 5,
    costs: [1000, 2500, 5000],
    weeklyExpenses: 200,
  },
  equipment: {
    name: 'Modern Equipment',
    description: 'Faster treatment times with better equipment',
    icon: '⚡',
    starting: 0,
    max: 3,
    costs: [800, 1500, 3000],
    weeklyExpenses: 150,
    speedMultiplier: [0.8, 0.6, 0.5],
  },
  staff: {
    name: 'Staff Training',
    description: 'Better trained staff for improved service quality',
    icon: '👥',
    starting: 0,
    max: 3,
    costs: [500, 1200, 2500],
    weeklyExpenses: 300,
    qualityMultiplier: [2, 3, 4],
  },
  marketing: {
    name: 'Marketing Campaign',
    description: 'Attract more customers with better marketing',
    icon: '📢',
    starting: 0,
    max: 3,
    costs: [600, 1400, 2800],
    weeklyExpenses: 100,
    spawnMultiplier: [0.7, 0.5, 0.3],
  },
};

export const RESTAURANT_UPGRADES: IndustryUpgradeConfig = {
  treatmentRooms: {
    name: 'Serving Stations',
    description: 'More stations allow serving more guests at once',
    icon: '🍽️',
    starting: 3,
    max: 6,
    costs: [1200, 2600, 5200],
    weeklyExpenses: 180,
  },
  equipment: {
    name: 'Kitchen Equipment',
    description: 'Modern appliances speed up food preparation',
    icon: '🍳',
    starting: 0,
    max: 3,
    costs: [900, 1800, 3200],
    weeklyExpenses: 200,
    speedMultiplier: [0.85, 0.65, 0.55],
  },
  staff: {
    name: 'Staff Training',
    description: 'Improved service quality and upselling skills',
    icon: '👩‍🍳',
    starting: 0,
    max: 3,
    costs: [600, 1400, 2800],
    weeklyExpenses: 260,
    qualityMultiplier: [2, 3, 4],
  },
  marketing: {
    name: 'Local Marketing',
    description: 'Attract more diners with community buzz',
    icon: '📣',
    starting: 0,
    max: 3,
    costs: [500, 1200, 2400],
    weeklyExpenses: 120,
    spawnMultiplier: [0.75, 0.55, 0.4],
  },
};

export const GYM_UPGRADES: IndustryUpgradeConfig = {
  treatmentRooms: {
    name: 'Workout Zones',
    description: 'Expand training zones for more members',
    icon: '🏋️',
    starting: 2,
    max: 5,
    costs: [1000, 2300, 4600],
    weeklyExpenses: 150,
  },
  equipment: {
    name: 'Gym Equipment',
    description: 'High-end gear boosts workout efficiency',
    icon: '💪',
    starting: 0,
    max: 3,
    costs: [850, 1700, 3000],
    weeklyExpenses: 220,
    speedMultiplier: [0.9, 0.7, 0.55],
  },
  staff: {
    name: 'Trainer Certifications',
    description: 'Advanced coaching improves member satisfaction',
    icon: '🧑‍🏫',
    starting: 0,
    max: 3,
    costs: [550, 1300, 2600],
    weeklyExpenses: 240,
    qualityMultiplier: [2, 3, 4],
  },
  marketing: {
    name: 'Membership Marketing',
    description: 'Grow membership with targeted campaigns',
    icon: '📢',
    starting: 0,
    max: 3,
    costs: [450, 1100, 2200],
    weeklyExpenses: 110,
    spawnMultiplier: [0.8, 0.6, 0.45],
  },
};

export function getUpgradesForIndustry(industry: string = 'dental'): IndustryUpgradeConfig {
  switch (industry) {
    case 'dental':
      return DENTAL_UPGRADES;
    case 'restaurant':
      return RESTAURANT_UPGRADES;
    case 'gym':
      return GYM_UPGRADES;
    default:
      return DENTAL_UPGRADES;
  }
}

export const DEFAULT_UPGRADE_VALUES = {
  TREATMENT_ROOMS_STARTING: BUSINESS_STATS.treatmentRooms,
} as const;

// -----------------------------------------------------------------------------
// DIFFICULTY CURVE CONFIGURATION
// -----------------------------------------------------------------------------

export const DIFFICULTY_CURVE = {
  WEEKS: {
    '1-3': {
      name: 'Learning Phase',
      spawnIntervalMultiplier: 1.5,
      patienceMultiplier: 1.5,
      expenseMultiplier: 0.75,
      description: 'Easy mode - learn the basics',
    },
    '4-8': {
      name: 'Growth Phase',
      spawnIntervalMultiplier: 1.0,
      patienceMultiplier: 1.2,
      expenseMultiplier: 1.0,
      description: 'Normal difficulty - optimize your business',
    },
    '9-15': {
      name: 'Pressure Phase',
      spawnIntervalMultiplier: 0.8,
      patienceMultiplier: 1.0,
      expenseMultiplier: 1.25,
      description: 'Hard mode - manage pressure points',
    },
    '16-20': {
      name: 'Challenge Phase',
      spawnIntervalMultiplier: 0.6,
      patienceMultiplier: 0.8,
      expenseMultiplier: 1.5,
      description: 'Expert mode - maximum difficulty',
    },
  },
} as const;

// -----------------------------------------------------------------------------
// UPGRADE SYSTEM CONFIGURATION
// -----------------------------------------------------------------------------

export const UPGRADE_CONFIG = {
  INFRASTRUCTURE: {
    waiting_chairs: {
      name: 'Comfortable Chairs',
      description: 'Add more waiting seats',
      icon: '🪑',
      baseCost: 200,
      maxLevel: 4,
      effect: (level: number) => CUSTOMER_CONFIG.MAX_WAITING_CHAIRS + level * 2,
      category: 'capacity',
    },
    treatment_rooms: {
      name: 'Treatment Rooms',
      description: 'More rooms for simultaneous service',
      icon: '🦷',
      baseCost: 800,
      maxLevel: 3,
      effect: (level: number) => CUSTOMER_CONFIG.MAX_TREATMENT_ROOMS + level,
      category: 'capacity',
    },
  },
  EFFICIENCY: {
    modern_equipment: {
      name: 'Modern Equipment',
      description: 'Faster treatment times',
      icon: '⚡',
      baseCost: 500,
      maxLevel: 4,
      effect: (level: number) => 1.0 - level * 0.15,
      category: 'efficiency',
    },
  },
  QUALITY: {
    staff_training: {
      name: 'Staff Training',
      description: 'Better service quality',
      icon: '🎓',
      baseCost: 300,
      maxLevel: 5,
      effect: (level: number) =>
        BASE_HAPPY_PROBABILITY + level * 0.05,
      category: 'quality',
    },
    comfortable_waiting: {
      name: 'Comfortable Waiting',
      description: 'Customers wait longer patiently',
      icon: '😌',
      baseCost: 400,
      maxLevel: 3,
      effect: (level: number) =>
        GAME_TIMING.DEFAULT_PATIENCE_SECONDS + level * 3,
      category: 'comfort',
    },
  },
} as const;

// -----------------------------------------------------------------------------
// HELPER UTILITIES
// -----------------------------------------------------------------------------

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds * TICKS_PER_SECOND);
}

export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

export const CUSTOMER_SPAWN_INTERVAL = secondsToTicks(CUSTOMER_SPAWN_INTERVAL_SECONDS);

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

export function getDifficultyForWeek(week: number) {
  if (week >= 1 && week <= 3) return DIFFICULTY_CURVE.WEEKS['1-3'];
  if (week >= 4 && week <= 8) return DIFFICULTY_CURVE.WEEKS['4-8'];
  if (week >= 9 && week <= 15) return DIFFICULTY_CURVE.WEEKS['9-15'];
  return DIFFICULTY_CURVE.WEEKS['16-20'];
}

export function getSpawnIntervalForWeek(week: number): number {
  const difficulty = getDifficultyForWeek(week);
  return GAME_TIMING.CUSTOMER_SPAWN_INTERVAL_SECONDS * difficulty.spawnIntervalMultiplier;
}

export function getPatienceForWeek(week: number): number {
  const difficulty = getDifficultyForWeek(week);
  return GAME_TIMING.DEFAULT_PATIENCE_SECONDS * difficulty.patienceMultiplier;
}

export function getWeeklyExpensesForWeek(week: number): number {
  const difficulty = getDifficultyForWeek(week);
  const baseExpenses =
    WEEKLY_EXPENSES.rent + WEEKLY_EXPENSES.utilities + WEEKLY_EXPENSES.supplies;
  return baseExpenses * difficulty.expenseMultiplier;
}

export function calculateWeeklyRevenuePotential(): {
  customersPerWeek: number;
  averageServicePrice: number;
  potentialRevenue: number;
  realisticTarget: number;
} {
  const weekDurationSeconds = GAME_TIMING.WEEK_DURATION_SECONDS;
  const spawnIntervalSeconds = GAME_TIMING.CUSTOMER_SPAWN_INTERVAL_SECONDS;

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
