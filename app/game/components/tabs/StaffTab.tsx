'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import type { Staff } from '@/lib/features/staff';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { useRequirements } from '@/lib/hooks/useRequirements';

const ROLE_STYLE_MAP: Record<
  string,
  {
    card: string;
    avatarBg: string;
    textColor: string;
    accentText: string;
    badgeBg: string;
  }
> = {
  Assistant: {
    card: 'from-indigo-900 to-indigo-700 border-indigo-500',
    avatarBg: 'bg-indigo-500',
    textColor: 'text-indigo-200',
    accentText: 'text-indigo-300',
    badgeBg: 'bg-indigo-400/20',
  },
  Technician: {
    card: 'from-amber-900 to-amber-700 border-amber-500',
    avatarBg: 'bg-amber-500',
    textColor: 'text-amber-200',
    accentText: 'text-amber-300',
    badgeBg: 'bg-amber-400/20',
  },
  Specialist: {
    card: 'from-purple-900 to-purple-700 border-purple-500',
    avatarBg: 'bg-purple-500',
    textColor: 'text-purple-200',
    accentText: 'text-purple-300',
    badgeBg: 'bg-purple-400/20',
  },
};

const FALLBACK_STYLE = {
  card: 'from-slate-900 to-slate-700 border-slate-600',
  avatarBg: 'bg-slate-500',
  textColor: 'text-slate-200',
  accentText: 'text-slate-300',
  badgeBg: 'bg-slate-400/20',
};

const getRoleStyles = (role: string) => ROLE_STYLE_MAP[role] ?? FALLBACK_STYLE;

