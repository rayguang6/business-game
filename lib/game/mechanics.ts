import {
  GameState,
  Metrics,
  Upgrades,
  MonthlyHistoryEntry,
  OneTimeCost,
  RevenueEntry,
  TimeSpentEntry,
  REVENUE_CATEGORY_LABELS,
  RevenueCategory,
  getLevel,
} from '@/lib/store/types';
import { SourceType } from '@/lib/config/sourceTypes';
import {
  getBusinessStats,
  getExpPerLevel,
  getTicksPerSecondForIndustry,
  isNewMonth,
  UpgradeEffect,
  DEFAULT_INDUSTRY_ID,
  getFounderWorkingHoursBase,
  getStartingTime,
  getLayoutConfig,
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
  buildMonthlyExpenseBreakdown,
} from '@/lib/features/economy';
import { Staff, assignStaffToService, freeStaffFromService } from '@/lib/features/staff';
import { MainCharacter, assignMainCharacterToService, freeMainCharacterFromService } from '@/lib/features/mainCharacter';
import { ExpenseBreakdownItem } from '@/lib/store/types';
import { getWaitingPositions, getServiceRoomPosition, getServiceStaffPosition, getStaffPositions } from '@/lib/game/positioning';
import { findPath } from '@/lib/game/pathfinding';
import { audioManager, AudioFx } from '@/lib/audio/audioManager';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { findAvailableStaffForService } from '@/lib/game/serviceStaffMatching';
import { getGlobalMovementConfig } from '@/lib/game/config';

// Input parameters for the tick function
interface TickInput {
  gameTick: number;
  gameTime: number;
  currentMonth: number;
  customers: Customer[];
  leads: Lead[];
  leadProgress: number;
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
  staffMembers?: Staff[];
  monthlyLeadsSpawned?: number;
  monthlyCustomersGenerated?: number;
  monthlyCustomersServed?: number;
  monthlyCustomersLeftImpatient?: number;
  monthlyCustomersServiceFailed?: number;
  monthlyTimeSpent?: number;
  monthlyTimeSpentDetails?: TimeSpentEntry[];
  hiredStaff?: Staff[];
  mainCharacter?: MainCharacter | null;
}

// Output/result of the tick function (includes calculated conversionRate)
interface TickResult {
  gameTick: number;
  gameTime: number;
  currentMonth: number;
  customers: Customer[];
  leads: Lead[];
  leadProgress: number;
  conversionRate: number; // Always calculated and returned
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyRevenueDetails: RevenueEntry[];
  monthlyOneTimeCosts: number;
  monthlyOneTimeCostDetails: OneTimeCost[];
  monthlyOneTimeCostsPaid: number;
  monthlyHistory: MonthlyHistoryEntry[];
  upgrades: Upgrades;
  monthlyExpenseAdjustments: number;
  flags?: Record<string, boolean>;
  availableFlags?: any[];
  availableConditions?: any[];
  customersServed?: number; // Customers served this tick
  customersLeftImpatient?: number; // Customers left impatient this tick
  customersServiceFailed?: number; // Customers service failed this tick
  monthlyLeadsSpawned?: number;
  hiredStaff?: Staff[];
  mainCharacter?: MainCharacter | null;
  monthlyCustomersGenerated?: number;
  monthlyCustomersServed?: number;
  monthlyCustomersLeftImpatient?: number;
  monthlyCustomersServiceFailed?: number;
  monthlyTimeSpent?: number;
  monthlyTimeSpentDetails?: TimeSpentEntry[];
}

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
  staffMembers?: Staff[];
  monthlyLeadsSpawned?: number;
  monthlyCustomersGenerated?: number;
  monthlyCustomersServed?: number;
  monthlyCustomersLeftImpatient?: number;
  monthlyCustomersServiceFailed?: number;
  monthlyTimeSpent?: number;
  monthlyTimeSpentDetails?: TimeSpentEntry[];
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
  monthlyLeadsSpawned: number;
  monthlyCustomersGenerated: number;
  monthlyCustomersServed: number;
  monthlyCustomersLeftImpatient: number;
  monthlyCustomersServiceFailed: number;
  monthlyTimeSpent: number;
  monthlyTimeSpentDetails: TimeSpentEntry[];
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
    [GameMetric.ServiceCapacity]: number;
    [GameMetric.ServiceRevenueMultiplier]: number;
    [GameMetric.ServiceRevenueFlatBonus]: number;
    serviceRevenueScale: number; // Not in GameMetric enum (config value, not an effect)
    [GameMetric.FailureRate]: number;
    // EXP gain/loss are config-only (read directly from baseStats, not modifiable by effects)
    expGainPerHappyCustomer: number;
    expLossPerAngryCustomer: number;
  };
  industryId: string;
  hiredStaff?: Staff[];
  mainCharacter?: MainCharacter | null;
}

