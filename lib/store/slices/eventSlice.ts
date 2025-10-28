import { StateCreator } from 'zustand';
import { GameEvent, GameEventChoice, GameEventConsequence, GameEventEffect, GameEventTemporaryEffect } from '../../types/gameEvents';
import type { GameStore } from '../gameStore';
import { effectManager } from '@/lib/game/effectManager';

interface ActiveEventEffect {
  effectId: string;
  eventId: string;
  effect: GameEventTemporaryEffect;
  expiresAt: number | null;
}

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
  temporaryEffects?: {
    metric: GameEventTemporaryEffect['metric'];
    type: GameEventTemporaryEffect['type'];
    value: number;
    durationSeconds: number;
    expiresAt: number | null;
    priority?: number;
  }[];
}

export interface EventSlice {
  currentEvent: GameEvent | null;
  wasPausedBeforeEvent: boolean;
  lastEventOutcome: ResolvedEventOutcome | null;
  activeEventEffects: ActiveEventEffect[];
  setCurrentEvent: (event: GameEvent | null) => void;
  resolveEventChoice: (choiceId: string) => void;
  clearLastEventOutcome: () => void;
  tickEventEffects: (currentGameTime: number) => void;
  clearEventEffects: () => void;
}

const applyEventEffect = (
  effect: GameEventEffect,
  event: GameEvent,
  choice: GameEventChoice,
  store: GameStore,
): void => {
  switch (effect.type) {
    case 'cash': {
      const { recordEventRevenue, recordEventExpense } = store;
      if (effect.amount >= 0) {
        recordEventRevenue(effect.amount, effect.label ?? `${event.title} - ${choice.label}`);
      } else {
        recordEventExpense(Math.abs(effect.amount), effect.label ?? `${event.title} - ${choice.label}`);
      }
      break;
    }
    case 'reputation': {
      store.applyReputationChange(effect.amount);
      break;
    }
    default:
      break;
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
  activeEventEffects: [],
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
    const newActiveEffects: ActiveEventEffect[] = [];
    const temporaryEffectSummaries: ResolvedEventOutcome['temporaryEffects'] = [];
    const startTime = get().gameTime ?? 0;

    if (consequence) {
      consequence.effects.forEach((effect) => {
        applyEventEffect(effect, event, choice, store);
        appliedEffects.push(effect);
      });

      (consequence.temporaryEffects ?? []).forEach((effect, index) => {
        const effectId = `event_${event.id}_${choice.id}_${consequence.id}_${Date.now()}_${index}`;
        const expiresAt = Number.isFinite(effect.durationSeconds)
          ? startTime + Math.max(0, effect.durationSeconds)
          : null;

        effectManager.add({
          id: effectId,
          source: {
            category: 'event',
            id: event.id,
            name: event.title,
          },
          metric: effect.metric,
          type: effect.type,
          value: effect.value,
          priority: effect.priority,
        });

        newActiveEffects.push({
          effectId,
          eventId: event.id,
          effect,
          expiresAt,
        });

        temporaryEffectSummaries.push({
          metric: effect.metric,
          type: effect.type,
          value: effect.value,
          durationSeconds: effect.durationSeconds,
          expiresAt,
          priority: effect.priority,
        });
      });
    }

    set((state) => ({
      activeEventEffects: newActiveEffects.length > 0
        ? [...state.activeEventEffects, ...newActiveEffects]
        : state.activeEventEffects,
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
        temporaryEffects: temporaryEffectSummaries,
      },
    }));

    store.setCurrentEvent(null);
  },
  clearLastEventOutcome: () => {
    const store = get();
    const shouldUnpause = !store.wasPausedBeforeEvent;
    set((state) => ({
      lastEventOutcome: null,
      wasPausedBeforeEvent: false,
      activeEventEffects: state.activeEventEffects,
    }));
    if (shouldUnpause) {
      store.unpauseGame();
    }
  },
  tickEventEffects: (currentGameTime) => {
    set((state) => {
      if (state.activeEventEffects.length === 0) {
        return state;
      }

      const remaining: ActiveEventEffect[] = [];
      state.activeEventEffects.forEach((instance) => {
        if (instance.expiresAt !== null && instance.expiresAt <= currentGameTime) {
          effectManager.remove(instance.effectId);
        } else {
          remaining.push(instance);
        }
      });

      if (remaining.length === state.activeEventEffects.length) {
        return state;
      }

      return {
        ...state,
        activeEventEffects: remaining,
      };
    });
  },
  clearEventEffects: () => {
    set((state) => {
      if (state.activeEventEffects.length > 0) {
        state.activeEventEffects.forEach((instance) => {
          effectManager.remove(instance.effectId);
        });
      }
      effectManager.clearCategory('event');
      return {
        ...state,
        activeEventEffects: [],
      };
    });
  },
});
