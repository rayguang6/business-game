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
import {
  DEFAULT_INDUSTRY_ID,
  getBusinessStats,
  getTicksPerSecondForIndustry,
  isNewWeek,
  UpgradeEffect,
} from '@/lib/game/config';

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
import { getWaitingPositions, getServiceRoomPosition } from '@/lib/game/positioning';
import { IndustryId } from '@/lib/game/types';
import { findPath } from '@/lib/game/pathfinding';
import { audioManager, AudioFx } from '@/lib/audio/audioManager';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

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
  industryId?: IndustryId;
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
  gameMetrics: {
    serviceRooms: number;
    reputationMultiplier: number;
    happyProbability: number;
  };
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
  gameMetrics,
  industryId,
}: ProcessCustomersParams): ProcessCustomersResult {
  const roomsRemaining = [...getAvailableRooms(customers, gameMetrics.serviceRooms)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = weeklyRevenue;
  const revenueDetails = [...weeklyRevenueDetails];
  const stats = getBusinessStats(industryId);
  const reputationMultiplier = gameMetrics.reputationMultiplier;
  const happyProbability = Math.max(0, Math.min(1, gameMetrics.happyProbability));

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
              { additionalWalls: dynamicWallsForCustomer, industryId }
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
          { additionalWalls: dynamicWallsForCustomer, industryId }
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
      const isHappy = Math.random() < happyProbability;
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
        category: RevenueCategory.Customer,
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
export function updateGameTimer(
  gameTime: number,
  gameTick: number,
  industryId: IndustryId,
): number {
  const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
  const ticksPerSecondRounded = Math.max(1, Math.round(ticksPerSecond));
  if (ticksPerSecond <= 0) {
    return gameTime;
  }
  if (gameTick % ticksPerSecondRounded === 0) {
    return gameTime + 1;
  }
  return gameTime;
}

interface WeekPreparationState {
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

function applyWeekTransitionIfNeeded(
  state: TickSnapshot,
  industryId: IndustryId,
  nextGameTime: number,
): WeekPreparationState {
  const cloneCurrentWeekState = (): WeekPreparationState => ({
    metrics: { ...state.metrics },
    weeklyRevenue: state.weeklyRevenue,
    weeklyExpenses: state.weeklyExpenses,
    weeklyRevenueDetails: [...state.weeklyRevenueDetails],
    weeklyOneTimeCosts: state.weeklyOneTimeCosts,
    weeklyOneTimeCostDetails: [...state.weeklyOneTimeCostDetails],
    weeklyOneTimeCostsPaid: state.weeklyOneTimeCostsPaid ?? 0,
    weeklyHistory: [...state.weeklyHistory],
    currentWeek: state.currentWeek,
    weeklyExpenseAdjustments: state.weeklyExpenseAdjustments ?? 0,
  });

  if (!isNewWeek(nextGameTime, state.gameTime, industryId)) {
    return cloneCurrentWeekState();
  }

  const transition = processWeekTransition({
    currentWeek: state.currentWeek,
    metrics: state.metrics,
    weeklyRevenue: state.weeklyRevenue,
    weeklyExpenses: state.weeklyExpenses,
    weeklyRevenueDetails: state.weeklyRevenueDetails,
    weeklyOneTimeCosts: state.weeklyOneTimeCosts,
    weeklyOneTimeCostDetails: state.weeklyOneTimeCostDetails,
    weeklyOneTimeCostsPaid: state.weeklyOneTimeCostsPaid ?? 0,
    weeklyHistory: state.weeklyHistory,
    weeklyExpenseAdjustments: state.weeklyExpenseAdjustments ?? 0,
    upgrades: state.upgrades,
    industryId,
  });

  return {
    metrics: transition.metrics,
    weeklyRevenue: transition.weeklyRevenue,
    weeklyExpenses: transition.weeklyExpenses,
    weeklyRevenueDetails: transition.weeklyRevenueDetails,
    weeklyOneTimeCosts: transition.weeklyOneTimeCosts,
    weeklyOneTimeCostDetails: transition.weeklyOneTimeCostDetails,
    weeklyOneTimeCostsPaid: transition.weeklyOneTimeCostsPaid,
    weeklyHistory: transition.weeklyHistory,
    currentWeek: transition.currentWeek,
    weeklyExpenseAdjustments: transition.weeklyExpenseAdjustments,
  };
}

function processCustomersWithEffects(params: ProcessCustomersParams): ProcessCustomersResult {
  return processCustomersForTick(params);
}

/**
 * Pure tick processor: given the current store state, returns updated fields.
 * (produce next tick given current snapshot.)
 */
export function tickOnce(state: TickSnapshot): TickResult {
  const industryId = (state.industryId ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  // Adds 1 to gameTime each time the configured tick cadence has elapsed.
  const nextTick = state.gameTick + 1;
  const nextGameTime = updateGameTimer(state.gameTime, nextTick, industryId);

  const preparedWeek = applyWeekTransitionIfNeeded(state, industryId, nextGameTime);

  // To keep it pure, the function copies arrays and objects (customers, metrics, weeklyRevenueDetails, etc.) before changing them.
  let customers = [...state.customers];
  let metrics = { ...preparedWeek.metrics };
  let weeklyRevenue = preparedWeek.weeklyRevenue;
  let weeklyExpenses = preparedWeek.weeklyExpenses;
  let weeklyRevenueDetails = [...preparedWeek.weeklyRevenueDetails];
  const weeklyOneTimeCosts = preparedWeek.weeklyOneTimeCosts;
  const weeklyOneTimeCostDetails = [...preparedWeek.weeklyOneTimeCostDetails];
  const weeklyOneTimeCostsPaid = preparedWeek.weeklyOneTimeCostsPaid;
  const weeklyHistory = [...preparedWeek.weeklyHistory];
  const currentWeek = preparedWeek.currentWeek;
  const weeklyExpenseAdjustments = preparedWeek.weeklyExpenseAdjustments;

  // Calculate all metrics using effectManager (includes upgrades, marketing, staff effects)
  const baseStats = getBusinessStats(industryId);
  const gameMetrics = {
    spawnIntervalSeconds: effectManager.calculate(GameMetric.SpawnIntervalSeconds, baseStats.customerSpawnIntervalSeconds),
    serviceSpeedMultiplier: effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0),
    serviceRooms: effectManager.calculate(GameMetric.ServiceRooms, baseStats.treatmentRooms),
    reputationMultiplier: effectManager.calculate(GameMetric.ReputationMultiplier, 1.0),
    happyProbability: effectManager.calculate(GameMetric.HappyProbability, baseStats.baseHappyProbability),
    weeklyExpenses: effectManager.calculate(GameMetric.WeeklyExpenses, 0),
  };
  weeklyExpenses = gameMetrics.weeklyExpenses;

  // Calculate spawn interval in ticks and check if it's time to spawn a customer
  const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
  const spawnIntervalTicks = Math.max(1, Math.round(gameMetrics.spawnIntervalSeconds * ticksPerSecond));
  const shouldSpawn = spawnIntervalTicks > 0 && nextTick % spawnIntervalTicks === 0;

  //If the customer should spawn, create a new customer.
  if (shouldSpawn) {
    customers = [...customers, createCustomer(gameMetrics.serviceSpeedMultiplier, industryId)];
  }

  //Process customers for the tick.
  const processedCustomersForTick = processCustomersWithEffects({
    customers,
    metrics,
    weeklyRevenue,
    weeklyRevenueDetails,
    gameMetrics,
    industryId,
  });

  customers = processedCustomersForTick.customers;
  metrics = processedCustomersForTick.metrics;
  weeklyRevenue = processedCustomersForTick.weeklyRevenue;
  weeklyRevenueDetails = processedCustomersForTick.weeklyRevenueDetails;

  return {
    gameTick: nextTick,
    gameTime: nextGameTime,
    currentWeek,
    customers,
    metrics,
    weeklyRevenue,
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
