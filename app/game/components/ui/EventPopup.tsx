import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '../../../../lib/store/gameStore';
import { GameEvent, GameEventChoice, GameEventEffect, EventEffectType } from '../../../../lib/types/gameEvents';
import { EffectType } from '@/lib/game/effectManager';
import type { ResolvedEventOutcome, ResolvedDelayedOutcome } from '@/lib/store/slices/eventSlice';
import GameButton from '@/app/components/ui/GameButton';
import { useConfigStore } from '@/lib/store/configStore';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { EventCategory, AUTO_RESOLVE_CATEGORIES } from '@/lib/game/constants/eventCategories';
import { getEventEffectIcon, getEventCategoryIcon, getMetricIcon } from '@/lib/game/metrics/registry';
import { GameMetric } from '@/lib/game/effectManager';


const getEffectColorClass = (type: GameEventEffect['type'], amount: number) => {
  if (type === EventEffectType.Exp) {
    return amount > 0 ? 'text-green-400' : 'text-red-400';
  }
  return amount > 0 ? 'text-green-400' : 'text-red-400';
};

const formatEffect = (effect: GameEventEffect) => {
  if (effect.type === EventEffectType.Cash || effect.type === EventEffectType.Exp) {
    const prefix = effect.type === EventEffectType.Cash ? '$' : '';
    const sign = effect.amount > 0 ? '+' : effect.amount < 0 ? '-' : '';
    const value = Math.abs(effect.amount);
    return `${sign}${prefix}${value.toLocaleString()}`;
  }
  return ''; // Metric effects are handled separately
};

// METRIC_LABELS removed - now using merged definitions from registry + database

const formatDurationLabel = (durationMonths: number | null | undefined) => {
  if (durationMonths === null || durationMonths === undefined || !Number.isFinite(durationMonths) || durationMonths <= 0) {
    return '';
  }
  return ` ${durationMonths} month`;
};

// formatMetricEffect moved inside component to use hook