interface ProcessCustomersResult {
  customers: Customer[];
  metrics: Metrics;
  monthlyRevenue: number;
  monthlyRevenueDetails: RevenueEntry[];
  customersServed: number; // Customers who completed service successfully this tick
  customersLeftImpatient: number; // Customers who left due to impatience this tick
  customersServiceFailed: number; // Customers whose service failed this tick
  timeSpentThisTick: number; // Time spent on services this tick
  timeSpentDetailsThisTick: TimeSpentEntry[]; // Details of time spent this tick
  staffUpdates?: Staff[]; // Updated staff (if any were assigned/freed)
  mainCharacterUpdate?: MainCharacter | null; // Updated main character (if assigned/freed)
}

const summarizeRevenueByCategory = (entries: RevenueEntry[]): RevenueEntry[] => {
  const result: RevenueEntry[] = [];
  
  // Combine customer payments (too many to show individually)
  const customerPayments = entries
    .filter((entry) => entry.category === RevenueCategory.Customer)
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  if (customerPayments > 0) {
    result.push({
      category: RevenueCategory.Customer,
      amount: customerPayments,
      label: 'Customer payments',
    });
  }
  
  // Show all other revenue sources individually (events, staff, upgrades, etc.)
  const nonCustomerEntries = entries.filter((entry) => entry.category !== RevenueCategory.Customer);
  nonCustomerEntries.forEach((entry) => {
    result.push({
      category: entry.category,
      amount: entry.amount,
      label: entry.label || REVENUE_CATEGORY_LABELS[entry.category],
      sourceId: entry.sourceId,
    });
  });
  
  return result;
};

// Runs endOfMonth to subtract expenses from cash and calculate profit.
// Summarizes monthly revenue by category (customer, event, other).
// Adds a MonthlyHistoryEntry so the UI can show a month-by-month log.
// Resets monthly accumulators (monthlyRevenue, monthlyOneTimeCosts, details arrays).
// Recomputes monthlyExpenses for the new month: base + upgrade-driven expenses.
// Expenses are now only added to totalExpenses at month end.
// Only expenses actually deducted (recurring + unpaid one-time costs) are added to totalExpenses.

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
  staffMembers = [],
  monthlyLeadsSpawned = 0,
  monthlyCustomersGenerated = 0,
  monthlyCustomersServed = 0,
  monthlyCustomersLeftImpatient = 0,
  monthlyCustomersServiceFailed = 0,
  monthlyTimeSpent = 0,
  monthlyTimeSpentDetails = [],
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
  
  // Build expense breakdown for this month (all operating expenses individually)
  // Note: gameTime not available here, but effects are already filtered by effectManager.tick() in the game loop
  const expenseBreakdown = buildMonthlyExpenseBreakdown(upgrades, industryId, staffMembers);
  
  // Calculate expenses that were actually deducted at month end:
  // - Recurring expenses (monthlyExpenses) are always deducted at month end
  // - One-time costs: only add those that weren't already paid (deductNow: true)
  //   (Already-paid one-time costs were added to totalExpenses immediately when deducted)
  // Validate edge case: paid should never exceed total
  if (monthlyOneTimeCostsPaid > monthlyOneTimeCosts) {
    console.warn(
      `Data inconsistency detected: monthlyOneTimeCostsPaid (${monthlyOneTimeCostsPaid}) > monthlyOneTimeCosts (${monthlyOneTimeCosts}). ` +
      `This may indicate a bug or data corruption.` // TODO: Remove this warning
    );
  }
  const payableOneTimeCosts = Math.max(0, monthlyOneTimeCosts - monthlyOneTimeCostsPaid);
  const expensesActuallyDeducted = monthlyExpenses + payableOneTimeCosts;

  // Refresh available time at start of new month
  const baseTimeBudget = getStartingTime(industryId);
  const timeCapacityBonus = effectManager.calculate(GameMetric.MonthlyTimeCapacity, 0);
  const timeBudget = baseTimeBudget + timeCapacityBonus;

  const updatedMetrics: Metrics = {
    ...metrics,
    cash: monthResult.cash,
    time: timeBudget, // Refresh available time each month
    // Only add expenses that were actually deducted at month end
    totalExpenses: metrics.totalExpenses + expensesActuallyDeducted,
  };

  const previousExp = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1].exp : 0;
  const previousLevel = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1].level : 0;
  const expPerLevel = getExpPerLevel(industryId);
  const currentLevel = getLevel(updatedMetrics.exp, expPerLevel);

  // Calculate profit that matches the expenses stored in history
  // History expenses = expensesActuallyDeducted (recurring + unpaid one-time costs)
  // So profit should be revenue - expensesActuallyDeducted (not monthResult.profit which uses ALL one-time costs)
  const historyProfit = monthlyRevenue - expensesActuallyDeducted;

  const updatedHistory: MonthlyHistoryEntry[] = [
    ...monthlyHistory,
    {
      month: currentMonth,
      revenue: monthlyRevenue,
      // Use expensesActuallyDeducted to match what was actually deducted and added to metrics.totalExpenses
      // This ensures history entries match the lifetime totals
      expenses: expensesActuallyDeducted,
      oneTimeCosts: monthlyOneTimeCostDetails,
      revenueBreakdown,
      expenseBreakdown, // Store individual operating expenses breakdown
      // Profit should match the expenses: revenue - expensesActuallyDeducted
      // (monthResult.profit uses ALL one-time costs, but we only store expensesActuallyDeducted)
      profit: historyProfit,
      exp: updatedMetrics.exp,
      expChange: updatedMetrics.exp - previousExp,
      level: currentLevel,
      levelChange: currentLevel - previousLevel,
      freedomScore: metrics.freedomScore,
      leadsSpawned: monthlyLeadsSpawned,
      customersGenerated: monthlyCustomersGenerated,
      customersServed: monthlyCustomersServed,
      customersLeftImpatient: monthlyCustomersLeftImpatient,
      customersServiceFailed: monthlyCustomersServiceFailed,
      timeSpent: monthlyTimeSpent,
      timeSpentDetails: monthlyTimeSpentDetails,
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
    monthlyExpenseAdjustments: 0, // Kept for backward compatibility but no longer used in calculations
    // Reset monthly tracking fields
    monthlyLeadsSpawned: 0,
    monthlyCustomersGenerated: 0,
    monthlyCustomersServed: 0,
    monthlyCustomersLeftImpatient: 0,
    monthlyCustomersServiceFailed: 0,
    monthlyTimeSpent: 0,
    monthlyTimeSpentDetails: [],
  };
}

