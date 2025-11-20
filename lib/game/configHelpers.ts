/**
 * Configuration Helpers - Simple Fallback Logic
 * Industry Config → Global Config → Code Defaults
 * Logs when fallback is used for debugging
 */

import type {
  BusinessMetrics,
  BusinessStats,
  MovementConfig,
  MapConfig,
  SimulationLayoutConfig,
  IndustryId,
} from './types';
import type { WinCondition, LoseCondition } from './winConditions';
import { fetchGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { fetchIndustrySimulationConfig } from '@/lib/data/industrySimulationConfigRepository';
import { DEFAULT_WIN_CONDITION, DEFAULT_LOSE_CONDITION } from './winConditions';

// Default values (fallback when database fails)
const DEFAULT_BUSINESS_METRICS: BusinessMetrics = {
  startingCash: 15000,
  monthlyExpenses: 5000,
  startingSkillLevel: 10, // Previously: startingReputation
  startingFreedomScore: 360, // Previously: founderWorkHours
};

const DEFAULT_BUSINESS_STATS: BusinessStats = {
  ticksPerSecond: 10,
  monthDurationSeconds: 60,
  customerSpawnIntervalSeconds: 3,
  customerPatienceSeconds: 10,
  leavingAngryDurationTicks: 10,
  customerSpawnPosition: { x: 4, y: 9 },
  treatmentRooms: 2,
  skillLevelGainPerHappyCustomer: 1, // Previously: reputationGainPerHappyCustomer
  skillLevelLossPerAngryCustomer: 1, // Previously: reputationLossPerAngryCustomer
  // baseHappyProbability removed - not used in game mechanics
  eventTriggerSeconds: [15, 30, 45],
  serviceRevenueMultiplier: 1,
  serviceRevenueScale: 10,
};

const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  customerTilesPerTick: 0.25,
  animationReferenceTilesPerTick: 0.25,
  walkFrameDurationMs: 200,
  minWalkFrameDurationMs: 80,
  maxWalkFrameDurationMs: 320,
  celebrationFrameDurationMs: 200,
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
};

const DEFAULT_LAYOUT: SimulationLayoutConfig = {
  entryPosition: { x: 4, y: 9 },
  waitingPositions: [
    { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 },
    { x: 1, y: 5 }, { x: 1, y: 6 }, { x: 1, y: 7 }, { x: 1, y: 8 },
  ],
  serviceRoomPositions: [
    { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 },
  ],
  staffPositions: [
    { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
    { x: 8, y: 0 }, { x: 9, y: 0 }, { x: 4, y: 1 }, { x: 5, y: 1 },
  ],
};

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

const DEFAULT_STAFF_NAME_POOL = [
  'Ava', 'Noah', 'Mia', 'Ethan', 'Liam',
  'Zara', 'Kai', 'Riya', 'Owen', 'Sage',
  'Nico', 'Luna', 'Milo', 'Iris', 'Ezra',
];

/**
 * Get business metrics with fallback
 */
export async function getBusinessMetricsWithFallback(industryId: IndustryId): Promise<BusinessMetrics> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.businessMetrics) {
      return industryConfig.businessMetrics;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.businessMetrics) {
      return globalConfig.businessMetrics;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch business metrics for ${industryId}, using defaults:`, error);
  }

  return DEFAULT_BUSINESS_METRICS;
}

/**
 * Get business stats with fallback
 */
export async function getBusinessStatsWithFallback(industryId: IndustryId): Promise<BusinessStats> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.businessStats) {
      return industryConfig.businessStats;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.businessStats) {
      return globalConfig.businessStats;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch business stats for ${industryId}, using defaults:`, error);
  }

  return DEFAULT_BUSINESS_STATS;
}

/**
 * Get movement config with fallback
 */
export async function getMovementConfigWithFallback(industryId: IndustryId): Promise<MovementConfig> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.movement) {
      return industryConfig.movement;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.movement) {
      return globalConfig.movement;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch movement config for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_MOVEMENT_CONFIG;
}

