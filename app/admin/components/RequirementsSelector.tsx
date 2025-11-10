'use client';

import { useState } from 'react';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';
import type { Requirement } from '@/lib/game/types';

interface RequirementsSelectorProps {
  flags: GameFlag[];
  conditions: GameCondition[];
  flagsLoading: boolean;
  conditionsLoading: boolean;
  requirements?: Requirement[];
  onRequirementsChange?: (requirements: Requirement[]) => void;
}

export function RequirementsSelector({
  flags,
  conditions,
  flagsLoading,
  conditionsLoading,
  requirements = [],
  onRequirementsChange,
}: RequirementsSelectorProps) {
  const [search, setSearch] = useState<string>('');

  const filteredFlags = (flags || []).filter(
    (flag) =>
      flag.name.toLowerCase().includes(search.toLowerCase()) ||
      (flag.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredConditions = (conditions || []).filter(
    (condition) =>
      condition.name.toLowerCase().includes(search.toLowerCase()) ||
      condition.description.toLowerCase().includes(search.toLowerCase()) ||
      condition.metric.toLowerCase().includes(search.toLowerCase())
  );

  const isRequirementSelected = (cleanId: string, type: 'flag' | 'condition'): boolean => {
    return requirements.some(req => req.id === cleanId && req.type === type);
  };

  const getRequirementExpected = (cleanId: string, type: 'flag' | 'condition'): boolean | undefined => {
    const req = requirements.find(r => r.id === cleanId && r.type === type);
    return req?.expected;
  };

  const handleToggle = (cleanId: string, type: 'flag' | 'condition') => {
    if (!onRequirementsChange) return;

    const existingIndex = requirements.findIndex(req => req.id === cleanId && req.type === type);

    if (existingIndex >= 0) {
      // Remove if already selected
      onRequirementsChange(requirements.filter((_, index) => index !== existingIndex));
    } else {
      // Add with default expected: true (must be met)
      onRequirementsChange([...requirements, { type, id: cleanId, expected: true }]);
    }
  };

  const handleToggleExpected = (cleanId: string, type: 'flag' | 'condition') => {
    if (!onRequirementsChange) return;

    const updated = requirements.map(req => {
      if (req.id === cleanId && req.type === type) {
        // Toggle between true and false
        return { ...req, expected: req.expected === false ? true : false };
      }
      return req;
    });
    onRequirementsChange(updated);
  };

  // All IDs are clean (no prefixes) - use directly

  return (
    <div className="space-y-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      {/* Search Filter */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search flags and conditions..."
          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {flagsLoading || conditionsLoading ? (
        <div className="text-sm text-slate-400 py-4">Loading requirements...</div>
      ) : (
        <>
          {/* Flags Section */}
          {filteredFlags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>🏁</span> Flags{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredFlags.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredFlags.map((flag) => {
                    // Use flag ID directly (no prefix handling)
                    const isSelected = isRequirementSelected(flag.id, 'flag');
                    const expected = getRequirementExpected(flag.id, 'flag');

                    return (
                      <div
                        key={flag.id}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(flag.id, 'flag')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{flag.name}</span>
                          {flag.description && (
                            <span
                              className="text-xs text-slate-400 truncate max-[150px]"
                              title={flag.description}
                            >
                              {flag.description}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <span className="text-xs text-slate-400">Must be:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleExpected(flag.id, 'flag')}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                expected === false
                                  ? 'bg-red-500/20 border-red-500 text-red-200'
                                  : 'bg-green-500/20 border-green-500 text-green-200'
                              }`}
                            >
                              {expected === false ? 'NO' : 'YES'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Conditions Section */}
          {filteredConditions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>📊</span> Conditions{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredConditions.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredConditions.map((condition) => {
                    // Use condition ID directly (no prefix handling)
                    const isSelected = isRequirementSelected(condition.id, 'condition');
                    const expected = getRequirementExpected(condition.id, 'condition');

                    return (
                      <div
                        key={condition.id}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500 text-blue-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(condition.id, 'condition')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{condition.name}</span>
                          <span className="text-xs text-slate-400">
                            ({condition.metric}{' '}
                            {condition.operator === 'greater'
                              ? '&gt;'
                              : condition.operator === 'less'
                                ? '&lt;'
                                : condition.operator === 'equals'
                                  ? '='
                                  : condition.operator === 'greater_equal'
                                    ? '&gt;='
                                    : '&lt;='}{' '}
                            {condition.value})
                          </span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <span className="text-xs text-slate-400">Must be:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleExpected(condition.id, 'condition')}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                expected === false
                                  ? 'bg-red-500/20 border-red-500 text-red-200'
                                  : 'bg-green-500/20 border-green-500 text-green-200'
                              }`}
                            >
                              {expected === false ? 'NO' : 'YES'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(() => {
            if ((flags || []).length === 0 && (conditions || []).length === 0) {
              return (
                <div className="text-sm text-slate-400 py-4 text-center">
                  No flags or conditions available. Create some first!
                </div>
              );
            }

            if (filteredFlags.length === 0 && filteredConditions.length === 0 && search) {
              return (
                <div className="text-sm text-slate-400 py-4 text-center">
                  No results found for &quot;{search}&quot;
                </div>
              );
            }

            return null;
          })()}

          {/* Selected Summary */}
          {requirements.length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-400">Selected: {requirements.length}</span>
                <button
                  type="button"
                  onClick={() => onRequirementsChange && onRequirementsChange([])}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

