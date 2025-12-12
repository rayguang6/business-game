// ════════════════════════════════════════════════════════════════════════════════
// 🎮 EVENT EFFECT SYSTEM - QUICK REFERENCE
// ════════════════════════════════════════════════════════════════════════════════
// TWO-PHASE SYSTEM: Resolve (calculate) → Apply (execute)
//
// 📋 WHEN ADDING NEW EFFECT TYPES:
//    1. GameEventEffect type (/lib/types/gameEvents.ts)
//    2. ResolvedEffect type (below)
//    3. resolveEventChoice function (STEP 3)
//    4. clearLastEventOutcome function (STEP 4)
//    5. Add tests
//
// 🚨 SEE DETAILED GUIDE BELOW FOR STEP-BY-STEP INSTRUCTIONS
//
// ════════════════════════════════════════════════════════════════════════════════
// 🎯 SYSTEM OVERVIEW
// ════════════════════════════════════════════════════════════════════════════════
// Event effects are applied in TWO PHASES for better UX:
//
// 1. RESOLVE PHASE (immediate): When player chooses option
//    - Calculate ALL dynamic values once at resolve time
//    - Store pre-calculated final values for application
//    - Show outcome popup with calculated effects
//
// 2. APPLY PHASE (deferred): When player clicks "Continue"
//    - Apply pre-calculated values (no recalculation)
//    - Run game over check
//
// BENEFITS: Players see outcomes before effects trigger, preventing surprise game overs
//           No display/apply misalignment since values are calculated once
// RISKS: Game state changes between resolve and apply don't affect calculations
//        (This is actually GOOD - locks in the values at choice time)
//
// If you modify this system, test carefully with:
// - Dynamic cash effects (expenses-based)
// - Game-ending effects (cash/reputation to zero)
// - Multiple effect types in same event
// - Edge case: Very rapid state changes (though unlikely during outcome review)
//
// NOTE: The TypeScript linter may show false positive errors about 'label' property
// not existing on ResolvedEffect types. These are incorrect - we're accessing
// 'effect.label' from the original GameEventEffect parameter, not from ResolvedEffect.
//
// =============================================================================
// 🚨 FUTURE MAINTAINER: EVENT EFFECT SYSTEM MAINTENANCE GUIDE 🚨
// =============================================================================
//
// This file implements a TWO-PHASE event effect system for better UX:
//
// PHASE 1 - RESOLVE (when player chooses option):
//   - Calculate all dynamic values once
//   - Store effects for display and later application
//   - Show outcome popup
//
// PHASE 2 - APPLY (when player clicks "Continue"):
//   - Apply pre-calculated effects
//   - Check for game over
//
// ════════════════════════════════════════════════════════════════════════════════
// 🆕 ADDING A NEW EFFECT TYPE - STEP-BY-STEP GUIDE
// ════════════════════════════════════════════════════════════════════════════════
//
// When adding a new effect type (e.g., 'health', 'energy', 'newMetricType'):
//
// STEP 1: Update GameEventEffect type in /lib/types/gameEvents.ts
// ──────────────────────────────────────────────────────────────────────────────
// Add your new effect to the union type:
// export type GameEventEffect =
//   | { type: 'cash'; amount: number; label?: string }
//   | { type: 'health'; amount: number; label?: string }  // ← ADD HERE
//   | { type: 'skillLevel'; amount: number } // Previously: 'reputation'
//   | ...existing types
//
// STEP 2: Update ResolvedEffect type in this file (eventSlice.ts)
// ──────────────────────────────────────────────────────────────────────────────
// Add corresponding resolved type:
// export type ResolvedEffect =
//   | { type: 'cash'; amount: number; label: string | undefined }
//   | { type: 'health'; amount: number; label: string | undefined }  // ← ADD HERE
//   | { type: 'reputation'; amount: number; label: string | undefined }
//   | ...existing types
//
// STEP 3: Handle RESOLUTION in resolveEventChoice function
// ──────────────────────────────────────────────────────────────────────────────
// Add case in the forEach loop (around line 252):
// } else if (effect.type === 'health') {
//   appliedEffects.push(effect);  // For display
//   const resolvedEffect: ResolvedEffect = {
//     type: 'health',
//     amount: effect.amount,
//     label: effect.label,
//   };
//   pendingEffects.push(resolvedEffect);  // For later application
// }
//
// STEP 4: Handle APPLICATION in clearLastEventOutcome function
// ──────────────────────────────────────────────────────────────────────────────
// Add case in the forEach loop (around line 318):
// } else if (resolvedEffect.type === 'health' && resolvedEffect.amount !== undefined) {
//   store.applyHealthChange(resolvedEffect.amount);  // Your application logic
// }
//
// STEP 5: Add tests in /test/eventEffects.test.ts (or equivalent)
// ──────────────────────────────────────────────────────────────────────────────
// Test both display and application:
// - Effect shows correctly in outcome popup
// - Effect applies correctly when clicking Continue
// - Dynamic calculations work (if applicable)
// - Game over triggers appropriately
//
// ════════════════════════════════════════════════════════════════════════════════
// ⚠️  COMMON PITFALLS & THINGS TO WATCH
// ════════════════════════════════════════════════════════════════════════════════
//
// 1. FORGETTING ONE PHASE:
//    - Only updating resolve but not apply = effects display but don't work
//    - Only updating apply but not resolve = effects work but don't show
//
// 2. TYPE MISMATCHES:
//    - ResolvedEffect properties must match what you expect in apply phase
//    - GameEventEffect and ResolvedEffect should be consistent
//
// 3. DYNAMIC VALUE CONSISTENCY:
//    - Dynamic effects (like expenses*N) are calculated ONCE at resolve time
//    - This is GOOD - locks in values at choice time
//    - But means game state changes during outcome review don't affect calculations
//
// 4. TESTING REQUIREMENTS:
//    - Test with game-ending effects (cash/reputation to zero)
//    - Test with multiple effects in one event
//    - Test dynamic calculations (expenses-based effects)
//    - Test edge cases (very large/small values)
//
// 5. PERFORMANCE:
//    - Effects are pre-calculated, so no performance impact during outcome review
//    - Keep calculations simple in resolve phase
//
// ════════════════════════════════════════════════════════════════════════════════
// 🔍 DEBUGGING CHECKLIST
// ════════════════════════════════════════════════════════════════════════════════
//
// If effects aren't working:
// □ Is the effect type added to GameEventEffect union?
// □ Is the resolved type added to ResolvedEffect union?
// □ Is there a case for it in resolveEventChoice?
// □ Is there a case for it in clearLastEventOutcome?
// □ Are the property names consistent between types?
// □ Do tests pass for both display and application?
//
// ════════════════════════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand';
import { GameEvent, GameEventChoice, GameEventConsequence, GameEventEffect, EventEffectType, DelayedConsequence } from '../../types/gameEvents';
import { GameMetric, EffectType } from '../../game/effectManager';
import type { GameStore } from '../gameStore';
import { effectManager } from '@/lib/game/effectManager';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { DynamicValueEvaluator } from '@/lib/game/dynamicValueEvaluator';
import { SourceType } from '@/lib/config/sourceTypes';
import { SourceHelpers } from '@/lib/utils/financialTracking';
import { updateLeveragedTimeCapacity } from '@/lib/utils/metricUpdates';
import { generateLeads } from '@/lib/features/leads';
import { EventCategory, AUTO_RESOLVE_CATEGORIES } from '@/lib/game/constants/eventCategories';

