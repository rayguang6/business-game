import { GameState, Metrics, Upgrades, WeeklyHistoryEntry } from '@/lib/store/types';
import { CUSTOMER_SPAWN_INTERVAL, TICKS_PER_SECOND, isNewWeek } from '@/lib/game/config';
import {
  Customer,
  CustomerStatus,
  LEAVING_ANGRY_DURATION_TICKS,
  spawnCustomer as createCustomer,
  tickCustomer,
  startService,
  getAvailableRooms,
} from '@/lib/features/customers';
import {
  processServiceCompletion,
  endOfWeek,
  getWeeklyBaseExpenses,
  calculateUpgradeWeeklyExpenses,
} from '@/lib/features/economy';
import {
  shouldSpawnCustomerWithUpgrades,
  getEffectiveReputationMultiplier,
  getEffectiveServiceSpeedMultiplier,
} from '@/lib/features/upgrades';

interface TickSnapshot {
  gameTick: number;
  gameTime: number;
  currentWeek: number;
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyHistory: WeeklyHistoryEntry[];
  upgrades: Upgrades;
  industryId?: string;
  weeklyExpenseAdjustments: number;
}

type TickResult = Omit<TickSnapshot, 'industryId'>;

interface WeekTransitionParams {
  currentWeek: number;
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;
  upgrades: Upgrades;
  industryId: string;
}

interface WeekTransitionResult {
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyHistory: WeeklyHistoryEntry[];
  currentWeek: number;
  weeklyExpenseAdjustments: number;
}

interface ProcessCustomersParams {
  customers: Customer[];
  upgrades: Upgrades;
  metrics: Metrics;
  weeklyRevenue: number;
  industryId: string;
}

interface ProcessCustomersResult {
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
}

function processWeekTransition({
  currentWeek,
  metrics,
  weeklyRevenue,
  weeklyExpenses,
  weeklyOneTimeCosts,
  weeklyHistory,
  weeklyExpenseAdjustments,
  upgrades,
  industryId,
}: WeekTransitionParams): WeekTransitionResult {
  const weekResult = endOfWeek(metrics.cash, weeklyRevenue, weeklyExpenses, weeklyOneTimeCosts);
  const alreadyAccounted = weeklyExpenseAdjustments ?? 0;
  const netExpensesForMetrics = Math.max(0, weekResult.totalExpenses - alreadyAccounted);

  const updatedMetrics: Metrics = {
    ...metrics,
    cash: weekResult.cash,
    totalExpenses: metrics.totalExpenses + netExpensesForMetrics,
  };

  const previousReputation = weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1].reputation : 0;
  const updatedHistory: WeeklyHistoryEntry[] = [
    ...weeklyHistory,
    {
      week: currentWeek,
      revenue: weeklyRevenue,
      expenses: weekResult.totalExpenses,
      profit: weekResult.profit,
      reputation: updatedMetrics.reputation,
      reputationChange: updatedMetrics.reputation - previousReputation,
    },
  ];

  const baseExpenses = getWeeklyBaseExpenses();
  const upgradeExpenses = calculateUpgradeWeeklyExpenses(upgrades, industryId);

  return {
    metrics: updatedMetrics,
    weeklyRevenue: 0,
    weeklyExpenses: baseExpenses + upgradeExpenses,
    weeklyOneTimeCosts: 0,
    weeklyHistory: updatedHistory,
    currentWeek: currentWeek + 1,
    weeklyExpenseAdjustments: 0,
  };
}