const EventPopup: React.FC = () => {
  const currentEvent = useGameStore((state) => state.currentEvent);
  const resolveEventChoice = useGameStore((state) => state.resolveEventChoice);
  const lastEventOutcome = useGameStore((state) => state.lastEventOutcome);
  const clearLastEventOutcome = useGameStore((state) => state.clearLastEventOutcome);
  const lastDelayedOutcome = useGameStore((state) => state.lastDelayedOutcome);
  const clearLastDelayedOutcome = useGameStore((state) => state.clearLastDelayedOutcome);
  const metrics = useGameStore((state) => state.metrics);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);

  const formatMetricEffect = (effect: GameEventEffect & { type: EventEffectType.Metric }) => {
    const label = getDisplayLabel(effect.metric);
    const durationLabel = formatDurationLabel(effect.durationMonths);
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

  // Get reactive UI config from store
  const globalConfig = useConfigStore((state) => state.globalConfig);
  const uiConfig = useMemo(() => ({
    eventAutoSelectDurationSeconds: globalConfig?.uiConfig?.eventAutoSelectDurationSeconds ?? 10,
    outcomePopupDurationSeconds: globalConfig?.uiConfig?.outcomePopupDurationSeconds ?? 5,
  }), [globalConfig?.uiConfig]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [outcomeCountdown, setOutcomeCountdown] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outcomeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outcomeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Auto-resolve categories should never reach the choice popup
    // But if they do, don't auto-select - just skip the timer
    if (AUTO_RESOLVE_CATEGORIES.has(currentEvent.category)) {
      setCountdown(null);
      return;
    }

    // Find the first affordable choice for auto-selection
    // For time: must have enough time (to prevent death by time)
    // For cash: always allow (can go bankrupt)
    const affordableChoice = currentEvent.choices.find(choice => {
      const hasTimeCost = choice.timeCost !== undefined && choice.timeCost > 0;
      const canAffordTime = !hasTimeCost || (choice.timeCost !== undefined && choice.timeCost <= metrics.myTime);
      return canAffordTime;
    });

    const defaultChoice = affordableChoice || currentEvent.choices[0];
    if (!defaultChoice) {
      setCountdown(null);
      return;
    }

    // Auto-select timer - automatically selects the affordable default choice after configured duration
    const autoSelectDuration = uiConfig.eventAutoSelectDurationSeconds;
    setCountdown(autoSelectDuration);

    // Schedule auto-selection using the captured choice id
    timeoutRef.current = setTimeout(() => {
      resolveEventChoice(defaultChoice.id);
    }, autoSelectDuration * 1000);

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

  // Auto-dismiss outcome popups after 5 seconds
  useEffect(() => {
    // Clear any existing outcome timers
    if (outcomeTimeoutRef.current) {
      clearTimeout(outcomeTimeoutRef.current);
      outcomeTimeoutRef.current = null;
    }
    if (outcomeIntervalRef.current) {
      clearInterval(outcomeIntervalRef.current);
      outcomeIntervalRef.current = null;
    }

    // Auto-dismiss delayed outcome
    if (lastDelayedOutcome && !currentEvent) {
      const outcomeDuration = uiConfig.outcomePopupDurationSeconds;
      setOutcomeCountdown(outcomeDuration);
      outcomeTimeoutRef.current = setTimeout(() => {
        clearLastDelayedOutcome();
        setOutcomeCountdown(null);
      }, outcomeDuration * 1000);

      outcomeIntervalRef.current = setInterval(() => {
        setOutcomeCountdown((prev) => {
          if (prev === null) return prev;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1_000);
    }
    // Auto-dismiss regular outcome
    else if (lastEventOutcome && !currentEvent) {
      const outcomeDuration = uiConfig.outcomePopupDurationSeconds;
      setOutcomeCountdown(outcomeDuration);
      outcomeTimeoutRef.current = setTimeout(() => {
        clearLastEventOutcome();
        setOutcomeCountdown(null);
      }, outcomeDuration * 1000);

      outcomeIntervalRef.current = setInterval(() => {
        setOutcomeCountdown((prev) => {
          if (prev === null) return prev;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1_000);
    } else {
      setOutcomeCountdown(null);
    }

    return () => {
      if (outcomeTimeoutRef.current) {
        clearTimeout(outcomeTimeoutRef.current);
        outcomeTimeoutRef.current = null;
      }
      if (outcomeIntervalRef.current) {
        clearInterval(outcomeIntervalRef.current);
        outcomeIntervalRef.current = null;
      }
    };
  }, [lastDelayedOutcome, lastEventOutcome, currentEvent, clearLastDelayedOutcome, clearLastEventOutcome]);

  // Prioritize showing delayed outcome over regular outcome
  if (lastDelayedOutcome && !currentEvent) {
    return (
      <div className="absolute inset-0 z-[9999] flex items-center justify-center px-4 py-4 pointer-events-none">
        <div className="absolute inset-0 bg-black/35 pointer-events-auto" />
        <div className="relative z-10 w-full max-w-[90%] sm:max-w-md pointer-events-auto">
          {/* Game-style frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--game-primary-light)]/20 via-[var(--game-primary)]/15 to-[var(--game-primary-dark)]/20 rounded-md md:rounded-2xl border-2 border-[var(--game-primary)]/30 shadow-[0_0_30px_rgba(35,170,246,0.3)]" />

          <div className="relative bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-md md:rounded-2xl shadow-xl p-3 md:p-6 border-2 border-[var(--border-primary)] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--game-primary)]/30 scrollbar-track-transparent">
            {/* Main Title - Delayed Outcome Title */}
            <div className="mb-1.5 md:mb-3">
              <h3 className="text-sm md:text-lg font-semibold text-[var(--text-primary)] leading-tight" style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}>
                {lastDelayedOutcome.label || 'Delayed Event Outcome'}
              </h3>
            </div>

            {/* Event Summary - Shows source event and choice */}
            <p className="text-[10px] md:text-sm text-[var(--text-secondary)] mb-1.5 md:mb-3 leading-snug italic">
              From <span className="font-semibold text-[var(--game-primary-light)]">{lastDelayedOutcome.eventTitle}</span> - <span className="font-semibold text-[var(--game-primary-light)]">{lastDelayedOutcome.choiceLabel}</span>
            </p>

            {/* Consequence Description */}
            {lastDelayedOutcome.description && (
              <div className={`text-[10px] md:text-sm text-[var(--text-primary)] mb-1 md:mb-2 bg-[var(--bg-tertiary)]/50 rounded p-1.5 md:p-2 border border-[var(--border-secondary)] ${lastDelayedOutcome.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
                <span className="font-medium italic">{lastDelayedOutcome.description}</span>
              </div>
            )}
            {lastDelayedOutcome.appliedEffects.length > 0 && (
              <div className="bg-[var(--bg-tertiary)]/60 rounded p-1.5 md:p-3 mb-1 md:mb-2 border border-[var(--border-secondary)]">
                <div className="text-[10px] md:text-sm font-semibold text-[var(--text-primary)] mb-0.5 md:mb-1">Effects:</div>
                <ul className="space-y-0.5 text-[9px] md:text-sm">
                  {lastDelayedOutcome.appliedEffects.map((effect, index) => {
                    if (effect.type === EventEffectType.Cash || effect.type === EventEffectType.Exp) {
                      const iconPath = effect.type === EventEffectType.Cash ? getMetricIcon(GameMetric.Cash) : getMetricIcon(GameMetric.Exp);
                      return (
                        <li key={index} className={`flex items-center gap-1 ${getEffectColorClass(effect.type, effect.amount)}`}>
                          {iconPath ? (
                            <img
                              src={iconPath}
                              alt={effect.type === EventEffectType.Cash ? 'Cash' : 'EXP'}
                              className="w-3 h-3"
                            />
                          ) : (
                            <span>{getEventEffectIcon(effect.type)}</span>
                          )}
                          <span>{formatEffect(effect)}</span>
                        </li>
                      );
                    } else if (effect.type === EventEffectType.Metric) {
                      return (
                        <li key={index} className="text-[var(--text-primary)]">
                          {formatMetricEffect(effect)}
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </ul>
              </div>
            )}
            <div className="mt-1.5 md:mt-3">
              <GameButton
                color="blue"
                fullWidth
                size="sm"
                onClick={() => {
                  if (outcomeTimeoutRef.current) {
                    clearTimeout(outcomeTimeoutRef.current);
                    outcomeTimeoutRef.current = null;
                  }
                  if (outcomeIntervalRef.current) {
                    clearInterval(outcomeIntervalRef.current);
                    outcomeIntervalRef.current = null;
                  }
                  setOutcomeCountdown(null);
                  clearLastDelayedOutcome();
                }}
              >
                Continue{outcomeCountdown !== null && outcomeCountdown > 0 ? ` (${outcomeCountdown}s)` : ''}
              </GameButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prioritize showing the outcome if present
  if (lastEventOutcome && !currentEvent) {
    return (
      <div className="absolute inset-0 z-[9999] flex items-center justify-center px-4 py-4 pointer-events-none">
        <div className="absolute inset-0 bg-black/35 pointer-events-auto" />
        <div className="relative z-10 w-full max-w-[90%] sm:max-w-md pointer-events-auto">
          {/* Game-style frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--game-primary-light)]/20 via-[var(--game-primary)]/15 to-[var(--game-primary-dark)]/20 rounded-md md:rounded-2xl border-2 border-[var(--game-primary)]/30 shadow-[0_0_30px_rgba(35,170,246,0.3)]" />

          <div className="relative bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-md md:rounded-2xl shadow-xl p-3 md:p-6 border-2 border-[var(--border-primary)] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--game-primary)]/30 scrollbar-track-transparent">
            {/* Main Title - Event Title */}
            <div className="mb-1.5 md:mb-3">
              <h3 className="text-sm md:text-lg font-semibold text-[var(--text-primary)] leading-tight" style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}>
                {lastEventOutcome.eventTitle}
              </h3>
            </div>

            {/* Event Summary */}
            {lastEventOutcome.eventSummary && (
              <p className="text-[10px] md:text-sm text-[var(--text-secondary)] mb-1.5 md:mb-3 leading-snug italic">
                {lastEventOutcome.eventSummary}
              </p>
            )}

            {/* Choice Info (only for Opportunity events) */}
            {lastEventOutcome.eventCategory === EventCategory.Opportunity && (
              <p className="text-[10px] md:text-sm text-[var(--text-secondary)] mb-1.5 md:mb-3 leading-snug italic">
                You chose <span className="font-semibold text-[var(--game-primary-light)]">{lastEventOutcome.choiceLabel}</span>
                {lastEventOutcome.costPaid > 0 && <span className="text-red-400 ml-1">(-${lastEventOutcome.costPaid})</span>}
              </p>
            )}

            {/* Consequence Label as Small Subtitle */}
            {lastEventOutcome.consequenceLabel && (
              <div className="mb-1.5 md:mb-3">
                <h4 className="text-xs md:text-sm font-medium text-[var(--game-primary-light)]" style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                }}>
                  {lastEventOutcome.consequenceLabel}
                </h4>
              </div>
            )}

            {/* Consequence Description */}
            {lastEventOutcome.consequenceDescription && (
              <div className="text-[10px] md:text-sm text-[var(--text-primary)] mb-1 md:mb-2 bg-[var(--bg-tertiary)]/50 rounded p-1.5 md:p-2 border border-[var(--border-secondary)]">
                <span className="font-medium italic">{lastEventOutcome.consequenceDescription}</span>
              </div>
            )}
            {lastEventOutcome.appliedEffects.length > 0 && (
              <div className="bg-[var(--bg-tertiary)]/60 rounded p-1.5 md:p-3 mb-1 md:mb-2 border border-[var(--border-secondary)]">
                <div className="text-[10px] md:text-sm font-semibold text-[var(--text-primary)] mb-0.5 md:mb-1">Effects:</div>
                <ul className="space-y-0.5 text-[9px] md:text-sm">
                  {lastEventOutcome.appliedEffects.map((effect, index) => {
                    if (effect.type === EventEffectType.Cash || effect.type === EventEffectType.Exp) {
                      const iconPath = effect.type === EventEffectType.Cash ? getMetricIcon(GameMetric.Cash) : getMetricIcon(GameMetric.Exp);
                      return (
                        <li key={index} className={`flex items-center gap-1 ${getEffectColorClass(effect.type, effect.amount)}`}>
                          {iconPath ? (
                            <img
                              src={iconPath}
                              alt={effect.type === EventEffectType.Cash ? 'Cash' : 'EXP'}
                              className="w-3 h-3"
                            />
                          ) : (
                            <span>{getEventEffectIcon(effect.type)}</span>
                          )}
                          <span>{formatEffect(effect)}</span>
                        </li>
                      );
                    } else if (effect.type === EventEffectType.Metric) {
                      return (
                        <li key={index} className="text-[var(--text-primary)]">
                          {formatMetricEffect(effect)}
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </ul>
              </div>
            )}
            <div className="mt-1.5 md:mt-3">
              <GameButton
                color="blue"
                fullWidth
                size="sm"
                onClick={() => {
                  if (outcomeTimeoutRef.current) {
                    clearTimeout(outcomeTimeoutRef.current);
                    outcomeTimeoutRef.current = null;
                  }
                  if (outcomeIntervalRef.current) {
                    clearInterval(outcomeIntervalRef.current);
                    outcomeIntervalRef.current = null;
                  }
                  setOutcomeCountdown(null);
                  clearLastEventOutcome();
                }}
              >
                Continue{outcomeCountdown !== null && outcomeCountdown > 0 ? ` (${outcomeCountdown}s)` : ''}
              </GameButton>
            </div>
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

  const isOpportunity = currentEvent.category === EventCategory.Opportunity;
  const shouldShowChoices = currentEvent.category === EventCategory.Opportunity;
  const eventIcon = getEventCategoryIcon(currentEvent.category);
  const eventTitleColor = isOpportunity ? 'text-green-300' : 'text-red-300';
  const categoryGradient = isOpportunity 
    ? 'from-green-500/20 via-green-600/15 to-green-700/20'
    : 'from-red-500/20 via-red-600/15 to-red-700/20';
  const categoryBorder = isOpportunity
    ? 'border-green-500/30'
    : 'border-red-500/30';

  // Find the first affordable choice for default selection
  // For time: must have enough time (to prevent death by time)
  // For cash: always allow (can go bankrupt)
  const affordableChoice = currentEvent.choices.find(choice => {
    const hasTimeCost = choice.timeCost !== undefined && choice.timeCost > 0;
    const canAffordTime = !hasTimeCost || (choice.timeCost !== undefined && choice.timeCost <= metrics.myTime);
    return canAffordTime;
  });

  const defaultChoiceId = affordableChoice?.id || currentEvent.choices[0]?.id;

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center px-4 py-4 pointer-events-none">
      <div className="absolute inset-0 bg-black/35 pointer-events-auto" />
      <div className="relative z-10 w-full max-w-[90%] sm:max-w-md md:max-w-lg pointer-events-auto">
        {/* Game-style frame with category color */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} rounded-md md:rounded-2xl border-2 ${categoryBorder} shadow-[0_0_30px_rgba(0,0,0,0.4)]`} />
        

        <div className="relative bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-md md:rounded-2xl shadow-xl p-3 md:p-5 lg:p-6 border-2 border-[var(--border-primary)] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--game-primary)]/30 scrollbar-track-transparent">
          {/* Header */}
          <div className="flex items-center gap-1 md:gap-1 mb-1.5 md:mb-3 pt-1">
            <span className={`text-sm md:text-2xl flex-shrink-0 drop-shadow-[0_0_4px_rgba(0,0,0,0.6)] ${isOpportunity ? 'text-green-400' : 'text-red-400'}`}>{eventIcon}</span>
            <h2 
              className={`text-sm md:text-2xl font-semibold md:font-bold ${eventTitleColor} leading-tight flex-1 line-clamp-2`}
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              {currentEvent.title}
            </h2>
          </div>
          
          {/* Summary */}
          <p className="text-[10px] md:text-sm text-[var(--text-secondary)] mb-1.5 md:mb-4 leading-tight line-clamp-2 italic">{currentEvent.summary}</p>

          {/* Choices - only show for opportunity events */}
          {shouldShowChoices && (
            <div className="space-y-2 md:space-y-2.5">
              {currentEvent.choices
                .sort((a, b) => {
                  // Null orders sort to the end
                  const aOrder = a.order ?? Infinity;
                  const bOrder = b.order ?? Infinity;
                  return aOrder - bOrder;
                })
                .map((choice, index) => {
              const isDefault = choice.id === defaultChoiceId;
              const hasCost = choice.cost !== undefined && choice.cost > 0;
              const hasTimeCost = choice.timeCost !== undefined && choice.timeCost > 0;
              // Only disable time costs (prevent death by time), allow cash costs (can go bankrupt)
              const canAffordTime = !hasTimeCost || (choice.timeCost !== undefined && choice.timeCost <= metrics.myTime);
              const isDisabled = !canAffordTime;

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
                  onClick={() => !isDisabled ? handleUserChoice(choice) : undefined}
                  disabled={isDisabled}
                  className={`w-full text-left p-2 md:p-3 rounded transition-all duration-200 border ${choiceBg} ${choiceBorder} ${choiceText} text-xs md:text-sm flex flex-col items-start relative overflow-hidden group ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                >
                  {/* Subtle gloss effect */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  
                  <div className="relative z-10 flex items-center justify-between w-full gap-1 md:gap-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs md:text-sm font-bold opacity-70 flex-shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="font-semibold text-sm md:text-base leading-tight flex-1" style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}>
                        {choice.label}
                      </span>
                    </div>
                    {isDefault && countdown !== null && countdown > 0 && (
                      <div className="flex-shrink-0 px-2 py-1 bg-black/60 border border-white/30 rounded text-xs font-semibold text-white whitespace-nowrap">
                        ⏱ {countdown}s
                      </div>
                    )}
                    {hasCost && choice.cost !== undefined && (
                      <div className="flex-shrink-0 px-2 py-1 bg-black/40 border border-black/60 rounded text-xs font-semibold text-red-300 whitespace-nowrap">
                        ${choice.cost.toLocaleString()}
                      </div>
                    )}
                    {hasTimeCost && choice.timeCost !== undefined && (
                      <div className="flex-shrink-0 px-2 py-1 bg-black/40 border border-black/60 rounded text-xs font-semibold text-blue-300 whitespace-nowrap flex items-center gap-1">
                        {getMetricIcon(GameMetric.MyTime) ? (
                          <img
                            src={getMetricIcon(GameMetric.MyTime)!}
                            alt="Time"
                            className="w-3 h-3"
                          />
                        ) : (
                          <>⏱</>
                        )}
                        {choice.timeCost.toLocaleString()}h
                      </div>
                    )}
                  </div>
                  {choice.description && (
                    <span className="relative z-10 text-white/80 text-xs md:text-sm leading-tight line-clamp-2 mt-1 pl-5 md:pl-6" style={{
                      textShadow: '0 1px 1px rgba(0,0,0,0.5)'
                    }}>
                      {choice.description}
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
