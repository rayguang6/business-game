'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { evaluateCondition } from '@/lib/game/conditionEvaluator';
import { fetchFlagsForIndustry } from '@/lib/data/flagRepository';
import type { GameFlag } from '@/lib/data/flagRepository';
import { fetchServicesForIndustry } from '@/lib/data/serviceRepository';
import type { IndustryServiceDefinition } from '@/lib/game/types';
import { useState, useEffect } from 'react';
import { useRequirements } from '@/lib/hooks/useRequirements';

export function HomeTab() {
  const flags = useGameStore((state) => state.flags);
  const conditions = useGameStore((state) => state.availableConditions);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  // We don't need hasActiveFlags anymore since we show all flags
  const hasConditions = conditions.length > 0;

  const [allFlags, setAllFlags] = useState<GameFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [services, setServices] = useState<IndustryServiceDefinition[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Load all available flags
  useEffect(() => {
    if (!selectedIndustry) return;

    const loadFlags = async () => {
      setFlagsLoading(true);
      try {
        const result = await fetchFlagsForIndustry(selectedIndustry.id);
        if (result) {
          setAllFlags(result);
        }
      } catch (error) {
        console.error('Failed to load flags:', error);
      } finally {
        setFlagsLoading(false);
      }
    };

    loadFlags();
  }, [selectedIndustry]);

  // Load all services
  useEffect(() => {
    if (!selectedIndustry) return;

    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const result = await fetchServicesForIndustry(selectedIndustry.id);
        if (result) {
          setServices(result);
        }
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, [selectedIndustry]);

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

      {allFlags.length > 0 && (
        <section>
          <h4 className="text-md font-semibold text-white mb-3">Flags 🏁</h4>
          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            {flagsLoading ? (
              <div className="text-sm text-slate-400">Loading flags…</div>
            ) : (
              allFlags.map((flag) => {
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
              })
            )}
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
            {servicesLoading ? (
              <div className="text-sm text-slate-400">Loading services…</div>
            ) : (
              services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: IndustryServiceDefinition }) {
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
            <span className="text-green-400 font-semibold">${service.price.toFixed(2)}</span>
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
