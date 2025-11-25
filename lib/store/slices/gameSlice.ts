import { StateCreator } from 'zustand';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState, RevenueCategory, OneTimeCostCategory } from '../types';
import { SourceType, SourceInfo } from '@/lib/config/sourceTypes';
import { mapSourceTypeToRevenueCategory, mapSourceTypeToOneTimeCostCategory, ensureValidSourceInfo, SourceHelpers } from '@/lib/utils/financialTracking';
import { Lead } from '@/lib/features/leads';
import { getInitialMetrics } from './metricsSlice';
import { DEFAULT_INDUSTRY_ID, getUpgradesForIndustry, getWinCondition, getLoseCondition, getStartingTime, getBusinessStats } from '@/lib/game/config';
import { GameStore } from '../gameStore';
import { IndustryId } from '@/lib/game/types';
import { effectManager } from '@/lib/game/effectManager';
import { addStaffEffects } from '@/lib/features/staff';
import { addUpgradeEffects } from './upgradesSlice';
import { checkWinCondition } from '@/lib/game/winConditions';
import { checkRequirements } from '@/lib/game/requirementChecker';
import type { ResolvedDelayedOutcome, ResolvedEffect } from './eventSlice';
import { EventEffectType } from '@/lib/types/gameEvents';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { DynamicValueEvaluator } from '@/lib/game/dynamicValueEvaluator';

// Shared initial game state - DRY principle
const getInitialGameState = (
  industryId: IndustryId,
  keepIndustry: boolean = false,
) => {
  const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
  const businessStats = getBusinessStats(industryId);
  return {
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentMonth: 1,
    isGameOver: false,
    gameOverReason: null,
    monthlyRevenue: 0,
    monthlyExpenses: baseMonthlyExpenses,
    monthlyRevenueDetails: [],
    monthlyOneTimeCosts: 0,
    monthlyOneTimeCostDetails: [],
    monthlyOneTimeCostsPaid: 0,
    monthlyHistory: [],
    customers: [],
    leads: [],
    leadProgress: 0,
    conversionRate: businessStats.conversionRate ?? 10, // From business config with fallback
    customersServed: 0,
    customersLeftImpatient: 0,
    customersServiceFailed: 0,
    monthlyTimeSpent: 0,
    monthlyTimeSpentDetails: [],
    monthlyLeadsSpawned: 0,
    monthlyCustomersGenerated: 0,
    monthlyCustomersServed: 0,
    monthlyCustomersLeftImpatient: 0,
    monthlyCustomersServiceFailed: 0,
    metrics: getInitialMetrics(industryId),
    upgrades: {},
    flags: {},
    monthlyExpenseAdjustments: 0,
    eventSequenceIndex: 0,
    ...(keepIndustry ? {} : { selectedIndustry: null }),
  };
};

export interface GameSlice {
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number;
  gameTick: number;
  currentMonth: number;
  isGameOver: boolean;
  gameOverReason: 'cash' | 'time' | 'victory' | null;

  // Leads
  leads: Lead[];
  leadProgress: number;
  conversionRate: number;

  // Customer Tracking (lifetime)
  customersServed: number;
  customersLeftImpatient: number;
  customersServiceFailed: number;

  // Monthly Tracking (reset each month)
  monthlyLeadsSpawned: number;
  monthlyCustomersGenerated: number;
  monthlyCustomersServed: number;
  monthlyCustomersLeftImpatient: number;
  monthlyCustomersServiceFailed: number;
  monthlyTimeSpent: number;
  monthlyTimeSpentDetails: import('../types').TimeSpentEntry[];

  // Flag management
  flags: Record<string, boolean>;

  // Event sequence tracking
  eventSequenceIndex: number;

