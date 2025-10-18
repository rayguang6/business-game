import {
  GameState,
  Metrics,
  Upgrades,
  WeeklyHistoryEntry,
  OneTimeCost,
  RevenueEntry,
  REVENUE_CATEGORY_LABELS,
  RevenueCategory,
} from '@/lib/store/types';
import { TICKS_PER_SECOND, isNewWeek, getBusinessStats } from '@/lib/game/config';

import {
  Customer,
  CustomerStatus,
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
import { getWaitingPositions, getServiceRoomPosition } from '@/lib/game/positioning';
import type { IndustryId } from '@/lib/game/types';
import { findPath } from '@/lib/game/pathfinding';
import { audioManager, AudioFx } from '@/lib/audio/audioManager';

interface TickSnapshot {
  gameTick: number;
  gameTime: number;
  currentWeek: number;
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyRevenueDetails: RevenueEntry[];
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyOneTimeCostsPaid: number;
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
  weeklyRevenueDetails: RevenueEntry[];
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyOneTimeCostsPaid: number;
  weeklyHistory: WeeklyHistoryEntry[];
  weeklyExpenseAdjustments: number;
  upgrades: Upgrades;
  industryId: IndustryId;
}

interface WeekTransitionResult {
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyRevenueDetails: RevenueEntry[];
  weeklyOneTimeCosts: number;
  weeklyOneTimeCostDetails: OneTimeCost[];
  weeklyOneTimeCostsPaid: number;
  weeklyHistory: WeeklyHistoryEntry[];
  currentWeek: number;
  weeklyExpenseAdjustments: number;
}

interface ProcessCustomersParams {
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyRevenueDetails: RevenueEntry[];
  upgradeEffects: UpgradeEffects;
  industryId: IndustryId;
}

interface ProcessCustomersResult {
  customers: Customer[];
  metrics: Metrics;
  weeklyRevenue: number;
  weeklyRevenueDetails: RevenueEntry[];
}

const summarizeRevenueByCategory = (entries: RevenueEntry[]): RevenueEntry[] => {
  const totals = new Map<RevenueCategory, number>();

  entries.forEach((entry) => {
    totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
  });

  return Array.from(totals.entries()).map(([category, amount]) => ({
    category,
    amount,
    label: REVENUE_CATEGORY_LABELS[category],
  }));
};

// Runs endOfWeek to subtract expenses from cash and calculate profit.
// Summarizes weekly revenue by category (customer, event, other).
// Adds a WeeklyHistoryEntry so the UI can show a week-by-week log.
// Resets weekly accumulators (weeklyRevenue, weeklyOneTimeCosts, details arrays).
// Recomputes weeklyExpenses for the new week: base + upgrade-driven expenses.
// Resets weeklyExpenseAdjustments to 0 (any upgrade deltas have now been rolled forward).
// metrics.totalExpenses goes up by the new expenses (minus any adjustments we already tracked mid-week).
function processWeekTransition({
  currentWeek,
  metrics,
  weeklyRevenue,
  weeklyExpenses,
  weeklyRevenueDetails,
  weeklyOneTimeCosts,
  weeklyOneTimeCostDetails,
  weeklyOneTimeCostsPaid,
  weeklyHistory,
  weeklyExpenseAdjustments,
  upgrades,
  industryId,
}: WeekTransitionParams): WeekTransitionResult {
  const weekResult = endOfWeek(
    metrics.cash,
    weeklyRevenue,
    weeklyExpenses,
    weeklyOneTimeCosts,
    weeklyOneTimeCostsPaid,
    industryId,
  );
  const revenueBreakdown = summarizeRevenueByCategory(weeklyRevenueDetails);
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
      revenueBreakdown,
      profit: weekResult.profit,
      reputation: updatedMetrics.reputation,
      reputationChange: updatedMetrics.reputation - previousReputation,
    },
  ];

  const baseExpenses = getWeeklyBaseExpenses(industryId);
  const upgradeExpenses = calculateUpgradeWeeklyExpenses(upgrades, industryId);

  return {
    metrics: updatedMetrics,
    weeklyRevenue: 0,
    weeklyExpenses: baseExpenses + upgradeExpenses,
    weeklyRevenueDetails: [],
    weeklyOneTimeCosts: 0,
    weeklyOneTimeCostDetails: [],
    weeklyOneTimeCostsPaid: 0,
    weeklyHistory: updatedHistory,
    currentWeek: currentWeek + 1,
    weeklyExpenseAdjustments: 0,
  };
}

