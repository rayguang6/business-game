/**
 * Central timing constants - Single source of truth
 * 
 * NOTE: Most constants moved to lib/config/gameConfig.ts
 * This file now only contains helper functions and legacy compatibility
 */

import { GAME_TIMING } from '@/lib/config/gameConfig';

// Re-export from centralized config for backward compatibility
export const TICKS_PER_SECOND = GAME_TIMING.TICKS_PER_SECOND;
export const TICK_INTERVAL_MS = GAME_TIMING.TICK_INTERVAL_MS;
export const ROUND_DURATION_SECONDS = GAME_TIMING.WEEK_DURATION_SECONDS;
export const SECONDS_PER_WEEK = ROUND_DURATION_SECONDS;

// Legacy constants (will be replaced with dynamic difficulty)
export const CUSTOMER_SPAWN_INTERVAL_SECONDS = GAME_TIMING.CUSTOMER_SPAWN_INTERVAL_SECONDS;
export const CUSTOMER_SPAWN_INTERVAL = secondsToTicks(CUSTOMER_SPAWN_INTERVAL_SECONDS);

// Helper functions to convert between seconds and ticks
export function secondsToTicks(seconds: number): number {
  return seconds * TICKS_PER_SECOND;
}

export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

// Round/Week helper functions
export function getCurrentWeek(gameTimeSeconds: number): number {
  return Math.floor(gameTimeSeconds / ROUND_DURATION_SECONDS) + 1;
}

export function getWeekProgress(gameTimeSeconds: number): number {
  const currentWeekTime = gameTimeSeconds % ROUND_DURATION_SECONDS;
  return (currentWeekTime / ROUND_DURATION_SECONDS) * 100;
}

export function isNewWeek(gameTimeSeconds: number, previousGameTime: number): boolean {
  const currentWeek = getCurrentWeek(gameTimeSeconds);
  const previousWeek = getCurrentWeek(previousGameTime);
  return currentWeek > previousWeek;
}
