import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../../lib/store/gameStore';
import { GameEvent, GameEventChoice, GameEventEffect } from '../../../../lib/types/gameEvents';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import type { ResolvedEventOutcome } from '@/lib/store/slices/eventSlice';

const getEffectIcon = (type: GameEventEffect['type']) => {
  switch (type) {
    case 'cash':
      return '💰 CASH:';
    case 'reputation':
      return '⭐ REPUTATION:';
    default:
      return '';
  }
};

const getEffectColorClass = (type: GameEventEffect['type'], amount: number) => {
  if (type === 'reputation') {
    return amount > 0 ? 'text-green-700' : 'text-red-600'; // Darker green for reputation
  }
  return amount > 0 ? 'text-green-700' : 'text-red-600'; // Darker green for cash/cost
};

const formatEffect = (effect: GameEventEffect) => {
  if (effect.type === 'cash' || effect.type === 'reputation') {
    const prefix = effect.type === 'cash' ? '$' : '';
    const sign = effect.amount > 0 ? '+' : effect.amount < 0 ? '-' : '';
    const value = Math.abs(effect.amount);
    return `${getEffectIcon(effect.type)} ${sign}${prefix}${value}`;
  }
  return ''; // Metric effects are handled separately
};

const METRIC_LABELS: Record<GameMetric, string> = {
  [GameMetric.SpawnIntervalSeconds]: 'Customer Spawn Speed',
  [GameMetric.ServiceSpeedMultiplier]: 'Service Speed',
  [GameMetric.ServiceRooms]: 'Service Rooms',
  [GameMetric.ReputationMultiplier]: 'Reputation Gain',
  [GameMetric.HappyProbability]: 'Customer Happiness',
  [GameMetric.MonthlyExpenses]: 'Monthly Expenses',
  [GameMetric.ServiceRevenueMultiplier]: 'Service Revenue Multiplier',
  [GameMetric.ServiceRevenueFlatBonus]: 'Service Revenue Bonus',
  [GameMetric.FounderWorkingHours]: 'Founder Working Hours',
  // Tier-specific metrics
  [GameMetric.HighTierServiceRevenueMultiplier]: 'High-Tier Service Revenue',
  [GameMetric.HighTierServiceWeightageMultiplier]: 'High-Tier Service Selection',
  [GameMetric.MidTierServiceRevenueMultiplier]: 'Mid-Tier Service Revenue',
  [GameMetric.MidTierServiceWeightageMultiplier]: 'Mid-Tier Service Selection',
  [GameMetric.LowTierServiceRevenueMultiplier]: 'Low-Tier Service Revenue',
  [GameMetric.LowTierServiceWeightageMultiplier]: 'Low-Tier Service Selection',
};

const formatDurationLabel = (durationSeconds: number | null | undefined) => {
  if (durationSeconds === null || durationSeconds === undefined || !Number.isFinite(durationSeconds)) {
    return ' (Permanent)';
  }
  if (durationSeconds <= 0) {
    return ' (Instant)';
  }
  return ` for ${durationSeconds}s`;
};

const formatMetricEffect = (effect: GameEventEffect & { type: 'metric' }) => {
  const label = METRIC_LABELS[effect.metric] ?? effect.metric;
  const durationLabel = formatDurationLabel(effect.durationSeconds);
  switch (effect.effectType) {
    case EffectType.Add:
      return `${label}: ${effect.value >= 0 ? '+' : ''}${effect.value}${durationLabel}`;
    case EffectType.Percent:
      return `${label}: ${effect.value >= 0 ? '+' : ''}${effect.value}%${durationLabel}`;
    case EffectType.Multiply:
      return `${label}: ×${effect.value}${durationLabel}`;
    case EffectType.Set:
      return `${label}: set to ${effect.value}${durationLabel}`;
    default:
      return `${label}: effect active${durationLabel}`;
  }
};