function processCustomersForTick({
  customers,
  metrics,
  weeklyRevenue,
  weeklyRevenueDetails,
  upgradeEffects,
  industryId,
}: ProcessCustomersParams): ProcessCustomersResult {
  const roomsRemaining = [...getAvailableRooms(customers, upgradeEffects.treatmentRooms)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = weeklyRevenue;
  let revenueDetails = [...weeklyRevenueDetails];
  const stats = getBusinessStats(industryId);
  const reputationMultiplier = upgradeEffects.reputationMultiplier;

  // Find already occupied waiting positions (including both current and target positions)
  // occupiedWaitingPositions: the grid locations where someone is already sitting or heading; used to avoid overlap.
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

  const baseDynamicWalls = occupiedWaitingPositions.map(pos => ({ x: pos.x, y: pos.y }));

  customers.forEach((customer) => {
    const updatedCustomer = tickCustomer(customer);
    const currentTile = { x: Math.round(updatedCustomer.x), y: Math.round(updatedCustomer.y) };
    const dynamicWallsForCustomer = baseDynamicWalls.filter(
      wall => !(wall.x === currentTile.x && wall.y === currentTile.y)
    );

    // Assign target waiting position when customer starts walking to chair
    if (customer.status === CustomerStatus.Spawning && updatedCustomer.status === CustomerStatus.WalkingToChair) {
      // Find first unoccupied waiting position
      const waitingPositions = getWaitingPositions(industryId);
      for (let i = 0; i < waitingPositions.length; i++) {
        const waitingPosition = waitingPositions[i];
        if (waitingPosition) {
          const isOccupied = occupiedWaitingPositions.some(
            pos => pos.x === waitingPosition.x && pos.y === waitingPosition.y
          );
          if (!isOccupied) {
            updatedCustomer.targetX = waitingPosition.x;
            updatedCustomer.targetY = waitingPosition.y;
            const pathToChair = findPath(
              { x: Math.round(updatedCustomer.x), y: Math.round(updatedCustomer.y) },
              waitingPosition,
              { additionalWalls: dynamicWallsForCustomer }
            );
            updatedCustomer.path = pathToChair.length > 0 ? pathToChair : undefined;
            // Mark as occupied for next customers
            occupiedWaitingPositions.push({ x: waitingPosition.x, y: waitingPosition.y });
            baseDynamicWalls.push({ x: waitingPosition.x, y: waitingPosition.y });
            break;
          }
        }
      }
    }

    // If customer is waiting and there are available rooms, assign them to a room
    if (updatedCustomer.status === CustomerStatus.Waiting && roomsRemaining.length > 0) {
      const assignedRoom = roomsRemaining.shift()!;
      const customerWithService = startService(updatedCustomer, assignedRoom);
      
      // Assign target service room position
      const servicePosition = getServiceRoomPosition(assignedRoom, industryId);
      if (servicePosition) {
        customerWithService.targetX = servicePosition.x;
        customerWithService.targetY = servicePosition.y;
        const pathToRoom = findPath(
          { x: Math.round(customerWithService.x), y: Math.round(customerWithService.y) },
          servicePosition,
          { additionalWalls: dynamicWallsForCustomer }
        );
        customerWithService.path = pathToRoom.length > 0 ? pathToRoom : undefined;
      }

      updatedCustomers.push(customerWithService);
      return;
    }

    // If customer is leaving happy, add revenue and reputation
    if (updatedCustomer.status === CustomerStatus.WalkingOutHappy) {
      const servicePrice = updatedCustomer.service.price;
      
      // Add revenue
      const newCash = metricsAccumulator.cash + servicePrice;
      
      // Check if customer is happy based on probability
      const isHappy = Math.random() < stats.baseHappyProbability;
      const reputationGain = isHappy 
        ? Math.floor(stats.reputationGainPerHappyCustomer * reputationMultiplier)
        : 0;

      metricsAccumulator = {
        ...metricsAccumulator,
        cash: newCash,
        reputation: metricsAccumulator.reputation + reputationGain,
        totalRevenue: metricsAccumulator.totalRevenue + servicePrice,
      };
      revenueAccumulator += servicePrice;
      revenueDetails.push({
        amount: servicePrice,
        category: 'customer',
        label: updatedCustomer.service?.name ?? 'Dental service',
      });
      // Play sound effect for service finished
      audioManager.playSoundEffect('serviceFinished');
      // Customer leaves happy - remove from game (don't push to updatedCustomers)
      return;
    }

    // If customer is leaving angry, deduct reputation and keep in game for exit animation
    if (customer.status !== CustomerStatus.LeavingAngry && updatedCustomer.status === CustomerStatus.LeavingAngry) {
      // Customer just became angry - deduct reputation and keep in game for exit animation
      const reputationLoss = stats.reputationLossPerAngryCustomer;
      metricsAccumulator = {
        ...metricsAccumulator,
        reputation: Math.max(0, metricsAccumulator.reputation - reputationLoss),
      };
      updatedCustomers.push(updatedCustomer);
      return;
    }

    // If customer is leaving angry, keep in game for exit animation
    if (customer.status === CustomerStatus.LeavingAngry) {
      const leavingTicks = (customer.leavingTicks ?? 0) + 1;
      if (leavingTicks >= stats.leavingAngryDurationTicks) {
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
    weeklyRevenueDetails: revenueDetails,
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
 * (produce next tick given current snapshot.)
 */
export function tickOnce(state: TickSnapshot): TickResult {
  const industryId = state.industryId ?? 'dental';

  //adds 1 to gameTime every 10 ticks (because TICKS_PER_SECOND = 10)
  const nextTick = state.gameTick + 1;
  const nextGameTime = updateGameTimer(state.gameTime, nextTick);

  //To keep it pure, the function copies arrays and objects (customers, metrics, weeklyRevenueDetails, etc.) before changing them.
  let customers = [...state.customers];
  let metrics = { ...state.metrics };
  let weeklyRevenue = state.weeklyRevenue;
  let weeklyExpenses = state.weeklyExpenses;
  let weeklyRevenueDetails = [...state.weeklyRevenueDetails];
  let weeklyOneTimeCosts = state.weeklyOneTimeCosts;
  let weeklyOneTimeCostDetails = [...state.weeklyOneTimeCostDetails];
  let weeklyOneTimeCostsPaid = state.weeklyOneTimeCostsPaid ?? 0;
  let weeklyHistory = [...state.weeklyHistory];
  let currentWeek = state.currentWeek;
  let weeklyExpenseAdjustments = state.weeklyExpenseAdjustments ?? 0;

  // If gameTime crosses to the next week (isNewWeek), call processWeekTransition. That:
  // Runs endOfWeek to subtract expenses from cash.
  // Summarizes revenue by category.
  
  // Adds a WeeklyHistoryEntry.
  // Resets the weekly accumulators and recomputes weekly expenses (base + upgrade).
  // Resets weeklyExpenseAdjustments (since upgrade deltas are now baked in).
  if (isNewWeek(nextGameTime, state.gameTime)) {
    const transition = processWeekTransition({
      currentWeek,
      metrics,
      weeklyRevenue,
      weeklyExpenses,
      weeklyRevenueDetails,
      weeklyOneTimeCosts,
      weeklyOneTimeCostDetails,
      weeklyOneTimeCostsPaid,
      weeklyHistory,
      weeklyExpenseAdjustments,
      upgrades: state.upgrades,
      industryId,
    });

    metrics = transition.metrics;
    weeklyRevenue = transition.weeklyRevenue;
    weeklyExpenses = transition.weeklyExpenses;
    weeklyRevenueDetails = transition.weeklyRevenueDetails;
    weeklyOneTimeCosts = transition.weeklyOneTimeCosts;
    weeklyOneTimeCostDetails = transition.weeklyOneTimeCostDetails;
    weeklyOneTimeCostsPaid = transition.weeklyOneTimeCostsPaid;
    weeklyHistory = transition.weeklyHistory;
    currentWeek = transition.currentWeek;
    weeklyExpenseAdjustments = transition.weeklyExpenseAdjustments;
  }


  //Get the upgrade effects for the current upgrades.
  const upgradeEffects = getUpgradeEffects(state.upgrades, industryId);

  //If the customer should spawn with the upgrades, create a new customer.
  if (shouldSpawnCustomerWithUpgrades(nextTick, state.upgrades, industryId, upgradeEffects)) {
    customers = [...customers, createCustomer(upgradeEffects.serviceSpeedMultiplier, industryId)];
  }

  //Process customers for the tick.
  const {
    customers: processedCustomers,
    metrics: processedMetrics,
    weeklyRevenue: processedWeeklyRevenue,
    weeklyRevenueDetails: processedRevenueDetails,
  } = processCustomersForTick({
    customers,
    metrics,
    weeklyRevenue,
    weeklyRevenueDetails,
    upgradeEffects,
    industryId,
  });

  weeklyRevenueDetails = processedRevenueDetails;

  return {
    gameTick: nextTick,
    gameTime: nextGameTime,
    currentWeek,
    customers: processedCustomers,
    metrics: processedMetrics,
    weeklyRevenue: processedWeeklyRevenue,
    weeklyExpenses,
    weeklyRevenueDetails,
    weeklyOneTimeCosts,
    weeklyOneTimeCostDetails,
    weeklyOneTimeCostsPaid,
    weeklyHistory,
    upgrades: state.upgrades,
    weeklyExpenseAdjustments,
  };
}
