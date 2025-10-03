import { GameState } from '@/lib/store/types';
import { TICKS_PER_SECOND, CUSTOMER_SPAWN_INTERVAL, getCurrentWeek, isNewWeek } from '@/lib/core/constants';
import { Customer, CustomerStatus, LEAVING_ANGRY_DURATION_TICKS, spawnCustomer as createCustomer, tickCustomer, startService, getAvailableSlots, getAvailableRooms } from '@/lib/features/customers';
import { processServiceCompletion, endOfWeek, handleWeekTransition } from '@/lib/features/economy';

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
  weeklyOneTimeCosts: number;
  weeklyHistory: Array<{ week: number; revenue: number; expenses: number; profit: number; reputation: number; reputationChange: number }>;
}): {
  gameTick: number;
  gameTime: number;
  currentWeek: number;
  customers: Customer[];
  metrics: { cash: number; totalRevenue: number; totalExpenses: number; reputation: number };
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyHistory: Array<{ week: number; revenue: number; expenses: number; profit: number; reputation: number; reputationChange: number }>;
} {
  const nextTick = state.gameTick + 1;
  let newCustomers = [...state.customers];
  let newMetrics = { ...state.metrics };
  let newWeeklyRevenue = state.weeklyRevenue;
  let newWeeklyExpenses = state.weeklyExpenses;
  let newWeeklyOneTimeCosts = state.weeklyOneTimeCosts;
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
      newWeeklyExpenses,
      newWeeklyOneTimeCosts
    );
    newMetrics = {
      ...newMetrics,
      cash: weekResult.cash,
      totalRevenue: newMetrics.totalRevenue,
      totalExpenses: newMetrics.totalExpenses + weekResult.totalExpenses,
    };
    const previousReputation = newWeeklyHistory.length > 0
      ? newWeeklyHistory[newWeeklyHistory.length - 1].reputation
      : 0;
    newWeeklyHistory.push({
      week: newCurrentWeek - 1,
      revenue: newWeeklyRevenue,
      expenses: weekResult.totalExpenses,
      profit: weekResult.profit,
      reputation: newMetrics.reputation,
      reputationChange: newMetrics.reputation - previousReputation,
    });
    const weekTransition = handleWeekTransition(
      newCurrentWeek,
      newMetrics.cash,
      newWeeklyRevenue,
      newWeeklyExpenses,
      newWeeklyOneTimeCosts,
      newMetrics.reputation
    );
    newWeeklyRevenue = weekTransition.weeklyRevenue;
    newWeeklyExpenses = weekTransition.weeklyExpenses;
    newWeeklyOneTimeCosts = weekTransition.weeklyOneTimeCosts;
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
            // Step 1: Update customer state (movement, patience, service progress)
            const updatedCustomer = tickCustomer(customer);
            
            // Step 2: Assign to service room if waiting and room available
            if (updatedCustomer.status === CustomerStatus.Waiting && roomsRemaining.length > 0) {
              const assignedRoom = roomsRemaining.shift()!;
              return startService(updatedCustomer, assignedRoom);
            }
            
            // Step 3: Handle happy customers (service completed)
            if (updatedCustomer.status === CustomerStatus.WalkingOutHappy) {
              const { cash: newCash, reputation: newReputation } = processServiceCompletion(
                newMetrics.cash,
                newMetrics.reputation,
                customer.service.price
              );
              newMetrics.cash = newCash;
              newMetrics.reputation = newReputation;
              newMetrics.totalRevenue += customer.service.price;
              newWeeklyRevenue += customer.service.price;
              return null; // Remove happy customer (they've left the building)
            }
            
            // Step 4: Handle customers who just became angry
            if (updatedCustomer.status === CustomerStatus.LeavingAngry && customer.status !== CustomerStatus.LeavingAngry) {
              newMetrics.reputation = Math.max(0, newMetrics.reputation - 1);
              return updatedCustomer; // Keep customer (they're now walking out angrily)
            }
            
            // Step 5: Handle angry customers who've been walking out for too long
            if (customer.status === CustomerStatus.LeavingAngry) {
              const leavingTicks = customer.leavingTicks || 0;
              if (leavingTicks >= LEAVING_ANGRY_DURATION_TICKS) {
                return null; // Remove customer (they've left the building)
              }
              return { ...customer, leavingTicks: leavingTicks + 1 }; // Update leaving timer
            }
            
            // Step 6: Keep all other customers as-is
            return updatedCustomer;
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
    weeklyOneTimeCosts: newWeeklyOneTimeCosts,
    weeklyHistory: newWeeklyHistory,
  };
}
