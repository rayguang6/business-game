'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import type { Staff } from '@/lib/features/staff';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Modal } from '@/app/components/ui/Modal';
import GameButton from '@/app/components/ui/GameButton';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';

// RPG Tier System Colors: Blue (Common) > Purple (Rare) > Orange (Epic) > Red (Legendary)
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
    // Darker blue for Common tier
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
    // Purple for Rare tier
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
    // Orange for Epic tier
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

// formatEffect moved inside component to use hook

interface StaffCandidateCardProps {
  candidate: Staff;
  onHire: (staff: Staff) => void;
  formatEffect: (effect: { metric: GameMetric; type: EffectType; value: number }) => string;
}

function StaffCandidateCard({ candidate, onHire, formatEffect }: StaffCandidateCardProps) {
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

  // Get icon for effect
  const getEffectIcon = (metric: GameMetric) => {
    switch (metric) {
      case GameMetric.Cash: return '💵';
      case GameMetric.MyTime: return '⏰';
      case GameMetric.ServiceSpeedMultiplier: return '⚡';
      case GameMetric.Exp: return '⭐';
      case GameMetric.ServiceRevenueMultiplier: return '💰';
      case GameMetric.ServiceRevenueFlatBonus: return '💵';
      case GameMetric.MonthlyExpenses: return '💸';
      default: return '✨';
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-gradient-to-b ${styles.cardGradient} rounded-2xl border-2 ${styles.borderColor} ${styles.borderGlow} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
    >
      {/* Hero Banner - Top decorative section */}
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
        <div className={`relative w-20 h-20 sm:w-24 sm:h-24 aspect-square ${styles.avatarBg} rounded-xl border-4 ${styles.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
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
      <div className="px-4 pb-3 text-center">
        <h5 className="text-white font-bold text-base sm:text-lg mb-2 tracking-tight truncate px-2">
          {candidate.name}
        </h5>
        <div className="flex justify-center">
          <div className={`inline-block px-3 py-1 rounded-full ${styles.badgeBg} border ${styles.borderColor}`}>
            <span className={`${styles.accentText} text-xs font-semibold uppercase whitespace-nowrap`}>
              {candidate.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="px-4 pb-3 space-y-1.5 flex-grow">
        {candidate.effects.length > 0 && (
          <div className="space-y-1.5">
            {candidate.effects.map((effect, index) => {
              const effectParts = formatEffect(effect).split(' ');
              const value = effectParts[0];
              const label = effectParts.slice(1).join(' ');
              return (
                <div key={index} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-white text-xs font-medium flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="flex-shrink-0">{getEffectIcon(effect.metric)}</span>
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="text-green-400 font-bold text-sm whitespace-nowrap flex-shrink-0">{value}</span>
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

      {/* Action Button - Using GameButton from design system */}
      <div className="px-4 pb-4 relative mt-auto">
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

export function StaffTab() {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);
  const hiredStaff = useGameStore((state) => state.hiredStaff);
  const availableStaff = useGameStore((state) => state.availableStaff);
  const hireStaff = useGameStore((state) => state.hireStaff);

  const formatEffect = useCallback((effect: { metric: GameMetric; type: EffectType; value: number }) => {
    const getTypeSymbol = (type: EffectType, value: number) => {
      switch (type) {
        case EffectType.Add: return value >= 0 ? `+${value}` : value.toString();
        case EffectType.Percent: return `${value >= 0 ? '+' : ''}${value}%`;
        case EffectType.Multiply: return `×${value}`;
        default: return value.toString();
      }
    };

    const label = getDisplayLabel(effect.metric);
    return `${getTypeSymbol(effect.type, effect.value)} ${label}`;
  }, [getDisplayLabel]);

  const handleHireStaff = (staffToHire: Staff) => {
    hireStaff(staffToHire);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6 text-primary text-center">Staff Management</h3>
        <p className="text-base sm:text-lg text-secondary mb-6 sm:mb-8 text-center px-2">
          Oversee your talented team. Happy staff, happy customers!
        </p>
      </div>

      {/* Current Staff */}
      <section className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <SectionHeading>Our Staff</SectionHeading>
          <p className="text-sm sm:text-base text-secondary">
            Meet the team running your business every day.
          </p>
        </div>
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-stretch gap-4 px-3 sm:px-4">
          {hiredStaff.map((member) => {
            const styles = getRoleStyles(member.role);
            
            // Get icon for effect
            const getEffectIcon = (metric: GameMetric) => {
              switch (metric) {
                case GameMetric.Cash: return '💵';
                case GameMetric.MyTime: return '⏰';
                case GameMetric.ServiceSpeedMultiplier: return '⚡';
                case GameMetric.Exp: return '⭐';
                case GameMetric.ServiceRevenueMultiplier: return '💰';
                case GameMetric.ServiceRevenueFlatBonus: return '💵';
                case GameMetric.MonthlyExpenses: return '💸';
                default: return '✨';
              }
            };
            
            return (
              <div key={member.id} className="w-[180px] flex">
                <div className="w-full">
                  <div
                    className={`relative w-full h-full flex flex-col bg-gradient-to-b ${styles.cardGradient} rounded-2xl border-2 ${styles.borderColor} ${styles.borderGlow} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
                  >
                  {/* Hero Banner */}
                <div className={`h-16 bg-gradient-to-r ${styles.cardGradient} relative overflow-hidden border-b-2 ${styles.borderColor}/50`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-2 left-3 right-3 flex items-center z-10">
                    <span className={`text-xs font-bold ${styles.textColor} uppercase tracking-wide`}>
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="relative -mt-10 flex justify-center mb-3">
                  <div className={`relative w-20 h-20 sm:w-24 sm:h-24 aspect-square ${styles.avatarBg} rounded-xl border-4 ${styles.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
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
                <div className="px-4 pb-3 text-center">
                  <h4 className="text-white font-bold text-base sm:text-lg mb-2 tracking-tight truncate px-2">
                    {member.name}
                  </h4>
                  <div className="flex justify-center">
                    <div className={`inline-block px-3 py-1 rounded-full ${styles.badgeBg} border ${styles.borderColor}`}>
                      <span className={`${styles.accentText} text-xs font-semibold uppercase whitespace-nowrap`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                  {/* Stats Panel */}
                  <div className="px-4 pb-3 space-y-1.5 flex-grow">
                    {member.effects.length > 0 && (
                      <div className="space-y-1.5">
                        {member.effects.map((effect, index) => {
                          const effectParts = formatEffect(effect).split(' ');
                          const value = effectParts[0];
                          const label = effectParts.slice(1).join(' ');
                          return (
                            <div key={index} className="flex items-center justify-between gap-2 min-w-0">
                              <span className="text-white text-xs font-medium flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="flex-shrink-0">{getEffectIcon(effect.metric)}</span>
                                <span className="truncate">{label}</span>
                              </span>
                              <span className="text-green-400 font-bold text-sm whitespace-nowrap flex-shrink-0">{value}</span>
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
                </div>
                </div>
              </div>
            );
          })}
          {hiredStaff.length === 0 && (
            <div className="text-center text-muted text-sm sm:text-base py-10 w-full">
              You haven&apos;t hired anyone yet. Pick a candidate below to build your team.
            </div>
          )}
        </div>
      </section>

      {/* Available Staff */}
      <section className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <SectionHeading>Available Staff</SectionHeading>
          <p className="text-sm sm:text-base text-secondary">
            Choose who joins your business next. Hiring is instant and only adds their salary.
          </p>
        </div>
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-stretch gap-4 px-3 sm:px-4">
          {availableStaff.map((candidate) => (
            <div key={candidate.id} className="w-[200px] flex">
              <div className="w-full">
                <StaffCandidateCard
                  candidate={candidate}
                  onHire={handleHireStaff}
                  formatEffect={formatEffect}
                />
              </div>
            </div>
          ))}
          {availableStaff.length === 0 && (
            <div className="text-center text-muted text-sm sm:text-base py-10 w-full">
              All available staff have joined your team. Check back later!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
