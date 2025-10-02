import { GameState } from '@/lib/store/types';
import { TICKS_PER_SECOND, CUSTOMER_SPAWN_INTERVAL, getCurrentWeek, isNewWeek } from '@/lib/core/constants';
import { Customer, CustomerStatus, LEAVING_ANGRY_DURATION_TICKS, spawnCustomer as createCustomer, tickCustomer, startService, getAvailableSlots, getAvailableRooms } from '@/lib/features/customers';
import { processServiceCompletion, endOfWeek, handleWeekTransition, getWeeklyBaseExpenses } from '@/lib/features/economy';

/**
 * Updates game timer based on ticks
 */
export function updateGameTimer(gameTime: number, gameTick: number): number {
  if (gameTick % TICKS_PER_SECOND === 0) {
    return gameTime + 1;
  }
  return gameTime;
}

/**
 * Checks if it's time to spawn a customer
 */
export function shouldSpawnCustomer(gameTick: number): boolean {
  return gameTick % CUSTOMER_SPAWN_INTERVAL === 0;
}

/**
 * Creates initial game state
 */
export function createInitialGameState(): Partial<GameState> {
  return {
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
  };
}

/**
 * Pure tick processor: given the current store state, returns updated fields.
 */
export function tickOnce(state: {
  gameTick: number;
  gameTime: number;
  currentWeek: number;
  customers: Customer[];
  metrics: { cash: number; totalRevenue: number; totalExpenses: number; reputation: number };
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyHistory: Array<{ week: number; revenue: number; expenses: number; profit: number; reputation: number; reputationChange: number }>;
}): {
  gameTick: number;
  gameTime: number;
  currentWeek: number;
  customers: Customer[];
  metrics: { cash: number; totalRevenue: number; totalExpenses: number; reputation: number };
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyHistory: Array<{ week: number; revenue: number; expenses: number; profit: number; reputation: number; reputationChange: number }>;
} {
  const nextTick = state.gameTick + 1;
  let newCustomers = [...state.customers];
  let newMetrics = { ...state.metrics };
  let newWeeklyRevenue = state.weeklyRevenue;
  let newWeeklyExpenses = state.weeklyExpenses;
  let newWeeklyHistory = [...state.weeklyHistory];
  let newGameTime = state.gameTime;
  let newCurrentWeek = state.currentWeek;

  // 1) Update game time
  newGameTime = updateGameTimer(newGameTime, nextTick);

  // 2) Week transition
  if (isNewWeek(newGameTime, state.gameTime)) {
    newCurrentWeek = getCurrentWeek(newGameTime);
    const weekResult = endOfWeek(
      newMetrics.cash,
      newWeeklyRevenue,
      newWeeklyExpenses
    );
    newMetrics = {
      ...newMetrics,
      cash: weekResult.cash,
      totalRevenue: newMetrics.totalRevenue,
      totalExpenses: newMetrics.totalExpenses + newWeeklyExpenses,
    };
    const previousReputation = newWeeklyHistory.length > 0
      ? newWeeklyHistory[newWeeklyHistory.length - 1].reputation
      : 0;
    newWeeklyHistory.push({
      week: newCurrentWeek - 1,
      revenue: newWeeklyRevenue,
      expenses: newWeeklyExpenses,
      profit: weekResult.profit,
      reputation: newMetrics.reputation,
      reputationChange: newMetrics.reputation - previousReputation,
    });
    const weekTransition = handleWeekTransition(
      newCurrentWeek,
      newMetrics.cash,
      newWeeklyRevenue,
      newWeeklyExpenses,
      newMetrics.reputation
    );
    newWeeklyRevenue = weekTransition.weeklyRevenue;
    newWeeklyExpenses = weekTransition.weeklyExpenses;
  }

  // 3) Spawn
  if (shouldSpawnCustomer(nextTick)) {
    const newCustomer = createCustomer();
    newCustomers.push(newCustomer);
  }

        // 4) Customers update and service completion
        const availableRooms = getAvailableRooms(newCustomers);
        let roomsRemaining = [...availableRooms];
        newCustomers = newCustomers
          .map((customer) => {
            if (customer.status === CustomerStatus.Waiting && roomsRemaining.length > 0) {
              const assignedRoom = roomsRemaining.shift()!;
              return startService(customer, assignedRoom);
            } else if (customer.status === CustomerStatus.InService) {
        const updatedCustomer = tickCustomer(customer);
        if (updatedCustomer.status === CustomerStatus.Paying) {
          const { cash: newCash, reputation: newReputation } = processServiceCompletion(
            newMetrics.cash,
            newMetrics.reputation,
            customer.service.price
          );
          newMetrics.cash = newCash;
          newMetrics.reputation = newReputation;
          newMetrics.totalRevenue += customer.service.price;
          newWeeklyRevenue += customer.service.price;
          return null; // Remove completed customer
        }
        return updatedCustomer;
      } else if (customer.status === CustomerStatus.Waiting) {
        const updatedCustomer = tickCustomer(customer);
        if (updatedCustomer.status === CustomerStatus.LeavingAngry) {
          // Patience ran out → customer leaves angrily; deduct reputation
          newMetrics.reputation = Math.max(0, newMetrics.reputation - 1);
          return updatedCustomer;
        }
        return updatedCustomer;
      } else if (customer.status === CustomerStatus.LeavingAngry) {
        // After ~1 second (10 ticks at 100ms), remove the customer
        // Simple approach: remove after 10 ticks in LeavingAngry state
        const leavingTicks = customer.leavingTicks || 0;
        if (leavingTicks >= LEAVING_ANGRY_DURATION_TICKS) {
          return null; // Remove customer
        }
        return { ...customer, leavingTicks: leavingTicks + 1 };
      }
      return customer;
    })
    .filter(Boolean) as Customer[];

  return {
    gameTick: nextTick,
    gameTime: newGameTime,
    currentWeek: newCurrentWeek,
    customers: newCustomers,
    metrics: newMetrics,
    weeklyRevenue: newWeeklyRevenue,
    weeklyExpenses: newWeeklyExpenses,
    weeklyHistory: newWeeklyHistory,
  };
}
