'use client';

import { useState } from 'react';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';

interface RequirementsSelectorProps {
  flags: GameFlag[];
  conditions: GameCondition[];
  flagsLoading: boolean;
  conditionsLoading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function RequirementsSelector({
  flags,
  conditions,
  flagsLoading,
  conditionsLoading,
  selectedIds,
  onSelectionChange,
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

  const handleToggle = (prefixedId: string) => {
    const currentIds = selectedIds || [];
    if (currentIds.includes(prefixedId)) {
      onSelectionChange(currentIds.filter((id) => id !== prefixedId));
    } else {
      onSelectionChange([...currentIds, prefixedId]);
    }
  };

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
                    const cleanId = flag.id.startsWith('flag_') ? flag.id.substring(5) : flag.id;
                    const prefixedId = `flag_${cleanId}`;
                    const isSelected = selectedIds.includes(prefixedId);
                    return (
                      <label
                        key={flag.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggle(prefixedId)}
                          className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm flex-1">{flag.name}</span>
                        {flag.description && (
                          <span
                            className="text-xs text-slate-400 truncate max-w-[200px]"
                            title={flag.description}
                          >
                            {flag.description}
                          </span>
                        )}
                      </label>
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
                    const cleanId = condition.id.startsWith('condition_')
                      ? condition.id.substring(10)
                      : condition.id;
                    const prefixedId = `condition_${cleanId}`;
                    const isSelected = selectedIds.includes(prefixedId);
                    return (
                      <label
                        key={condition.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500 text-blue-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggle(prefixedId)}
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
                      </label>
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
          {selectedIds.length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-400">Selected: {selectedIds.length}</span>
                <button
                  type="button"
                  onClick={() => onSelectionChange([])}
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

