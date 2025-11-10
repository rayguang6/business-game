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
import { Card } from '@/app/components/ui/Card';
import { SectionHeading } from '@/app/components/ui/SectionHeading';

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
        <SectionHeading>Game Status</SectionHeading>
        <Card>
          <p className="text-sm sm:text-base text-secondary">
            Welcome to your business! Manage your operations, staff, and upgrades to grow your empire.
          </p>
        </Card>
      </section>

      {availableFlags.length > 0 && (
        <section>
          <SectionHeading>Flags 🏁</SectionHeading>
          <Card>
            <div className="space-y-3">
              {availableFlags.map((flag) => {
                const isActive = flags[flag.id] === true;
                return (
                  <div key={flag.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                    <span className={isActive ? 'text-[var(--success)] text-xl' : 'text-gray-500 text-xl'}>
                      {isActive ? '✓' : '✗'}
                    </span>
                    <span className="text-secondary text-sm sm:text-base">
                      <span className="font-semibold text-primary">{flag.name}</span>
                      <span className="text-muted ml-2 font-mono text-xs">({flag.id})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {hasConditions && (
        <section>
          <SectionHeading>Conditions 📊</SectionHeading>
          <Card>
            <div className="space-y-3">
              {conditions.map((condition) => {
                const isMet = evaluateCondition(condition, useGameStore.getState());
                return (
                  <div key={condition.id} className={`flex items-center gap-3 p-2 rounded-lg border ${
                    isMet 
                      ? 'bg-[var(--success)]/10 border-[var(--success)]/30' 
                      : 'bg-[var(--error)]/10 border-[var(--error)]/30'
                  }`}>
                    <span className={isMet ? 'text-[var(--success)] text-xl' : 'text-[var(--error)] text-xl'}>
                      {isMet ? '✓' : '✗'}
                    </span>
                    <span className="text-secondary text-sm sm:text-base flex-1">
                      <span className="font-semibold text-primary">{condition.name}</span>
                      <span className="text-muted ml-2 text-xs">
                        ({condition.metric} {getOperatorSymbol(condition.operator)} {condition.value})
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {services.length > 0 && (
        <section>
          <SectionHeading>Services 💼</SectionHeading>
          <div className="space-y-3">
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
    <Card
      variant={requirementsMet ? "success" : "default"}
      interactive
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={requirementsMet ? 'text-[var(--success)] text-xl' : 'text-gray-500 text-xl'}>
              {requirementsMet ? '✓' : '✗'}
            </span>
            <span className={`font-semibold text-sm sm:text-base ${requirementsMet ? 'text-primary' : 'text-tertiary'}`}>
              {service.name}
            </span>
            {!requirementsMet && service.requirements && service.requirements.length > 0 && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="w-5 h-5 bg-[var(--bg-tertiary)] hover:bg-[var(--game-primary)] text-white rounded-full text-xs font-bold shadow-md transition-colors flex items-center justify-center min-w-[20px] min-h-[20px]"
                  title="Click to see requirements"
                >
                  ?
                </button>
                {showTooltip && (
                  <div className="absolute z-10 left-0 top-7 w-64 card border-[var(--game-primary)]">
                    <div className="text-xs font-semibold text-primary mb-2">Requirements:</div>
                    <div className="text-xs text-secondary space-y-1">
                      {requirementDescriptions.map((desc, idx) => (
                        <div key={idx}>• {desc}</div>
                      ))}
                    </div>
                    <div className="text-xs text-muted mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      Hire staff or purchase upgrades to meet requirements.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-tertiary">
            <span>⏱️ {service.duration}s</span>
            <div className="flex items-center gap-1">
              <span className="text-[var(--success)] font-semibold">${service.effectivePrice.toFixed(2)}</span>
              {service.price !== service.effectivePrice && (
                <span className="text-muted line-through">${service.price.toFixed(2)}</span>
              )}
            </div>
            {service.pricingCategory && (
              <span className="capitalize text-[var(--game-primary)]">
                {service.pricingCategory} tier
              </span>
            )}
            <span className="text-[var(--info)]">
              Weight: {service.effectiveWeightage.toFixed(1)} ({service.selectionProbability}%)
            </span>
          </div>
        </div>
        <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 border ${
          requirementsMet 
            ? 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30' 
            : 'bg-[var(--bg-tertiary)] text-tertiary border-[var(--border-primary)]'
        }`}>
          {requirementsMet ? 'Available' : 'Locked'}
        </div>
      </div>
    </Card>
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