function processCustomersForTick({
  customers,
  metrics,
  monthlyRevenue,
  monthlyRevenueDetails,
  gameMetrics,
  industryId,
  hiredStaff = [],
  mainCharacter = null,
}: ProcessCustomersParams): ProcessCustomersResult {
  const roomsRemaining = [...getAvailableRooms(customers, gameMetrics.serviceCapacity, industryId)];
  const updatedCustomers: Customer[] = [];
  let metricsAccumulator: Metrics = { ...metrics };
  let revenueAccumulator = monthlyRevenue;
  const revenueDetails = [...monthlyRevenueDetails];
  let customersServedCount = 0;
  let customersLeftImpatientCount = 0;
  let customersServiceFailedCount = 0;
  let timeSpentThisTick = 0;
  const timeSpentDetailsThisTick: TimeSpentEntry[] = [];
  
  // Track staff and main character updates
  const staffUpdatesMap = new Map<string, Staff>();
  let mainCharacterUpdate: MainCharacter | null = mainCharacter;
  // Skill level effects are applied directly in the effect system
  // EXP gain/loss values now come from gameMetrics (calculated via effectManager)
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
      // Try each available room until we find one with valid positions and available staff
      let assigned = false;
      // Iterate backwards to avoid index issues when removing rooms
      for (let roomIndex = roomsRemaining.length - 1; roomIndex >= 0; roomIndex--) {
        const potentialRoom = roomsRemaining[roomIndex];
        const servicePosition = getServiceRoomPosition(potentialRoom, industryId);
        const staffPosition = getServiceStaffPosition(potentialRoom, industryId);
        
        // Skip rooms without valid positions
        if (!servicePosition || !staffPosition) {
          console.warn('[Service Room Assignment] Skipping room - missing positions', {
            roomId: potentialRoom,
            hasServicePosition: !!servicePosition,
            hasStaffPosition: !!staffPosition,
          });
          continue;
        }
        
        // Find available staff or main character for this service
        const currentStaff = hiredStaff.map(s => staffUpdatesMap.get(s.id) || s);
        const currentMainChar = mainCharacterUpdate || mainCharacter;
        const availableProvider = findAvailableStaffForService(
          updatedCustomer.service,
          currentStaff,
          currentMainChar
        );
        
        if (availableProvider) {
          // Check if there's enough time available for this service
          const serviceTimeCost = updatedCustomer.service.timeCost || 0;
          if (serviceTimeCost > 0 && metrics.time < serviceTimeCost) {
            // Not enough time available for this service - skip to next room
            continue;
          }

          // Found a room with valid positions, available staff, and sufficient time - assign it
          // Remove the room from available rooms (safe to remove when iterating backwards)
          roomsRemaining.splice(roomIndex, 1);
          
          // Recalculate service time with current service speed multiplier (fixes bug where upgrades don't apply to waiting customers)
          // Using GameMetric enum value ensures consistency - enum value is 'serviceSpeedMultiplier'
          const customerWithService = startService(updatedCustomer, potentialRoom, gameMetrics.serviceSpeedMultiplier, industryId);
          
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
          
          // Assign provider to service
          if (availableProvider.id === 'main-character') {
            // Assign main character
            // Use current position from availableProvider (before assignment) for pathfinding
            const currentMainCharPosition = {
              x: Math.round((availableProvider as MainCharacter).x ?? 0),
              y: Math.round((availableProvider as MainCharacter).y ?? 0),
            };
            
            const assignedMainChar = assignMainCharacterToService(
              availableProvider as MainCharacter,
              potentialRoom,
              customerWithService.id,
              staffPosition
            );
            // Calculate path for main character to staff position using their current position
            const mainCharPath = findPath(
              currentMainCharPosition,
              staffPosition,
              { additionalWalls: dynamicWallsForCustomer, industryId }
            );
            // Add facing direction to the last waypoint (use staffPosition facing or default to 'down')
            if (mainCharPath.length > 0) {
              const lastWaypoint = mainCharPath[mainCharPath.length - 1];
              lastWaypoint.facingDirection = staffPosition.facingDirection || assignedMainChar.facingDirection || 'down';
            }
            mainCharacterUpdate = {
              ...assignedMainChar,
              path: mainCharPath.length > 0 ? mainCharPath : undefined,
            };
          } else {
            // Assign staff
            // Get staff's current position - use their x/y if set, otherwise fall back to their initial staff position
            const staffProvider = availableProvider as Staff;
            const staffPositions = getStaffPositions(industryId);
            const staffIndex = hiredStaff.findIndex(s => s.id === staffProvider.id);
            const fallbackPosition = staffIndex >= 0 && staffIndex < staffPositions.length 
              ? staffPositions[staffIndex]
              : { x: 0, y: 0 };
            
            const currentStaffPosition = {
              x: Math.round(staffProvider.x ?? fallbackPosition.x),
              y: Math.round(staffProvider.y ?? fallbackPosition.y),
            };
            
            const assignedStaff = assignStaffToService(
              staffProvider,
              potentialRoom,
              customerWithService.id,
              staffPosition
            );
            // Calculate path for staff to staff position using their current position
            const staffPath = findPath(
              currentStaffPosition,
              staffPosition,
              { additionalWalls: dynamicWallsForCustomer, industryId }
            );
            // Add facing direction to the last waypoint (use staffPosition facing or default to 'down')
            if (staffPath.length > 0) {
              const lastWaypoint = staffPath[staffPath.length - 1];
              lastWaypoint.facingDirection = staffPosition.facingDirection || assignedStaff.facingDirection || 'down';
            }
            
            if (staffPath.length === 0) {
              console.warn('[Staff Assignment] No path found', {
                staffId: assignedStaff.id,
                staffName: assignedStaff.name,
                from: currentStaffPosition,
                to: staffPosition,
                roomId: potentialRoom,
              });
            }
            
            staffUpdatesMap.set(assignedStaff.id, {
              ...assignedStaff,
              path: staffPath.length > 0 ? staffPath : undefined,
            });
          }

          // Deduct time cost when service starts (upfront payment)
          if (serviceTimeCost > 0) {
            // Deduct time from available time
            const oldTime = metricsAccumulator.time;
            const newTime = Math.max(0, oldTime - serviceTimeCost);
            metricsAccumulator = {
              ...metricsAccumulator,
              time: newTime,
            };

            // Track time spent
            timeSpentThisTick += serviceTimeCost;
            timeSpentDetailsThisTick.push({
              amount: serviceTimeCost,
              label: `Service: ${updatedCustomer.service.name}`,
              sourceId: updatedCustomer.service.id,
              sourceType: SourceType.Other,
              sourceName: updatedCustomer.service.name,
            });
          }

          updatedCustomers.push(customerWithService);
          assigned = true;
          break; // Successfully assigned, exit the room loop
        }
        // If no provider available for this room, try next room
      }
      
      if (!assigned) {
        // No available room with valid positions and staff - keep customer waiting
        updatedCustomers.push(updatedCustomer);
      }
      continue; // Skip to next letcustomer
    }

    // If customer is leaving happy, check failure rate and add revenue and skill level
    if (updatedCustomer.status === CustomerStatus.WalkingOutHappy) {
      // Check failure rate - customer might fail and leave angry instead
      const failed = Math.random() * 100 < gameMetrics.failureRate;

      if (failed) {
        // Service failed - customer becomes angry and leaves without revenue
        updatedCustomer.status = CustomerStatus.LeavingAngry;
        updatedCustomer.leavingTicks = 0; // Initialize leaving animation
        customersServiceFailedCount++;

        // Immediately deduct EXP when customer becomes angry
        // Use calculated value from effectManager (can be modified by upgrades/staff/events)
        const expLoss = gameMetrics.expLossPerAngryCustomer;
        const oldExp = metricsAccumulator.exp;
        const newExp = Math.max(0, oldExp - expLoss);
        
        metricsAccumulator = {
          ...metricsAccumulator,
          exp: newExp,
        };

        // Keep customer in game for exit animation (don't continue)
        updatedCustomers.push(updatedCustomer);
        continue; // Skip to next customer (no revenue already handled)
      }

      // Service succeeded - customer leaves happy with revenue and exp
      customersServedCount++;


      const servicePrice = updatedCustomer.service.price;
      const tierMultiplier = getTierRevenueMultiplier(updatedCustomer.service.pricingCategory);
      const baseServiceValue = (servicePrice * tierMultiplier) + serviceRevenueFlatBonus;
      const serviceRevenue = Math.max(0, baseServiceValue) * serviceRevenueMultiplier * serviceRevenueScale;

      // Add revenue
      const oldCash = metricsAccumulator.cash;
      const newCash = oldCash + serviceRevenue;

      // Customers always leave satisfied, so apply the exp gain
      // Use service-specific EXP gain value
      const expGain = updatedCustomer.service.expGained || 0;
      const oldExp = metricsAccumulator.exp;
      const newExp = oldExp + expGain;

      metricsAccumulator = {
        ...metricsAccumulator,
        cash: newCash,
        exp: newExp,
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
      
      // Free staff or main character from service
      if (updatedCustomer.roomId) {
        // Find provider assigned to this customer
        const currentStaff = hiredStaff.map(s => staffUpdatesMap.get(s.id) || s);
        const currentMainChar = mainCharacterUpdate || mainCharacter;
        
        // Check staff first
        const assignedStaff = currentStaff.find(s => 
          s.assignedCustomerId === updatedCustomer.id && s.assignedRoomId === updatedCustomer.roomId
        );
        
        if (assignedStaff) {
          // Free staff and calculate return path to idle position
          const staffPositions = getStaffPositions(industryId);
          const staffIndex = hiredStaff.findIndex(s => s.id === assignedStaff.id);
          const idlePosition = staffIndex >= 0 && staffIndex < staffPositions.length 
            ? staffPositions[staffIndex]
            : { x: assignedStaff.x || 0, y: assignedStaff.y || 0 };
          
          const freedStaff = freeStaffFromService(assignedStaff);
          const returnPath = findPath(
            { x: Math.round(freedStaff.x || 0), y: Math.round(freedStaff.y || 0) },
            idlePosition,
            { additionalWalls: dynamicWallsForCustomer, industryId }
          );
          
          staffUpdatesMap.set(freedStaff.id, {
            ...freedStaff,
            targetX: idlePosition.x,
            targetY: idlePosition.y,
            path: returnPath.length > 0 ? returnPath : undefined,
          });
        } else if (currentMainChar && 
                   currentMainChar.assignedCustomerId === updatedCustomer.id && 
                   currentMainChar.assignedRoomId === updatedCustomer.roomId) {
          // Free main character and calculate return path to idle position
          const layoutConfig = getLayoutConfig(industryId);
          const idlePosition = layoutConfig?.mainCharacterPosition 
            ?? (layoutConfig?.staffPositions?.[0] ?? { x: currentMainChar.x || 0, y: currentMainChar.y || 0 });
          
          const freedMainChar = freeMainCharacterFromService(currentMainChar);
          const returnPath = findPath(
            { x: Math.round(freedMainChar.x || 0), y: Math.round(freedMainChar.y || 0) },
            idlePosition,
            { additionalWalls: dynamicWallsForCustomer, industryId }
          );
          
          mainCharacterUpdate = {
            ...freedMainChar,
            targetX: idlePosition.x,
            targetY: idlePosition.y,
            path: returnPath.length > 0 ? returnPath : undefined,
          };
        }
      }
      
      // Customer leaves happy - remove from game (don't push to updatedCustomers)
      continue; // Skip to next customer
    }

    // If customer is leaving angry, keep in game for exit animation
    // Check if customer just transitioned to LeavingAngry (was Waiting, now LeavingAngry = impatience)
    if (customer.status === CustomerStatus.LeavingAngry || updatedCustomer.status === CustomerStatus.LeavingAngry) {
      // If customer was Waiting and now is LeavingAngry, they left due to impatience
      if (customer.status === CustomerStatus.Waiting && updatedCustomer.status === CustomerStatus.LeavingAngry) {
        customersLeftImpatientCount++;
      }
      
      const leavingTicks = (customer.leavingTicks ?? 0) + 1;
      // Get leaving duration from base stats (not modifiable by effects - animation timing only)
      const baseStats = getBusinessStats(industryId);
      if (!baseStats) continue; // Skip if stats not loaded
      if (leavingTicks >= baseStats.leavingAngryDurationTicks) {
        // Exit animation complete - remove from game
        continue; // Skip to next customer
      }
      // Still leaving - keep in game to show animation
      updatedCustomers.push({ ...updatedCustomer, leavingTicks });
      continue; // Skip to next customer
    }

    updatedCustomers.push(updatedCustomer);
  }

  // Convert staff updates map to array (only include updated staff)
  const staffUpdates = hiredStaff.map(s => staffUpdatesMap.get(s.id) || s);
  
  return {
    customers: updatedCustomers,
    metrics: metricsAccumulator,
    monthlyRevenue: revenueAccumulator,
    monthlyRevenueDetails: revenueDetails,
    customersServed: customersServedCount,
    customersLeftImpatient: customersLeftImpatientCount,
    customersServiceFailed: customersServiceFailedCount,
    timeSpentThisTick,
    timeSpentDetailsThisTick,
    staffUpdates: staffUpdatesMap.size > 0 ? staffUpdates : undefined,
    mainCharacterUpdate: mainCharacterUpdate !== mainCharacter ? mainCharacterUpdate : undefined,
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
  monthlyLeadsSpawned: number;
  monthlyCustomersGenerated: number;
  monthlyCustomersServed: number;
  monthlyCustomersLeftImpatient: number;
  monthlyCustomersServiceFailed: number;
  monthlyTimeSpent: number;
  monthlyTimeSpentDetails: TimeSpentEntry[];
}

