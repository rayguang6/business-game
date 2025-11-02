'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { evaluateCondition } from '@/lib/game/conditionEvaluator';
import { fetchFlagsForIndustry } from '@/lib/data/flagRepository';
import type { GameFlag } from '@/lib/data/flagRepository';
import { useState, useEffect } from 'react';

export function HomeTab() {
  const flags = useGameStore((state) => state.flags);
  const conditions = useGameStore((state) => state.availableConditions);
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  // We don't need hasActiveFlags anymore since we show all flags
  const hasConditions = conditions.length > 0;

  const [allFlags, setAllFlags] = useState<GameFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);

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
