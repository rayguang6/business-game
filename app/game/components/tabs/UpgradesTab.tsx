'use client';

import React, { useMemo, useState } from 'react';
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

const METRIC_LABELS: Partial<Record<GameMetric, string>> = {
  [GameMetric.Cash]: 'Cash',
  [GameMetric.Time]: 'Available Time',
  [GameMetric.ServiceRooms]: 'Service Rooms',
  [GameMetric.MonthlyExpenses]: 'Monthly Expenses',
  [GameMetric.ServiceSpeedMultiplier]: 'Service Speed',
  [GameMetric.SpawnIntervalSeconds]: 'Customer Spawn',
  [GameMetric.SkillLevel]: 'Skill Level',
  // [GameMetric.HappyProbability] removed - not used in game mechanics
  [GameMetric.ServiceRevenueMultiplier]: 'Service Price',
  [GameMetric.ServiceRevenueFlatBonus]: 'Service Price',
  [GameMetric.FreedomScore]: 'Freedom Score',
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
      case GameMetric.ServiceRooms:
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

function UpgradeCard({ upgrade }: UpgradeCardProps) {
  const { canAffordUpgrade, getUpgradeLevel, purchaseUpgrade, metrics } = useGameStore();
  const { areMet: requirementsMet, descriptions: requirementDescriptions } = useRequirements(upgrade.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  const currentLevel = getUpgradeLevel(upgrade.id);
  const needsCash = upgrade.cost > 0;
  const needsTime = upgrade.timeCost !== undefined && upgrade.timeCost > 0;
  const canAfford = canAffordUpgrade(upgrade.cost, upgrade.timeCost);
  const isMaxed = currentLevel >= upgrade.maxLevel;
  
  // Determine what's missing for button text
  const missing: string[] = [];
  if (needsCash && metrics.cash < upgrade.cost) missing.push('Cash');
  if (needsTime && metrics.time < upgrade.timeCost!) missing.push('Time');
  const needText = missing.length > 0 ? `Need ${missing.join(' + ')}` : 'Need Cash';
  const effects = upgrade.effects.map(formatEffect);
  const buttonDisabled = isMaxed || !canAfford || !requirementsMet;

  const handlePurchase = () => {
    if (!buttonDisabled) {
      purchaseUpgrade(upgrade.id);
    }
  };

  const handleRequirementsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  };

  return (
    <Card
      variant={currentLevel > 0 ? "success" : "default"}
      className="transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl" aria-hidden>{upgrade.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h5 className="text-primary font-bold text-base">{upgrade.name}</h5>
              {upgrade.maxLevel > 1 && (
                <span className="text-xs text-tertiary">
                  Lvl {currentLevel}/{upgrade.maxLevel}
                </span>
              )}
            </div>
            <span className={`text-sm font-semibold ${isMaxed ? '' : ''}`} style={{ color: isMaxed ? 'var(--success)' : 'var(--game-secondary)' }}>
              {isMaxed ? 'Max' : (() => {
                const costParts: string[] = [];
                if (needsCash) costParts.push(`$${upgrade.cost.toLocaleString()}`);
                if (needsTime) costParts.push(`${upgrade.timeCost}h`);
                return costParts.join(' + ') || 'Free';
              })()}
            </span>
          </div>
          <p className="text-secondary text-sm mt-1 mb-3">{upgrade.description}</p>

          {/* Requirements Modal */}
          <Modal
            isOpen={showRequirementsModal}
            onClose={() => setShowRequirementsModal(false)}
            maxWidth="sm"
          >
            <div className="text-center text-secondary text-sm leading-relaxed space-y-1">
              <h3 className="text-primary font-semibold mb-3">Requirements</h3>
              {requirementDescriptions.map((desc, idx) => (
                <div key={idx}>{desc}</div>
              ))}
            </div>
          </Modal>
          <ul className="text-xs text-secondary space-y-1">
            {effects.map((effect, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span style={{ color: 'var(--game-primary)' }}>•</span>
                <span>{effect}</span>
                {currentLevel > 0 && upgrade.maxLevel > 1 && (
                  <span className="ml-1" style={{ color: 'var(--success)' }}>
                    (×{currentLevel})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex justify-end relative">
        <GameButton
          color={isMaxed ? 'gold' : canAfford && requirementsMet ? 'blue' : 'gold'}
          className="w-full sm:w-auto"
          disabled={buttonDisabled}
          onClick={handlePurchase}
        >
          {isMaxed
            ? 'Max Level'
            : !requirementsMet
              ? 'Requirements Not Met'
              : canAfford
                ? currentLevel > 0
                  ? 'Upgrade'
                  : 'Buy'
                : needText}
        </GameButton>
        {requirementDescriptions.length > 0 && !requirementsMet && (
          <button
            onClick={handleRequirementsClick}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--bg-tertiary)] hover:bg-[var(--game-primary)] text-white rounded-full text-xs font-bold shadow-md transition-colors flex items-center justify-center z-10 min-w-[20px] min-h-[20px]"
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
      case GameMetric.SkillLevel: return 'Skill Level';
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
    case GameMetric.SkillLevel: return '⭐';
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
  const styles = getRoleStyles(candidate.role);
  const metrics = useGameStore((state) => state.metrics);
  const canAfford = metrics.cash >= candidate.salary;

  const handleHire = () => {
    if (requirementsMet && canAfford) {
      onHire(candidate);
    }
  };

  const handleRequirementsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  };

  return (
    <div
      className={`relative w-full bg-gradient-to-b ${styles.cardGradient} rounded-2xl border-2 ${styles.borderColor} ${styles.borderGlow} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
    >
      {/* Hero Banner */}
      <div className={`h-16 bg-gradient-to-r ${styles.cardGradient} relative overflow-hidden border-b-2 ${styles.borderColor}/50`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between z-10">
          <span className={`text-xs font-bold ${styles.textColor} uppercase tracking-wide`}>
            {candidate.role}
          </span>
          {!requirementsMet && (
            <span className="text-white/70 text-base">🔒</span>
          )}
        </div>
      </div>

      {/* Avatar Section */}
      <div className="relative -mt-10 flex justify-center mb-3">
        <div className="relative">
          <div className={`absolute inset-0 ${styles.avatarBg} rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity`}></div>
          <div className={`relative w-20 h-20 sm:w-24 sm:h-24 ${styles.avatarBg} rounded-full flex items-center justify-center border-4 ${styles.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-4xl sm:text-5xl leading-none relative z-10">{candidate.emoji}</span>
          </div>
        </div>
      </div>

      {/* Name Section */}
      <div className="px-4 pb-3 text-center">
        <h5 className="text-white font-bold text-base sm:text-lg mb-2 tracking-tight">
          {candidate.name}
        </h5>
        <div className={`inline-block px-3 py-1 rounded-full ${styles.badgeBg} border ${styles.borderColor}`}>
          <span className={`${styles.accentText} text-xs font-semibold uppercase`}>
            {candidate.role}
          </span>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="px-4 pb-3 space-y-2">
        {candidate.effects.length > 0 && (
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/10">
            <div className="text-white/70 text-[10px] uppercase tracking-wide mb-2 font-semibold">Benefits</div>
            <div className="space-y-1.5">
              {candidate.effects.map((effect, index) => {
                const effectParts = formatStaffEffect(effect).split(' ');
                const value = effectParts[0];
                const label = effectParts.slice(1).join(' ');
                return (
                  <div key={index} className="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                    <span className="text-white text-xs font-medium flex items-center gap-1.5">
                      <span>{getEffectIcon(effect.metric)}</span>
                      <span>{label}</span>
                    </span>
                    <span className="text-green-400 font-bold text-sm">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-xs font-medium flex items-center gap-1.5">
              <span>💰</span>
              <span>Monthly Cost</span>
            </span>
            <span className={`font-bold text-sm ${canAfford ? 'text-[var(--game-secondary)]' : 'text-[var(--error)]'}`}>
              ${Math.round(candidate.salary).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRequirementsModal}
        onClose={() => setShowRequirementsModal(false)}
        maxWidth="sm"
      >
        <div className="text-center text-secondary text-sm leading-relaxed space-y-1">
          <h3 className="text-primary font-semibold mb-3">Requirements</h3>
          {requirementDescriptions.map((desc, idx) => (
            <div key={idx}>{desc}</div>
          ))}
        </div>
      </Modal>

      <div className="px-4 pb-4 relative">
        <GameButton
          onClick={handleHire}
          disabled={!requirementsMet || !canAfford}
          color="gold"
          fullWidth
          className="w-full"
        >
          {!canAfford ? 'Need Cash' : requirementsMet ? `Hire ${candidate.name.split(' ')[0]}` : 'Requirements Not Met'}
        </GameButton>
        {requirementDescriptions.length > 0 && !requirementsMet && (
          <button
            onClick={handleRequirementsClick}
            className="absolute top-0 right-4 w-6 h-6 bg-black/70 hover:bg-black/90 text-white rounded-full text-xs font-bold shadow-lg transition-colors flex items-center justify-center z-10 border border-white/20"
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

  return (
    <div
      className={`relative w-full bg-gradient-to-b ${styles.cardGradient} rounded-2xl border-2 ${styles.borderColor} ${styles.borderGlow} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
    >
      {/* Hero Banner with Active Badge */}
      <div className={`h-16 bg-gradient-to-r ${styles.cardGradient} relative overflow-hidden border-b-2 ${styles.borderColor}/50`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between z-10">
          <span className={`text-xs font-bold ${styles.textColor} uppercase tracking-wide`}>
            {member.role}
          </span>
          <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md border border-emerald-300/50">
            ✓ Active
          </span>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="relative -mt-10 flex justify-center mb-3">
        <div className="relative">
          <div className={`absolute inset-0 ${styles.avatarBg} rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity`}></div>
          <div className={`relative w-20 h-20 sm:w-24 sm:h-24 ${styles.avatarBg} rounded-full flex items-center justify-center border-4 ${styles.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-4xl sm:text-5xl leading-none relative z-10">{member.emoji}</span>
          </div>
        </div>
      </div>

      {/* Name Section */}
      <div className="px-4 pb-3 text-center">
        <h4 className="text-white font-bold text-base sm:text-lg mb-2 tracking-tight">
          {member.name}
        </h4>
        <div className={`inline-block px-3 py-1 rounded-full ${styles.badgeBg} border ${styles.borderColor}`}>
          <span className={`${styles.accentText} text-xs font-semibold uppercase`}>
            {member.role}
          </span>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="px-4 pb-3 space-y-2">
        {member.effects.length > 0 && (
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/10">
            <div className="text-white/70 text-[10px] uppercase tracking-wide mb-2 font-semibold">Benefits</div>
            <div className="space-y-1.5">
              {member.effects.map((effect, index) => {
                const effectParts = formatStaffEffect(effect).split(' ');
                const value = effectParts[0];
                const label = effectParts.slice(1).join(' ');
                return (
                  <div key={index} className="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                    <span className="text-white text-xs font-medium flex items-center gap-1.5">
                      <span>{getEffectIcon(effect.metric)}</span>
                      <span>{label}</span>
                    </span>
                    <span className="text-green-400 font-bold text-sm">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-xs font-medium flex items-center gap-1.5">
              <span>💰</span>
              <span>Monthly Cost</span>
            </span>
            <span className="text-[var(--game-secondary)] font-bold text-sm">
              ${Math.round(member.salary).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Fire Button */}
      <div className="px-4 pb-4">
        <GameButton
          onClick={() => onFire(member.id)}
          color="red"
          fullWidth
          className="w-full"
        >
          Fire {member.name.split(' ')[0]}
        </GameButton>
      </div>
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
    fireStaff(staffId);
  };

  return (
    <div className="space-y-6">
      {/* Upgrades Section */}
      <section>
        <SectionHeading>Available Upgrades</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableUpgrades.map((upgrade) => (
            <UpgradeCard key={upgrade.id} upgrade={upgrade} />
          ))}
        </div>
      </section>

      {/* Staff Section */}
      <section className="space-y-6">
        <div className="text-center">
          <SectionHeading>Staff Management</SectionHeading>
          <p className="text-base sm:text-lg text-secondary mb-6 sm:mb-8 text-center px-2">
            Oversee your talented team. Happy staff, happy customers!
          </p>
        </div>

        {/* Current Staff */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-bold text-primary mb-2">Our Staff</h4>
            <p className="text-sm sm:text-base text-secondary">
              Meet the team running your clinic every day.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] px-3 sm:px-4">
            {hiredStaff.map((member) => (
              <HiredStaffCard key={member.id} member={member} onFire={handleFireStaff} />
            ))}
            {hiredStaff.length === 0 && (
              <div className="text-center text-muted text-sm sm:text-base py-10 col-span-full">
                You haven&apos;t hired anyone yet. Pick a candidate below to build your team.
              </div>
            )}
          </div>
        </div>

        {/* Available Staff */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <h4 className="text-xl font-bold text-primary mb-2">Available Staff</h4>
            <p className="text-sm sm:text-base text-secondary">
              Choose who joins your clinic next. Hiring is instant and only adds their salary.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] px-3 sm:px-4">
            {availableStaff.map((candidate) => (
              <StaffCandidateCard
                key={candidate.id}
                candidate={candidate}
                onHire={handleHireStaff}
              />
            ))}
            {availableStaff.length === 0 && (
              <div className="text-center text-muted text-sm sm:text-base py-10 col-span-full">
                All available staff have joined your team. Check back later!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
