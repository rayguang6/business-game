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

    // DISABLED: Auto-select timer for easier testing and tweaking
    // Uncomment below to re-enable auto-select after 10 seconds
    /*
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
    */

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
      <div className="absolute inset-0 z-30 flex items-start md:items-center justify-center px-2 md:px-6 pt-16 md:pt-6 pb-2 md:pb-6 pointer-events-none">
        <div className="absolute inset-0 bg-black/35 md:bg-black/50 pointer-events-auto" />
        <div className="relative z-10 w-full max-w-[70%] md:max-w-md pointer-events-auto">
          <div className="bg-white/95 rounded-md md:rounded-2xl shadow-xl p-2.5 md:p-6 border-t-2 md:border-t-4 border-blue-500 max-h-[calc(100vh-5rem)] md:max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-1 md:gap-1.5 mb-1.5 md:mb-3">
              <span className="text-blue-700 text-sm md:text-xl">🎲</span>
              <h3 className="text-xs md:text-lg font-semibold text-gray-900 leading-tight flex-1">
                {lastEventOutcome.eventTitle}
              </h3>
            </div>
            <p className="text-[10px] md:text-sm text-gray-600 mb-1.5 md:mb-3 leading-snug">
              You chose <span className="font-semibold text-gray-800">{lastEventOutcome.choiceLabel}</span>
              {lastEventOutcome.costPaid > 0 && <span className="text-red-600 ml-1">(-${lastEventOutcome.costPaid})</span>}
            </p>
            {lastEventOutcome.consequenceLabel && (
              <div className="text-[10px] md:text-xs text-gray-700 mb-1 md:mb-2">
                <span className="font-medium">{lastEventOutcome.consequenceLabel}</span>
                {lastEventOutcome.consequenceDescription && (
                  <span className="text-gray-600 ml-1">• {lastEventOutcome.consequenceDescription}</span>
                )}
              </div>
            )}
            {lastEventOutcome.appliedEffects.length > 0 && (
              <div className="bg-gray-100 rounded p-1.5 md:p-3 mb-1 md:mb-2">
                <div className="text-[10px] md:text-xs font-semibold text-gray-800 mb-0.5 md:mb-1">Effects:</div>
                <ul className="space-y-0.5 text-[9px] md:text-xs">
                  {lastEventOutcome.appliedEffects.map((effect, index) => {
                    if (effect.type === 'cash' || effect.type === 'reputation') {
                      return (
                        <li key={index} className={getEffectColorClass(effect.type, effect.amount)}>
                          {formatEffect(effect)}
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </ul>
              </div>
            )}
            {lastEventOutcome.appliedEffects.some(effect => effect.type === 'metric') && (
              <div className="bg-blue-50 rounded p-1.5 md:p-3 mb-1 md:mb-2 border border-blue-200">
                <div className="text-[10px] md:text-xs font-semibold text-blue-800 mb-0.5">Active:</div>
                <ul className="space-y-0.5 text-[9px] md:text-xs text-blue-800">
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
              className="mt-1.5 md:mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-sm font-semibold py-1.5 md:py-2 rounded transition"
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
    <div className="absolute inset-0 z-30 flex items-start md:items-center justify-center px-2 md:px-6 pt-16 md:pt-6 pb-2 md:pb-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/35 md:bg-black/50 pointer-events-auto" />
      <div className="relative z-10 w-full max-w-[70%] md:max-w-lg pointer-events-auto">
        <div
          className={`bg-white/95 rounded-md md:rounded-2xl shadow-xl p-2.5 md:p-5 lg:p-6 border-t-2 md:border-t-4 ${eventTypeColorClass.split(' ')[0]} max-h-[calc(100vh-5rem)] md:max-h-[80vh] overflow-y-auto`}
        >
          {/* Ultra Compact Header */}
          <div className="flex items-center gap-1 md:gap-1 mb-1.5 md:mb-3">
            <span className={`text-sm md:text-2xl ${eventTypeColorClass.split(' ')[1]} flex-shrink-0`}>{eventIcon}</span>
            <h2 className={`text-xs md:text-2xl font-semibold md:font-bold ${eventTitleColor} leading-tight flex-1 line-clamp-2`}>
              {currentEvent.title}
            </h2>
          </div>
          
          {/* Compact Summary - Single line if possible */}
          <p className="text-[10px] md:text-sm text-gray-700 mb-1.5 md:mb-4 leading-tight line-clamp-2">{currentEvent.summary}</p>

          {/* Ultra Compact Choices - Optimized for 2-3 choices */}
          <div className="space-y-1.5 md:space-y-2.5">
            {currentEvent.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleUserChoice(choice)}
                className={`w-full text-left p-1.5 md:p-3 rounded transition duration-200 border text-[10px] md:text-sm
                ${currentEvent.category === 'opportunity'
                  ? (choice.id === defaultChoiceId ? 'bg-green-100 hover:bg-green-200 border-green-300 text-green-900' : 'bg-green-300 hover:bg-green-400 border-green-500 text-green-900')
                  : (choice.id === defaultChoiceId ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900' : 'bg-red-300 hover:bg-red-400 border-red-500 text-red-900')
                }
                flex flex-col items-start`}
              >
                <div className="flex items-center justify-between w-full gap-1 md:gap-1">
                  <span className="font-semibold text-[10px] md:text-base leading-tight flex-1">{choice.label}</span>
                  {choice.cost !== undefined && choice.cost > 0 && (
                    <span className="text-[9px] md:text-xs font-semibold text-red-700 flex-shrink-0 whitespace-nowrap">
                      ${choice.cost}
                    </span>
                  )}
                </div>
                {choice.description && (
                  <span className="text-gray-800 text-[9px] md:text-xs leading-tight line-clamp-1 mt-0.5">{choice.description}</span>
                )}
                {/* Auto-select countdown - disabled for testing */}
                {/* Uncomment to re-enable: {choice.id === defaultChoiceId && countdown !== null && countdown > 0 && (
                  <span className="mt-0.5 text-[8px] md:text-xs font-semibold text-gray-700 animate-pulse">
                    Auto {countdown}s
                  </span>
                )} */}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