// ════════════════════════════════════════════════════════════════════════════════
// 🎯 RESOLVED EFFECT TYPES - Update this when adding new effects (STEP 2)
// ════════════════════════════════════════════════════════════════════════════════
// Pre-calculated effect values for consistent application
// These must match the structure expected in the application phase
export type ResolvedEffect =
  | { type: EventEffectType.Cash; amount: number; label: string | undefined }
  | { type: EventEffectType.Exp; amount: number; label: string | undefined }
  | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: number; durationMonths?: number | null; priority?: number; label: string | undefined };
// 🚨 ADD NEW RESOLVED EFFECT TYPES HERE (STEP 2)
// | { type: 'yourNewEffectType'; amount: number; label: string | undefined }

export interface ResolvedEventOutcome {
  eventId: string;
  eventTitle: string;
  eventSummary?: string;
  eventCategory: string;
  choiceId: string;
  choiceLabel: string;
  consequenceId: string | null;
  costPaid: number;
  timeCostPaid: number;
  appliedEffects: GameEventEffect[]; // Effects shown to player (may be transformed for display)
  pendingEffects: ResolvedEffect[]; // Pre-calculated values to apply when player clicks continue
  consequenceLabel?: string;
  consequenceDescription?: string;
}

export interface PendingDelayedConsequence {
  id: string; // Unique identifier
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  choiceId: string;
  choiceLabel: string;
  consequenceId: string;
  delayedConsequence: DelayedConsequence;
  triggerTime: number; // gameTime when it should trigger
}

export interface ResolvedDelayedOutcome {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  choiceId: string;
  choiceLabel: string;
  consequenceId: string;
  label?: string;
  description?: string;
  success: boolean;
  appliedEffects: GameEventEffect[]; // Effects shown to player
  pendingEffects: ResolvedEffect[]; // Pre-calculated values to apply when player clicks continue
}

