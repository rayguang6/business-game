import { StateCreator } from 'zustand';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';
import { tickOnce } from '@/lib/game/mechanics';
import { GameState, RevenueCategory, OneTimeCostCategory } from '../types';
import { getInitialMetrics } from './metricsSlice';
import { DEFAULT_INDUSTRY_ID, getUpgradesForIndustry, getWinCondition, getLoseCondition, getStartingTime } from '@/lib/game/config';
import { GameStore } from '../gameStore';
import { IndustryId } from '@/lib/game/types';
import { effectManager } from '@/lib/game/effectManager';
import { addStaffEffects } from '@/lib/features/staff';
import { addUpgradeEffects } from './upgradesSlice';
import { checkWinCondition } from '@/lib/game/winConditions';

// Shared initial game state - DRY principle
const getInitialGameState = (
  industryId: IndustryId,
  keepIndustry: boolean = false,
) => {
  const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
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
    metrics: getInitialMetrics(industryId),
    upgrades: {},
    flags: {},
    monthlyExpenseAdjustments: 0,
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
  
  // Flag management
  flags: Record<string, boolean>;
  
  startGame: () => void;
  pauseGame: () => void;
  unpauseGame: () => void;
  resetAllGame: () => void;
  tickGame: () => void;
  applyCashChange: (amount: number) => void;
  applyTimeChange: (amount: number) => void;
  applySkillLevelChange: (amount: number) => void; // Previously: applyReputationChange
  applyFreedomScoreChange: (amount: number) => void;
  recordEventRevenue: (amount: number, label?: string) => void;
  recordEventExpense: (amount: number, label: string) => void;
  checkGameOver: () => void;
  checkWinConditionAtMonthEnd: () => void;
  
  // Flag management methods
  setFlag: (flagId: string, value: boolean) => void;
  hasFlag: (flagId: string) => boolean;
  resetFlags: () => void;
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
  
  startGame: () => {
    const { resetEvents, resetMonthlyTracking, resetFlags } = get();

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
            applySkillLevelChange: currentState.applySkillLevelChange,
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
        applySkillLevelChange: currentState.applySkillLevelChange,
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
      });
      return { ...state, ...updated };
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
    set((state) => ({
      metrics: { ...state.metrics, time: state.metrics.time + amount },
    }));
    const { checkGameOver } = get();
    if (checkGameOver) {
      checkGameOver();
    }
  },
  applySkillLevelChange: (amount: number) => {
    set((state) => ({
      metrics: { ...state.metrics, skillLevel: state.metrics.skillLevel + amount },
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
  recordEventRevenue: (amount: number, label: string = 'Event revenue') => {
    set((state) => ({
      monthlyRevenue: state.monthlyRevenue + amount,
      monthlyRevenueDetails: [
        ...state.monthlyRevenueDetails,
        {
          amount,
          category: RevenueCategory.Event,
          label,
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
  recordEventExpense: (amount: number, label: string) => {
    const { addOneTimeCost } = get();
    if (addOneTimeCost) {
      addOneTimeCost(
        { label, amount, category: OneTimeCostCategory.Event },
        { deductNow: true },
      );
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
    const industryId = (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    
    // Check win condition: cash target reached
    const winCondition = getWinCondition(industryId);
    if (checkWinCondition(cash, winCondition)) {
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
});
};
