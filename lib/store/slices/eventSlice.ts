import { StateCreator } from 'zustand';
import { GameEvent, GameEventChoice, GameEventConsequence, GameEventEffect } from '../../types/gameEvents';
import { GameMetric, EffectType } from '../../game/effectManager';
import type { GameStore } from '../gameStore';
import { effectManager } from '@/lib/game/effectManager';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { DynamicValueEvaluator } from '@/lib/game/dynamicValueEvaluator';

export interface ResolvedEventOutcome {
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  consequenceId: string | null;
  costPaid: number;
  appliedEffects: GameEventEffect[];
  consequenceLabel?: string;
  consequenceDescription?: string;
}

export interface EventSlice {
  currentEvent: GameEvent | null;
  wasPausedBeforeEvent: boolean;
  lastEventOutcome: ResolvedEventOutcome | null;
  setCurrentEvent: (event: GameEvent | null) => void;
  resolveEventChoice: (choiceId: string) => void;
  clearLastEventOutcome: () => void;
}

// Helper to calculate dynamic cash value
const calculateDynamicCashValue = (
  effect: GameEventEffect & { type: 'dynamicCash' },
  store: GameStore,
): number => {
  const industryId = store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID;
  const baseExpenses = getMonthlyBaseExpenses(industryId);
  const currentExpenses = effectManager.calculate(GameMetric.MonthlyExpenses, baseExpenses);

  const evaluator = new DynamicValueEvaluator({ expenses: currentExpenses });
  let value = evaluator.evaluate(effect.expression);

  // Quick fix: Expenses expressions are always costs (negative cash)
  // Since expenses*N is always positive, we negate it for expenses-based expressions
  const isExpensesExpression = effect.expression.trim().toLowerCase().startsWith('expenses');
  if (isExpensesExpression && value > 0) {
    value = -value;
  }

  return value;
};

// Convert event effects to effectManager system
const applyEventEffect = (
  effect: GameEventEffect,
  event: GameEvent,
  choice: GameEventChoice,
  store: GameStore,
): void => {
  switch (effect.type) {
    case 'cash': {
      // Cash effects should be handled by the game's revenue system
      const { recordEventRevenue, recordEventExpense } = store;
      if (effect.amount >= 0) {
        recordEventRevenue(effect.amount, effect.label ?? `${event.title} - ${choice.label}`);
      } else {
        recordEventExpense(Math.abs(effect.amount), effect.label ?? `${event.title} - ${choice.label}`);
      }
      return; // Don't use effectManager for cash (handled by revenue system)
    }
    case 'dynamicCash': {
      const value = calculateDynamicCashValue(effect, store);
      const { recordEventRevenue, recordEventExpense } = store;
      if (value >= 0) {
        recordEventRevenue(value, effect.label ?? `${event.title} - ${choice.label}`);
      } else {
        recordEventExpense(Math.abs(value), effect.label ?? `${event.title} - ${choice.label}`);
      }
      return;
    }
    case 'reputation': {
      // Reputation effects should directly modify reputation
      const { applyReputationChange } = store;
      applyReputationChange(effect.amount);
      return; // Don't use effectManager for reputation (handled directly)
    }
    case 'metric': {
      // Direct metric effect
      effectManager.add({
        id: `event_${event.id}_${choice.id}_${Date.now()}`,
        source: {
          category: 'event',
          id: event.id,
          name: event.title,
        },
        metric: effect.metric,
        type: effect.effectType,
        value: effect.value,
        durationSeconds: effect.durationSeconds,
        priority: effect.priority,
      });
      break;
    }
  }
};

const pickConsequence = (choice: GameEventChoice): GameEventConsequence | null => {
  if (!choice.consequences || choice.consequences.length === 0) {
    return null;
  }

  const totalWeight = choice.consequences.reduce(
    (sum, consequence) => sum + Math.max(0, consequence.weight ?? 0),
    0,
  );
  if (totalWeight <= 0) {
    // No positive weights; just return first consequence to avoid runtime errors
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Event choice "${choice.id}" has no positive consequence weights. Defaulting to the first consequence.`,
        choice,
      );
    }
    return choice.consequences[0];
  }

  const roll = Math.random() * totalWeight;
  let cumulative = 0;
  for (const consequence of choice.consequences) {
    cumulative += Math.max(0, consequence.weight ?? 0);
    if (roll <= cumulative) {
      return consequence;
    }
  }

  return choice.consequences[choice.consequences.length - 1];
};

export const createEventSlice: StateCreator<GameStore, [], [], EventSlice> = (set, get) => ({
  currentEvent: null,
  wasPausedBeforeEvent: false,
  lastEventOutcome: null,
  setCurrentEvent: (event) => {
    if (event) {
      const store = get();
      const wasPaused = store.isPaused;
      set({
        currentEvent: event,
        wasPausedBeforeEvent: wasPaused,
        lastEventOutcome: null,
      });
      if (!wasPaused) {
        store.pauseGame();
      }
      return;
    }

    const store = get();
    const { wasPausedBeforeEvent, lastEventOutcome } = store;
    if (lastEventOutcome) {
      set({ currentEvent: null });
      return;
    }

    set({
      currentEvent: null,
      wasPausedBeforeEvent: false,
    });
    if (!wasPausedBeforeEvent) {
      store.unpauseGame();
    }
  },
  resolveEventChoice: (choiceId) => {
    const store = get();
    const event = store.currentEvent;

    if (!event) {
      return;
    }

    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) {
      return;
    }

    const cost = Math.max(0, choice.cost ?? 0);
    if (cost > 0) {
      store.recordEventExpense(cost, `${event.title} - ${choice.label} (cost)`);
    }

    const consequence = pickConsequence(choice);
    const appliedEffects: GameEventEffect[] = [];

    if (consequence) {
      consequence.effects.forEach((effect: GameEventEffect) => {
        applyEventEffect(effect, event, choice, store);
        
        // Convert dynamicCash to cash format for display (with calculated value)
        if (effect.type === 'dynamicCash') {
          const calculatedValue = calculateDynamicCashValue(effect, store);
          // Store as cash effect for display purposes
          appliedEffects.push({
            type: 'cash',
            amount: calculatedValue,
            label: effect.label,
          });
        } else {
          appliedEffects.push(effect);
        }
      });
    }

    // Handle flag setting
    if (choice.setsFlag) {
      store.setFlag(choice.setsFlag, true);
      console.log(`[Flag System] Flag "${choice.setsFlag}" set to true`);
    }

    set({
      lastEventOutcome: {
        eventId: event.id,
        eventTitle: event.title,
        choiceId: choice.id,
        choiceLabel: choice.label,
        consequenceId: consequence?.id ?? null,
        costPaid: cost,
        appliedEffects,
        consequenceLabel: consequence?.label,
        consequenceDescription: consequence?.description,
      },
    });

    store.setCurrentEvent(null);
  },
  clearLastEventOutcome: () => {
    const store = get();
    const shouldUnpause = !store.wasPausedBeforeEvent;
    set({
      lastEventOutcome: null,
      wasPausedBeforeEvent: false,
    });
    if (shouldUnpause) {
      store.unpauseGame();
    }
  },
});