  startGame: () => void;
  pauseGame: () => void;
  unpauseGame: () => void;
  resetAllGame: () => void;
  tickGame: () => void;
  applyCashChange: (amount: number) => void;
  applyTimeChange: (amount: number) => void;
  applyExpChange: (amount: number) => void; // Previously: applySkillLevelChange
  applyFreedomScoreChange: (amount: number) => void;
  // Record revenue with source tracking
  // Supports both: recordEventRevenue(amount, label) and recordEventRevenue(amount, sourceInfo, label?)
  recordEventRevenue: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => void;
  // Record expense with source tracking
  // Supports both: recordEventExpense(amount, label) and recordEventExpense(amount, sourceInfo, label?)
  recordEventExpense: (amount: number, labelOrSource: string | SourceInfo, label?: string) => void;
  // Record time spent with source tracking
  // Supports both: recordTimeSpent(amount, label) and recordTimeSpent(amount, sourceInfo, label?)
  recordTimeSpent: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => void;
  checkGameOver: () => void;
  checkWinConditionAtMonthEnd: () => void;
  
  // Flag management methods
  setFlag: (flagId: string, value: boolean) => void;
  hasFlag: (flagId: string) => boolean;
  resetFlags: () => void;

  // Event sequence methods
  advanceEventSequence: () => void;
  resetEventSequence: () => void;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => {
  return ({
    isGameStarted: false,
    isPaused: false,
    gameTime: 0,
    gameTick: 0,
    currentMonth: 1,
    isGameOver: false,
    gameOverReason: null,
    flags: {},
    eventSequenceIndex: 0,

    // Leads
    leads: [],
    leadProgress: 0,
    conversionRate: 10, // Will be overridden by getInitialGameState

    // Customer Tracking (lifetime)
    customersServed: 0,
    customersLeftImpatient: 0,
    customersServiceFailed: 0,

    // Monthly Tracking (reset each month)
    monthlyLeadsSpawned: 0,
    monthlyCustomersGenerated: 0,
    monthlyCustomersServed: 0,
    monthlyCustomersLeftImpatient: 0,
    monthlyCustomersServiceFailed: 0,
    monthlyTimeSpent: 0,
    monthlyTimeSpentDetails: [],
  
  startGame: () => {
    const { resetEvents, resetMonthlyTracking, resetFlags, resetEventSequence } = get();

    // Reset to initial state but keep industry selection and start the game
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
    set({
      ...getInitialGameState(industryId, true), // keepIndustry = true
      isGameStarted: true, // Override to start the game
      monthlyExpenses: baseMonthlyExpenses,
      monthlyExpenseAdjustments: 0,
    });

    // Reset state for a fresh game
    if (resetEvents) {
      resetEvents();
    }
    if (resetMonthlyTracking) {
      resetMonthlyTracking();
    }
    if (resetFlags) {
      resetFlags();
    }
    if (resetEventSequence) {
      resetEventSequence();
    }

    // Restore effects for purchased upgrades and hired staff
    const currentState = get();
    const upgrades = currentState.upgrades;
    const hiredStaff = currentState.hiredStaff;

    // Re-register upgrade effects
    const availableUpgrades = getUpgradesForIndustry(industryId);
    const upgradeMap = new Map(availableUpgrades.map((upgrade) => [upgrade.id, upgrade]));
    Object.entries(upgrades).forEach(([upgradeId, level]) => {
      if (level > 0) {
        const upgrade = upgradeMap.get(upgradeId);
        if (upgrade) {
          addUpgradeEffects(upgrade, level, {
            applyCashChange: currentState.applyCashChange,
            applyTimeChange: currentState.applyTimeChange,
            applyExpChange: currentState.applyExpChange,
            applyFreedomScoreChange: currentState.applyFreedomScoreChange,
            recordEventRevenue: currentState.recordEventRevenue,
            recordEventExpense: currentState.recordEventExpense,
          });
        }
      }
    });

    // Re-register staff effects
    hiredStaff.forEach((staff) => {
      addStaffEffects(staff, {
        applyCashChange: currentState.applyCashChange,
        applyTimeChange: currentState.applyTimeChange,
        applyExpChange: currentState.applyExpChange,
        applyFreedomScoreChange: currentState.applyFreedomScoreChange,
        recordEventRevenue: currentState.recordEventRevenue,
        recordEventExpense: currentState.recordEventExpense,
      });
    });
  },
  
  pauseGame: () => {
    set({ isPaused: true });
  },
  
  unpauseGame: () => {
    set({ isPaused: false });
  },
  
  resetAllGame: () => {
    const {
      resetStaff,
      resetUpgrades,
      resetMarketing,
      resetEvents,
      resetMonthlyTracking,
      resetFlags,
      resetEventSequence,
    } = get();

    // Clear all active effects before rebuilding initial ones
    effectManager.clearAll();

    if (resetUpgrades) {
      resetUpgrades();
    }
    if (resetMarketing) {
      resetMarketing();
    }
    if (resetEvents) {
      resetEvents();
    }
    if (resetStaff) {
      resetStaff();
    }
    if (resetMonthlyTracking) {
      resetMonthlyTracking();
    }
    if (resetFlags) {
      resetFlags();
    }
    if (resetEventSequence) {
      resetEventSequence();
    }

    // Reset everything to initial state including industry selection
    set({
      ...getInitialGameState(DEFAULT_INDUSTRY_ID, false), // keepIndustry = false
      monthlyExpenses: getMonthlyBaseExpenses(DEFAULT_INDUSTRY_ID),
      monthlyExpenseAdjustments: 0,
    });
  },
  
  tickGame: () => {
    const { isPaused, currentMonth: previousMonth } = get();

    if (isPaused) {
      return;
    }

    set((state) => {
      const updated = tickOnce({
        gameTick: state.gameTick,
        gameTime: state.gameTime,
        currentMonth: state.currentMonth,
        customers: state.customers,
        leads: state.leads || [],
        leadProgress: state.leadProgress || 0,
        metrics: state.metrics,
        monthlyRevenue: state.monthlyRevenue,
        monthlyExpenses: state.monthlyExpenses,
        monthlyRevenueDetails: state.monthlyRevenueDetails,
        monthlyOneTimeCosts: state.monthlyOneTimeCosts,
        monthlyOneTimeCostDetails: state.monthlyOneTimeCostDetails,
        monthlyOneTimeCostsPaid: state.monthlyOneTimeCostsPaid,
        upgrades: state.upgrades,
        monthlyHistory: state.monthlyHistory,
        industryId: (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId,
        monthlyExpenseAdjustments: state.monthlyExpenseAdjustments,
        flags: state.flags,
        availableFlags: state.availableFlags,
        availableConditions: state.availableConditions,
        staffMembers: state.hiredStaff || [],
        monthlyLeadsSpawned: state.monthlyLeadsSpawned || 0,
        monthlyCustomersGenerated: state.monthlyCustomersGenerated || 0,
        monthlyCustomersServed: state.monthlyCustomersServed || 0,
        monthlyCustomersLeftImpatient: state.monthlyCustomersLeftImpatient || 0,
        monthlyCustomersServiceFailed: state.monthlyCustomersServiceFailed || 0,
        monthlyTimeSpent: state.monthlyTimeSpent || 0,
        monthlyTimeSpentDetails: state.monthlyTimeSpentDetails || [],
      });
      // Update customer tracking counters (lifetime only - monthly is tracked in mechanics.ts)
      const customerUpdates: Partial<GameState> = {};
      if (updated.customersServed !== undefined) {
        customerUpdates.customersServed = (state.customersServed || 0) + updated.customersServed;
      }
      if (updated.customersLeftImpatient !== undefined) {
        customerUpdates.customersLeftImpatient = (state.customersLeftImpatient || 0) + updated.customersLeftImpatient;
      }
      if (updated.customersServiceFailed !== undefined) {
        customerUpdates.customersServiceFailed = (state.customersServiceFailed || 0) + updated.customersServiceFailed;
      }
      // Monthly tracking values come directly from tick result (already calculated in mechanics.ts)
      if (updated.monthlyLeadsSpawned !== undefined) {
        customerUpdates.monthlyLeadsSpawned = updated.monthlyLeadsSpawned;
      }
      if (updated.monthlyCustomersGenerated !== undefined) {
        customerUpdates.monthlyCustomersGenerated = updated.monthlyCustomersGenerated;
      }
      if (updated.monthlyCustomersServed !== undefined) {
        customerUpdates.monthlyCustomersServed = updated.monthlyCustomersServed;
      }
      if (updated.monthlyCustomersLeftImpatient !== undefined) {
        customerUpdates.monthlyCustomersLeftImpatient = updated.monthlyCustomersLeftImpatient;
      }
      if (updated.monthlyCustomersServiceFailed !== undefined) {
        customerUpdates.monthlyCustomersServiceFailed = updated.monthlyCustomersServiceFailed;
      }
      if (updated.monthlyTimeSpent !== undefined) {
        customerUpdates.monthlyTimeSpent = updated.monthlyTimeSpent;
      }
      if (updated.monthlyTimeSpentDetails !== undefined) {
        customerUpdates.monthlyTimeSpentDetails = updated.monthlyTimeSpentDetails;
      }
      return { ...state, ...updated, ...customerUpdates };
    });
    
    // Check if a new month just started (month transition happened)
    const { currentMonth, checkGameOver, checkWinConditionAtMonthEnd, tickMarketing, gameTime } = get();
    const monthJustEnded = currentMonth > previousMonth;

    // Handle effect expiration through unified effect manager
    effectManager.tick(gameTime);

    // Check if marketing campaigns have ended
    if (tickMarketing) {
      tickMarketing(gameTime);
    }

    // Process ready delayed consequences
    const currentStore = get();
    const { pendingDelayedConsequences } = currentStore;
    if (pendingDelayedConsequences && pendingDelayedConsequences.length > 0) {
      const readyConsequences = pendingDelayedConsequences.filter(
        (pending) => gameTime >= pending.triggerTime
      );

      if (readyConsequences.length > 0) {
        // Process each ready delayed consequence
        readyConsequences.forEach((pending) => {
          const { delayedConsequence, eventId, eventTitle, choiceId, choiceLabel, consequenceId } = pending;
          
          // Check requirements to determine success/failure
          const hasRequirements = delayedConsequence.successRequirements && delayedConsequence.successRequirements.length > 0;
          const requirementsMet = hasRequirements 
            ? checkRequirements(delayedConsequence.successRequirements || [], currentStore)
            : true; // Default to success if no requirements
          
          const success = requirementsMet;
          const effectsToResolve = success 
            ? delayedConsequence.successEffects 
            : (delayedConsequence.failureEffects || []);

          // Resolve effects (similar to resolveEventChoice logic)
          const appliedEffects: any[] = [];
          const pendingEffects: ResolvedEffect[] = [];

          effectsToResolve.forEach((effect) => {
            if (effect.type === EventEffectType.DynamicCash) {
              // Calculate dynamic cash value at trigger time
              const industryId = currentStore.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID;
              const baseExpenses = getMonthlyBaseExpenses(industryId);
              const currentExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);
              const evaluator = new DynamicValueEvaluator({ expenses: currentExpenses });
              let value = evaluator.evaluate(effect.expression);
              const isExpensesExpression = effect.expression.trim().toLowerCase().startsWith('expenses');
              if (isExpensesExpression && value > 0) {
                value = -value;
              }

              appliedEffects.push({
                type: EventEffectType.Cash,
                amount: value,
                label: effect.label,
              });

              pendingEffects.push({
                type: EventEffectType.Cash,
                amount: value,
                label: effect.label,
              });
            } else if (effect.type === EventEffectType.Cash || effect.type === EventEffectType.Exp) {
              appliedEffects.push(effect);
              const resolvedEffect: ResolvedEffect = {
                type: effect.type,
                amount: effect.amount,
                label: effect.type === EventEffectType.Cash ? effect.label : undefined,
              };
              pendingEffects.push(resolvedEffect);
            } else if (effect.type === EventEffectType.Metric) {
              appliedEffects.push(effect);
              const resolvedEffect: ResolvedEffect = {
                type: EventEffectType.Metric,
                metric: effect.metric!,
                effectType: effect.effectType!,
                value: effect.value!,
                durationSeconds: effect.durationSeconds,
                priority: effect.priority,
                label: undefined,
              };
              pendingEffects.push(resolvedEffect);
            }
          });

          // Create resolved delayed outcome
          const resolvedOutcome: ResolvedDelayedOutcome = {
            id: pending.id,
            eventId,
            eventTitle,
            choiceId,
            choiceLabel,
            consequenceId,
            label: delayedConsequence.label,
            description: success ? delayedConsequence.successDescription : delayedConsequence.failureDescription,
            success,
            appliedEffects,
            pendingEffects,
          };

          // Update state atomically
          const wasPaused = currentStore.isPaused;
          set((state) => ({
            pendingDelayedConsequences: state.pendingDelayedConsequences.filter(
              (p) => p.id !== pending.id
            ),
            lastDelayedOutcome: resolvedOutcome,
            wasPausedBeforeDelayedOutcome: wasPaused,
          }));
          
          if (!wasPaused) {
            get().pauseGame();
          }
        });
      }
    }

    // Check lose conditions (cash, skillLevel) continuously
    checkGameOver();
    
    // Check win condition only at month end (after month is finalized)
    if (monthJustEnded && checkWinConditionAtMonthEnd) {
      checkWinConditionAtMonthEnd();
    }
  },

  //adjust cash, time, or skillLevel immediately and run checkGameOver afterward.
  applyCashChange: (amount: number) => {
    set((state) => ({
      metrics: { ...state.metrics, cash: state.metrics.cash + amount },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },
  applyTimeChange: (amount: number) => {
    // If time is being spent (negative), track it with fallback "Other" source
    if (amount < 0) {
      const { recordTimeSpent } = get();
      if (recordTimeSpent) {
        // Use recordTimeSpent with fallback "Other" source for unregistered time deductions
        recordTimeSpent(amount, 'Time spent');
        return; // recordTimeSpent already updates metrics and calls checkGameOver
      }
    }
    
    // For positive amounts (time gained) or if recordTimeSpent is not available, just update time
    set((state) => ({
      metrics: { ...state.metrics, time: state.metrics.time + amount },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },
  applyExpChange: (amount: number) => {
    set((state) => ({
      metrics: { ...state.metrics, exp: state.metrics.exp + amount },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },
  applyFreedomScoreChange: (amount: number) => {
    set((state) => ({
      metrics: { ...state.metrics, freedomScore: state.metrics.freedomScore + amount },
    }));
    // FreedomScore doesn't trigger game over, but we could add it if needed
  },

  //adds a revenue ledger entry, bumps monthly revenue, and updates cash/total revenue.
  // Supports both old API (label only) and new API (with SourceInfo)
  recordEventRevenue: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => {
    // Handle both old API (label: string) and new API (source: SourceInfo, label?: string)
    let sourceInfo: SourceInfo;
    let finalLabel: string;
    
    if (typeof labelOrSource === 'object' && labelOrSource !== null) {
      // New API: recordEventRevenue(amount, sourceInfo, optionalLabel)
      sourceInfo = ensureValidSourceInfo(labelOrSource, `legacy_${Date.now()}`, 'Event revenue');
      finalLabel = label || sourceInfo.name;
    } else {
      // Old API: recordEventRevenue(amount, label)
      finalLabel = labelOrSource || 'Event revenue';
      // Create default source info for backward compatibility
      sourceInfo = ensureValidSourceInfo(undefined, `legacy_${Date.now()}`, finalLabel);
    }
    
    set((state) => ({
      monthlyRevenue: state.monthlyRevenue + amount,
      monthlyRevenueDetails: [
        ...state.monthlyRevenueDetails,
        {
          amount,
          category: mapSourceTypeToRevenueCategory(sourceInfo.type),
          label: finalLabel,
          sourceId: sourceInfo.id,
          sourceType: sourceInfo.type,
          sourceName: sourceInfo.name,
        },
      ],
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash + amount,
        totalRevenue: state.metrics.totalRevenue + amount,
      },
    }));
  },

  // registers a one-time cost via monthlySlice.addOneTimeCost (which handles immediate deductions when requested).
  // Supports both old API (label only) and new API (with SourceInfo)
  recordEventExpense: (amount: number, labelOrSource: string | SourceInfo, label?: string) => {
    const { addOneTimeCost } = get();
    if (!addOneTimeCost) return;
    
    // Handle both old API (label: string) and new API (source: SourceInfo, label?: string)
    let sourceInfo: SourceInfo;
    let finalLabel: string;
    
    if (typeof labelOrSource === 'object' && labelOrSource !== null) {
      // New API: recordEventExpense(amount, sourceInfo, optionalLabel)
      sourceInfo = ensureValidSourceInfo(labelOrSource, `legacy_${Date.now()}`, 'Expense');
      finalLabel = label || sourceInfo.name || 'Expense';
    } else {
      // Old API: recordEventExpense(amount, label)
      finalLabel = labelOrSource || 'Expense';
      // Create default source info for backward compatibility
      sourceInfo = ensureValidSourceInfo(undefined, `legacy_${Date.now()}`, finalLabel);
    }
    
    addOneTimeCost(
      {
        label: finalLabel,
        amount,
        category: mapSourceTypeToOneTimeCostCategory(sourceInfo.type),
        sourceId: sourceInfo.id,
        sourceType: sourceInfo.type,
        sourceName: sourceInfo.name,
      },
      { deductNow: true },
    );
  },

  recordTimeSpent: (amount: number, labelOrSource?: string | SourceInfo, label?: string) => {
    // Only track when time is being spent (negative amount)
    if (amount >= 0) {
      // If time is being added, just apply the change without tracking
      const { applyTimeChange } = get();
      if (applyTimeChange) {
        applyTimeChange(amount);
      }
      return;
    }

    // Handle both old API (label: string) and new API (source: SourceInfo, label?: string)
    let sourceInfo: SourceInfo;
    let finalLabel: string;
    
    if (typeof labelOrSource === 'object' && labelOrSource !== null) {
      // New API: recordTimeSpent(amount, sourceInfo, optionalLabel)
      sourceInfo = ensureValidSourceInfo(labelOrSource, `time_${Date.now()}`, 'Time spent');
      finalLabel = label || sourceInfo.name;
    } else {
      // Old API: recordTimeSpent(amount, label) - use "Other" source type for unregistered sources
      finalLabel = labelOrSource || 'Time spent';
      // Create "Other" source info for unregistered time deductions
      sourceInfo = SourceHelpers.other(`other_time_${Date.now()}`, finalLabel);
    }

    const timeSpent = Math.abs(amount); // Convert to positive for tracking
    
    set((state) => ({
      metrics: {
        ...state.metrics,
        time: state.metrics.time + amount, // Deduct time
        totalTimeSpent: state.metrics.totalTimeSpent + timeSpent,
      },
      monthlyTimeSpent: state.monthlyTimeSpent + timeSpent,
      monthlyTimeSpentDetails: [
        ...state.monthlyTimeSpentDetails,
        {
          amount: timeSpent,
          label: finalLabel,
          sourceId: sourceInfo.id,
          sourceType: sourceInfo.type,
          sourceName: sourceInfo.name,
        },
      ],
    }));

    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },

  checkGameOver: () => {
    const state = get();
    if (state.isGameOver) return; // Already game over
    
    const { cash, time } = state.metrics;
    const industryId = (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const loseCondition = getLoseCondition(industryId);
    
    // Check lose conditions: cash or time
    if (cash <= loseCondition.cashThreshold) {
      set({ isGameOver: true, gameOverReason: 'cash', isPaused: true });
      return;
    }
    
    // Check time condition: only if time system is enabled (startingTime > 0)
    // If time <= 0 and time system is enabled, game over
    const startingTime = getStartingTime(industryId);
    if (startingTime > 0 && time <= loseCondition.timeThreshold) {
      set({ isGameOver: true, gameOverReason: 'time', isPaused: true });
      return;
    }
  },

  checkWinConditionAtMonthEnd: () => {
    const state = get();
    if (state.isGameOver) return; // Already game over

    const { cash } = state.metrics;
    const { currentMonth } = state;
    const industryId = (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

    // Check win condition: cash target reached or month target reached
    const winCondition = getWinCondition(industryId);
    if (checkWinCondition(cash, currentMonth, winCondition)) {
      set({ isGameOver: true, gameOverReason: 'victory', isPaused: true });
    }
  },

  // Flag management methods - use clean IDs directly (no prefix handling)
  setFlag: (flagId, value) => {
    set((state) => ({
      flags: { ...state.flags, [flagId]: value }
    }));
  },

  hasFlag: (flagId) => {
    return get().flags[flagId] === true;
  },

  resetFlags: () => {
    set({ flags: {} });
  },

  // Event sequence methods
  advanceEventSequence: () => {
    set((state) => ({
      eventSequenceIndex: state.eventSequenceIndex + 1
    }));
  },

  resetEventSequence: () => {
    set({ eventSequenceIndex: 0 });
  },
});
};