/**
 * Get map config with fallback
 */
export async function getMapConfigWithFallback(industryId: IndustryId): Promise<MapConfig> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.mapConfig) {
      return industryConfig.mapConfig;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.mapConfig) {
      return globalConfig.mapConfig;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch map config for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_MAP_CONFIG;
}

/**
 * Get layout config with fallback
 */
export async function getLayoutConfigWithFallback(industryId: IndustryId): Promise<SimulationLayoutConfig> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    const globalConfig = await fetchGlobalSimulationConfig();
    
    // Merge: industry overrides global
    if (industryConfig?.layoutConfig && globalConfig?.layoutConfig) {
      return {
        entryPosition: industryConfig.layoutConfig.entryPosition ?? globalConfig.layoutConfig.entryPosition,
        waitingPositions: industryConfig.layoutConfig.waitingPositions?.length 
          ? industryConfig.layoutConfig.waitingPositions 
          : globalConfig.layoutConfig.waitingPositions,
        serviceRoomPositions: industryConfig.layoutConfig.serviceRoomPositions?.length
          ? industryConfig.layoutConfig.serviceRoomPositions
          : globalConfig.layoutConfig.serviceRoomPositions,
        staffPositions: industryConfig.layoutConfig.staffPositions?.length
          ? industryConfig.layoutConfig.staffPositions
          : globalConfig.layoutConfig.staffPositions,
      };
    }
    
    if (industryConfig?.layoutConfig) {
      return industryConfig.layoutConfig;
    }
    
    if (globalConfig?.layoutConfig) {
      return globalConfig.layoutConfig;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch layout config for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_LAYOUT;
}

/**
 * Get capacity image with fallback
 */
export async function getCapacityImageWithFallback(industryId: IndustryId): Promise<string | null> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.capacityImage !== undefined) {
      return industryConfig.capacityImage;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.capacityImage) {
      return globalConfig.capacityImage;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch capacity image for ${industryId}:`, error);
  }
  
  return null;
}

/**
 * Get customer images with fallback
 */
export async function getCustomerImagesWithFallback(industryId: IndustryId): Promise<string[]> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    // NULL = use global, [] = empty, [values] = override
    if (industryConfig?.customerImages !== undefined && industryConfig.customerImages !== null) {
      return industryConfig.customerImages;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.customerImages && globalConfig.customerImages.length > 0) {
      return globalConfig.customerImages;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch customer images for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_CUSTOMER_IMAGES;
}

/**
 * Get staff name pool with fallback
 */
export async function getStaffNamePoolWithFallback(industryId: IndustryId): Promise<string[]> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.staffNamePool !== undefined && industryConfig.staffNamePool !== null) {
      return industryConfig.staffNamePool;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.staffNamePool && globalConfig.staffNamePool.length > 0) {
      return globalConfig.staffNamePool;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch staff name pool for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_STAFF_NAME_POOL;
}

/**
 * Get win condition with fallback
 */
export async function getWinConditionWithFallback(industryId: IndustryId): Promise<WinCondition> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.winCondition) {
      return industryConfig.winCondition;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.winCondition) {
      return globalConfig.winCondition;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch win condition for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_WIN_CONDITION;
}

/**
 * Get lose condition with fallback
 */
export async function getLoseConditionWithFallback(industryId: IndustryId): Promise<LoseCondition> {
  try {
    const industryConfig = await fetchIndustrySimulationConfig(industryId);
    if (industryConfig?.loseCondition) {
      return industryConfig.loseCondition;
    }
    
    const globalConfig = await fetchGlobalSimulationConfig();
    if (globalConfig?.loseCondition) {
      return globalConfig.loseCondition;
    }
  } catch (error) {
    console.warn(`[Config] Failed to fetch lose condition for ${industryId}, using defaults:`, error);
  }
  
  return DEFAULT_LOSE_CONDITION;
}