function processCustomersForTick({
  customers,
  upgrades,
  metrics,
  weeklyRevenue,
  industryId,
}: ProcessCustomersParams): ProcessCustomersResult {
  const roomsRemaining = [...getAvailableRooms(customers, upgrades.treatmentRooms)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = weeklyRevenue;
  const reputationMultiplier = getEffectiveReputationMultiplier(upgrades, industryId);

  customers.forEach((customer) => {
    const updatedCustomer = tickCustomer(customer);

    if (updatedCustomer.status === CustomerStatus.Waiting && roomsRemaining.length > 0) {
      const assignedRoom = roomsRemaining.shift()!;
      updatedCustomers.push(startService(updatedCustomer, assignedRoom));
      return;
    }

    if (updatedCustomer.status === CustomerStatus.WalkingOutHappy) {
      const servicePrice = updatedCustomer.service.price;
      const { cash: newCash, reputation: newReputation } = processServiceCompletion(
        metricsAccumulator.cash,
        metricsAccumulator.reputation,
        servicePrice,
        reputationMultiplier,
      );

      metricsAccumulator = {
        ...metricsAccumulator,
        cash: newCash,
        reputation: newReputation,
        totalRevenue: metricsAccumulator.totalRevenue + servicePrice,
      };
      revenueAccumulator += servicePrice;
      return;
    }

    if (customer.status !== CustomerStatus.LeavingAngry && updatedCustomer.status === CustomerStatus.LeavingAngry) {
      metricsAccumulator = {
        ...metricsAccumulator,
        reputation: Math.max(0, metricsAccumulator.reputation - 1),
      };
      updatedCustomers.push(updatedCustomer);
      return;
    }

    if (customer.status === CustomerStatus.LeavingAngry) {
      const leavingTicks = (customer.leavingTicks ?? 0) + 1;
      if (leavingTicks >= LEAVING_ANGRY_DURATION_TICKS) {
        return;
      }
      updatedCustomers.push({ ...updatedCustomer, leavingTicks });
      return;
    }

    updatedCustomers.push(updatedCustomer);
  });

  return {
    customers: updatedCustomers,
    metrics: metricsAccumulator,
    weeklyRevenue: revenueAccumulator,
  };
}

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
export function tickOnce(state: TickSnapshot): TickResult {
  const industryId = state.industryId ?? 'dental';
  const nextTick = state.gameTick + 1;

  const nextGameTime = updateGameTimer(state.gameTime, nextTick);

  let customers = [...state.customers];
  let metrics = { ...state.metrics };
  let weeklyRevenue = state.weeklyRevenue;
  let weeklyExpenses = state.weeklyExpenses;
  let weeklyOneTimeCosts = state.weeklyOneTimeCosts;
  let weeklyHistory = [...state.weeklyHistory];
  let currentWeek = state.currentWeek;
  let weeklyExpenseAdjustments = state.weeklyExpenseAdjustments ?? 0;

  if (isNewWeek(nextGameTime, state.gameTime)) {
    const transition = processWeekTransition({
      currentWeek,
      metrics,
      weeklyRevenue,
      weeklyExpenses,
      weeklyOneTimeCosts,
      weeklyHistory,
      weeklyExpenseAdjustments,
      upgrades: state.upgrades,
      industryId,
    });

    metrics = transition.metrics;
    weeklyRevenue = transition.weeklyRevenue;
    weeklyExpenses = transition.weeklyExpenses;
    weeklyOneTimeCosts = transition.weeklyOneTimeCosts;
    weeklyHistory = transition.weeklyHistory;
    currentWeek = transition.currentWeek;
    weeklyExpenseAdjustments = transition.weeklyExpenseAdjustments;
  }

  if (shouldSpawnCustomerWithUpgrades(nextTick, state.upgrades, industryId)) {
    const serviceSpeedMultiplier = getEffectiveServiceSpeedMultiplier(state.upgrades, industryId);
    customers = [...customers, createCustomer(serviceSpeedMultiplier, industryId)];
  }

  const { customers: processedCustomers, metrics: processedMetrics, weeklyRevenue: processedWeeklyRevenue } =
    processCustomersForTick({
      customers,
      upgrades: state.upgrades,
      metrics,
      weeklyRevenue,
      industryId,
    });

  return {
    gameTick: nextTick,
    gameTime: nextGameTime,
    currentWeek,
    customers: processedCustomers,
    metrics: processedMetrics,
    weeklyRevenue: processedWeeklyRevenue,
    weeklyExpenses,
    weeklyOneTimeCosts,
    weeklyHistory,
    upgrades: state.upgrades,
    weeklyExpenseAdjustments,
  };
}
