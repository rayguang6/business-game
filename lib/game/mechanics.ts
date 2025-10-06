import { GameState, Metrics, Upgrades, WeeklyHistoryEntry, OneTimeCost } from '@/lib/store/types';
import { TICKS_PER_SECOND, isNewWeek, BUSINESS_STATS } from '@/lib/game/config';

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
  endOfWeek,
  getWeeklyBaseExpenses,
  calculateUpgradeWeeklyExpenses,
} from '@/lib/features/economy';
import { shouldSpawnCustomerWithUpgrades, getUpgradeEffects, UpgradeEffects } from '@/lib/features/upgrades';
import { getWaitingPositionByIndex, getServiceRoomPosition } from '@/lib/game/positioning';
import { findPath } from '@/lib/game/pathfinding';

interface TickSnapshot {
  gameTick: number;
  gameTime: number;
  currentWeek: number;
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
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
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;
  upgrades: Upgrades;
}

interface WeekTransitionResult {
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyHistory: WeeklyHistoryEntry[];
  currentWeek: number;
  weeklyExpenseAdjustments: number;
}

interface ProcessCustomersParams {
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
  upgradeEffects: UpgradeEffects;
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
  weeklyOneTimeCostDetails,
  weeklyHistory,
  weeklyExpenseAdjustments,
  upgrades,
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
      oneTimeCosts: weeklyOneTimeCostDetails,
      profit: weekResult.profit,
      reputation: updatedMetrics.reputation,
      reputationChange: updatedMetrics.reputation - previousReputation,
    },
  ];

  const baseExpenses = getWeeklyBaseExpenses();
  const upgradeExpenses = calculateUpgradeWeeklyExpenses(upgrades);

  return {
    metrics: updatedMetrics,
    weeklyRevenue: 0,
    weeklyExpenses: baseExpenses + upgradeExpenses,
    weeklyOneTimeCosts: 0,
    weeklyOneTimeCostDetails: [],
    weeklyHistory: updatedHistory,
    currentWeek: currentWeek + 1,
    weeklyExpenseAdjustments: 0,
  };
}

