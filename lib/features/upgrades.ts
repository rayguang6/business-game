/**
 * Upgrades Feature
 * Centralized system for calculating effective values based on upgrades
 * 
 * This system calculates all upgrade effects in one place,
 * so the rest of the game just uses the calculated values.
 */

import { Upgrades } from '@/lib/store/types';
import { getUpgradesForIndustry } from '@/lib/config/gameConfig';
import { CUSTOMER_SPAWN_INTERVAL } from '@/lib/core/constants';

/**
 * Calculates effective customer spawn interval based on marketing upgrades
 */
export function getEffectiveSpawnInterval(upgrades: Upgrades, industryId: string = 'dental'): number {
  const baseInterval = CUSTOMER_SPAWN_INTERVAL;
  
  if (upgrades.marketing === 0) return baseInterval;
  
  const industryConfig = getUpgradesForIndustry(industryId);
  const marketingConfig = industryConfig.marketing;
  const multiplier = marketingConfig?.spawnMultiplier?.[upgrades.marketing - 1] || 1;
  
  return Math.floor(baseInterval * multiplier);
}

/**
 * Calculates effective service duration multiplier based on equipment upgrades
 */
export function getEffectiveServiceSpeedMultiplier(upgrades: Upgrades, industryId: string = 'dental'): number {
  if (upgrades.equipment === 0) return 1;
  
  const industryConfig = getUpgradesForIndustry(industryId);
  const equipmentConfig = industryConfig.equipment;
  const multiplier = equipmentConfig?.speedMultiplier?.[upgrades.equipment - 1] || 1;
  
  return multiplier;
}

/**
 * Calculates effective reputation gain multiplier based on staff upgrades
 */
export function getEffectiveReputationMultiplier(upgrades: Upgrades, industryId: string = 'dental'): number {
  if (upgrades.staff === 0) return 1;
  
  const industryConfig = getUpgradesForIndustry(industryId);
  const staffConfig = industryConfig.staff;
  const multiplier = staffConfig?.qualityMultiplier?.[upgrades.staff - 1] || 1;
  
  return multiplier;
}

/**
 * Calculates effective treatment room capacity based on treatment room upgrades
 */
export function getEffectiveTreatmentRooms(upgrades: Upgrades): number {
  return upgrades.treatmentRooms;
}

/**
 * Comprehensive upgrade effects calculation
 * Returns all effective values in one place
 */
export function calculateUpgradeEffects(upgrades: Upgrades, industryId: string = 'dental') {
  return {
    // Customer spawn rate
    spawnInterval: getEffectiveSpawnInterval(upgrades, industryId),
    
    // Service speed
    serviceSpeedMultiplier: getEffectiveServiceSpeedMultiplier(upgrades, industryId),
    
    // Reputation gain
    reputationMultiplier: getEffectiveReputationMultiplier(upgrades, industryId),
    
    // Treatment capacity
    treatmentRooms: getEffectiveTreatmentRooms(upgrades),
  };
}

/**
 * Helper function to check if it's time to spawn a customer with upgrades
 */
export function shouldSpawnCustomerWithUpgrades(gameTick: number, upgrades: Upgrades, industryId: string = 'dental'): boolean {
  const effectiveInterval = getEffectiveSpawnInterval(upgrades, industryId);
  return gameTick % effectiveInterval === 0;
}