/**
 * Central timing constants - Single source of truth
 */

// Core game timing
export const TICKS_PER_SECOND = 10; // 100ms per tick
export const TICK_INTERVAL_MS = 100; // milliseconds between ticks

// Game intervals (in seconds - much more readable!)
export const CUSTOMER_SPAWN_INTERVAL_SECONDS = 4; // spawn every 4 seconds
export const GAME_TIMER_UPDATE_SECONDS = 1; // update timer every 1 second

// Round/Week system
export const ROUND_DURATION_SECONDS = 30; // 1 round = 30 seconds = 1 week
export const SECONDS_PER_WEEK = ROUND_DURATION_SECONDS; // For clarity

// Legacy constants for backward compatibility
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