export interface EventSlice {
  currentEvent: GameEvent | null;
  lastEventOutcome: ResolvedEventOutcome | null;
  pendingDelayedConsequences: PendingDelayedConsequence[];
  lastDelayedOutcome: ResolvedDelayedOutcome | null;
  setCurrentEvent: (event: GameEvent | null) => void;
  resolveEventChoice: (choiceId: string, event?: GameEvent) => void;
  clearLastEventOutcome: () => void;
  clearLastDelayedOutcome: () => void;
  resetEvents: () => void;
}

// Helper to calculate dynamic cash value
const calculateDynamicCashValue = (
  effect: GameEventEffect & { type: EventEffectType.DynamicCash },
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
  consequence?: GameEventConsequence | null,
): void => {
  switch (effect.type) {
    case EventEffectType.Cash: {
      // Cash effects should be handled by the game's revenue system
      const { recordEventRevenue, recordEventExpense } = store;
      const sourceInfo = SourceHelpers.fromEvent(event.id, event.title);
      const label = effect.label ?? `${event.title} - ${choice.label}`;
      if (effect.amount >= 0) {
        recordEventRevenue(effect.amount, sourceInfo, label);
      } else {
        recordEventExpense(Math.abs(effect.amount), sourceInfo, label);
      }
      return; // Don't use effectManager for cash (handled by revenue system)
    }
    case EventEffectType.DynamicCash: {
      const value = calculateDynamicCashValue(effect, store);
      const { recordEventRevenue, recordEventExpense } = store;
      const sourceInfo = SourceHelpers.fromEvent(event.id, event.title, {
        choiceId: choice.id,
        choiceLabel: choice.label,
        consequenceId: consequence?.id,
        consequenceLabel: consequence?.label,
        effectLabel: effect.label,
      });
      const label = effect.label ?? `${event.title} - ${choice.label}`;
      if (value >= 0) {
        recordEventRevenue(value, sourceInfo, label);
      } else {
        recordEventExpense(Math.abs(value), sourceInfo, label);
      }
      return;
    }
    case EventEffectType.Exp: {
      // Skill level effects directly modify skill level
      const { applyExpChange } = store;
      applyExpChange(effect.amount);
      return; // Don't use effectManager for skill level (handled directly)
    }
    case EventEffectType.Metric: {
      // For direct state metrics (Cash, Time, SkillLevel, GenerateLeads) with Add effects, apply directly
      // These are one-time permanent effects (no duration tracking)
      if ((effect.metric === GameMetric.Cash || effect.metric === GameMetric.MyTime ||
           effect.metric === GameMetric.Exp ||
           effect.metric === GameMetric.GenerateLeads)
          && effect.effectType === EffectType.Add) {
        if (effect.metric === GameMetric.Cash) {
          const { recordEventRevenue, recordEventExpense } = store;
          const sourceInfo = SourceHelpers.fromEvent(event.id, event.title, {
            choiceId: choice.id,
            choiceLabel: choice.label,
            consequenceId: consequence?.id,
            consequenceLabel: consequence?.label,
          });
          const label = `${event.title} - ${choice.label}`;
          if (effect.value >= 0) {
            recordEventRevenue(effect.value, sourceInfo, label);
          } else {
            recordEventExpense(Math.abs(effect.value), sourceInfo, label);
          }
        } else if (effect.metric === GameMetric.MyTime) {
          // For MyTime effects, deduct myTime directly (not leveraged time first)
          // Use applyTimeChange which handles both positive and negative values
          if (store.applyTimeChange) {
            // For negative values, we need to deduct myTime directly, not through recordTimeSpent
            if (effect.value < 0) {
              const timeToDeduct = Math.abs(effect.value);
              const sourceInfo = SourceHelpers.fromEvent(event.id, event.title, {
                choiceId: choice.id,
                choiceLabel: choice.label,
                consequenceId: consequence?.id,
                consequenceLabel: consequence?.label,
              });
              const timeLabel = `${event.title} - ${choice.label}`;
              // Use recordMyTimeSpent to deduct only myTime (not leveraged time)
              if (store.recordMyTimeSpent) {
                store.recordMyTimeSpent(-timeToDeduct, sourceInfo, timeLabel);
              }
            } else {
              store.applyTimeChange(effect.value);
            }
          }
        } else if (effect.metric === GameMetric.Exp) {
          store.applyExpChange(effect.value);
        } else if (effect.metric === GameMetric.GenerateLeads) {
          // NOTE: This is a legacy function that is not currently used.
          // All GenerateLeads effects should go through the two-phase system (resolveEventChoice -> clearLastEventOutcome),
          // which uses the shared generateLeads() utility from @/lib/features/leads.
          // If this function is ever needed, it should be updated to use generateLeads() with proper state access.
          // For now, this is a simplified fallback that doesn't track conversion progress.
          const count = Math.max(0, Math.floor(effect.value));

          if (count > 0 && store.spawnLead && store.updateLeads) {
            for (let i = 0; i < count; i++) {
              setTimeout(() => {
                const lead = store.spawnLead();
                if (lead) {
                  const currentLeads = store.leads || [];
                  store.updateLeads([...currentLeads, lead]);
                }
              }, i * 150);
            }
          }
        }
        // Direct state metrics are always permanent (one-time add/subtract)
        // Duration is ignored for these metrics - content should not use temporary effects
        return;
      }
      
      // For other metrics or effect types, use effect manager
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
        durationMonths: effect.durationMonths,
        priority: effect.priority,
      });
      
      // For direct state metrics with non-Add effects, calculate and apply the change
      const { metrics } = store;
      if (effect.metric === GameMetric.Cash) {
        const currentCash = metrics.cash;
        const newCash = effectManager.calculate(GameMetric.Cash, currentCash);
        store.applyCashChange(newCash - currentCash);
      } else if (effect.metric === GameMetric.MyTime || effect.metric === GameMetric.LeveragedTime) {
        // Handle MyTime and LeveragedTime separately
        if (effect.metric === GameMetric.MyTime) {
          const currentTime = metrics.myTime;
          const newTime = effectManager.calculate(GameMetric.MyTime, currentTime);
          const delta = newTime - currentTime;
          // For MyTime effects, deduct myTime directly (not leveraged time first)
          if (delta < 0) {
            const timeToDeduct = Math.abs(delta);
            const sourceInfo = SourceHelpers.fromEvent(event.id, event.title, {
              choiceId: choice.id,
              choiceLabel: choice.label,
              consequenceId: consequence?.id,
              consequenceLabel: consequence?.label,
            });
            const timeLabel = `${event.title} - ${choice.label}`;
            // Use updateMetrics to update myTime directly
            if ((store as any).updateMetrics) {
              (store as any).updateMetrics({
                myTime: Math.max(0, metrics.myTime - timeToDeduct),
                totalTimeSpent: metrics.totalTimeSpent + timeToDeduct,
              });
              // Update monthly tracking through store's internal mechanism
              // Note: This requires access to the store's set function, which we don't have here
              // For now, we'll track it through the metrics update
              // Monthly tracking will be handled by the calling context if needed
            }
            if (store.checkGameOver) {
              store.checkGameOver();
            }
          } else {
            store.applyTimeChange(delta);
          }
        } else if (effect.metric === GameMetric.LeveragedTime) {
          // Use shared utility for leveraged time capacity updates
          // In this context, we need to use updateMetrics if available, otherwise calculate manually
          if ((store as any).updateMetrics) {
            // Calculate the updates using our utility logic
            const newCapacity = effectManager.calculate(GameMetric.LeveragedTime, 0);
            const currentCapacity = metrics.leveragedTimeCapacity;
            const capacityDelta = newCapacity - currentCapacity;

            if (capacityDelta !== 0) {
              let newLeveragedTime = metrics.leveragedTime;

              if (capacityDelta > 0) {
                // When adding effects: add to both time and capacity
                newLeveragedTime = metrics.leveragedTime + capacityDelta;
              } else {
                // When removing effects: decrease both time and capacity
                // Also clamp time to not exceed the new capacity
                newLeveragedTime = Math.min(metrics.leveragedTime, newCapacity);
              }

              (store as any).updateMetrics({
                leveragedTime: Math.max(0, Math.round(newLeveragedTime)),
                leveragedTimeCapacity: Math.max(0, newCapacity),
              });
            }
          }
        }
      } else if (effect.metric === GameMetric.Exp) {
        const currentExp = metrics.exp;
        const newExp = effectManager.calculate(GameMetric.Exp, currentExp);
        store.applyExpChange(newExp - currentExp);
      }
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
  lastEventOutcome: null,
  pendingDelayedConsequences: [],
  lastDelayedOutcome: null,
  setCurrentEvent: (event) => {
    if (event) {
      set({
        currentEvent: event,
        lastEventOutcome: null,
      });
      return;
    }

    const store = get();
    const { lastEventOutcome } = store;
    if (lastEventOutcome) {
      set({ currentEvent: null });
      return;
    }

    set({
      currentEvent: null,
    });
  },
  resolveEventChoice: (choiceId, eventOverride) => {
    const store = get();
    const event = eventOverride || store.currentEvent;

    if (!event) {
      return;
    }

    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) {
      return;
    }

    // Validate time cost - prevent negative time (death by time)
    const timeCost = Math.max(0, choice.timeCost ?? 0);
    // Check myTime availability (events only use personal time, not leveraged time)
    if (timeCost > 0 && timeCost > store.metrics.myTime) {
      console.warn(`Cannot resolve event choice: insufficient personal time. Required: ${timeCost}, Available: ${store.metrics.myTime}`);
      return;
    }

    // Cash cost validation - allow bankruptcy (negative cash is allowed)
    const cost = Math.max(0, choice.cost ?? 0);
    if (cost > 0) {
      const sourceInfo = SourceHelpers.fromEvent(event.id, event.title, {
        choiceId: choice.id,
        choiceLabel: choice.label,
        effectLabel: `${choice.label} (cost)`,
      });
      store.recordEventExpense(cost, sourceInfo, `${event.title} - ${choice.label} (cost)`);
    }

    // Time cost - deduct time (already validated above)
    if (timeCost > 0 && store.recordMyTimeSpent) {
      const sourceInfo = SourceHelpers.fromEvent(event.id, event.title, {
        choiceId: choice.id,
        choiceLabel: choice.label,
      });
      const timeLabel = `${event.title} - ${choice.label}`;
      store.recordMyTimeSpent(-timeCost, sourceInfo, timeLabel);
    }

    const consequence = pickConsequence(choice);
    const appliedEffects: GameEventEffect[] = []; // For display only
    const pendingEffects: ResolvedEffect[] = []; // Pre-calculated values for consistent application

    // ════════════════════════════════════════════════════════════════════════════════
    // 🎯 EFFECT RESOLUTION PHASE - Add new effect types here (STEP 3)
    // ════════════════════════════════════════════════════════════════════════════════
    // RESOLVE STRATEGY: Calculate ALL values once at choice time
    // This eliminates display/apply misalignment by locking in values immediately
    if (consequence) {
      consequence.effects.forEach((effect: GameEventEffect) => {
        if (effect.type === EventEffectType.DynamicCash) {
          // Dynamic cash effects: calculate once, store final value
          const finalAmount = calculateDynamicCashValue(effect, store);

          appliedEffects.push({
            type: EventEffectType.Cash,
            amount: finalAmount,
            label: effect.label,
          });

          pendingEffects.push({
            type: EventEffectType.Cash,
            amount: finalAmount,
            label: effect.label,
          });
        } else if (effect.type === EventEffectType.Cash || effect.type === EventEffectType.Exp) {
          // Direct cash/skillLevel effects - no calculation needed
          appliedEffects.push(effect);
          const resolvedEffect: ResolvedEffect = {
            type: effect.type,
            amount: effect.amount,
            label: effect.type === EventEffectType.Cash ? effect.label : undefined,
          };
          pendingEffects.push(resolvedEffect);
        } else if (effect.type === EventEffectType.Metric) {
          // Metric effects - copy all properties as-is
          appliedEffects.push(effect);
          const resolvedEffect: ResolvedEffect = {
            type: EventEffectType.Metric,
            metric: effect.metric!,
            effectType: effect.effectType!,
            value: effect.value!,
            durationMonths: effect.durationMonths,
            priority: effect.priority,
            label: undefined,
          };
          pendingEffects.push(resolvedEffect);
        }
        // 🚨 ADD NEW EFFECT TYPE HANDLING HERE (STEP 3)
        // else if (effect.type === 'yourNewEffectType') {
        //   // Handle resolution logic for your new effect
        //   appliedEffects.push(effect);
        //   const resolvedEffect: ResolvedEffect = {
        //     type: 'yourNewEffectType',
        //     // ... your properties
        //   };
        //   pendingEffects.push(resolvedEffect);
        // }
      });
    }

    // Handle flag setting
    if (choice.setsFlag) {
      store.setFlag(choice.setsFlag, true);
    }

    // Queue delayed consequence if present
    const pendingDelayedConsequences: PendingDelayedConsequence[] = [];
    if (consequence?.delayedConsequence) {
      const delayedId = `${event.id}_${choice.id}_${consequence.id}_${Date.now()}`;
      const triggerTime = store.gameTime + consequence.delayedConsequence.delaySeconds;
      pendingDelayedConsequences.push({
        id: delayedId,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        choiceId: choice.id,
        choiceLabel: choice.label,
        consequenceId: consequence.id,
        delayedConsequence: consequence.delayedConsequence,
        triggerTime,
      });
    }

    set({
      lastEventOutcome: {
        eventId: event.id,
        eventTitle: event.title,
        eventSummary: event.summary,
        eventCategory: event.category,
        choiceId: choice.id,
        choiceLabel: choice.label,
        consequenceId: consequence?.id ?? null,
        costPaid: cost,
        timeCostPaid: timeCost,
        appliedEffects, // For display
        pendingEffects, // For later application
        consequenceLabel: consequence?.label,
        consequenceDescription: consequence?.description,
      },
      pendingDelayedConsequences: [...store.pendingDelayedConsequences, ...pendingDelayedConsequences],
    });

    store.setCurrentEvent(null);
  },
  clearLastEventOutcome: () => {
    const store = get();
    const setState = set;

    // ════════════════════════════════════════════════════════════════════════════════
    // 🎯 EFFECT APPLICATION PHASE - Add new effect types here (STEP 4)
    // ════════════════════════════════════════════════════════════════════════════════
    // APPLY PHASE: Apply pre-calculated effect values
    // Benefits: No recalculation, guaranteed consistency with display values
    const outcome = store.lastEventOutcome;
    if (outcome?.pendingEffects) {
      outcome.pendingEffects.forEach((resolvedEffect: ResolvedEffect) => {
        if (resolvedEffect.type === EventEffectType.Cash && resolvedEffect.amount !== undefined) {
          // Cash effects go through revenue system
          const { recordEventRevenue, recordEventExpense } = store;
          const sourceInfo = SourceHelpers.fromEvent(outcome.eventId || 'unknown', outcome.eventTitle, {
            choiceId: outcome.choiceId,
            choiceLabel: outcome.choiceLabel,
            consequenceId: outcome.consequenceId || undefined,
            consequenceLabel: outcome.consequenceLabel || undefined,
            effectLabel: resolvedEffect.label,
          });
          const label = resolvedEffect.label ?? `${outcome.eventTitle} - ${outcome.choiceLabel}`;
          if (resolvedEffect.amount >= 0) {
            recordEventRevenue(resolvedEffect.amount, sourceInfo, label);
          } else {
            recordEventExpense(Math.abs(resolvedEffect.amount), sourceInfo, label);
          }
        } else if (resolvedEffect.type === EventEffectType.Exp && resolvedEffect.amount !== undefined) {
          // Skill level effects directly modify skill level
          store.applyExpChange(resolvedEffect.amount);
        } else if (resolvedEffect.type === EventEffectType.Metric && resolvedEffect.metric && resolvedEffect.effectType !== undefined && resolvedEffect.value !== undefined) {
          // Metric effects go through effect manager
          const { gameTime, metrics } = store;
          
          // For direct state metrics (Cash, Time, SkillLevel), apply immediately if Add effect
          if (resolvedEffect.metric === GameMetric.Cash && resolvedEffect.effectType === EffectType.Add) {
            // Cash effects should go through revenue/expense tracking (same as EventEffectType.Cash)
            const { recordEventRevenue, recordEventExpense } = store;
            const sourceInfo = {
              type: SourceType.Event,
              id: outcome.eventId || 'unknown',
              name: outcome.eventTitle,
            };
            const label = resolvedEffect.label ?? `${outcome.eventTitle} - ${outcome.choiceLabel}`;
            if (resolvedEffect.value >= 0) {
              recordEventRevenue(resolvedEffect.value, sourceInfo, label);
            } else {
              recordEventExpense(Math.abs(resolvedEffect.value), sourceInfo, label);
            }
          } else if (resolvedEffect.metric === GameMetric.MyTime && resolvedEffect.effectType === EffectType.Add) {
            // For MyTime effects, deduct myTime directly (not leveraged time first)
            if (resolvedEffect.value < 0) {
              const timeToDeduct = Math.abs(resolvedEffect.value);
              setState((state) => ({
                metrics: {
                  ...state.metrics,
                  myTime: Math.max(0, state.metrics.myTime - timeToDeduct),
                  totalTimeSpent: state.metrics.totalTimeSpent + timeToDeduct,
                },
                monthlyTimeSpent: state.monthlyTimeSpent + timeToDeduct,
                monthlyTimeSpentDetails: [
                  ...state.monthlyTimeSpentDetails,
                  {
                    amount: timeToDeduct,
                    label: resolvedEffect.label ?? `${outcome.eventTitle} - ${outcome.choiceLabel}`,
                    sourceId: outcome.eventId || 'unknown',
                    sourceType: SourceType.Event,
                    sourceName: outcome.eventTitle,
                  },
                ],
              }));
              const { checkGameOver } = get();
              if (checkGameOver) {
                checkGameOver();
              }
            } else {
              store.applyTimeChange(resolvedEffect.value);
            }
          } else if (resolvedEffect.metric === GameMetric.Exp && resolvedEffect.effectType === EffectType.Add) {
            store.applyExpChange(resolvedEffect.value);
          } else if (resolvedEffect.metric === GameMetric.GenerateLeads && resolvedEffect.effectType === EffectType.Add) {
            // Use shared lead generation utility (single source of truth)
            generateLeads(resolvedEffect.value, {
              spawnLead: store.spawnLead,
              updateLeads: store.updateLeads,
              spawnCustomer: store.spawnCustomer,
              addCustomers: store.addCustomers,
              getState: () => get(),
              updateLeadProgress: (progress: number) => {
                setState((state) => ({
                  leadProgress: progress,
                }));
              },
            });
          } else {
            // For other metrics or effect types, use effect manager
            effectManager.add({
              id: `event_${outcome.eventId}_${outcome.choiceId}_${Date.now()}`,
              source: {
                category: 'event',
                id: outcome.eventId,
                name: outcome.eventTitle,
              },
              metric: resolvedEffect.metric,
              type: resolvedEffect.effectType,
              value: resolvedEffect.value,
              durationMonths: resolvedEffect.durationMonths,
              priority: resolvedEffect.priority,
            }, gameTime);
            
            // For direct state metrics with non-Add effects, calculate and apply the change
            if (resolvedEffect.metric === GameMetric.Cash) {
              const currentCash = metrics.cash;
              const newCash = effectManager.calculate(GameMetric.Cash, currentCash);
              store.applyCashChange(newCash - currentCash);
            } else if (resolvedEffect.metric === GameMetric.MyTime || resolvedEffect.metric === GameMetric.LeveragedTime) {
              // Handle MyTime and LeveragedTime separately
              if (resolvedEffect.metric === GameMetric.MyTime) {
                const currentTime = metrics.myTime;
                const newTime = effectManager.calculate(GameMetric.MyTime, currentTime);
                const delta = newTime - currentTime;
                // For MyTime effects, deduct myTime directly (not leveraged time first)
                if (delta < 0) {
                  const timeToDeduct = Math.abs(delta);
                  set((state) => ({
                    ...state,
                    metrics: {
                      ...state.metrics,
                      myTime: Math.max(0, state.metrics.myTime - timeToDeduct),
                      totalTimeSpent: state.metrics.totalTimeSpent + timeToDeduct,
                    },
                    monthlyTimeSpent: state.monthlyTimeSpent + timeToDeduct,
                    monthlyTimeSpentDetails: [
                      ...state.monthlyTimeSpentDetails,
                      {
                        amount: timeToDeduct,
                        label: resolvedEffect.label ?? `${outcome.eventTitle} - ${outcome.choiceLabel}`,
                        sourceId: outcome.eventId || 'unknown',
                        sourceType: SourceType.Event,
                        sourceName: outcome.eventTitle,
                      },
                    ],
                  }));
                  const { checkGameOver } = get();
                  if (checkGameOver) {
                    checkGameOver();
                  }
                } else {
                  store.applyTimeChange(delta);
                }
              } else if (resolvedEffect.metric === GameMetric.LeveragedTime) {
                // Use shared utility for leveraged time capacity updates
                updateLeveragedTimeCapacity(metrics, set);
              }
            } else if (resolvedEffect.metric === GameMetric.Exp) {
              const currentExp = metrics.exp;
              const newExp = effectManager.calculate(GameMetric.Exp, currentExp);
              store.applyExpChange(newExp - currentExp);
            }
          }
        }
        // 🚨 ADD NEW EFFECT TYPE APPLICATION HERE (STEP 4)
        // else if (resolvedEffect.type === 'yourNewEffectType' && resolvedEffect.amount !== undefined) {
        //   // Apply your effect to the game state
        //   store.applyYourNewEffect(resolvedEffect.amount);
        // }
      });

      // Check for game over after applying effects
      store.checkGameOver();
    }

    set({
      lastEventOutcome: null,
    });
  },
  resetEvents: () => {
    set({
      currentEvent: null,
      lastEventOutcome: null,
      pendingDelayedConsequences: [],
      lastDelayedOutcome: null,
    });
  },
  clearLastDelayedOutcome: () => {
    const store = get();
    const setState = set;

    // Apply pre-calculated effect values
    const outcome = store.lastDelayedOutcome;
    if (outcome?.pendingEffects) {
      outcome.pendingEffects.forEach((resolvedEffect: ResolvedEffect) => {
        if (resolvedEffect.type === EventEffectType.Cash && resolvedEffect.amount !== undefined) {
          const { recordEventRevenue, recordEventExpense } = store;
          const sourceInfo = SourceHelpers.fromEvent(outcome.eventId || 'unknown', outcome.eventTitle, {
            choiceId: outcome.choiceId,
            choiceLabel: outcome.choiceLabel,
            consequenceId: outcome.consequenceId || undefined,
            effectLabel: resolvedEffect.label,
          });
          const label = resolvedEffect.label ?? `${outcome.eventTitle} - ${outcome.choiceLabel}`;
          if (resolvedEffect.amount >= 0) {
            recordEventRevenue(resolvedEffect.amount, sourceInfo, label);
          } else {
            recordEventExpense(Math.abs(resolvedEffect.amount), sourceInfo, label);
          }
        } else if (resolvedEffect.type === EventEffectType.Exp && resolvedEffect.amount !== undefined) {
          store.applyExpChange(resolvedEffect.amount);
        } else if (resolvedEffect.type === EventEffectType.Metric && resolvedEffect.metric && resolvedEffect.effectType !== undefined && resolvedEffect.value !== undefined) {
          const { gameTime, metrics } = store;
          
          if (resolvedEffect.metric === GameMetric.Cash && resolvedEffect.effectType === EffectType.Add) {
            // Cash effects should go through revenue/expense tracking (same as EventEffectType.Cash)
            const { recordEventRevenue, recordEventExpense } = store;
            const sourceInfo = SourceHelpers.fromEvent(outcome.eventId || 'unknown', outcome.eventTitle, {
              choiceId: outcome.choiceId,
              choiceLabel: outcome.choiceLabel,
              consequenceId: outcome.consequenceId || undefined,
              effectLabel: resolvedEffect.label,
            });
            const label = resolvedEffect.label ?? `${outcome.eventTitle} - ${outcome.choiceLabel}`;
            if (resolvedEffect.value >= 0) {
              recordEventRevenue(resolvedEffect.value, sourceInfo, label);
            } else {
              recordEventExpense(Math.abs(resolvedEffect.value), sourceInfo, label);
            }
          } else if (resolvedEffect.metric === GameMetric.MyTime && resolvedEffect.effectType === EffectType.Add) {
            store.applyTimeChange(resolvedEffect.value);
          } else if (resolvedEffect.metric === GameMetric.Exp && resolvedEffect.effectType === EffectType.Add) {
            store.applyExpChange(resolvedEffect.value);
          } else if (resolvedEffect.metric === GameMetric.GenerateLeads && resolvedEffect.effectType === EffectType.Add) {
            // Use shared lead generation utility (single source of truth)
            generateLeads(resolvedEffect.value, {
              spawnLead: store.spawnLead,
              updateLeads: store.updateLeads,
              spawnCustomer: store.spawnCustomer,
              addCustomers: store.addCustomers,
              getState: () => get(),
              updateLeadProgress: (progress: number) => {
                setState((state) => ({
                  leadProgress: progress,
                }));
              },
            });
          } else {
            effectManager.add({
              id: `delayed_${outcome.eventId}_${outcome.choiceId}_${Date.now()}`,
              source: {
                category: 'event',
                id: outcome.eventId,
                name: outcome.eventTitle,
              },
              metric: resolvedEffect.metric,
              type: resolvedEffect.effectType,
              value: resolvedEffect.value,
              durationMonths: resolvedEffect.durationMonths,
              priority: resolvedEffect.priority,
            }, gameTime);
            
            if (resolvedEffect.metric === GameMetric.Cash) {
              const currentCash = metrics.cash;
              const newCash = effectManager.calculate(GameMetric.Cash, currentCash);
              store.applyCashChange(newCash - currentCash);
            } else if (resolvedEffect.metric === GameMetric.MyTime || resolvedEffect.metric === GameMetric.LeveragedTime) {
              // Handle MyTime and LeveragedTime separately
              if (resolvedEffect.metric === GameMetric.MyTime) {
                const currentTime = metrics.myTime;
                const newTime = effectManager.calculate(GameMetric.MyTime, currentTime);
                store.applyTimeChange(newTime - currentTime);
              } else if (resolvedEffect.metric === GameMetric.LeveragedTime) {
                // Use shared utility for leveraged time capacity updates
                updateLeveragedTimeCapacity(metrics, set);
              }
            } else if (resolvedEffect.metric === GameMetric.Exp) {
              const currentExp = metrics.exp;
              const newExp = effectManager.calculate(GameMetric.Exp, currentExp);
              store.applyExpChange(newExp - currentExp);
            }
          }
        }
      });

      // Check for game over after applying effects
      store.checkGameOver();
    }

    set({
      lastDelayedOutcome: null,
    });
  },
});
