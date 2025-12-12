'use client';

import React, { useMemo, useState, useCallback } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { Staff } from '@/lib/features/staff';
import type { IndustryId } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { getMetricIcon, getMetricEmojiIcon } from '@/lib/game/metrics/registry';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { calculateSeveranceCost, SEVERANCE_MULTIPLIER } from '@/lib/features/staff';
import { Modal } from '@/app/components/ui/Modal';

// Simplified card design - no complex styling needed

interface HiredStaffCardProps {
  member: Staff;
  onFire: (staffId: string) => void;
}

export function HiredStaffCard({ member, onFire }: HiredStaffCardProps) {
  const { selectedIndustry } = useGameStore();
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);
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

  const formatStaffEffect = useCallback((effect: { metric: GameMetric; type: EffectType; value: number }) => {
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

  return (
    <div className="w-full flex flex-col justify-between bg-slate-800 rounded-lg border border-slate-600 hover:bg-slate-750 transition-colors">
      {/* Top Content Section */}
      <div className="space-y-0.5">
        {/* Header with Role */}
        <div className="px-3 md:px-4 py-2 bg-slate-700 border-b border-slate-600 flex items-center justify-center h-10 md:h-12">
          <span className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide leading-tight line-clamp-2">
            {member.role}
          </span>
        </div>

        {/* Avatar Section */}
        <div className="flex justify-center py-2">
          <div className="relative w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-slate-600 rounded border border-slate-500 overflow-hidden">
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

        {/* Name */}
        <div className="px-3 md:px-4 pb-1 text-center">
          <h4 className="text-white font-bold text-xs md:text-sm truncate">
            {member.name}
          </h4>
        </div>

        {/* Stats Panel */}
        <div className="px-3 md:px-4 pb-1 space-y-0.5">
          <div className="space-y-0.5">
            {Array.from({ length: 2 }, (_, index) => {
              const effect = member.effects[index];
              if (effect) {
                const formattedEffect = formatStaffEffect(effect);
                return (
                  <div key={index} className="flex items-center gap-1 min-w-0">
                    <span className="text-slate-300 text-[10px] flex items-center gap-0.5 min-w-0 flex-1">
                      {getMetricIcon(effect.metric) ? (
                        <img
                          src={getMetricIcon(effect.metric)!}
                          alt=""
                          className="w-4 h-4 flex-shrink-0"
                        />
                      ) : (
                        <span className="text-[10px] flex-shrink-0">{getMetricEmojiIcon(effect.metric)}</span>
                      )}
                      <span>{formattedEffect}</span>
                    </span>
                  </div>
                );
              } else {
                // Empty effect line for consistent height
                return (
                  <div key={index} className="flex items-center gap-1 min-w-0 opacity-0">
                    <span className="text-slate-300 text-[10px] flex items-center gap-0.5 min-w-0 flex-1">
                      <span className="text-[10px] flex-shrink-0">📊</span>
                      <span className="truncate">Placeholder +0</span>
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Salary and Button */}
      <div className="px-3 md:px-4 pb-3 space-y-1">
        {/* Salary - Bottom aligned */}
        <div className="text-center">
          <div className="text-xs font-bold text-green-400">
            ${Math.round(member.salary).toLocaleString()}/m
          </div>
        </div>

        {/* Fire Button */}
        <GameButton
          onClick={handleFireClick}
          color="red"
          fullWidth
          size="sm"
          className="w-full text-xs py-1.5"
          disabled={!canAffordSeverance}
        >
          Fire
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