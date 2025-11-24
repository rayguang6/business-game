import {
  GameState,
  Metrics,
  Upgrades,
  MonthlyHistoryEntry,
  OneTimeCost,
  RevenueEntry,
  REVENUE_CATEGORY_LABELS,
  RevenueCategory,
  getLevel,
} from '@/lib/store/types';
import {
  getBusinessStats,
  getTicksPerSecondForIndustry,
  isNewMonth,
  UpgradeEffect,
  DEFAULT_INDUSTRY_ID,
  getFounderWorkingHoursBase,
  getStartingTime,
} from '@/lib/game/config';
import type { IndustryId, ServicePricingCategory } from '@/lib/game/types';

import {
  Customer,
  CustomerStatus,
  spawnCustomer as createCustomer,
  tickCustomer,
  startService,
  getAvailableRooms,
} from '@/lib/features/customers';
import {
  Lead,
  spawnLead as createLead,
  tickLead,
} from '@/lib/features/leads';
import { getServicesForIndustry } from '@/lib/game/config';
import { getServicesFromStore } from '@/lib/store/configStore';
import { checkRequirements } from '@/lib/game/requirementChecker';
import type { GameStore } from '@/lib/store/gameStore';
import { getWeightedRandomService } from '@/lib/features/services';
import {
  endOfMonth,
  getMonthlyBaseExpenses,
  calculateUpgradeMonthlyExpenses,
} from '@/lib/features/economy';
import { getWaitingPositions, getServiceRoomPosition } from '@/lib/game/positioning';
import { findPath } from '@/lib/game/pathfinding';
import { audioManager, AudioFx } from '@/lib/audio/audioManager';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

interface TickSnapshot {
  gameTick: number;
  gameTime: number;
  currentMonth: number;
  customers: Customer[];
  leads: Lead[];
  leadProgress: number;
  conversionRate: number;
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  upgrades: Upgrades;
  industryId?: string;
  monthlyExpenseAdjustments: number;
  flags?: Record<string, boolean>;
  availableFlags?: any[];
  availableConditions?: any[];
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
  industryId: string;
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
    // Using GameMetric enum values ensures consistency with effectManager
    // Note: SkillLevel is handled directly (like cash), not through effect system
    [GameMetric.ServiceSpeedMultiplier]: number;
    [GameMetric.ServiceRooms]: number;
    [GameMetric.ServiceRevenueMultiplier]: number;
    [GameMetric.ServiceRevenueFlatBonus]: number;
    serviceRevenueScale: number; // Not in GameMetric enum (config value, not an effect)
  };
  industryId: string;
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

/**
 * Gets the revenue multiplier for a service tier
 */