function applyMonthTransitionIfNeeded(
  state: TickInput,
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
    monthlyLeadsSpawned: state.monthlyLeadsSpawned ?? 0,
    monthlyCustomersGenerated: state.monthlyCustomersGenerated ?? 0,
    monthlyCustomersServed: state.monthlyCustomersServed ?? 0,
    monthlyCustomersLeftImpatient: state.monthlyCustomersLeftImpatient ?? 0,
    monthlyCustomersServiceFailed: state.monthlyCustomersServiceFailed ?? 0,
    monthlyTimeSpent: state.monthlyTimeSpent ?? 0,
    monthlyTimeSpentDetails: state.monthlyTimeSpentDetails ?? [],
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
    staffMembers: state.staffMembers ?? [],
    monthlyLeadsSpawned: state.monthlyLeadsSpawned ?? 0,
    monthlyCustomersGenerated: state.monthlyCustomersGenerated ?? 0,
    monthlyCustomersServed: state.monthlyCustomersServed ?? 0,
    monthlyCustomersLeftImpatient: state.monthlyCustomersLeftImpatient ?? 0,
    monthlyCustomersServiceFailed: state.monthlyCustomersServiceFailed ?? 0,
    monthlyTimeSpent: state.monthlyTimeSpent ?? 0,
    monthlyTimeSpentDetails: state.monthlyTimeSpentDetails ?? [],
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
    monthlyLeadsSpawned: transition.monthlyLeadsSpawned,
    monthlyCustomersGenerated: transition.monthlyCustomersGenerated,
    monthlyCustomersServed: transition.monthlyCustomersServed,
    monthlyCustomersLeftImpatient: transition.monthlyCustomersLeftImpatient,
    monthlyCustomersServiceFailed: transition.monthlyCustomersServiceFailed,
    monthlyTimeSpent: transition.monthlyTimeSpent,
    monthlyTimeSpentDetails: transition.monthlyTimeSpentDetails,
  };
}

