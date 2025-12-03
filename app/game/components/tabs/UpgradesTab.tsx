'use client';

import React, { useMemo, useState, useCallback } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { UpgradeEffect, UpgradeDefinition } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { useConfigStore, selectUpgradesForIndustry } from '@/lib/store/configStore';
import { Card } from '@/app/components/ui/Card';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Modal } from '@/app/components/ui/Modal';
import type { Staff } from '@/lib/features/staff';
import { calculateSeveranceCost, SEVERANCE_MULTIPLIER } from '@/lib/features/staff';

const METRIC_LABELS: Partial<Record<GameMetric, string>> = {
  [GameMetric.Cash]: 'Cash',
  [GameMetric.Time]: 'Available Time',
  [GameMetric.MonthlyTimeCapacity]: 'Monthly Time Capacity',
  [GameMetric.ServiceCapacity]: 'Service Capacity',
  [GameMetric.MonthlyExpenses]: 'Monthly Expenses',
  [GameMetric.ServiceSpeedMultiplier]: 'Service Speed',
  [GameMetric.SpawnIntervalSeconds]: 'Customer Spawn',
  [GameMetric.Exp]: 'EXP',
  // [GameMetric.HappyProbability] removed - not used in game mechanics
  [GameMetric.ServiceRevenueMultiplier]: 'Service Price',
  [GameMetric.ServiceRevenueFlatBonus]: 'Service Price',
  [GameMetric.FreedomScore]: 'Freedom Score',
  // Note: ExpGainPerHappyCustomer and ExpLossPerAngryCustomer are config-only (not modifiable by upgrades)
};

const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

const formatRawNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const formatCurrency = (value: number): string => `$${Math.abs(value).toLocaleString()}`;
const formatRawCurrency = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`;

const formatEffect = (effect: UpgradeEffect): string => {
  const { metric, type, value } = effect;
  const label = METRIC_LABELS[metric] ?? metric;
  const sign = value >= 0 ? '+' : '-';
  const absValue = Math.abs(value);

  if (type === EffectType.Add) {
    switch (metric) {
      case GameMetric.Cash:
      case GameMetric.MonthlyExpenses:
      case GameMetric.ServiceRevenueFlatBonus:
        return `${sign}${formatCurrency(value)} ${label}`;
      case GameMetric.Time:
        return `${sign}${formatMagnitude(value)}h ${label}`;
      case GameMetric.SpawnIntervalSeconds:
        return `${sign}${formatMagnitude(value)}s ${label} Interval`;
      case GameMetric.ServiceCapacity:
        return `${sign}${formatMagnitude(value)} ${label}`;
      default:
        return `${sign}${formatMagnitude(value)} ${label}`;
    }
  }

  if (type === EffectType.Percent) {
    const percent = Math.round(absValue);
    switch (metric) {
      case GameMetric.SpawnIntervalSeconds:
        return `${sign}${percent}% Customer Spawn Rate`;
      default:
        return `${sign}${percent}% ${label}`;
    }
  }

  if (type === EffectType.Multiply) {
    const multiplier = Number.isInteger(value) ? value.toString() : value.toFixed(2);
    return `×${multiplier} ${label}`;
  }

  if (type === EffectType.Set) {
    switch (metric) {
      case GameMetric.MonthlyExpenses:
      case GameMetric.ServiceRevenueFlatBonus:
        return `Set ${label} to ${formatRawCurrency(value)}`;
      case GameMetric.SpawnIntervalSeconds:
        return `Set ${label} Interval to ${formatRawNumber(value)}s`;
      default:
        return `Set ${label} to ${formatRawNumber(value)}`;
    }
  }

  return `${sign}${formatMagnitude(value)} ${label}`;
};

interface UpgradeCardProps {
  upgrade: UpgradeDefinition;
}

// Helper to compare effects and show differences
function compareEffects(
  currentEffects: UpgradeEffect[],
  nextEffects: UpgradeEffect[],
): Array<{ effect: string; isNew: boolean; isImproved: boolean }> {
  // Create a map of current effects by metric+type
  const currentMap = new Map<string, UpgradeEffect>();
  currentEffects.forEach((e) => {
    const key = `${e.metric}_${e.type}`;
    currentMap.set(key, e);
  });

  const result: Array<{ effect: string; isNew: boolean; isImproved: boolean }> = [];
  nextEffects.forEach((e) => {
    const key = `${e.metric}_${e.type}`;
    const formatted = formatEffect(e);
    const currentEffect = currentMap.get(key);
    
    if (!currentEffect) {
      // This effect doesn't exist in current level - it's new
      result.push({ effect: formatted, isNew: true, isImproved: false });
    } else if (currentEffect.value !== e.value) {
      // Value changed - check if it's an improvement (higher is better for most metrics)
      // For Add/Percent types, positive values increasing is improvement
      // For Multiply, >1 increasing is improvement, <1 decreasing is improvement
      // For Set, we'll just mark as changed
      const isImprovement = 
        (e.type === EffectType.Add && e.value > currentEffect.value) ||
        (e.type === EffectType.Percent && e.value > currentEffect.value) ||
        (e.type === EffectType.Multiply && e.value > currentEffect.value && e.value >= 1) ||
        (e.type === EffectType.Multiply && e.value < currentEffect.value && e.value < 1) ||
        (e.type === EffectType.Set);
      
      result.push({ effect: formatted, isNew: false, isImproved: isImprovement });
    } else {
      // Same effect value
      result.push({ effect: formatted, isNew: false, isImproved: false });
    }
  });

  return result;
}

function UpgradeCard({ upgrade }: UpgradeCardProps) {
  const { getUpgradeLevel, purchaseUpgrade } = useGameStore();
  // Subscribe to upgrades state to ensure re-renders when levels change
  const upgrades = useGameStore((state) => state.upgrades);
  // Subscribe to metrics with selector to ensure re-renders when metrics change
  const metrics = useGameStore((state) => state.metrics);
  const { areMet: requirementsMet, descriptions: requirementDescriptions } = useRequirements(upgrade.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  // Calculate current level from subscribed upgrades state
  // currentLevel is 1-indexed: 0 = not purchased, 1 = level 1 purchased, 2 = level 2 purchased, etc.
  const currentLevel = useMemo(() => upgrades[upgrade.id] || 0, [upgrades, upgrade.id]);
  
  // Get current level config (for display)
  const currentLevelConfig = currentLevel > 0 && currentLevel <= upgrade.levels.length
    ? upgrade.levels.find(l => l.level === currentLevel) || upgrade.levels[currentLevel - 1]
    : null;
  
  // Get next level config (for purchase)
  const nextLevelNumber = currentLevel + 1;
  const nextLevelConfig = currentLevel < upgrade.maxLevel 
    ? (upgrade.levels.find(level => level.level === nextLevelNumber) || upgrade.levels[currentLevel])
    : null;
  
  // Get cost, timeCost, and effects from level config
  const upgradeCost = nextLevelConfig ? nextLevelConfig.cost : 0;
  const upgradeTimeCost = nextLevelConfig?.timeCost;
  
  const needsCash = upgradeCost > 0;
  const needsTime = upgradeTimeCost !== undefined && upgradeTimeCost > 0;
  // Calculate affordability directly using subscribed metrics to ensure reactivity
  const canAfford = useMemo(() => {
    const hasCash = upgradeCost === 0 || metrics.cash >= upgradeCost;
    const hasTime = upgradeTimeCost === undefined || upgradeTimeCost === 0 || metrics.time >= upgradeTimeCost;
    return hasCash && hasTime;
  }, [metrics.cash, metrics.time, upgradeCost, upgradeTimeCost]);
  const isMaxed = currentLevel >= upgrade.maxLevel;
  
  // Determine what's missing for button text
  const needText = useMemo(() => {
    const missing: string[] = [];
    if (needsCash && metrics.cash < upgradeCost) missing.push('Cash');
    if (needsTime && metrics.time < upgradeTimeCost!) missing.push('Time');
    return missing.length > 0 ? `Need ${missing.join(' + ')}` : 'Need Cash';
  }, [needsCash, needsTime, metrics.cash, metrics.time, upgradeCost, upgradeTimeCost]);
  
  // Get next level effects for display
  const nextLevelEffects = useMemo(() => {
    if (!nextLevelConfig) return [];
    return nextLevelConfig.effects.map(effect => formatEffect(effect));
  }, [nextLevelConfig]);

  const buttonDisabled = isMaxed || !canAfford || !requirementsMet;

  const handlePurchase = useCallback(() => {
    if (!buttonDisabled) {
      purchaseUpgrade(upgrade.id);
    }
  }, [buttonDisabled, purchaseUpgrade, upgrade.id]);

  const handleRequirementsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequirementsModal(false);
  }, []);

  return (
    <Card className="space-y-3">
      {/* Header: Upgrade Name and Level Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-primary">
            {upgrade.name}
          </span>
        </div>
        <div className={`px-2 py-1 rounded border text-xs sm:text-sm font-bold ${
          currentLevel > 0
            ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
            : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
        }`}>
          {currentLevel}/{upgrade.maxLevel}
        </div>
      </div>

      {/* What You'll Get (Next Level Info) */}
      {nextLevelConfig && !isMaxed && (
        <>
          <div>
            <p className="text-sm sm:text-base font-semibold text-primary leading-tight">
              {nextLevelConfig.name}
            </p>
          </div>

          {nextLevelConfig.description && (
            <div>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                {nextLevelConfig.description}
              </p>
            </div>
          )}

          {nextLevelEffects.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                Effects:
              </div>
              <ul className="space-y-1">
                {nextLevelEffects.map((effect, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-secondary leading-relaxed">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

          {/* Cost Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            {needsCash && (
              <div className={`flex items-center gap-1.5 sm:gap-2 ${
                metrics.cash >= upgradeCost 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="text-base sm:text-lg">💎</span>
                <span className="text-sm sm:text-base font-bold">
                  ${upgradeCost.toLocaleString()}
                </span>
              </div>
            )}
            {needsCash && needsTime && (
              <span className="text-xs text-secondary">+</span>
            )}
            {needsTime && (
              <div className={`flex items-center gap-1.5 sm:gap-2 ${
                metrics.time >= upgradeTimeCost!
                  ? 'text-cyan-600 dark:text-cyan-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="text-base sm:text-lg">⏱️</span>
                <span className="text-sm sm:text-base font-bold">
                  {upgradeTimeCost}h
                </span>
              </div>
            )}
            {!needsCash && !needsTime && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400">
                <span className="text-base sm:text-lg">🆓</span>
                <span className="text-sm sm:text-base font-bold">Free</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Max Level Message */}
      {isMaxed && (
        <div className="p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold text-center">
            🎉 Maximum Level Reached
          </p>
        </div>
      )}

      {/* Requirements Modal */}
      <Modal
        isOpen={showRequirementsModal}
        onClose={handleCloseModal}
        maxWidth="sm"
      >
        <div className="text-center text-secondary text-body-sm leading-relaxed space-y-1">
          <h3 className="text-primary font-semibold mb-3">Requirements</h3>
          {requirementDescriptions.map((desc, idx) => (
            <div key={idx}>{desc}</div>
          ))}
        </div>
      </Modal>

      {/* Action Button */}
      <div className="relative pt-2">
        <GameButton
          color={isMaxed ? 'gold' : canAfford && requirementsMet ? 'blue' : 'gold'}
          fullWidth
          size="sm"
          disabled={buttonDisabled}
          onClick={handlePurchase}
        >
          {isMaxed
            ? 'Max Level'
            : !requirementsMet
              ? 'Requirements Not Met'
              : canAfford
                ? `Upgrade to Level ${nextLevelNumber}`
                : needText}
        </GameButton>
        {requirementDescriptions.length > 0 && !requirementsMet && (
          <button
            onClick={handleRequirementsClick}
            className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[var(--bg-tertiary)] hover:bg-[var(--game-primary)] text-white rounded-full text-micro sm:text-caption font-bold shadow-md transition-colors flex items-center justify-center z-10"
            title="Click to see requirements"
          >
            ?
          </button>
        )}
      </div>
    </Card>
  );
}

// Staff-related helper functions and styles (from StaffTab)
const ROLE_STYLE_MAP: Record<
  string,
  {
    card: string;
    cardGradient: string;
    avatarBg: string;
    textColor: string;
    accentText: string;
    badgeBg: string;
    borderColor: string;
    borderGlow: string;
    cornerAccent: string;
  }
> = {
  Assistant: {
    card: 'bg-blue-700',
    cardGradient: 'from-blue-800 via-blue-700 to-blue-800',
    avatarBg: 'bg-blue-600',
    textColor: 'text-blue-100',
    accentText: 'text-blue-200',
    badgeBg: 'bg-blue-600/40',
    borderColor: 'border-blue-500',
    borderGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    cornerAccent: 'border-blue-400',
  },
  Technician: {
    card: 'bg-purple-600',
    cardGradient: 'from-purple-700 via-purple-600 to-purple-700',
    avatarBg: 'bg-purple-500',
    textColor: 'text-purple-100',
    accentText: 'text-purple-200',
    badgeBg: 'bg-purple-500/40',
    borderColor: 'border-purple-400',
    borderGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    cornerAccent: 'border-purple-300',
  },
  Specialist: {
    card: 'bg-orange-600',
    cardGradient: 'from-orange-700 via-orange-600 to-orange-700',
    avatarBg: 'bg-orange-500',
    textColor: 'text-orange-100',
    accentText: 'text-orange-200',
    badgeBg: 'bg-orange-500/40',
    borderColor: 'border-orange-400',
    borderGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.6)]',
    cornerAccent: 'border-orange-300',
  },
};

const FALLBACK_STYLE = {
  card: 'bg-slate-600',
  cardGradient: 'from-slate-700 via-slate-600 to-slate-700',
  avatarBg: 'bg-slate-500',
  textColor: 'text-slate-200',
  accentText: 'text-slate-300',
  badgeBg: 'bg-slate-400/20',
  borderColor: 'border-slate-600',
  borderGlow: 'shadow-[0_0_15px_rgba(100,116,139,0.4)]',
  cornerAccent: 'border-slate-400',
};

const getRoleStyles = (role: string) => ROLE_STYLE_MAP[role] ?? FALLBACK_STYLE;

// Format effect for staff display
const formatStaffEffect = (effect: { metric: GameMetric; type: EffectType; value: number }) => {
  const getMetricLabel = (metric: GameMetric) => {
    switch (metric) {
      case GameMetric.Cash: return 'Cash';
      case GameMetric.Time: return 'Available Time';
      case GameMetric.ServiceSpeedMultiplier: return 'Service Speed';
      case GameMetric.FreedomScore: return 'Freedom Score';
      case GameMetric.MonthlyExpenses: return 'Monthly Expenses';
      case GameMetric.Exp: return 'EXP';
      case GameMetric.ServiceRevenueMultiplier: return 'Revenue';
      case GameMetric.ServiceRevenueFlatBonus: return 'Revenue Bonus';
      default: return metric;
    }
  };

  const getTypeSymbol = (type: EffectType, value: number) => {
    switch (type) {
      case EffectType.Add: return value >= 0 ? `+${value}` : value.toString();
      case EffectType.Percent: return `${value >= 0 ? '+' : ''}${value}%`;
      case EffectType.Multiply: return `×${value}`;
      default: return value.toString();
    }
  };

  return `${getTypeSymbol(effect.type, effect.value)} ${getMetricLabel(effect.metric)}`;
};

const getEffectIcon = (metric: GameMetric) => {
  switch (metric) {
    case GameMetric.Cash: return '💵';
    case GameMetric.Time: return '⏰';
    case GameMetric.ServiceSpeedMultiplier: return '⚡';
    case GameMetric.Exp: return '⭐';
    case GameMetric.ServiceRevenueMultiplier: return '💰';
    case GameMetric.ServiceRevenueFlatBonus: return '💵';
    case GameMetric.FreedomScore: return '⏰';
    case GameMetric.MonthlyExpenses: return '💸';
    default: return '✨';
  }
};

interface StaffCandidateCardProps {
  candidate: Staff;
  onHire: (staff: Staff) => void;
}

function StaffCandidateCard({ candidate, onHire }: StaffCandidateCardProps) {
  const { areMet: requirementsMet, descriptions: requirementDescriptions } = useRequirements(candidate.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const styles = useMemo(() => getRoleStyles(candidate.role), [candidate.role]);
  const metrics = useGameStore((state) => state.metrics);
  const canAfford = useMemo(() => metrics.cash >= candidate.salary, [metrics.cash, candidate.salary]);

  const handleHire = useCallback(() => {
    if (requirementsMet && canAfford) {
      onHire(candidate);
    }
  }, [requirementsMet, canAfford, onHire, candidate]);

  const handleRequirementsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequirementsModal(false);
  }, []);

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-gradient-to-b ${styles.cardGradient} rounded-xl sm:rounded-2xl border-2 ${styles.borderColor} ${styles.borderGlow} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
    >
      {/* Hero Banner */}
      <div className={`h-10 sm:h-12 md:h-16 bg-gradient-to-r ${styles.cardGradient} relative overflow-hidden border-b-2 ${styles.borderColor}/50`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-1 sm:top-1.5 md:top-2 left-2 sm:left-2.5 md:left-3 right-2 sm:right-2.5 md:right-3 flex items-center justify-between z-10">
          <span className={`text-micro sm:text-ultra-sm md:text-xs font-bold ${styles.textColor} uppercase tracking-wide`}>
            {candidate.role}
          </span>
          {!requirementsMet && (
            <span className="text-white/70 text-xs sm:text-sm md:text-base">🔒</span>
          )}
        </div>
      </div>

      {/* Avatar Section */}
      <div className="relative -mt-6 sm:-mt-8 md:-mt-10 flex justify-center mb-1.5 sm:mb-2 md:mb-3">
        <div className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square ${styles.avatarBg} rounded-xl border-2 sm:border-3 md:border-4 ${styles.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
          <div className={`absolute inset-0 ${styles.avatarBg} rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity -z-10`}></div>
          <img
            src={candidate.spriteImage || '/images/staff/staff1.png'}
            alt={candidate.name}
            className="w-[1600%] h-full object-cover object-left select-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/staff/staff1.png';
            }}
          />
        </div>
      </div>

      {/* Name Section */}
      <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 md:pb-3 text-center">
        <h5 className="text-white font-bold text-heading-sm sm:text-heading mb-1 sm:mb-1.5 md:mb-2 tracking-tight truncate px-2">
          {candidate.name}
        </h5>
        <div className="flex justify-center">
          <div className={`inline-block px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-0.5 md:py-1 rounded-full ${styles.badgeBg} border ${styles.borderColor}`}>
            <span className={`${styles.accentText} text-micro sm:text-caption md:text-xs font-semibold uppercase whitespace-nowrap`}>
              {candidate.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 md:pb-3 space-y-1 sm:space-y-1.5 flex-grow">
        {candidate.effects.length > 0 && (
          <div className="space-y-1 sm:space-y-1.5">
            {candidate.effects.map((effect, index) => {
              const effectParts = formatStaffEffect(effect).split(' ');
              const value = effectParts[0];
              const label = effectParts.slice(1).join(' ');
              return (
                <div key={index} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-white text-caption sm:text-label font-medium flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <span className="text-micro sm:text-ultra-sm flex-shrink-0">{getEffectIcon(effect.metric)}</span>
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="text-green-400 font-bold text-caption sm:text-label whitespace-nowrap flex-shrink-0">{value}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-2 border-t border-white/10 mt-auto">
          <div className={`text-lg sm:text-xl font-bold ${canAfford ? 'text-[var(--game-secondary)]' : 'text-[var(--error)]'}`}>
            ${Math.round(candidate.salary).toLocaleString()}/m
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRequirementsModal}
        onClose={handleCloseModal}
        maxWidth="sm"
      >
        <div className="text-center text-secondary text-body-sm leading-relaxed space-y-1">
          <h3 className="text-primary font-semibold mb-3">Requirements</h3>
          {requirementDescriptions.map((desc, idx) => (
            <div key={idx}>{desc}</div>
          ))}
        </div>
      </Modal>

      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 relative mt-auto">
        <GameButton
          onClick={handleHire}
          disabled={!requirementsMet || !canAfford}
          color="gold"
          fullWidth
          size="sm"
          className="w-full"
        >
          {!canAfford ? 'Need Cash' : requirementsMet ? `Hire ${candidate.name.split(' ')[0]}` : 'Requirements Not Met'}
        </GameButton>
        {requirementDescriptions.length > 0 && !requirementsMet && (
          <button
            onClick={handleRequirementsClick}
            className="absolute top-0 right-2 sm:right-3 md:right-4 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-black/70 hover:bg-black/90 text-white rounded-full text-micro sm:text-caption md:text-xs font-bold shadow-lg transition-colors flex items-center justify-center z-10 border border-white/20"
            title="Click to see requirements"
          >
            ?
          </button>
        )}
      </div>
    </div>
  );
}

interface HiredStaffCardProps {
  member: Staff;
  onFire: (staffId: string) => void;
}

function HiredStaffCard({ member, onFire }: HiredStaffCardProps) {
  const styles = getRoleStyles(member.role);
  const [showFireConfirm, setShowFireConfirm] = useState(false);
  const metrics = useGameStore((state) => state.metrics);
  
  // Memoize calculations to prevent unnecessary re-renders
  const severanceCost = useMemo(() => calculateSeveranceCost(member), [member]);
  const canAffordSeverance = useMemo(() => metrics.cash >= severanceCost, [metrics.cash, severanceCost]);
  const multiplierText = useMemo(() => SEVERANCE_MULTIPLIER === 1 ? '1x' : `${SEVERANCE_MULTIPLIER}x`, []);

  const handleFireClick = useCallback(() => {
    setShowFireConfirm(true);
  }, []);

  const handleConfirmFire = useCallback(() => {
    onFire(member.id);
    setShowFireConfirm(false);
  }, [member.id, onFire]);

  const handleCancelFire = useCallback(() => {
    setShowFireConfirm(false);
  }, []);

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-gradient-to-b ${styles.cardGradient} rounded-xl sm:rounded-2xl border-2 ${styles.borderColor} ${styles.borderGlow} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
    >
      {/* Hero Banner */}
      <div className={`h-10 sm:h-12 md:h-16 bg-gradient-to-r ${styles.cardGradient} relative overflow-hidden border-b-2 ${styles.borderColor}/50`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-1 sm:top-1.5 md:top-2 left-2 sm:left-2.5 md:left-3 right-2 sm:right-2.5 md:right-3 flex items-center z-10">
          <span className={`text-micro sm:text-ultra-sm md:text-xs font-bold ${styles.textColor} uppercase tracking-wide`}>
            {member.role}
          </span>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="relative -mt-6 sm:-mt-8 md:-mt-10 flex justify-center mb-1.5 sm:mb-2 md:mb-3">
        <div className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square ${styles.avatarBg} rounded-xl border-2 sm:border-3 md:border-4 ${styles.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
          <div className={`absolute inset-0 ${styles.avatarBg} rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity -z-10`}></div>
          <img
            src={member.spriteImage || '/images/staff/staff1.png'}
            alt={member.name}
            className="w-[1600%] h-full object-cover object-left select-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/staff/staff1.png';
            }}
          />
        </div>
      </div>

      {/* Name Section */}
      <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 md:pb-3 text-center">
        <h4 className="text-white font-bold text-heading-sm sm:text-heading mb-1 sm:mb-1.5 md:mb-2 tracking-tight truncate px-2">
          {member.name}
        </h4>
        <div className="flex justify-center">
          <div className={`inline-block px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-0.5 md:py-1 rounded-full ${styles.badgeBg} border ${styles.borderColor}`}>
            <span className={`${styles.accentText} text-micro sm:text-caption md:text-xs font-semibold uppercase whitespace-nowrap`}>
              {member.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 md:pb-3 space-y-1 sm:space-y-1.5 flex-grow">
        {member.effects.length > 0 && (
          <div className="space-y-1 sm:space-y-1.5">
            {member.effects.map((effect, index) => {
              const effectParts = formatStaffEffect(effect).split(' ');
              const value = effectParts[0];
              const label = effectParts.slice(1).join(' ');
              return (
                <div key={index} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-white text-caption sm:text-label font-medium flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <span className="text-micro sm:text-ultra-sm flex-shrink-0">{getEffectIcon(effect.metric)}</span>
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="text-green-400 font-bold text-caption sm:text-label whitespace-nowrap flex-shrink-0">{value}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-2 border-t border-white/10 mt-auto">
          <div className="text-lg sm:text-xl font-bold text-[var(--game-secondary)]">
            ${Math.round(member.salary).toLocaleString()}/m
          </div>
        </div>
      </div>

      {/* Fire Button */}
      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 mt-auto">
        <GameButton
          onClick={handleFireClick}
          color="red"
          fullWidth
          size="sm"
          className="w-full"
          disabled={!canAffordSeverance}
        >
          Fire {member.name.split(' ')[0]}
        </GameButton>
      </div>

      {/* Fire Confirmation Modal */}
      <Modal
        isOpen={showFireConfirm}
        onClose={handleCancelFire}
        maxWidth="sm"
      >
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="text-center border-b border-[var(--border-primary)] pb-4">
              <h3 className="text-2xl font-bold text-primary mb-2">
                Fire {member.name}?
              </h3>
              <p className="text-secondary text-sm">
                This will remove {member.name} from your team. Their effects will stop immediately.
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-tertiary)]/50 rounded-xl p-5 border-2 border-[var(--border-primary)] shadow-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary text-sm font-medium">Monthly Salary:</span>
                  <span className="text-primary font-bold text-base">${Math.round(member.salary).toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-[var(--border-primary)]"></div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-secondary text-sm font-medium">
                    Severance <span className="text-tertiary">({multiplierText} salary)</span>:
                  </span>
                  <span className={`font-bold text-lg ${canAffordSeverance ? 'text-[var(--error)]' : 'text-[var(--error)]/60'}`}>
                    ${severanceCost.toLocaleString()}
                  </span>
                </div>
                
                <div className="h-px bg-[var(--border-primary)]"></div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-primary font-semibold text-sm">Your Cash:</span>
                  <span className={`font-bold text-lg ${canAffordSeverance ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    ${metrics.cash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            {!canAffordSeverance && (
              <div className="bg-[var(--error)]/20 border-2 border-[var(--error)]/50 rounded-lg p-4 animate-pulse">
                <p className="text-[var(--error)] text-sm text-center font-medium">
                  ⚠️ Insufficient funds. You need ${severanceCost.toLocaleString()} to pay severance.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <GameButton
                onClick={handleCancelFire}
                color="gold"
                className="flex-1"
              >
                Cancel
              </GameButton>
              <GameButton
                onClick={handleConfirmFire}
                color="red"
                className="flex-1"
                disabled={!canAffordSeverance}
              >
                Fire&Pay
              </GameButton>
            </div>
          </div>
        </Modal>
    </div>
  );
}

export function UpgradesTab() {
  const { selectedIndustry } = useGameStore();
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const upgradesSelector = useMemo(
    () => selectUpgradesForIndustry(industryId),
    [industryId],
  );
  const availableUpgrades = useConfigStore(upgradesSelector);

  // Staff-related state
  const hiredStaff = useGameStore((state) => state.hiredStaff);
  const availableStaff = useGameStore((state) => state.availableStaff);
  const hireStaff = useGameStore((state) => state.hireStaff);
  const fireStaff = useGameStore((state) => state.fireStaff);

  const handleHireStaff = (staffToHire: Staff) => {
    hireStaff(staffToHire);
  };

  const handleFireStaff = (staffId: string) => {
    const result = fireStaff(staffId);
    if (result && !result.success) {
      // Could show error message here if needed
      console.warn(result.message);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Upgrades Section */}
      <section>
        <SectionHeading>Available Upgrades</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {availableUpgrades.map((upgrade) => (
            <UpgradeCard key={upgrade.id} upgrade={upgrade} />
          ))}
        </div>
      </section>

      {/* Staff Section */}
      <section className="space-y-3 sm:space-y-4 md:space-y-6">
        <div className="text-center">
          <SectionHeading>Staff Management</SectionHeading>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-secondary mb-3 sm:mb-4 md:mb-6 lg:mb-8 text-center px-2">
            Oversee your talented team. Happy staff, happy customers!
          </p>
        </div>

        {/* Current Staff */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
          <div className="text-center">
            <h4 className="text-base sm:text-lg md:text-xl font-bold text-primary mb-1 sm:mb-2">Our Staff</h4>
            <p className="text-xs sm:text-sm md:text-base text-secondary">
              Meet the team running your business every day.
            </p>
          </div>
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-stretch gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 md:px-4">
            {hiredStaff.map((member) => (
              <div key={member.id} className="w-[160px] sm:w-[180px] flex">
                <div className="w-full">
                  <HiredStaffCard member={member} onFire={handleFireStaff} />
                </div>
              </div>
            ))}
            {hiredStaff.length === 0 && (
              <div className="text-center text-muted text-xs sm:text-sm md:text-base py-6 sm:py-8 md:py-10 w-full">
                You haven&apos;t hired anyone yet. Pick a candidate below to build your team.
              </div>
            )}
          </div>
        </div>

        {/* Available Staff */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
          <div className="text-center">
            <h4 className="text-base sm:text-lg md:text-xl font-bold text-primary mb-1 sm:mb-2">Available Staff</h4>
            <p className="text-xs sm:text-sm md:text-base text-secondary">
              Choose who joins your business next. Hiring is instant and only adds their salary.
            </p>
          </div>
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-stretch gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 md:px-4">
            {availableStaff.map((candidate) => (
              <div key={candidate.id} className="w-[160px] sm:w-[200px] flex">
                <div className="w-full">
                  <StaffCandidateCard
                    candidate={candidate}
                    onHire={handleHireStaff}
                  />
                </div>
              </div>
            ))}
            {availableStaff.length === 0 && (
              <div className="text-center text-muted text-xs sm:text-sm md:text-base py-6 sm:py-8 md:py-10 w-full">
                All available staff have joined your team. Check back later!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