function getTierRevenueMultiplier(tier?: ServicePricingCategory): number {
  switch (tier) {
    case 'high':
      return effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, 1);
    case 'mid':
      return effectManager.calculate(GameMetric.MidTierServiceRevenueMultiplier, 1);
    case 'low':
      return effectManager.calculate(GameMetric.LowTierServiceRevenueMultiplier, 1);
    default:
      return 1;
  }
}

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

  // Refresh time budget at start of new month
  const baseTimeBudget = getStartingTime(industryId);
  const timeCapacityBonus = effectManager.calculate(GameMetric.MonthlyTimeCapacity, 0);
  const timeBudget = baseTimeBudget + timeCapacityBonus;

  const updatedMetrics: Metrics = {
    ...metrics,
    cash: monthResult.cash,
    time: timeBudget, // Refresh time budget each month
    totalExpenses: metrics.totalExpenses + netExpensesForMetrics,
  };

  const previousExp = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1].exp : 0;
  const previousLevel = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1].level : 0;
  const currentLevel = getLevel(updatedMetrics.exp);

  const updatedHistory: MonthlyHistoryEntry[] = [
    ...monthlyHistory,
    {
      month: currentMonth,
      revenue: monthlyRevenue,
      expenses: monthResult.totalExpenses,
      oneTimeCosts: monthlyOneTimeCostDetails,
      revenueBreakdown,
      profit: monthResult.profit,
      exp: updatedMetrics.exp,
      expChange: updatedMetrics.exp - previousExp,
      level: currentLevel,
      levelChange: currentLevel - previousLevel,
      freedomScore: metrics.freedomScore,
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
  const roomsRemaining = [...getAvailableRooms(customers, gameMetrics.serviceRooms, industryId)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = monthlyRevenue;
  const revenueDetails = [...monthlyRevenueDetails];
  const stats = getBusinessStats(industryId);
  // Skill level effects are applied directly in the effect system
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

  // Use for...of loop instead of forEach to allow proper control flow
  for (const customer of customers) {
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
            // Store the facing direction from the waiting position config (defaults to 'right' for backward compatibility)
            updatedCustomer.waitingPositionFacing = waitingPosition.facingDirection || 'right';
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
    // Only assign to customers who were ALREADY waiting (not those who just transitioned to waiting)
    if (customer.status === CustomerStatus.Waiting && updatedCustomer.status === CustomerStatus.Waiting && roomsRemaining.length > 0) {
      // Check if service position exists BEFORE consuming a room slot
      const potentialRoom = roomsRemaining[0]; // Peek at first room without removing it
      const servicePosition = getServiceRoomPosition(potentialRoom, industryId);
      
      if (servicePosition) {
        // Only consume room slot if we can actually assign it
        const assignedRoom = roomsRemaining.shift()!;
        // Recalculate service time with current service speed multiplier (fixes bug where upgrades don't apply to waiting customers)
        // Using GameMetric enum value ensures consistency - enum value is 'serviceSpeedMultiplier'
        const customerWithService = startService(updatedCustomer, assignedRoom, gameMetrics.serviceSpeedMultiplier, industryId);
        
        customerWithService.targetX = servicePosition.x;
        customerWithService.targetY = servicePosition.y;
        // Store the facing direction from the service position config (defaults to 'down' for backward compatibility)
        customerWithService.servicePositionFacing = servicePosition.facingDirection || 'down';
        const pathToRoom = findPath(
          { x: Math.round(customerWithService.x), y: Math.round(customerWithService.y) },
          servicePosition,
          { additionalWalls: dynamicWallsForCustomer, industryId }
        );
        customerWithService.path = pathToRoom.length > 0 ? pathToRoom : undefined;
        updatedCustomers.push(customerWithService);
        continue; // Skip to next customer
      } else {
        // If no valid service position for this room, keep customer waiting
        // Don't consume room slot - it will be available for next customer
        updatedCustomers.push(updatedCustomer);
        continue; // Skip to next customer
      }
    }

    // If customer is leaving happy, check failure rate and add revenue and skill level
    if (updatedCustomer.status === CustomerStatus.WalkingOutHappy) {
      // Check failure rate - customer might fail and leave angry instead
      const failureRate = effectManager.calculate(GameMetric.FailureRate, 0);
      const failed = Math.random() * 100 < failureRate;

      if (failed) {
        // Service failed - customer becomes angry and leaves without revenue
        updatedCustomer.status = CustomerStatus.LeavingAngry;
        // Keep customer in game for exit animation (don't continue)
        updatedCustomers.push(updatedCustomer);
        continue; // Skip to next customer (no revenue, no exp)
      }

      // Service succeeded - customer leaves happy with revenue and exp
      const servicePrice = updatedCustomer.service.price;
      const tierMultiplier = getTierRevenueMultiplier(updatedCustomer.service.pricingCategory);
      const baseServiceValue = (servicePrice * tierMultiplier) + serviceRevenueFlatBonus;
      const serviceRevenue = Math.max(0, baseServiceValue) * serviceRevenueMultiplier * serviceRevenueScale;

      // Add revenue
      const newCash = metricsAccumulator.cash + serviceRevenue;

      // Customers always leave satisfied, so apply the base exp gain
      // EXP is modified directly (like cash), not through effect multipliers
      const expGain = stats.expGainPerHappyCustomer;

      metricsAccumulator = {
        ...metricsAccumulator,
        cash: newCash,
        exp: metricsAccumulator.exp + expGain,
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
      continue; // Skip to next customer
    }

    // If customer is leaving angry, deduct skill level and keep in game for exit animation
    if (customer.status !== CustomerStatus.LeavingAngry && updatedCustomer.status === CustomerStatus.LeavingAngry) {
      // Customer just became angry - deduct exp and keep in game for exit animation
      const expLoss = stats.expLossPerAngryCustomer;
      metricsAccumulator = {
        ...metricsAccumulator,
        exp: Math.max(0, metricsAccumulator.exp - expLoss),
      };
      updatedCustomers.push(updatedCustomer);
      continue; // Skip to next customer
    }

    // If customer is leaving angry, keep in game for exit animation
    if (customer.status === CustomerStatus.LeavingAngry) {
      const leavingTicks = (customer.leavingTicks ?? 0) + 1;
      if (leavingTicks >= stats.leavingAngryDurationTicks) {
        // Exit animation complete - remove from game
        continue; // Skip to next customer
      }
      // Still leaving - keep in game to show animation
      updatedCustomers.push({ ...updatedCustomer, leavingTicks });
      continue; // Skip to next customer
    }

    updatedCustomers.push(updatedCustomer);
  }

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
  industryId: string,
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
  industryId: string,
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
  let leads = [...(state.leads || [])];
  let leadProgress = state.leadProgress || 0;
  let conversionRate = state.conversionRate || 10;
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
    // Skill level is handled directly (like cash), not through effect system
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
    founderWorkingHours: effectManager.calculate(
      GameMetric.FreedomScore,
      getFounderWorkingHoursBase(industryId),
    ),
  };
  monthlyExpenses = gameMetrics.monthlyExpenses;

  // Calculate spawn interval in ticks and check if it's time to spawn leads
  const ticksPerSecond = getTicksPerSecondForIndustry(industryId);
  const spawnIntervalTicks = Math.max(1, Math.round(gameMetrics.spawnIntervalSeconds * ticksPerSecond));
  const shouldSpawnLeads = spawnIntervalTicks > 0 && nextTick % spawnIntervalTicks === 0;

  // Lead system: spawn leads that accumulate toward customer conversion
  if (shouldSpawnLeads) {
      // LEAD SYSTEM: Spawn leads that accumulate toward customer conversion
      const lead = createLead(industryId);
      leads = [...leads, lead];

      // Each lead spawn contributes to conversion progress
      leadProgress += conversionRate;

      // If progress reaches 100%, convert to a customer
      if (leadProgress >= 100) {
        // Filter services by requirements (same pattern as lead spawning)
        const servicesFromStore = getServicesFromStore(industryId);
        const allServices =
          servicesFromStore.length > 0 ? servicesFromStore : getServicesForIndustry(industryId);

        // Create a minimal store-like object for requirement checking
        const storeContext: Partial<GameStore> = {
          flags: state.flags || {},
          availableFlags: state.availableFlags || [],
          availableConditions: state.availableConditions || [],
          metrics: state.metrics,
          upgrades: state.upgrades,
        };

        // Filter services that meet requirements
        const availableServices = allServices.filter((service) => {
          if (!service.requirements || service.requirements.length === 0) {
            return true; // No requirements means always available
          }
          return checkRequirements(service.requirements, storeContext as GameStore);
        });

        if (availableServices.length > 0) {
          // Pick a weighted random service
          const selectedService = getWeightedRandomService(availableServices);

          // Create customer with the selected service
          const customer = createCustomer(gameMetrics.serviceSpeedMultiplier, industryId);
          customers = [...customers, {
            ...customer,
            service: selectedService,
          }];

          console.log(`[Lead System] Lead converted to customer! Progress reached 100% (${conversionRate}% per lead)`);
        } else {
          console.warn(`[Lead System] No services available for customer conversion`);
        }

        // Reset progress after conversion
        leadProgress = 0;
      }
  }

  // Process leads for the tick
  leads = leads.map(lead => tickLead(lead));
  
  // Remove leads that have expired (lifetime <= 0) or are leaving and off-screen
  leads = leads.filter(lead => {
    if (lead.lifetime <= 0) {
      return false; // Expired
    }
    // Keep leads that are still active
    return true;
  });

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

  // FreedomScore is now direct state (like Cash/Time/SkillLevel)
  // It's modified directly via applyFreedomScoreChange(), not calculated here
  // Staff/upgrade effects on FreedomScore are applied directly when hired/purchased

  return {
    gameTick: nextTick,
    gameTime: nextGameTime,
    currentMonth,
    customers,
    leads,
    leadProgress,
    conversionRate,
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