const EventPopup: React.FC = () => {
  const currentEvent = useGameStore((state) => state.currentEvent);
  const resolveEventChoice = useGameStore((state) => state.resolveEventChoice);
  const lastEventOutcome = useGameStore((state) => state.lastEventOutcome);
  const clearLastEventOutcome = useGameStore((state) => state.clearLastEventOutcome);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing timers first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!currentEvent) {
      setCountdown(null);
      return;
    }

    const defaultChoice = currentEvent.choices[0];
    if (!defaultChoice) {
      setCountdown(null);
      return;
    }

    setCountdown(10);

    // Schedule auto-selection using the captured choice id
    timeoutRef.current = setTimeout(() => {
      resolveEventChoice(defaultChoice.id);
    }, 10_000);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1_000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentEvent?.id, resolveEventChoice]);

  // Prioritize showing the outcome if present
  if (lastEventOutcome && !currentEvent) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center px-2 sm:px-6 py-3 sm:py-6 pointer-events-none">
        <div className="absolute inset-0 bg-black/35 sm:bg-black/50 pointer-events-auto" />
        <div className="relative z-10 w-full max-w-xs sm:max-w-md pointer-events-auto">
          <div className="bg-white/95 rounded-2xl shadow-xl p-4 sm:p-6 border-t-4 border-blue-500 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-center mb-3 text-blue-700 text-xl sm:text-2xl font-semibold">
              🎲 Outcome
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">
              {lastEventOutcome.eventTitle}
            </h3>
            <p className="text-sm sm:text-base text-gray-700 text-center mb-4">
              You chose <span className="font-semibold text-gray-900">{lastEventOutcome.choiceLabel}</span>.
            </p>
            {lastEventOutcome.costPaid > 0 && (
              <div className="mb-3 text-sm sm:text-base text-red-700 text-center font-semibold">
                Upfront cost paid: -${lastEventOutcome.costPaid}
              </div>
            )}
            {lastEventOutcome.consequenceLabel && (
              <div className="mb-2 text-sm text-gray-700 text-center">
                Outcome: <span className="font-medium text-gray-900">{lastEventOutcome.consequenceLabel}</span>
              </div>
            )}
            {lastEventOutcome.consequenceDescription && (
              <p className="text-xs sm:text-sm text-gray-600 text-center mb-3">
                {lastEventOutcome.consequenceDescription}
              </p>
            )}
            <div className="bg-gray-100 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Effects</h4>
              {lastEventOutcome.appliedEffects.length > 0 ? (
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  {lastEventOutcome.appliedEffects.map((effect, index) => {
                    if (effect.type === 'cash' || effect.type === 'reputation') {
                      return (
                        <li key={index} className={getEffectColorClass(effect.type, effect.amount)}>
                          {formatEffect(effect)}
                        </li>
                      );
                    }
                    // Metric effects are shown in the separate section below
                    return null;
                  }).filter(Boolean)}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600">No additional changes.</p>
              )}
            </div>
            {lastEventOutcome.appliedEffects.some(effect => effect.type === 'metric') && (
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4 border border-blue-200">
                <h4 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">Active Effects</h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-blue-800">
                  {lastEventOutcome.appliedEffects
                    .filter((effect): effect is Extract<GameEventEffect, { type: 'metric' }> => effect.type === 'metric')
                    .map((effect, index) => (
                      <li key={index}>{formatMetricEffect(effect)}</li>
                    ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={clearLastEventOutcome}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold py-2 sm:py-2.5 rounded-lg transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEvent) return null;

  const handleUserChoice = (choice: GameEventChoice) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    resolveEventChoice(choice.id);
  };

  const eventTypeColorClass = currentEvent.category === 'opportunity' ? 'border-green-600 text-green-700' : 'border-red-400 text-red-600'; // Darker green border and text
  const eventIcon = currentEvent.category === 'opportunity' ? '✨' : '⚠️';
  const eventTitleColor = currentEvent.category === 'opportunity' ? 'text-green-800' : 'text-red-700'; // Darker green title
  const defaultChoiceId = currentEvent.choices[0]?.id;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-2 sm:px-6 py-3 sm:py-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/35 sm:bg-black/50 pointer-events-auto" />
      <div className="relative z-10 w-full max-w-xs sm:max-w-lg pointer-events-auto">
        <div
          className={`bg-white/90 rounded-2xl shadow-xl p-3 sm:p-5 md:p-6 border-t-4 ${eventTypeColorClass.split(' ')[0]} max-h-[65vh] sm:max-h-[80vh] overflow-y-auto`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center text-center sm:text-left mb-3 gap-1.5 sm:gap-3">
            <span className={`text-xl sm:text-3xl sm:mr-1 ${eventTypeColorClass.split(' ')[1]}`}>{eventIcon}</span>
            <h2 className={`text-xl sm:text-3xl font-semibold sm:font-bold ${eventTitleColor}`}>{currentEvent.title}</h2>
          </div>
          <p className="text-gray-700 text-center sm:text-left mb-4 sm:mb-5 text-xs sm:text-sm leading-relaxed">{currentEvent.summary}</p>

          <div className="space-y-2.5 sm:space-y-4">
            {currentEvent.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleUserChoice(choice)}
                className={`w-full text-left p-2.5 sm:p-4 rounded-lg transition duration-200 border text-sm sm:text-base
                ${currentEvent.category === 'opportunity'
                  ? (choice.id === defaultChoiceId ? 'bg-green-100 hover:bg-green-200 border-green-300 text-green-900' : 'bg-green-300 hover:bg-green-400 border-green-500 text-green-900')
                  : (choice.id === defaultChoiceId ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900' : 'bg-red-300 hover:bg-red-400 border-red-500 text-red-900')
                }
                flex flex-col items-start`}
              >
                <span className="font-semibold text-sm sm:text-lg mb-1">{choice.label}</span>
                <span className="text-gray-800 text-xs sm:text-sm mb-2 leading-relaxed">{choice.description}</span>
                {choice.cost !== undefined && choice.cost > 0 && (
                  <span className="text-xs sm:text-sm font-semibold text-red-700 mb-1">
                    Upfront cost: ${choice.cost}
                  </span>
                )}
                {choice.id === defaultChoiceId && countdown !== null && countdown > 0 && (
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-gray-700 block animate-pulse">
                    Auto-selecting in {countdown}s...
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