function processCustomersWithEffects(params: ProcessCustomersParams): ProcessCustomersResult {
return processCustomersForTick(params);
}

/**
 * Process staff movement and status transitions for one tick
 */
function processStaffForTick(
  staff: Staff[],
  industryId: IndustryId,
): Staff[] {
  const movementSpeed = getGlobalMovementConfig()?.customerTilesPerTick || 0.1;
  
  return staff.map((member) => {
    // Handle different statuses
    switch (member.status) {
      case 'walking_to_room':
      case 'walking_to_idle': {
        // Move along path or towards target
        if (member.targetX === undefined || member.targetY === undefined) {
          return member;
        }
        
        const [nextWaypoint, ...remainingPath] =
          member.path && member.path.length > 0
            ? member.path
            : [{ x: member.targetX, y: member.targetY }];
        
        const dx = nextWaypoint.x - (member.x || 0);
        const dy = nextWaypoint.y - (member.y || 0);
        
        // Close enough to waypoint - snap to position and advance path
        if (Math.abs(dx) <= movementSpeed && Math.abs(dy) <= movementSpeed) {
          const hasMoreWaypoints = remainingPath.length > 0;
          const reachedFinalWaypoint =
            !hasMoreWaypoints &&
            nextWaypoint.x === member.targetX &&
            nextWaypoint.y === member.targetY;
          
          let facingDirection = member.facingDirection || 'down';
          if (reachedFinalWaypoint) {
            // Use target facing direction if available
            // Check current waypoint first, then path's last waypoint, then fallback
            const targetPos = member.path && member.path.length > 0 
              ? member.path[member.path.length - 1]
              : { x: member.targetX, y: member.targetY };
            facingDirection = nextWaypoint.facingDirection || targetPos.facingDirection || member.facingDirection || 'down';
            
            // Transition status based on target
            if (member.status === 'walking_to_room') {
              // Reached service room - start serving
              return {
                ...member,
                x: nextWaypoint.x,
                y: nextWaypoint.y,
                facingDirection,
                path: undefined,
                status: 'serving',
              };
            } else if (member.status === 'walking_to_idle') {
              // Reached idle position - go idle
              return {
                ...member,
                x: nextWaypoint.x,
                y: nextWaypoint.y,
                facingDirection,
                path: undefined,
                targetX: undefined,
                targetY: undefined,
                status: 'idle',
              };
            }
          }
          
          // Move to next waypoint
          let newFacingDirection = member.facingDirection || 'down';
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0) {
            newFacingDirection = dx > 0 ? 'right' : 'left';
          } else if (Math.abs(dy) > 0) {
            newFacingDirection = dy > 0 ? 'down' : 'up';
          }
          
          return {
            ...member,
            x: nextWaypoint.x,
            y: nextWaypoint.y,
            facingDirection: newFacingDirection,
            path: remainingPath.length > 0 ? remainingPath : undefined,
          };
        }
        
        // Move towards waypoint
        let newX = (member.x || 0) + Math.sign(dx) * Math.min(Math.abs(dx), movementSpeed);
        let newY = (member.y || 0) + Math.sign(dy) * Math.min(Math.abs(dy), movementSpeed);
        
        let newFacingDirection = member.facingDirection || 'down';
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0) {
          newFacingDirection = dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > 0) {
          newFacingDirection = dy > 0 ? 'down' : 'up';
        }
        
        return {
          ...member,
          x: newX,
          y: newY,
          facingDirection: newFacingDirection,
        };
      }
      
      case 'serving':
        // Staff is serving - no movement, status stays 'serving'
        return member;
      
      case 'idle':
      default:
        // Staff is idle - no movement
        return member;
    }
  });
}

