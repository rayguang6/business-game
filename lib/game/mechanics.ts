import {
  GameState,
  Metrics,
  Upgrades,
  MonthlyHistoryEntry,
  OneTimeCost,
  RevenueEntry,
  REVENUE_CATEGORY_LABELS,
  RevenueCategory,
} from '@/lib/store/types';
import {
  DEFAULT_INDUSTRY_ID,
  getBusinessStats,
  getTicksPerSecondForIndustry,
  isNewMonth,
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
  endOfMonth,
  getMonthlyBaseExpenses,
  calculateUpgradeMonthlyExpenses,
} from '@/lib/features/economy';
import { getWaitingPositions, getServiceRoomPosition } from '@/lib/game/positioning';
import { IndustryId } from '@/lib/game/types';
import { findPath } from '@/lib/game/pathfinding';
import { audioManager, AudioFx } from '@/lib/audio/audioManager';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

interface TickSnapshot {
  gameTick: number;
  gameTime: number;
  currentMonth: number;
  customers: Customer[];
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  upgrades: Upgrades;
  industryId?: IndustryId;
  monthlyExpenseAdjustments: number;
}

type TickResult = Omit<TickSnapshot, 'industryId'>;

interface MonthTransitionParams {
  currentMonth: number;
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  monthlyExpenseAdjustments: number;
  upgrades: Upgrades;
  industryId: IndustryId;
}

interface MonthTransitionResult {
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  currentMonth: number;
  monthlyExpenseAdjustments: number;
}

interface ProcessCustomersParams {
  customers: Customer[];
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyRevenueDetails: RevenueEntry[];
  gameMetrics: {
    serviceRooms: number;
    reputationMultiplier: number;
    serviceRevenueMultiplier: number;
    serviceRevenueFlatBonus: number;
    serviceRevenueScale: number;
  };
  industryId: IndustryId;
}

interface ProcessCustomersResult {
  customers: Customer[];
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyRevenueDetails: RevenueEntry[];
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

// Runs endOfMonth to subtract expenses from cash and calculate profit.
// Summarizes monthly revenue by category (customer, event, other).
// Adds a MonthlyHistoryEntry so the UI can show a month-by-month log.
// Resets monthly accumulators (monthlyRevenue, monthlyOneTimeCosts, details arrays).
// Recomputes monthlyExpenses for the new month: base + upgrade-driven expenses.
// Resets monthlyExpenseAdjustments to 0 (any upgrade deltas have now been rolled forward).
// metrics.totalExpenses goes up by the new expenses (minus any adjustments we already tracked mid-month).
function processMonthTransition({
  currentMonth,
  metrics,
  monthlyRevenue,
  monthlyExpenses,
  monthlyRevenueDetails,
  monthlyOneTimeCosts,
  monthlyOneTimeCostDetails,
  monthlyOneTimeCostsPaid,
  monthlyHistory,
  monthlyExpenseAdjustments,
  upgrades,
  industryId,
}: MonthTransitionParams): MonthTransitionResult {
  const monthResult = endOfMonth(
    metrics.cash,
    monthlyRevenue,
    monthlyExpenses,
    monthlyOneTimeCosts,
    monthlyOneTimeCostsPaid,
    industryId,
  );
  const revenueBreakdown = summarizeRevenueByCategory(monthlyRevenueDetails);
  const alreadyAccounted = monthlyExpenseAdjustments ?? 0;
  const netExpensesForMetrics = Math.max(0, monthResult.totalExpenses - alreadyAccounted);

  const updatedMetrics: Metrics = {
    ...metrics,
    cash: monthResult.cash,
    totalExpenses: metrics.totalExpenses + netExpensesForMetrics,
  };

  const previousReputation = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1].reputation : 0;
  const updatedHistory: MonthlyHistoryEntry[] = [
    ...monthlyHistory,
    {
      month: currentMonth,
      revenue: monthlyRevenue,
      expenses: monthResult.totalExpenses,
      oneTimeCosts: monthlyOneTimeCostDetails,
      revenueBreakdown,
      profit: monthResult.profit,
      reputation: updatedMetrics.reputation,
      reputationChange: updatedMetrics.reputation - previousReputation,
    },
  ];

