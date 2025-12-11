'use client';

import React, { useMemo, useState, useCallback } from 'react';
import GameButton from '@/app/components/ui/GameButton';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { Staff } from '@/lib/features/staff';
import type { IndustryId } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { getMetricIcon } from '@/lib/game/metrics/registry';
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
    <div className="relative w-full h-full flex flex-col bg-slate-800 rounded-lg border border-slate-600 hover:bg-slate-750 transition-colors overflow-hidden">
      {/* Header with Role */}
      <div className="px-2 py-1 bg-slate-700 border-b border-slate-600 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          {candidate.role}
        </span>
        {availability === 'locked' && (
          <span className="text-slate-400 text-xs">🔒</span>
        )}
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center py-2">
        <div className="relative w-8 h-8 bg-slate-600 rounded border border-slate-500 overflow-hidden">
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
      <div className="px-2 pb-1 text-center">
        <h5 className="text-white font-bold text-xs truncate">
          {candidate.name}
        </h5>
      </div>

      {/* Stats Panel */}
      <div className="px-2 pb-2 space-y-0.5 flex-grow">
        {candidate.effects.length > 0 && (
          <div className="space-y-0.5">
            {candidate.effects.slice(0, 2).map((effect, index) => {
              const effectParts = formatStaffEffect(effect).split(' ');
              const value = effectParts[0];
              const label = effectParts.slice(1).join(' ');
              return (
                <div key={index} className="flex items-center justify-between gap-1 min-w-0">
                  <span className="text-slate-300 text-xs flex items-center gap-0.5 min-w-0 flex-1">
                    <span className="text-xs flex-shrink-0">{getMetricIcon(effect.metric)}</span>
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="text-green-400 font-bold text-xs whitespace-nowrap flex-shrink-0">{value}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-1 border-t border-slate-600 mt-auto">
          <div className={`text-xs font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
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

      <div className="px-2 pb-2 relative">
        <GameButton
          onClick={handleHire}
          disabled={availability === 'locked' || !canAfford}
          color="gold"
          fullWidth
          size="sm"
          className="w-full text-xs py-1"
        >
          {!canAfford ? 'Need Cash' : availability === 'available' ? `Hire` : 'Locked'}
        </GameButton>
        {requirementDescriptions.length > 0 && availability === 'locked' && (
          <button
            onClick={handleRequirementsClick}
            className="absolute top-1 right-1 w-4 h-4 bg-slate-600 hover:bg-slate-500 text-white rounded-full text-xs font-bold transition-colors flex items-center justify-center"
            title="Click to see requirements"
          >
            ?
          </button>
        )}
      </div>
    </div>
  );
}