/**
 * Process main character movement and status transitions for one tick
 */
function processMainCharacterForTick(
  mainCharacter: MainCharacter | null,
  industryId: IndustryId,
): MainCharacter | null {
  if (!mainCharacter) {
    return null;
  }
  
  const movementSpeed = getGlobalMovementConfig()?.customerTilesPerTick || 0.1;
  
  // Handle different statuses (same logic as staff)
  switch (mainCharacter.status) {
    case 'walking_to_room':
    case 'walking_to_idle': {
      // Move along path or towards target
      if (mainCharacter.targetX === undefined || mainCharacter.targetY === undefined) {
        return mainCharacter;
      }
      
      const [nextWaypoint, ...remainingPath] =
        mainCharacter.path && mainCharacter.path.length > 0
          ? mainCharacter.path
          : [{ x: mainCharacter.targetX, y: mainCharacter.targetY }];
      
      const dx = nextWaypoint.x - (mainCharacter.x || 0);
      const dy = nextWaypoint.y - (mainCharacter.y || 0);
      
      // Close enough to waypoint - snap to position and advance path
      if (Math.abs(dx) <= movementSpeed && Math.abs(dy) <= movementSpeed) {
        const hasMoreWaypoints = remainingPath.length > 0;
        const reachedFinalWaypoint =
          !hasMoreWaypoints &&
          nextWaypoint.x === mainCharacter.targetX &&
          nextWaypoint.y === mainCharacter.targetY;
        
        let facingDirection = mainCharacter.facingDirection || 'down';
        if (reachedFinalWaypoint) {
          // Use target facing direction if available
          // Check current waypoint first, then path's last waypoint, then fallback
          const targetPos = mainCharacter.path && mainCharacter.path.length > 0 
            ? mainCharacter.path[mainCharacter.path.length - 1]
            : { x: mainCharacter.targetX, y: mainCharacter.targetY };
          facingDirection = nextWaypoint.facingDirection || targetPos.facingDirection || mainCharacter.facingDirection || 'down';
          
          // Transition status based on target
          if (mainCharacter.status === 'walking_to_room') {
            // Reached service room - start serving
            return {
              ...mainCharacter,
              x: nextWaypoint.x,
              y: nextWaypoint.y,
              facingDirection,
              path: undefined,
              status: 'serving',
            };
          } else if (mainCharacter.status === 'walking_to_idle') {
            // Reached idle position - go idle
            return {
              ...mainCharacter,
              x: nextWaypoint.x,
              y: nextWaypoint.y,
              facingDirection,
              path: undefined,
              targetX: undefined,
              targetY: undefined,
              status: 'idle',
            };
          }
        }
        
        // Move to next waypoint
        let newFacingDirection = mainCharacter.facingDirection || 'down';
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0) {
          newFacingDirection = dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > 0) {
          newFacingDirection = dy > 0 ? 'down' : 'up';
        }
        
        return {
          ...mainCharacter,
          x: nextWaypoint.x,
          y: nextWaypoint.y,
          facingDirection: newFacingDirection,
          path: remainingPath.length > 0 ? remainingPath : undefined,
        };
      }
      
      // Move towards waypoint
      let newX = (mainCharacter.x || 0) + Math.sign(dx) * Math.min(Math.abs(dx), movementSpeed);
      let newY = (mainCharacter.y || 0) + Math.sign(dy) * Math.min(Math.abs(dy), movementSpeed);
      
      let newFacingDirection = mainCharacter.facingDirection || 'down';
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0) {
        newFacingDirection = dx > 0 ? 'right' : 'left';
      } else if (Math.abs(dy) > 0) {
        newFacingDirection = dy > 0 ? 'down' : 'up';
      }
      
      return {
        ...mainCharacter,
        x: newX,
        y: newY,
        facingDirection: newFacingDirection,
      };
    }
    
    case 'serving':
      // Main character is serving - no movement, status stays 'serving'
      return mainCharacter;
    
    case 'idle':
    default:
      // Main character is idle - no movement
      return mainCharacter;
  }
}

