// Re-export from central constants for backward compatibility
export { TICKS_PER_SECOND, CUSTOMER_SPAWN_INTERVAL } from '../core/constants';

// Game initialization
export const INITIAL_GAME_STATE = {
  isGameStarted: false,
  isPaused: false,
  gameTime: 0,
  gameTick: 0,
  score: 0,
  money: 1000, // Start with some initial money
};
