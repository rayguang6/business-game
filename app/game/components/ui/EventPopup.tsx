import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../../lib/store/gameStore';
import { GameEvent, GameEventChoice, GameEventEffect } from '../../../../lib/types/gameEvents';
import { EffectType, GameMetric } from '@/lib/game/effectManager';
import type { ResolvedEventOutcome } from '@/lib/store/slices/eventSlice';

const getEffectIcon = (type: GameEventEffect['type']) => {
  switch (type) {
    case 'cash':
      return '💰';
    case 'reputation':
      return '⭐';
    default:
      return '';
  }
};

const getEffectColorClass = (type: GameEventEffect['type'], amount: number) => {
  if (type === 'reputation') {
    return amount > 0 ? 'text-green-400' : 'text-red-400';
  }
  return amount > 0 ? 'text-green-400' : 'text-red-400';
};

const formatEffect = (effect: GameEventEffect) => {
  if (effect.type === 'cash' || effect.type === 'reputation') {
    const prefix = effect.type === 'cash' ? '$' : '';
    const sign = effect.amount > 0 ? '+' : effect.amount < 0 ? '-' : '';
    const value = Math.abs(effect.amount);
    return `${getEffectIcon(effect.type)} ${sign}${prefix}${value.toLocaleString()}`;
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
        <div className="absolute inset-0 bg-black/35 md:bg-black/50 backdrop-blur-sm pointer-events-auto" />
        <div className="relative z-10 w-full max-w-[70%] md:max-w-md pointer-events-auto">
          {/* Game-style frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--game-primary-light)]/20 via-[var(--game-primary)]/15 to-[var(--game-primary-dark)]/20 rounded-md md:rounded-2xl border-2 border-[var(--game-primary)]/30 shadow-[0_0_30px_rgba(35,170,246,0.3)]" />
          
          <div className="relative bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-md md:rounded-2xl shadow-xl p-2.5 md:p-6 border-2 border-[var(--border-primary)] max-h-[calc(100vh-5rem)] md:max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-1 md:gap-1.5 mb-1.5 md:mb-3">
              <span className="text-[var(--game-primary-light)] text-sm md:text-xl drop-shadow-[0_0_4px_rgba(35,170,246,0.6)]">🎲</span>
              <h3 className="text-xs md:text-lg font-semibold text-[var(--text-primary)] leading-tight flex-1" style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}>
                {lastEventOutcome.eventTitle}
              </h3>
            </div>
            <p className="text-[10px] md:text-sm text-[var(--text-secondary)] mb-1.5 md:mb-3 leading-snug">
              You chose <span className="font-semibold text-[var(--game-primary-light)]">{lastEventOutcome.choiceLabel}</span>
              {lastEventOutcome.costPaid > 0 && <span className="text-red-400 ml-1">(-${lastEventOutcome.costPaid})</span>}
            </p>
            {lastEventOutcome.consequenceLabel && (
              <div className="text-[10px] md:text-xs text-[var(--text-primary)] mb-1 md:mb-2 bg-[var(--bg-tertiary)]/50 rounded p-1.5 md:p-2 border border-[var(--border-secondary)]">
                <span className="font-medium">{lastEventOutcome.consequenceLabel}</span>
                {lastEventOutcome.consequenceDescription && (
                  <span className="text-[var(--text-secondary)] ml-1">• {lastEventOutcome.consequenceDescription}</span>
                )}
              </div>
            )}
            {lastEventOutcome.appliedEffects.length > 0 && (
              <div className="bg-[var(--bg-tertiary)]/60 rounded p-1.5 md:p-3 mb-1 md:mb-2 border border-[var(--border-secondary)]">
                <div className="text-[10px] md:text-xs font-semibold text-[var(--text-primary)] mb-0.5 md:mb-1">Effects:</div>
                <ul className="space-y-0.5 text-[9px] md:text-xs">
                  {lastEventOutcome.appliedEffects.map((effect, index) => {
                    if (effect.type === 'cash' || effect.type === 'reputation') {
                      return (
                        <li key={index} className={`flex items-center gap-1 ${getEffectColorClass(effect.type, effect.amount)}`}>
                          <span>{getEffectIcon(effect.type)}</span>
                          <span>{formatEffect(effect).replace(getEffectIcon(effect.type) + ' ', '')}</span>
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </ul>
              </div>
            )}
            {lastEventOutcome.appliedEffects.some(effect => effect.type === 'metric') && (
              <div className="bg-[var(--game-primary)]/20 rounded p-1.5 md:p-3 mb-1 md:mb-2 border border-[var(--game-primary)]/40">
                <div className="text-[10px] md:text-xs font-semibold text-[var(--game-primary-light)] mb-0.5">Active:</div>
                <ul className="space-y-0.5 text-[9px] md:text-xs text-[var(--text-primary)]">
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
              className="mt-1.5 md:mt-3 w-full bg-gradient-to-b from-[var(--game-primary-light)] via-[var(--game-primary)] to-[var(--game-primary-dark)] hover:from-[var(--game-primary)] hover:via-[var(--game-primary-dark)] hover:to-[var(--game-primary-dark)] text-white text-[10px] md:text-sm font-semibold py-1.5 md:py-2 rounded border-2 border-black/20 shadow-lg hover:shadow-xl transition-all duration-200"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
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

  const isOpportunity = currentEvent.category === 'opportunity';
  const eventIcon = isOpportunity ? '✨' : '⚠️';
  const eventTitleColor = isOpportunity ? 'text-green-300' : 'text-red-300';
  const categoryGradient = isOpportunity 
    ? 'from-green-500/20 via-green-600/15 to-green-700/20'
    : 'from-red-500/20 via-red-600/15 to-red-700/20';
  const categoryBorder = isOpportunity 
    ? 'border-green-500/30'
    : 'border-red-500/30';
  const defaultChoiceId = currentEvent.choices[0]?.id;

  return (
    <div className="absolute inset-0 z-30 flex items-start md:items-center justify-center px-2 md:px-6 pt-16 md:pt-6 pb-2 md:pb-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/35 md:bg-black/50 backdrop-blur-sm pointer-events-auto" />
      <div className="relative z-10 w-full max-w-[70%] md:max-w-lg pointer-events-auto">
        {/* Game-style frame with category color */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} rounded-md md:rounded-2xl border-2 ${categoryBorder} shadow-[0_0_30px_rgba(0,0,0,0.4)]`} />
        
        {/* Category badge ribbon */}
        <div className={`absolute top-0 right-4 md:right-6 px-2 md:px-3 py-0.5 md:py-1 bg-gradient-to-r ${categoryGradient} border border-[var(--border-secondary)] rounded-b-md shadow-lg z-20`}>
          <span className="text-[8px] md:text-xs font-bold uppercase tracking-wide text-white" style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}>
            {isOpportunity ? 'Opportunity' : 'Challenge'}
          </span>
        </div>

        <div className="relative bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-md md:rounded-2xl shadow-xl p-2.5 md:p-5 lg:p-6 border-2 border-[var(--border-primary)] max-h-[calc(100vh-5rem)] md:max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-1 md:gap-1 mb-1.5 md:mb-3 pt-1">
            <span className={`text-sm md:text-2xl flex-shrink-0 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)] ${isOpportunity ? 'text-green-400' : 'text-red-400'}`}>{eventIcon}</span>
            <h2 
              className={`text-xs md:text-2xl font-semibold md:font-bold ${eventTitleColor} leading-tight flex-1 line-clamp-2`}
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              {currentEvent.title}
            </h2>
          </div>
          
          {/* Summary */}
          <p className="text-[10px] md:text-sm text-[var(--text-secondary)] mb-1.5 md:mb-4 leading-tight line-clamp-2">{currentEvent.summary}</p>

          {/* Choices */}
          <div className="space-y-1.5 md:space-y-2.5">
            {currentEvent.choices.map((choice, index) => {
              const isDefault = choice.id === defaultChoiceId;
              const hasCost = choice.cost !== undefined && choice.cost > 0;
              
              // Choice button colors based on category
              const choiceBg = isOpportunity
                ? (isDefault 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/30 hover:from-green-500/30 hover:to-green-600/40'
                  : 'bg-gradient-to-br from-green-600/30 to-green-700/40 hover:from-green-600/40 hover:to-green-700/50')
                : (isDefault
                  ? 'bg-gradient-to-br from-red-500/20 to-red-600/30 hover:from-red-500/30 hover:to-red-600/40'
                  : 'bg-gradient-to-br from-red-600/30 to-red-700/40 hover:from-red-600/40 hover:to-red-700/50');
              
              const choiceBorder = isOpportunity
                ? (isDefault ? 'border-green-400/50' : 'border-green-500/60')
                : (isDefault ? 'border-red-400/50' : 'border-red-500/60');
              
              const choiceText = isOpportunity ? 'text-green-100' : 'text-red-100';
              
              return (
                <button
                  key={choice.id}
                  onClick={() => handleUserChoice(choice)}
                  className={`w-full text-left p-1.5 md:p-3 rounded transition-all duration-200 border ${choiceBg} ${choiceBorder} ${choiceText} text-[10px] md:text-sm flex flex-col items-start relative overflow-hidden group`}
                >
                  {/* Subtle gloss effect */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  
                  <div className="relative z-10 flex items-center justify-between w-full gap-1 md:gap-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] md:text-sm font-bold opacity-70 flex-shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="font-semibold text-[10px] md:text-base leading-tight flex-1" style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}>
                        {choice.label}
                      </span>
                    </div>
                    {hasCost && choice.cost !== undefined && (
                      <div className="flex-shrink-0 px-1.5 md:px-2 py-0.5 md:py-1 bg-black/40 border border-black/60 rounded text-[9px] md:text-xs font-semibold text-red-300 whitespace-nowrap">
                        ${choice.cost.toLocaleString()}
                      </div>
                    )}
                  </div>
                  {choice.description && (
                    <span className="relative z-10 text-white/80 text-[9px] md:text-xs leading-tight line-clamp-1 mt-0.5 pl-4 md:pl-5" style={{
                      textShadow: '0 1px 1px rgba(0,0,0,0.5)'
                    }}>
                      {choice.description}
                    </span>
                  )}
                  {isDefault && (
                    <div className="relative z-10 mt-1 pt-1 border-t border-white/10 w-full">
                      <span className="text-[8px] md:text-xs text-white/70 italic">
                        ⭐ Recommended
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