  const baseExpenses = getMonthlyBaseExpenses(industryId);
  const upgradeExpenses = calculateUpgradeMonthlyExpenses(upgrades, industryId);

  return {
    metrics: updatedMetrics,
    monthlyRevenue: 0,
    monthlyExpenses: baseExpenses + upgradeExpenses,
    monthlyRevenueDetails: [],
    monthlyOneTimeCosts: 0,
    monthlyOneTimeCostDetails: [],
    monthlyOneTimeCostsPaid: 0,
    monthlyHistory: updatedHistory,
    currentMonth: currentMonth + 1,
    monthlyExpenseAdjustments: 0,
  };
}

function processCustomersForTick({
  customers,
  metrics,
  monthlyRevenue,
  monthlyRevenueDetails,
  gameMetrics,
  industryId,
}: ProcessCustomersParams): ProcessCustomersResult {
  const roomsRemaining = [...getAvailableRooms(customers, gameMetrics.serviceRooms)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = monthlyRevenue;
  const revenueDetails = [...monthlyRevenueDetails];
  const stats = getBusinessStats(industryId);
  const reputationMultiplier = gameMetrics.reputationMultiplier;
  const serviceRevenueMultiplier = gameMetrics.serviceRevenueMultiplier > 0
    ? gameMetrics.serviceRevenueMultiplier
    : 1;
  const serviceRevenueFlatBonus = gameMetrics.serviceRevenueFlatBonus || 0;
  const serviceRevenueScale = gameMetrics.serviceRevenueScale > 0 ? gameMetrics.serviceRevenueScale : 1;

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
      const baseServiceValue = servicePrice + serviceRevenueFlatBonus;
      const serviceRevenue = Math.max(0, baseServiceValue) * serviceRevenueMultiplier * serviceRevenueScale;
      
      // Add revenue
      const newCash = metricsAccumulator.cash + serviceRevenue;
      
      // Customers always leave satisfied, so apply the full reputation gain
      const reputationGain = Math.floor(stats.reputationGainPerHappyCustomer * reputationMultiplier);

      metricsAccumulator = {
        ...metricsAccumulator,
        cash: newCash,
        reputation: metricsAccumulator.reputation + reputationGain,
        totalRevenue: metricsAccumulator.totalRevenue + serviceRevenue,
      };
      revenueAccumulator += serviceRevenue;
      revenueDetails.push({
        amount: serviceRevenue,
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
    monthlyRevenue: revenueAccumulator,
    monthlyRevenueDetails: revenueDetails,
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

interface MonthPreparationState {
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  currentMonth: number;
  monthlyExpenseAdjustments: number;
}

function applyMonthTransitionIfNeeded(
  state: TickSnapshot,
  industryId: IndustryId,
  nextGameTime: number,
): MonthPreparationState {
  const cloneCurrentMonthState = (): MonthPreparationState => ({
    metrics: { ...state.metrics },
    monthlyRevenue: state.monthlyRevenue,
    monthlyExpenses: state.monthlyExpenses,
    monthlyRevenueDetails: [...state.monthlyRevenueDetails],
    monthlyOneTimeCosts: state.monthlyOneTimeCosts,
    monthlyOneTimeCostDetails: [...state.monthlyOneTimeCostDetails],
    monthlyOneTimeCostsPaid: state.monthlyOneTimeCostsPaid ?? 0,
    monthlyHistory: [...state.monthlyHistory],
    currentMonth: state.currentMonth,
    monthlyExpenseAdjustments: state.monthlyExpenseAdjustments ?? 0,
  });

  if (!isNewMonth(nextGameTime, state.gameTime, industryId)) {
    return cloneCurrentMonthState();
  }

  const transition = processMonthTransition({
    currentMonth: state.currentMonth,
    metrics: state.metrics,
    monthlyRevenue: state.monthlyRevenue,
    monthlyExpenses: state.monthlyExpenses,
    monthlyRevenueDetails: state.monthlyRevenueDetails,
    monthlyOneTimeCosts: state.monthlyOneTimeCosts,
    monthlyOneTimeCostDetails: state.monthlyOneTimeCostDetails,
    monthlyOneTimeCostsPaid: state.monthlyOneTimeCostsPaid ?? 0,
    monthlyHistory: state.monthlyHistory,
    monthlyExpenseAdjustments: state.monthlyExpenseAdjustments ?? 0,
    upgrades: state.upgrades,
    industryId,
  });

  return {
    metrics: transition.metrics,
    monthlyRevenue: transition.monthlyRevenue,
    monthlyExpenses: transition.monthlyExpenses,
    monthlyRevenueDetails: transition.monthlyRevenueDetails,
    monthlyOneTimeCosts: transition.monthlyOneTimeCosts,
    monthlyOneTimeCostDetails: transition.monthlyOneTimeCostDetails,
    monthlyOneTimeCostsPaid: transition.monthlyOneTimeCostsPaid,
    monthlyHistory: transition.monthlyHistory,
    currentMonth: transition.currentMonth,
    monthlyExpenseAdjustments: transition.monthlyExpenseAdjustments,
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

  const preparedMonth = applyMonthTransitionIfNeeded(state, industryId, nextGameTime);

  // To keep it pure, the function copies arrays and objects (customers, metrics, monthlyRevenueDetails, etc.) before changing them.
  let customers = [...state.customers];
  let metrics = { ...preparedMonth.metrics };
  let monthlyRevenue = preparedMonth.monthlyRevenue;
  let monthlyExpenses = preparedMonth.monthlyExpenses;
  let monthlyRevenueDetails = [...preparedMonth.monthlyRevenueDetails];
  const monthlyOneTimeCosts = preparedMonth.monthlyOneTimeCosts;
  const monthlyOneTimeCostDetails = [...preparedMonth.monthlyOneTimeCostDetails];
  const monthlyOneTimeCostsPaid = preparedMonth.monthlyOneTimeCostsPaid;
  const monthlyHistory = [...preparedMonth.monthlyHistory];
  const currentMonth = preparedMonth.currentMonth;
  const monthlyExpenseAdjustments = preparedMonth.monthlyExpenseAdjustments;

  // Calculate all metrics using effectManager (includes upgrades, marketing, staff effects)
  const baseStats = getBusinessStats(industryId);
  const gameMetrics = {
    spawnIntervalSeconds: effectManager.calculate(GameMetric.SpawnIntervalSeconds, baseStats.customerSpawnIntervalSeconds),
    serviceSpeedMultiplier: effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0),
    serviceRooms: effectManager.calculate(GameMetric.ServiceRooms, baseStats.treatmentRooms),
    reputationMultiplier: effectManager.calculate(GameMetric.ReputationMultiplier, 1.0),
    serviceRevenueMultiplier: effectManager.calculate(
      GameMetric.ServiceRevenueMultiplier,
      baseStats.serviceRevenueMultiplier ?? 1,
    ),
    serviceRevenueFlatBonus: effectManager.calculate(
      GameMetric.ServiceRevenueFlatBonus,
      0,
    ),
    serviceRevenueScale: baseStats.serviceRevenueScale ?? 1,
    monthlyExpenses: effectManager.calculate(
      GameMetric.MonthlyExpenses,
      getMonthlyBaseExpenses(industryId),
    ),
  };
  monthlyExpenses = gameMetrics.monthlyExpenses;

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
    monthlyRevenue,
    monthlyRevenueDetails,
    gameMetrics,
    industryId,
  });

  customers = processedCustomersForTick.customers;
  metrics = processedCustomersForTick.metrics;
  monthlyRevenue = processedCustomersForTick.monthlyRevenue;
  monthlyRevenueDetails = processedCustomersForTick.monthlyRevenueDetails;

  return {
    gameTick: nextTick,
    gameTime: nextGameTime,
    currentMonth,
    customers,
    metrics,
    monthlyRevenue,
    monthlyExpenses,
    monthlyRevenueDetails,
    monthlyOneTimeCosts,
    monthlyOneTimeCostDetails,
    monthlyOneTimeCostsPaid,
    monthlyHistory,
    upgrades: state.upgrades,
    monthlyExpenseAdjustments,
  };
}