/**
 * Pure tick processor: given the current store state, returns updated fields.
 * (produce next tick given current snapshot.)
 */
export function tickOnce(state: TickInput): TickResult {
  const industryId = (state.industryId ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  // Adds 1 to gameTime each time the configured tick cadence has elapsed.
  const nextTick = state.gameTick + 1;
  const nextGameTime = updateGameTimer(state.gameTime, nextTick, industryId);

  const preparedMonth = applyMonthTransitionIfNeeded(state, industryId, nextGameTime);

  // To keep it pure, the function copies arrays and objects (customers, metrics, monthlyRevenueDetails, etc.) before changing them.
  let customers = [...state.customers];
  let leads = [...(state.leads || [])];
  let leadProgress = state.leadProgress || 0;
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
  let monthlyLeadsSpawned = preparedMonth.monthlyLeadsSpawned;
  let monthlyCustomersGenerated = preparedMonth.monthlyCustomersGenerated;
  let monthlyCustomersServed = preparedMonth.monthlyCustomersServed;
  let monthlyCustomersLeftImpatient = preparedMonth.monthlyCustomersLeftImpatient;
  let monthlyCustomersServiceFailed = preparedMonth.monthlyCustomersServiceFailed;
  let monthlyTimeSpent = preparedMonth.monthlyTimeSpent;
  let monthlyTimeSpentDetails = [...preparedMonth.monthlyTimeSpentDetails];
  
  // Initialize staff and main character
  let hiredStaff = [...(state.hiredStaff || [])];
  let mainCharacter = state.mainCharacter ? { ...state.mainCharacter } : null;

  // Calculate all metrics using effectManager (includes upgrades, marketing, staff effects)
  const baseStats = getBusinessStats(industryId);
  if (!baseStats) throw new Error('Business stats not loaded');
  const gameMetrics = {
    spawnIntervalSeconds: effectManager.calculate(GameMetric.SpawnIntervalSeconds, baseStats.customerSpawnIntervalSeconds),
    serviceSpeedMultiplier: effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0),
    serviceCapacity: effectManager.calculate(GameMetric.ServiceCapacity, baseStats.serviceCapacity),
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
    conversionRate: effectManager.calculate(GameMetric.ConversionRate, baseStats.conversionRate ?? 10),
    failureRate: effectManager.calculate(GameMetric.FailureRate, baseStats.failureRate ?? 0),
    monthlyExpenses: effectManager.calculate(
      GameMetric.MonthlyExpenses,
      getMonthlyBaseExpenses(industryId),
    ),
    founderWorkingHours: effectManager.calculate(
      GameMetric.FreedomScore,
      getFounderWorkingHoursBase(industryId),
    ),
    // EXP gain/loss are config-only (read directly from baseStats, not modifiable by effects)
    expGainPerHappyCustomer: (typeof baseStats.expGainPerHappyCustomer === 'number' && !Number.isNaN(baseStats.expGainPerHappyCustomer))
      ? baseStats.expGainPerHappyCustomer
      : 1,
    expLossPerAngryCustomer: (typeof baseStats.expLossPerAngryCustomer === 'number' && !Number.isNaN(baseStats.expLossPerAngryCustomer))
      ? baseStats.expLossPerAngryCustomer
      : 1,
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
      metrics.totalLeadsSpawned = (metrics.totalLeadsSpawned || 0) + 1;
      monthlyLeadsSpawned += 1;

      // Each lead spawn contributes to conversion progress
      leadProgress += gameMetrics.conversionRate;

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
          metrics.totalCustomersGenerated = (metrics.totalCustomersGenerated || 0) + 1;
          monthlyCustomersGenerated += 1;
        } else {
          console.warn(`[Lead System] No services available for customer conversion`);
        }

        // Carry over remaining progress after conversion
        leadProgress = leadProgress % 100;
      }
  }

  // Process leads for the tick
  leads = leads.map(lead => tickLead(lead, industryId));
  
  // Remove leads that have expired (lifetime <= 0) or are leaving and off-screen
  leads = leads.filter(lead => {
    if (lead.lifetime <= 0) {
      return false; // Expired
    }
    // Keep leads that are still active
    return true;
  });

  //Process customers for the tick (includes service assignment)
  const processedCustomersForTick = processCustomersWithEffects({
    customers,
    metrics,
    monthlyRevenue,
    monthlyRevenueDetails,
    gameMetrics,
    industryId,
    hiredStaff,
    mainCharacter,
  });

  customers = processedCustomersForTick.customers;
  metrics = processedCustomersForTick.metrics;
  monthlyRevenue = processedCustomersForTick.monthlyRevenue;
  monthlyRevenueDetails = processedCustomersForTick.monthlyRevenueDetails;
  
  // Update staff and main character if they were assigned/freed during customer processing
  if (processedCustomersForTick.staffUpdates) {
    hiredStaff = processedCustomersForTick.staffUpdates;
  }
  if (processedCustomersForTick.mainCharacterUpdate !== undefined) {
    mainCharacter = processedCustomersForTick.mainCharacterUpdate;
  }
  
  // Process staff and main character movement
  hiredStaff = processStaffForTick(hiredStaff, industryId);
  mainCharacter = processMainCharacterForTick(mainCharacter, industryId);
  
  // Accumulate per-tick customer tracking into monthly totals
  monthlyCustomersServed += processedCustomersForTick.customersServed;
  monthlyCustomersLeftImpatient += processedCustomersForTick.customersLeftImpatient;
  monthlyCustomersServiceFailed += processedCustomersForTick.customersServiceFailed;

  // Accumulate time spent on services this tick
  monthlyTimeSpent += processedCustomersForTick.timeSpentThisTick;
  monthlyTimeSpentDetails.push(...processedCustomersForTick.timeSpentDetailsThisTick);

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
    conversionRate: gameMetrics.conversionRate,
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
    customersServed: processedCustomersForTick.customersServed,
    customersLeftImpatient: processedCustomersForTick.customersLeftImpatient,
    customersServiceFailed: processedCustomersForTick.customersServiceFailed,
    monthlyLeadsSpawned,
    monthlyCustomersGenerated,
    monthlyCustomersServed,
    monthlyCustomersLeftImpatient,
    monthlyCustomersServiceFailed,
    monthlyTimeSpent,
    monthlyTimeSpentDetails,
    hiredStaff,
    mainCharacter,
  };
}