// Format effect for display
const formatEffect = (effect: { metric: GameMetric; type: EffectType; value: number }) => {
  const getMetricLabel = (metric: GameMetric) => {
    switch (metric) {
      case GameMetric.ServiceSpeedMultiplier: return 'Service Speed';
      case GameMetric.FounderWorkingHours: return 'Founder Workload';
      case GameMetric.MonthlyExpenses: return 'Monthly Expenses';
      case GameMetric.ReputationMultiplier: return 'Reputation';
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

interface StaffCandidateCardProps {
  candidate: Staff;
  onHire: (staff: Staff) => void;
}

function StaffCandidateCard({ candidate, onHire }: StaffCandidateCardProps) {
  const { areMet: requirementsMet, descriptions: requirementDescriptions } = useRequirements(candidate.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const styles = getRoleStyles(candidate.role);

  const handleHire = () => {
    if (requirementsMet) {
      onHire(candidate);
    }
  };

  const handleRequirementsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  };

  return (
    <div
      className={`relative w-full bg-slate-900/80 rounded-2xl border border-slate-700 px-3 py-4 sm:px-4 sm:py-5 shadow-lg flex flex-col items-center text-center gap-3 overflow-hidden ${styles.badgeBg}`}
    >
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 ${styles.avatarBg} rounded-full flex items-center justify-center border-[4px] border-white/15 shadow-inner`}
      >
        <span className="text-2xl sm:text-3xl leading-none">{candidate.emoji}</span>
      </div>

      <div className="space-y-1 w-full">
        <h5 className="text-white font-semibold text-xs sm:text-sm tracking-tight truncate w-full">
          {candidate.name}
        </h5>
        <p className={`${styles.accentText} text-[11px] sm:text-xs font-medium truncate`}>
          {candidate.role}
        </p>
      </div>

      <div className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2.5">
        <span className="block text-[9px] sm:text-[11px] text-white/60 uppercase tracking-[0.22em] mb-1">
          Salary
        </span>
        <span className="text-white text-xs sm:text-sm font-semibold break-words">
          ${Math.round(candidate.salary).toLocaleString()}/m
        </span>
      </div>


      {/* Requirements Modal */}
      {showRequirementsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRequirementsModal(false)}
        >
          <div
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-slate-300 text-sm leading-relaxed space-y-1">
              {requirementDescriptions.map((desc, idx) => (
                <div key={idx}>{desc}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff Effects */}
      {candidate.effects.length > 0 && (
        <div className="w-full bg-black/20 border border-white/10 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2">
          <span className="block text-[9px] sm:text-[11px] text-white/60 uppercase tracking-[0.22em] mb-1">
            Effects
          </span>
          <div className="space-y-0.5">
            {candidate.effects.map((effect, index) => (
              <div key={index} className="text-[9px] sm:text-[10px] text-green-300 font-medium leading-tight">
                {formatEffect(effect)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={handleHire}
          disabled={!requirementsMet}
          className={`w-full font-semibold text-[11px] sm:text-xs py-2 rounded-xl transition-colors duration-200 shadow-md ${
            requirementsMet
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {requirementsMet ? `Hire ${candidate.name}` : 'Requirements Not Met'}
        </button>
        {requirementDescriptions.length > 0 && !requirementsMet && (
          <button
            onClick={handleRequirementsClick}
            className="absolute -top-1 -right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-bold shadow-md transition-colors flex items-center justify-center z-10"
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
  const hiredStaff = useGameStore((state) => state.hiredStaff);
  const availableStaff = useGameStore((state) => state.availableStaff);
  const hireStaff = useGameStore((state) => state.hireStaff);

  const handleHireStaff = (staffToHire: Staff) => {
    hireStaff(staffToHire);
  };

  return (
    <div className="relative">
      <h3 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6 text-white text-center">Staff Management</h3>
      <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 text-center px-2">
        Oversee your talented team. Happy staff, happy customers!
      </p>

      {/* Current Staff */}
      <section className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h4 className="text-lg sm:text-xl font-bold text-white">Our Staff</h4>
          <p className="text-sm sm:text-base text-gray-400">
            Meet the team running your clinic every day.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid gap-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] px-3 sm:px-4">
          {hiredStaff.map((member) => {
            const styles = getRoleStyles(member.role);
            return (
              <div
                key={member.id}
                className={`relative w-full bg-gradient-to-b ${styles.card} rounded-2xl border px-3 py-4 sm:px-4 sm:py-5 shadow-lg flex flex-col items-center text-center gap-3 overflow-hidden`}
              >
                <div className="absolute top-2 right-2">
                  <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shadow-sm tracking-wide">
                    Active
                  </span>
                </div>

                <div className="flex flex-col items-center text-center gap-3 w-full">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 ${styles.avatarBg} rounded-full flex items-center justify-center border-[4px] border-white/20 shadow-inner`}
                  >
                    <span className="text-2xl sm:text-3xl leading-none">{member.emoji}</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-white font-semibold text-xs sm:text-sm tracking-tight truncate w-full">
                      {member.name}
                    </h4>
                    <p className={`${styles.textColor} text-[11px] sm:text-xs font-medium truncate`}>
                      {member.role}
                    </p>
                  </div>

                  <div className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2.5">
                    <span className="block text-[9px] sm:text-[11px] text-white/70 uppercase tracking-[0.22em] mb-1">
                      Salary
                    </span>
                    <span className="text-white text-xs sm:text-sm font-semibold break-words">
                      ${Math.round(member.salary).toLocaleString()}/month
                    </span>
                  </div>

                  {/* Staff Effects */}
                  {member.effects.length > 0 && (
                    <div className="w-full bg-black/20 border border-white/10 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2">
                      <span className="block text-[9px] sm:text-[11px] text-white/70 uppercase tracking-[0.22em] mb-1">
                        Effects
                      </span>
                      <div className="space-y-0.5">
                        {member.effects.map((effect, index) => (
                          <div key={index} className="text-[9px] sm:text-[10px] text-green-300 font-medium leading-tight">
                            {formatEffect(effect)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {hiredStaff.length === 0 && (
            <div className="text-center text-gray-400 text-sm sm:text-base py-10">
              You haven&apos;t hired anyone yet. Pick a candidate below to build your team.
            </div>
          )}
        </div>
      </section>

      {/* Available Staff */}
      <section className="mt-10 space-y-4 sm:space-y-6">
        <div className="text-center">
          <h4 className="text-lg sm:text-xl font-bold text-white">Available Staff</h4>
          <p className="text-sm sm:text-base text-gray-400">
            Choose who joins your clinic next. Hiring is instant and only adds their salary.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid gap-4 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] px-3 sm:px-4">
          {availableStaff.map((candidate) => (
            <StaffCandidateCard
              key={candidate.id}
              candidate={candidate}
              onHire={handleHireStaff}
            />
          ))}
          {availableStaff.length === 0 && (
            <div className="text-center text-gray-400 text-sm sm:text-base py-10">
              All available staff have joined your team. Check back later!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