function processCustomersForTick({
  customers,
  metrics,
  weeklyRevenue,
  upgradeEffects,
}: ProcessCustomersParams): ProcessCustomersResult {
  const roomsRemaining = [...getAvailableRooms(customers, upgradeEffects.treatmentRooms)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = weeklyRevenue;
  const reputationMultiplier = upgradeEffects.reputationMultiplier;

  // Find already occupied waiting positions (including both current and target positions)
  const occupiedWaitingPositions = customers
    .filter(c => c.status === CustomerStatus.Waiting || c.status === CustomerStatus.WalkingToChair)
    .flatMap((c) => {
      if (c.status === CustomerStatus.Waiting) {
        return [{ x: Math.round(c.x), y: Math.round(c.y) }];
      }

      if (c.targetX !== undefined && c.targetY !== undefined) {
        return [{ x: c.targetX, y: c.targetY }];
      }

      return [];
    });

  customers.forEach((customer) => {
    const updatedCustomer = tickCustomer(customer);

    // Assign target waiting position when customer starts walking to chair
    if (customer.status === CustomerStatus.Spawning && updatedCustomer.status === CustomerStatus.WalkingToChair) {
      // Find first unoccupied waiting position
      for (let i = 0; i < 8; i++) { // Only 8 waiting positions
        const waitingPosition = getWaitingPositionByIndex(i);
        if (waitingPosition) {
          const isOccupied = occupiedWaitingPositions.some(
            pos => pos.x === waitingPosition.x && pos.y === waitingPosition.y
          );
          if (!isOccupied) {
            updatedCustomer.targetX = waitingPosition.x;
            updatedCustomer.targetY = waitingPosition.y;
            const pathToChair = findPath(
              { x: Math.round(updatedCustomer.x), y: Math.round(updatedCustomer.y) },
              waitingPosition
            );
            updatedCustomer.path = pathToChair.length > 0 ? pathToChair : undefined;
            // Mark as occupied for next customers
            occupiedWaitingPositions.push({ x: waitingPosition.x, y: waitingPosition.y });
            break;
          }
        }
      }
    }

    if (updatedCustomer.status === CustomerStatus.Waiting && roomsRemaining.length > 0) {
      const assignedRoom = roomsRemaining.shift()!;
      const customerWithService = startService(updatedCustomer, assignedRoom);
      
      // Assign target service room position
      const servicePosition = getServiceRoomPosition(assignedRoom);
      if (servicePosition) {
        customerWithService.targetX = servicePosition.x;
        customerWithService.targetY = servicePosition.y;
        const pathToRoom = findPath(
          { x: Math.round(customerWithService.x), y: Math.round(customerWithService.y) },
          servicePosition
        );
        customerWithService.path = pathToRoom.length > 0 ? pathToRoom : undefined;
      }
      
      updatedCustomers.push(customerWithService);
      return;
    }

    if (updatedCustomer.status === CustomerStatus.WalkingOutHappy) {
      const servicePrice = updatedCustomer.service.price;
      
      // Add revenue
      const newCash = metricsAccumulator.cash + servicePrice;
      
      // Check if customer is happy based on probability
      const isHappy = Math.random() < BUSINESS_STATS.baseHappyProbability;
      const reputationGain = isHappy 
        ? Math.floor(BUSINESS_STATS.reputationGainPerHappyCustomer * reputationMultiplier)
        : 0;

      metricsAccumulator = {
        ...metricsAccumulator,
        cash: newCash,
        reputation: metricsAccumulator.reputation + reputationGain,
        totalRevenue: metricsAccumulator.totalRevenue + servicePrice,
      };
      revenueAccumulator += servicePrice;
      // Customer leaves happy - remove from game (don't push to updatedCustomers)
      return;
    }

    if (customer.status !== CustomerStatus.LeavingAngry && updatedCustomer.status === CustomerStatus.LeavingAngry) {
      // Customer just became angry - deduct reputation and keep in game for exit animation
      const reputationLoss = BUSINESS_STATS.reputationLossPerAngryCustomer;
      metricsAccumulator = {
        ...metricsAccumulator,
        reputation: Math.max(0, metricsAccumulator.reputation - reputationLoss),
      };
      updatedCustomers.push(updatedCustomer);
      return;
    }

    if (customer.status === CustomerStatus.LeavingAngry) {
      const leavingTicks = (customer.leavingTicks ?? 0) + 1;
      if (leavingTicks >= LEAVING_ANGRY_DURATION_TICKS) {
        // Exit animation complete - remove from game
        return;
      }
      // Still leaving - keep in game to show animation
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
  let weeklyOneTimeCostDetails = [...state.weeklyOneTimeCostDetails];
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
      weeklyOneTimeCostDetails,
      weeklyHistory,
      weeklyExpenseAdjustments,
      upgrades: state.upgrades,
    });

    metrics = transition.metrics;
    weeklyRevenue = transition.weeklyRevenue;
    weeklyExpenses = transition.weeklyExpenses;
    weeklyOneTimeCosts = transition.weeklyOneTimeCosts;
    weeklyOneTimeCostDetails = transition.weeklyOneTimeCostDetails;
    weeklyHistory = transition.weeklyHistory;
    currentWeek = transition.currentWeek;
    weeklyExpenseAdjustments = transition.weeklyExpenseAdjustments;
  }

  const upgradeEffects = getUpgradeEffects(state.upgrades);

  if (shouldSpawnCustomerWithUpgrades(nextTick, state.upgrades, upgradeEffects)) {
    customers = [...customers, createCustomer(upgradeEffects.serviceSpeedMultiplier, industryId)];
  }

  const { customers: processedCustomers, metrics: processedMetrics, weeklyRevenue: processedWeeklyRevenue } =
    processCustomersForTick({
      customers,
      metrics,
      weeklyRevenue,
      upgradeEffects,
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
    weeklyOneTimeCostDetails,
    weeklyHistory,
    upgrades: state.upgrades,
    weeklyExpenseAdjustments,
  };
}
