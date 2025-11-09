'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { evaluateCondition } from '@/lib/game/conditionEvaluator';
import { useRequirements } from '@/lib/hooks/useRequirements';
import { effectManager } from '@/lib/game/effectManager';
import { buildEffectiveServices, type EffectiveService } from '@/lib/features/services';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { useConfigStore, selectServicesForIndustry } from '@/lib/store/configStore';

export function HomeTab() {
  const flags = useGameStore((state) => state.flags);
  const availableFlags = useGameStore((state) => state.availableFlags);
  const conditions = useGameStore((state) => state.availableConditions);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const hasConditions = conditions.length > 0;
  const industryId = useMemo(
    () => (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId,
    [selectedIndustry],
  );
  const servicesSelector = useMemo(
    () => selectServicesForIndustry(industryId),
    [industryId],
  );
  const baseServices = useConfigStore(servicesSelector);
  const [services, setServices] = useState<EffectiveService[]>([]);

  // Load all services with effective values
  useEffect(() => {
    const loadServices = () => {
      const effectiveServices = buildEffectiveServices(baseServices);
      setServices(effectiveServices);
    };

    loadServices();

    // Subscribe to effect manager changes to update services when tier multipliers change
    const unsubscribe = effectManager.subscribe(loadServices);

    return unsubscribe;
  }, [baseServices]);

  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-md font-semibold text-white mb-3">Game Status</h4>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-300">
            Welcome to your business! Manage your operations, staff, and upgrades to grow your empire.
          </p>
        </div>
      </section>

      {availableFlags.length > 0 && (
        <section>
          <h4 className="text-md font-semibold text-white mb-3">Flags 🏁</h4>
          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            {availableFlags.map((flag) => {
              const isActive = flags[flag.id] === true;
              return (
                <div key={flag.id} className="flex items-center gap-2">
                  <span className={isActive ? 'text-green-400 text-lg' : 'text-gray-500 text-lg'}>
                    {isActive ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-200 text-sm">
                    <span className="font-semibold">{flag.name}</span>
                    <span className="text-slate-400 ml-2 font-mono">({flag.id})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasConditions && (
        <section>
          <h4 className="text-md font-semibold text-white mb-3">Conditions 📊</h4>
          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            {conditions.map((condition) => {
              const isMet = evaluateCondition(condition, useGameStore.getState());
              return (
                <div key={condition.id} className="flex items-center gap-2">
                  <span className={isMet ? 'text-green-400 text-lg' : 'text-red-400 text-lg'}>
                    {isMet ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-200 text-sm">
                    <span className="font-semibold">{condition.name}</span>
                    <span className="text-slate-400 ml-2">
                      ({condition.metric} {getOperatorSymbol(condition.operator)} {condition.value})
                    </span>
                </span>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section>
          <h4 className="text-md font-semibold text-white mb-3">Services 💼</h4>
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: EffectiveService }) {
  const { areMet: requirementsMet, descriptions: requirementDescriptions } = useRequirements(service.requirements);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`border rounded-lg p-3 transition ${
        requirementsMet 
          ? 'border-green-500/60 bg-green-500/5' 
          : 'border-gray-700 bg-gray-900/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={requirementsMet ? 'text-green-400 text-lg' : 'text-gray-500 text-lg'}>
              {requirementsMet ? '✓' : '✗'}
            </span>
            <span className={`font-semibold text-sm ${requirementsMet ? 'text-slate-200' : 'text-slate-400'}`}>
              {service.name}
            </span>
            {!requirementsMet && service.requirements && service.requirements.length > 0 && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="w-4 h-4 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-bold shadow-md transition-colors flex items-center justify-center"
                  title="Click to see requirements"
                >
                  ?
                </button>
                {showTooltip && (
                  <div className="absolute z-10 left-0 top-6 w-64 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
                    <div className="text-xs font-semibold text-slate-300 mb-2">Requirements:</div>
                    <div className="text-xs text-slate-400 space-y-1">
                      {requirementDescriptions.map((desc, idx) => (
                        <div key={idx}>• {desc}</div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                      Hire staff or purchase upgrades to meet requirements.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Duration: {service.duration}s</span>
            <div className="flex items-center gap-1">
              <span className="text-green-400 font-semibold">${service.effectivePrice.toFixed(2)}</span>
              {service.price !== service.effectivePrice && (
                <span className="text-slate-500 line-through">${service.price.toFixed(2)}</span>
              )}
            </div>
            {service.pricingCategory && (
              <span className="capitalize text-purple-400">
                {service.pricingCategory} end
              </span>
            )}
            <span className="text-blue-400">
              Weight: {service.effectiveWeightage.toFixed(1)} ({service.selectionProbability}%)
            </span>
          </div>
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded ${
          requirementsMet 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-gray-700/50 text-gray-400'
        }`}>
          {requirementsMet ? 'Available' : 'Locked'}
        </div>
      </div>
    </div>
  );
}

function getOperatorSymbol(operator: string): string {
  switch (operator) {
    case 'greater': return '>';
    case 'less': return '<';
    case 'equals': return '=';
    case 'greater_equal': return '≥';
    case 'less_equal': return '≤';
    default: return operator;
  }
}
