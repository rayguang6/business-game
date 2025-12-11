'use client';

import React, { useMemo, useState, useCallback } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { Staff } from '@/lib/features/staff';
import type { IndustryId } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { getMetricIcon, getMetricEmojiIcon } from '@/lib/game/metrics/registry';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { Modal } from '@/app/components/ui/Modal';

// Simplified card design - no complex styling needed

interface StaffCandidateCardProps {
  candidate: Staff;
  onHire: (staff: Staff) => void;
}

export function StaffCandidateCard({ candidate, onHire }: StaffCandidateCardProps) {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getDisplayLabel } = useMetricDisplayConfigs(industryId);
  const { availability, descriptions: requirementDescriptions } = useRequirements(candidate.requirements);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const metrics = useGameStore((state) => state.metrics);
  const canAfford = useMemo(() => metrics.cash >= candidate.salary, [metrics.cash, candidate.salary]);

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

  const handleHire = useCallback(() => {
    if (availability === 'available' && canAfford) {
      onHire(candidate);
    }
  }, [availability, canAfford, onHire, candidate]);

  const handleRequirementsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRequirementsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequirementsModal(false);
  }, []);

  // Hide card if requirements are not met and should be hidden
  if (availability === 'hidden') {
    return null;
  }

  return (
    <div className="w-full flex flex-col justify-between bg-slate-800 rounded-lg border border-slate-600 hover:bg-slate-750 transition-colors">
      {/* Top Content Section */}
      <div className="space-y-0.5">
        {/* Header with Role */}
        <div className="px-3 md:px-4 py-2 bg-slate-700 border-b border-slate-600 flex items-center justify-between h-10 md:h-12">
          <span className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide leading-tight line-clamp-2">
            {candidate.role}
          </span>
          {availability === 'locked' && (
            <span className="text-slate-400 text-xs md:text-sm">🔒</span>
          )}
        </div>

        {/* Avatar Section */}
        <div className="flex justify-center py-2">
          <div className="relative w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-slate-600 rounded border border-slate-500 overflow-hidden">
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

      {/* Name */}
        <div className="px-3 md:px-4 pb-1 text-center">
          <h5 className="text-white font-bold text-xs md:text-sm truncate">
            {candidate.name}
          </h5>
        </div>

        {/* Stats Panel */}
        <div className="px-3 md:px-4 pb-1 space-y-0.5">
          <div className="space-y-0.5">
            {Array.from({ length: 2 }, (_, index) => {
              const effect = candidate.effects[index];
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
                      <span className="truncate">{formattedEffect}</span>
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
          <div className={`text-xs font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
            ${Math.round(candidate.salary).toLocaleString()}/m
          </div>
        </div>

        {/* Hire Button */}
        <div className="relative">
          <GameButton
            onClick={handleHire}
            disabled={availability === 'locked' || !canAfford}
            color={availability === 'available' && canAfford ? "purple" : "gray"}
            fullWidth
            size="sm"
            className="w-full text-xs py-1.5"
          >
            {!canAfford ? 'Need Cash' : availability === 'available' ? `Hire` : 'Locked'}
          </GameButton>
          {requirementDescriptions.length > 0 && availability === 'locked' && (
            <button
              onClick={handleRequirementsClick}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-slate-600 hover:bg-slate-500 text-white rounded-full text-micro font-bold shadow-md transition-colors flex items-center justify-center z-10"
              title="Click to see requirements"
            >
              ?
            </button>
          )}
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
      </div>
    </div>
  );
}