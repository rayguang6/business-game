import { create } from 'zustand';
import { Industry } from '../game/industry/types';
import { Customer, CustomerStatus } from '../game/customers/types';
import { spawnCustomer as createCustomer, tickCustomer, startService, getAvailableSlots } from '../game/customers/mechanics';
import { updateGameTimer, shouldSpawnCustomer, tickOnce } from '../game/game/mechanics';
import { processServiceCompletion, endOfWeek, handleWeekTransition, getWeeklyBaseExpenses } from '../game/economy/mechanics';
import { TICKS_PER_SECOND, CUSTOMER_SPAWN_INTERVAL, getCurrentWeek, isNewWeek } from '../game/core/constants';
import { MAX_CUSTOMER_CAPACITY } from '../game/customers/config';

interface GameState {
  // Game state
  selectedIndustry: Industry | null;
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number; // in seconds
  gameTick: number; // increments every 100ms
  currentWeek: number; // current week/round (1, 2, 3, etc.)
  
  // Business metrics (structured object)
  metrics: {
    cash: number;        // Available money
    totalRevenue: number;     // Total money earned (cumulative)
    totalExpenses: number;    // Total money spent (cumulative)
    reputation: number;  // Business reputation
  };
  
  // Weekly tracking
  weeklyRevenue: number; // Revenue earned this week (resets each week)
  weeklyExpenses: number; // Expenses paid this week (resets each week)
  
  // Weekly history for charts/analytics
  weeklyHistory: Array<{
    week: number;
    revenue: number;
    expenses: number;
    profit: number;
    reputation: number;
    reputationChange: number;
  }>;
  
  // Customers
  customers: Customer[];
  
  // Actions
  setSelectedIndustry: (industry: Industry) => void;
  startGame: () => void;
  stopGame: () => void;
  pauseGame: () => void;
  unpauseGame: () => void;
  resetGame: () => void;
  resetAllGame: () => void; // New action to reset everything including industry
  updateMetrics: (updates: Partial<GameState['metrics']>) => void;
  updateWeeklyRevenue: (amount: number) => void;
  updateWeeklyExpenses: (amount: number) => void;
  updateGameTimer: () => void;
  
  // Customer actions
  spawnCustomer: () => Customer;
  removeCustomer: (customerId: string) => void;
  startService: (customerId: string) => void;
  
  // Game loop
  tickGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  selectedIndustry: null,
  isGameStarted: false,
  isPaused: false,
  gameTime: 0, // Game timer in seconds
  gameTick: 0, // increments every 100ms
  currentWeek: 1, // Start at week 1
  
  // Business metrics
  metrics: {
    cash: 1000,        // Start with some initial cash
    totalRevenue: 0,        // Total money earned (cumulative)
    totalExpenses: 0,       // Total money spent (cumulative)
    reputation: 0,     // Business reputation
  },
  
  // Weekly tracking
  weeklyRevenue: 0,    // Revenue earned this week
  weeklyExpenses: 0,   // Expenses paid this week
  
  // Weekly history
  weeklyHistory: [],
  
  // Customers
  customers: [],

  // Actions
  setSelectedIndustry: (industry: Industry) => {
    set({ selectedIndustry: industry });
  },

  startGame: () => {
    set({ 
      isGameStarted: true, 
      isPaused: false, 
      gameTime: 0, 
      gameTick: 0, 
      currentWeek: 1, 
      weeklyRevenue: 0,
      weeklyExpenses: getWeeklyBaseExpenses(),
      weeklyHistory: [],
      customers: [] 
    });
  },

  stopGame: () => {
    set({ isGameStarted: false, isPaused: false });
  },

  pauseGame: () => {
    set({ isPaused: true });
  },

  unpauseGame: () => {
    set({ isPaused: false });
  },

  // Reset game progress but keep the selected industry
  resetGame: () => {
    set((state) => ({
      isGameStarted: false,
      isPaused: false,
      gameTime: 0,
      gameTick: 0,
      currentWeek: 1,
      weeklyRevenue: 0,
      weeklyExpenses: getWeeklyBaseExpenses(),
      weeklyHistory: [],
      customers: [],
      metrics: {
        cash: 1000,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: 0,
      },
      // Keep the selectedIndustry unchanged
      selectedIndustry: state.selectedIndustry,
    }));
  },

  // Reset everything including the selected industry
  resetAllGame: () => {
    set({
      selectedIndustry: null,
      isGameStarted: false,
      isPaused: false,
      gameTime: 0,
      gameTick: 0,
      currentWeek: 1,
      weeklyRevenue: 0,
      weeklyExpenses: getWeeklyBaseExpenses(),
      weeklyHistory: [],
      customers: [],
      metrics: {
        cash: 1000,
        totalRevenue: 0,
        totalExpenses: 0,
        reputation: 0,
      },
    });
  },

  updateMetrics: (updates) => {
    set((state) => ({
      metrics: { ...state.metrics, ...updates }
    }));
  },

  updateWeeklyRevenue: (amount) => {
    set((state) => ({
      weeklyRevenue: state.weeklyRevenue + amount,
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash + amount,
        totalRevenue: state.metrics.totalRevenue + amount
      }
    }));
  },

  updateWeeklyExpenses: (amount) => {
    set((state) => ({
      weeklyExpenses: state.weeklyExpenses + amount,
      metrics: {
        ...state.metrics,
        cash: state.metrics.cash - amount,
        totalExpenses: state.metrics.totalExpenses + amount
      }
    }));
  },

  updateGameTimer: () => {
    set((state) => ({ gameTime: state.gameTime + 1 }));
  },

  // Customer actions
  spawnCustomer: () => {
    return createCustomer();
  },

  removeCustomer: (customerId: string) => {
    set((state) => ({
      customers: state.customers.filter(c => c.id !== customerId)
    }));
  },

  startService: (customerId: string) => {
    set((state) => ({
      customers: state.customers.map(customer => 
        customer.id === customerId 
          ? startService(customer)
          : customer
      )
    }));
  },


  // Central game loop action - tick-based system
  tickGame: () => {
    const { isPaused } = get();

    // Don't process game logic if paused
    if (isPaused) {
      return;
    }

    set((state) => {
      const updated = tickOnce({
        gameTick: state.gameTick,
        gameTime: state.gameTime,
        currentWeek: state.currentWeek,
        customers: state.customers,
        metrics: state.metrics,
        weeklyRevenue: state.weeklyRevenue,
        weeklyExpenses: state.weeklyExpenses,
        weeklyHistory: state.weeklyHistory,
      });
      return { ...state, ...updated };
    });
  },
}));