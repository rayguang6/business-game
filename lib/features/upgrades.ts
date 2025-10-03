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
export function getEffectiveSpawnInterval(upgrades: Upgrades): number {
  const baseInterval = CUSTOMER_SPAWN_INTERVAL;
  
  if (upgrades.marketing === 0) return baseInterval;
  
  const dentalConfig = getUpgradesForIndustry('dental');
  const marketingConfig = (dentalConfig as any).marketing;
  const multiplier = marketingConfig.spawnMultiplier[upgrades.marketing - 1] || 1;
  
  return Math.floor(baseInterval * multiplier);
}

/**
 * Calculates effective service duration multiplier based on equipment upgrades
 */
export function getEffectiveServiceSpeedMultiplier(upgrades: Upgrades): number {
  if (upgrades.equipment === 0) return 1;
  
  const dentalConfig = getUpgradesForIndustry('dental');
  const equipmentConfig = (dentalConfig as any).equipment;
  const multiplier = equipmentConfig.speedMultiplier[upgrades.equipment - 1] || 1;
  
  return multiplier;
}

/**
 * Calculates effective reputation gain multiplier based on staff upgrades
 */
export function getEffectiveReputationMultiplier(upgrades: Upgrades): number {
  if (upgrades.staff === 0) return 1;
  
  const dentalConfig = getUpgradesForIndustry('dental');
  const staffConfig = (dentalConfig as any).staff;
  const multiplier = staffConfig.qualityMultiplier[upgrades.staff - 1] || 1;
  
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
export function calculateUpgradeEffects(upgrades: Upgrades) {
  return {
    // Customer spawn rate
    spawnInterval: getEffectiveSpawnInterval(upgrades),
    
    // Service speed
    serviceSpeedMultiplier: getEffectiveServiceSpeedMultiplier(upgrades),
    
    // Reputation gain
    reputationMultiplier: getEffectiveReputationMultiplier(upgrades),
    
    // Treatment capacity
    treatmentRooms: getEffectiveTreatmentRooms(upgrades),
  };
}

/**
 * Helper function to check if it's time to spawn a customer with upgrades
 */
export function shouldSpawnCustomerWithUpgrades(gameTick: number, upgrades: Upgrades): boolean {
  const effectiveInterval = getEffectiveSpawnInterval(upgrades);
  return gameTick % effectiveInterval === 0;
}
