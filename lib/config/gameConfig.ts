/**
 * CENTRALIZED GAME CONFIGURATION
 * 
 * This file contains ALL game parameters in one place for easy tweaking.
 * Change values here to instantly affect game balance without hunting through code.
 */

// ============================================================================
// CORE GAME TIMING
// ============================================================================
export const GAME_TIMING = {
  // Tick system
  TICKS_PER_SECOND: 10,
  TICK_INTERVAL_MS: 100,
  
  // Week system
  WEEK_DURATION_SECONDS: 30,
  
  // Customer spawn
  CUSTOMER_SPAWN_INTERVAL_SECONDS: 1, // Every 3 seconds
  
  // Customer patience
  DEFAULT_PATIENCE_SECONDS: 10,
  
  // Customer leaving animation
  LEAVING_ANGRY_DURATION_TICKS: 10, // 1 second visible
} as const;

// ============================================================================
// CUSTOMER CONFIGURATION
// ============================================================================
export const CUSTOMER_CONFIG = {
  // Spawn area (pixels)
  SPAWN_AREA: {
    x: { min: 50, max: 350 },
    y: { min: 50, max: 250 }
  },
  
  // Capacity limits
  MAX_WAITING_CHAIRS: 4,
  MAX_TREATMENT_ROOMS: 2,
  
  // Images
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

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================
export const SERVICE_CONFIG = {
  // Dental services (balanced for 30s weeks)
  DENTAL_SERVICES: [
    {
      id: 'dental_cleaning',
      name: 'Teeth Cleaning',
      duration: 4,    // seconds
      price: 100,      // dollars
      demand: 0.5     // 50% of customers want this
    },
    {
      id: 'dental_filling',
      name: 'Cavity Filling',
      duration: 5,   // seconds
      price: 200,     // dollars
      demand: 0.3     // 30% of customers
    },
    {
      id: 'dental_root_canal',
      name: 'Root Canal',
      duration: 6,   // seconds
      price: 300,     // dollars
      demand: 0.2     // 20% of customers
    }
  ]
} as const;

// ============================================================================
// ECONOMIC CONFIGURATION
// ============================================================================
export const ECONOMY_CONFIG = {
  // Starting values
  INITIAL_MONEY: 3000,
  INITIAL_REPUTATION: 0,
  
  // Reputation system
  REPUTATION_GAIN_PER_HAPPY_CUSTOMER: 1,
  REPUTATION_LOSS_PER_ANGRY_CUSTOMER: 1,
  BASE_HAPPY_PROBABILITY: 0.7, // 70% chance of happy customer
  
  // Weekly expenses (simple structure for now)
  WEEKLY_BASE_EXPENSES: {
    rent: 400,
    utilities: 200,
    supplies: 200,
  },
  
  // Economic targets (realistic based on calculations)
  TARGET_WEEKLY_REVENUE: 1500, // Goal: $1.5k per week (realistic with 70% efficiency)
  TARGET_TOTAL_MONEY: 30000,   // Goal: $30k total (20 weeks × $1.5k)
} as const;

// ============================================================================
// INDUSTRY-SPECIFIC UPGRADE CONFIGURATIONS
// ============================================================================

// Dental Industry Upgrades
export const DENTAL_UPGRADES = {
  treatmentRooms: {
    name: 'Treatment Rooms',
    description: 'More rooms for simultaneous dental procedures',
    icon: '🦷',
    starting: 2,
    max: 5,
    costs: [1000, 2500, 5000], // Cost for rooms 3, 4, 5
    weeklyExpenses: 200, // Per room
  }
} as const;

// Future: Restaurant Industry Upgrades
export const RESTAURANT_UPGRADES = {
  kitchenEquipment: {
    name: 'Kitchen Equipment', 
    description: 'Better cooking equipment for faster service',
    icon: '🍳',
    starting: 2,
    max: 5,
    costs: [1000, 2500, 5000],
    weeklyExpenses: 200,
  }
} as const;

// Get upgrades for current industry (defaults to dental)
export function getUpgradesForIndustry(industry: string = 'dental') {
  switch (industry) {
    case 'dental':
      return DENTAL_UPGRADES;
    case 'restaurant':
      return RESTAURANT_UPGRADES;
    default:
      return DENTAL_UPGRADES;
  }
}

// Default values for fallbacks
export const DEFAULT_UPGRADE_VALUES = {
  TREATMENT_ROOMS_STARTING: 2,
} as const;

// ============================================================================
// DIFFICULTY CURVE CONFIGURATION
// ============================================================================
export const DIFFICULTY_CURVE = {
  // Week-based scaling
  WEEKS: {
    '1-3': {
      name: 'Learning Phase',
      spawnIntervalMultiplier: 1.5,    // Slower spawn (3.75s)
      patienceMultiplier: 1.5,         // More patience (15s)
      expenseMultiplier: 0.75,         // Lower expenses ($600)
      description: 'Easy mode - learn the basics'
    },
    '4-8': {
      name: 'Growth Phase', 
      spawnIntervalMultiplier: 1.0,    // Normal spawn (2.5s)
      patienceMultiplier: 1.2,         // Slightly more patience (12s)
      expenseMultiplier: 1.0,          // Normal expenses ($800)
      description: 'Normal difficulty - optimize your business'
    },
    '9-15': {
      name: 'Pressure Phase',
      spawnIntervalMultiplier: 0.8,    // Faster spawn (2.0s)
      patienceMultiplier: 1.0,         // Normal patience (10s)
      expenseMultiplier: 1.25,         // Higher expenses ($1000)
      description: 'Hard mode - manage pressure points'
    },
    '16-20': {
      name: 'Challenge Phase',
      spawnIntervalMultiplier: 0.6,    // Very fast spawn (1.5s)
      patienceMultiplier: 0.8,         // Less patience (8s)
      expenseMultiplier: 1.5,          // High expenses ($1200)
      description: 'Expert mode - maximum difficulty'
    }
  }
} as const;

// ============================================================================
// UPGRADE SYSTEM CONFIGURATION
// ============================================================================
export const UPGRADE_CONFIG = {
  // Infrastructure upgrades
  INFRASTRUCTURE: {
    waiting_chairs: {
      name: 'Comfortable Chairs',
      description: 'Add more waiting seats',
      icon: '🪑',
      baseCost: 200,
      maxLevel: 4,
      effect: (level: number) => CUSTOMER_CONFIG.MAX_WAITING_CHAIRS + (level * 2), // 4, 6, 8, 10, 12
      category: 'capacity'
    },
    treatment_rooms: {
      name: 'Treatment Rooms',
      description: 'More rooms for simultaneous service',
      icon: '🦷',
      baseCost: 800,
      maxLevel: 3,
      effect: (level: number) => CUSTOMER_CONFIG.MAX_TREATMENT_ROOMS + level, // 2, 3, 4, 5
      category: 'capacity'
    }
  },
  
  // Efficiency upgrades
  EFFICIENCY: {
    modern_equipment: {
      name: 'Modern Equipment',
      description: 'Faster treatment times',
      icon: '⚡',
      baseCost: 500,
      maxLevel: 4,
      effect: (level: number) => 1.0 - (level * 0.15), // 1.0x, 0.85x, 0.7x, 0.55x, 0.4x speed
      category: 'efficiency'
    }
  },
  
  // Quality upgrades
  QUALITY: {
    staff_training: {
      name: 'Staff Training',
      description: 'Better service quality',
      icon: '🎓',
      baseCost: 300,
      maxLevel: 5,
      effect: (level: number) => ECONOMY_CONFIG.BASE_HAPPY_PROBABILITY + (level * 0.05), // 0.7 → 0.95
      category: 'quality'
    },
    comfortable_waiting: {
      name: 'Comfortable Waiting',
      description: 'Customers wait longer patiently',
      icon: '😌',
      baseCost: 400,
      maxLevel: 3,
      effect: (level: number) => GAME_TIMING.DEFAULT_PATIENCE_SECONDS + (level * 3), // 10 → 19s
      category: 'comfort'
    }
  }
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get difficulty settings for a specific week
 */
export function getDifficultyForWeek(week: number) {
  if (week >= 1 && week <= 3) return DIFFICULTY_CURVE.WEEKS['1-3'];
  if (week >= 4 && week <= 8) return DIFFICULTY_CURVE.WEEKS['4-8'];
  if (week >= 9 && week <= 15) return DIFFICULTY_CURVE.WEEKS['9-15'];
  return DIFFICULTY_CURVE.WEEKS['16-20'];
}

/**
 * Calculate spawn interval for a specific week
 */
export function getSpawnIntervalForWeek(week: number): number {
  const difficulty = getDifficultyForWeek(week);
  return GAME_TIMING.CUSTOMER_SPAWN_INTERVAL_SECONDS * difficulty.spawnIntervalMultiplier;
}

/**
 * Calculate customer patience for a specific week
 */
export function getPatienceForWeek(week: number): number {
  const difficulty = getDifficultyForWeek(week);
  return GAME_TIMING.DEFAULT_PATIENCE_SECONDS * difficulty.patienceMultiplier;
}

/**
 * Calculate weekly expenses for a specific week
 */
export function getWeeklyExpensesForWeek(week: number): number {
  const difficulty = getDifficultyForWeek(week);
  const baseExpenses = ECONOMY_CONFIG.WEEKLY_BASE_EXPENSES.rent + 
                      ECONOMY_CONFIG.WEEKLY_BASE_EXPENSES.utilities + 
                      ECONOMY_CONFIG.WEEKLY_BASE_EXPENSES.supplies;
  return baseExpenses * difficulty.expenseMultiplier;
}

/**
 * Calculate realistic revenue potential for a week
 */
export function calculateWeeklyRevenuePotential(): {
  customersPerWeek: number;
  averageServicePrice: number;
  potentialRevenue: number;
  realisticTarget: number;
} {
  const weekDurationSeconds = GAME_TIMING.WEEK_DURATION_SECONDS;
  const spawnIntervalSeconds = GAME_TIMING.CUSTOMER_SPAWN_INTERVAL_SECONDS;
  
  // Calculate customers per week
  const customersPerWeek = Math.floor(weekDurationSeconds / spawnIntervalSeconds);
  
  // Calculate average service price
  const services = SERVICE_CONFIG.DENTAL_SERVICES;
  const averageServicePrice = services.reduce((sum, service) => sum + service.price, 0) / services.length;
  
  // Calculate potential revenue (100% efficiency)
  const potentialRevenue = customersPerWeek * averageServicePrice;
  
  // Realistic target (assuming 70% efficiency due to angry customers, capacity limits)
  const realisticTarget = potentialRevenue * 0.7;
  
  return {
    customersPerWeek,
    averageServicePrice,
    potentialRevenue,
    realisticTarget
  };
}
