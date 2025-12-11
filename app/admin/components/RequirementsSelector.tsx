'use client';

import { useState } from 'react';
import type { Requirement } from '@/lib/game/types';
import { getMetricDefinition } from '@/lib/game/metrics/registry';
import { GameMetric } from '@/lib/game/effectManager';
import { NumberInput } from './NumberInput';
import { useFlags } from '../hooks/useFlags';
import { useUpgrades } from '../hooks/useUpgrades';
import { useRoles } from '../hooks/useRoles';
import { useMarketing } from '../hooks/useMarketing';
import { useConditions } from '../hooks/useConditions';

interface RequirementsSelectorProps {
  industryId: string;
  requirements?: Requirement[];
  onRequirementsChange?: (requirements: Requirement[]) => void;
}

const METRIC_OPTIONS = [
  { id: 'cash', name: getMetricDefinition(GameMetric.Cash).displayLabel },
  { id: 'exp', name: getMetricDefinition(GameMetric.Exp).displayLabel },
  { id: 'level', name: 'Level' },
  { id: 'expenses', name: getMetricDefinition(GameMetric.MonthlyExpenses).displayLabel },
  { id: 'gameTime', name: 'Game Time' },
] as const;

const OPERATOR_OPTIONS = [
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '==', label: '==' },
] as const;

export function RequirementsSelector({
  industryId,
  requirements = [],
  onRequirementsChange,
}: RequirementsSelectorProps) {
  // Fetch all required data internally
  const flags = useFlags(industryId);
  const upgrades = useUpgrades(industryId);
  const roles = useRoles(industryId);
  const marketing = useMarketing(industryId);
  const conditionsData = useConditions(industryId);

  const flagsData = flags.flags;
  const upgradesData = upgrades.upgrades;
  const staffRoles = roles.roles;
  const marketingCampaigns = marketing.campaigns;
  const conditionsList = conditionsData.conditions;
  const flagsLoading = flags.loading;
  const [search, setSearch] = useState<string>('');
  const [editingRequirement, setEditingRequirement] = useState<string | null>(null);

  const filteredFlags = (flagsData || []).filter(
    (flag) =>
      flag.name.toLowerCase().includes(search.toLowerCase()) ||
      (flag.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredUpgrades = (upgradesData || []).filter(
    (upgrade) =>
      upgrade.name.toLowerCase().includes(search.toLowerCase()) ||
      upgrade.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStaffRoles = (staffRoles || []).filter(
    (role) =>
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMarketingCampaigns = (marketingCampaigns || []).filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredConditions = (conditionsList || []).filter(
    (condition) =>
      condition.name.toLowerCase().includes(search.toLowerCase()) ||
      condition.id.toLowerCase().includes(search.toLowerCase()) ||
      (condition.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredMetrics = METRIC_OPTIONS.filter(
    (metric) =>
      metric.name.toLowerCase().includes(search.toLowerCase()) ||
      metric.id.toLowerCase().includes(search.toLowerCase())
  );

  const isRequirementSelected = (cleanId: string, type: Requirement['type']): boolean => {
    return requirements.some(req => req.id === cleanId && req.type === type);
  };

  const getRequirement = (cleanId: string, type: Requirement['type']): Requirement | undefined => {
    return requirements.find(r => r.id === cleanId && r.type === type);
  };

  const handleToggle = (cleanId: string, type: Requirement['type'], defaultOperator?: string, defaultValue?: number) => {
    if (!onRequirementsChange) return;

    const existingIndex = requirements.findIndex(req => req.id === cleanId && req.type === type);

    if (existingIndex >= 0) {
      // Remove if already selected
      onRequirementsChange(requirements.filter((_, index) => index !== existingIndex));
      setEditingRequirement(null);
    } else {
      // Add with defaults, including default onFail = 'lock'
      const newReq: Requirement = { type, id: cleanId, onFail: 'lock' };
      if (type === 'flag') {
        newReq.expected = true;
      } else if (type === 'upgrade' || type === 'metric' || type === 'staff' || type === 'marketing') {
        newReq.operator = (defaultOperator || '>=') as any;
        newReq.value = defaultValue ?? (type === 'upgrade' || type === 'staff' || type === 'marketing' ? 1 : 0);
      } else if (type === 'condition') {
        newReq.expected = true;
      }
      onRequirementsChange([...requirements, newReq]);
      setEditingRequirement(`${type}-${cleanId}`);
    }
  };

  const handleToggleExpected = (cleanId: string, type: 'flag' | 'condition') => {
    if (!onRequirementsChange) return;

    const updated = requirements.map(req => {
      if (req.id === cleanId && req.type === type) {
        return { ...req, expected: req.expected === false ? true : false };
      }
      return req;
    });
    onRequirementsChange(updated);
  };

  const handleUpdateNumericRequirement = (cleanId: string, type: 'upgrade' | 'metric' | 'staff' | 'marketing', operator: string, value: number) => {
    if (!onRequirementsChange) return;

    const updated = requirements.map(req => {
      if (req.id === cleanId && req.type === type) {
        return { ...req, operator: operator as any, value };
      }
      return req;
    });
    onRequirementsChange(updated);
  };

  const handleToggleOnFail = (cleanId: string, type: Requirement['type'], onFail: 'lock' | 'hide') => {
    if (!onRequirementsChange) return;

    const updated = requirements.map(req => {
      if (req.id === cleanId && req.type === type) {
        return { ...req, onFail: req.onFail === onFail ? undefined : onFail };
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
          placeholder="🔍 Search requirements..."
          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {flagsLoading ? (
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
                    const req = getRequirement(flag.id, 'flag');
                    const expected = req?.expected;

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
                          <div className="space-y-2 mt-2 ml-6">
                            <div className="flex items-center gap-2">
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">When unmet:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleOnFail(flag.id, 'flag', 'lock')}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    req?.onFail === 'lock'
                                      ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                      : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  Lock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOnFail(flag.id, 'flag', 'hide')}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    req?.onFail === 'hide'
                                      ? 'bg-red-500/20 border-red-500 text-red-200'
                                      : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  Hide
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Upgrades Section */}
          {filteredUpgrades.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>⚙️</span> Upgrades{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredUpgrades.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredUpgrades.map((upgrade) => {
                    const isSelected = isRequirementSelected(upgrade.id, 'upgrade');
                    const req = getRequirement(upgrade.id, 'upgrade');
                    const isEditing = editingRequirement === `upgrade-${upgrade.id}`;

                    return (
                      <div
                        key={upgrade.id}
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
                            onChange={() => handleToggle(upgrade.id, 'upgrade')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{upgrade.name}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 ml-6 space-y-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <select
                                    value={req?.operator || '>='}
                                    onChange={(e) => {
                                      handleUpdateNumericRequirement(upgrade.id, 'upgrade', e.target.value, req?.value || 1);
                                    }}
                                    className="flex-1 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                  >
                                    {OPERATOR_OPTIONS.map(op => (
                                      <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                  </select>
                                  <NumberInput
                                    value={req?.value ?? 1}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      handleUpdateNumericRequirement(upgrade.id, 'upgrade', req?.operator || '>=', val);
                                    }}
                                    className="w-20 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                    min="0"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(null)}
                                  className="text-xs text-slate-400 hover:text-slate-300"
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  Level {req?.operator || '>='} {req?.value ?? 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(`upgrade-${upgrade.id}`)}
                                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <span className="text-xs text-slate-400">When unmet:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(upgrade.id, 'upgrade', 'lock')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'lock'
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Lock
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(upgrade.id, 'upgrade', 'hide')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'hide'
                                    ? 'bg-red-500/20 border-red-500 text-red-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Hide
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Metrics Section */}
          {filteredMetrics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>📊</span> Metrics{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredMetrics.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredMetrics.map((metric) => {
                    const isSelected = isRequirementSelected(metric.id, 'metric');
                    const req = getRequirement(metric.id, 'metric');
                    const isEditing = editingRequirement === `metric-${metric.id}`;

                    return (
                      <div
                        key={metric.id}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-green-500/20 border-green-500 text-green-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(metric.id, 'metric')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-green-600 focus:ring-green-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{metric.name}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 ml-6 space-y-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <select
                                    value={req?.operator || '>='}
                                    onChange={(e) => {
                                      handleUpdateNumericRequirement(metric.id, 'metric', e.target.value, req?.value || 0);
                                    }}
                                    className="flex-1 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                  >
                                    {OPERATOR_OPTIONS.map(op => (
                                      <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                  </select>
                                  <NumberInput
                                    value={req?.value ?? 0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      handleUpdateNumericRequirement(metric.id, 'metric', req?.operator || '>=', val);
                                    }}
                                    className="w-24 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                    step={metric.id === 'expenses' || metric.id === 'cash' ? '1' : '0.1'}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(null)}
                                  className="text-xs text-slate-400 hover:text-slate-300"
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  {req?.operator || '>='} {req?.value ?? 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(`metric-${metric.id}`)}
                                  className="text-xs text-green-400 hover:text-green-300 underline"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <span className="text-xs text-slate-400">When unmet:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(metric.id, 'metric', 'lock')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'lock'
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Lock
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(metric.id, 'metric', 'hide')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'hide'
                                    ? 'bg-red-500/20 border-red-500 text-red-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Hide
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Staff Section */}
          {filteredStaffRoles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>👥</span> Staff{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredStaffRoles.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredStaffRoles.map((role) => {
                    const isSelected = isRequirementSelected(role.id, 'staff');
                    const req = getRequirement(role.id, 'staff');
                    const isEditing = editingRequirement === `staff-${role.id}`;

                    return (
                      <div
                        key={role.id}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(role.id, 'staff')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-orange-600 focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{role.name}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 ml-6 space-y-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <select
                                    value={req?.operator || '>='}
                                    onChange={(e) => {
                                      handleUpdateNumericRequirement(role.id, 'staff', e.target.value, req?.value || 1);
                                    }}
                                    className="flex-1 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                  >
                                    {OPERATOR_OPTIONS.map(op => (
                                      <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                  </select>
                                  <NumberInput
                                    value={req?.value ?? 1}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      handleUpdateNumericRequirement(role.id, 'staff', req?.operator || '>=', val);
                                    }}
                                    className="w-20 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                    min="0"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(null)}
                                  className="text-xs text-slate-400 hover:text-slate-300"
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  Count {req?.operator || '>='} {req?.value ?? 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(`staff-${role.id}`)}
                                  className="text-xs text-orange-400 hover:text-orange-300 underline"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <span className="text-xs text-slate-400">When unmet:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(role.id, 'staff', 'lock')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'lock'
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Lock
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(role.id, 'staff', 'hide')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'hide'
                                    ? 'bg-red-500/20 border-red-500 text-red-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Hide
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Marketing Section */}
          {filteredMarketingCampaigns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>📢</span> Marketing{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredMarketingCampaigns.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredMarketingCampaigns.map((campaign) => {
                    const isSelected = isRequirementSelected(campaign.id, 'marketing');
                    const req = getRequirement(campaign.id, 'marketing');
                    const isEditing = editingRequirement === `marketing-${campaign.id}`;

                    return (
                      <div
                        key={campaign.id}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(campaign.id, 'marketing')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{campaign.name}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 ml-6 space-y-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <select
                                    value={req?.operator || '>='}
                                    onChange={(e) => {
                                      handleUpdateNumericRequirement(campaign.id, 'marketing', e.target.value, req?.value || 1);
                                    }}
                                    className="flex-1 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                  >
                                    {OPERATOR_OPTIONS.map(op => (
                                      <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                  </select>
                                  <NumberInput
                                    value={req?.value ?? 1}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      handleUpdateNumericRequirement(campaign.id, 'marketing', req?.operator || '>=', val);
                                    }}
                                    className="w-20 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                    min="0"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(null)}
                                  className="text-xs text-slate-400 hover:text-slate-300"
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  Level {req?.operator || '>='} {req?.value ?? 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingRequirement(`marketing-${campaign.id}`)}
                                  className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <span className="text-xs text-slate-400">When unmet:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(campaign.id, 'marketing', 'lock')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'lock'
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Lock
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOnFail(campaign.id, 'marketing', 'hide')}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  req?.onFail === 'hide'
                                    ? 'bg-red-500/20 border-red-500 text-red-200'
                                    : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                }`}
                              >
                                Hide
                              </button>
                            </div>
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
                <span>🎯</span> Conditions{' '}
                <span className="text-xs text-slate-400 font-normal">({filteredConditions.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredConditions.map((condition) => {
                    const isSelected = isRequirementSelected(condition.id, 'condition');
                    const req = getRequirement(condition.id, 'condition');
                    const expected = req?.expected;

                    return (
                      <div
                        key={condition.id}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(condition.id, 'condition')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-teal-600 focus:ring-teal-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">{condition.name}</span>
                          {condition.description && (
                            <span
                              className="text-xs text-slate-400 truncate max-[150px]"
                              title={condition.description}
                            >
                              {condition.description}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="space-y-2 mt-2 ml-6">
                            <div className="flex items-center gap-2">
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">When unmet:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleOnFail(condition.id, 'condition', 'lock')}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    req?.onFail === 'lock'
                                      ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                      : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  Lock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOnFail(condition.id, 'condition', 'hide')}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    req?.onFail === 'hide'
                                      ? 'bg-red-500/20 border-red-500 text-red-200'
                                      : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  Hide
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Total Staff Option */}
          {filteredStaffRoles.length > 0 && (
            <div>
              <div className="max-h-48 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(() => {
                    const isSelected = isRequirementSelected('*', 'staff');
                    const req = getRequirement('*', 'staff');
                    const isEditing = editingRequirement === 'staff-*';

                    return (
                      <div
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle('*', 'staff')}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-orange-600 focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-sm flex-1">Total Staff (Any Role)</span>
                        </div>
                        <>
                          {isSelected && (
                            <div className="mt-2 ml-6 space-y-2">
                              {isEditing ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <select
                                      value={req?.operator || '>='}
                                      onChange={(e) => {
                                        handleUpdateNumericRequirement('*', 'staff', e.target.value, req?.value || 1);
                                      }}
                                      className="flex-1 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                    >
                                      {OPERATOR_OPTIONS.map(op => (
                                        <option key={op.value} value={op.value}>{op.label}</option>
                                      ))}
                                    </select>
                                    <NumberInput
                                      value={req?.value ?? 1}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        handleUpdateNumericRequirement('*', 'staff', req?.operator || '>=', val);
                                      }}
                                      className="w-20 rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                                      min="0"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRequirement(null)}
                                    className="text-xs text-slate-400 hover:text-slate-300"
                                  >
                                    Done
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">
                                    Count {req?.operator || '>='} {req?.value ?? 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRequirement('staff-*')}
                                    className="text-xs text-orange-400 hover:text-orange-300 underline"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {isSelected && (
                            <div className="flex items-center gap-2 mt-2 ml-6">
                              <span className="text-xs text-slate-400">When unmet:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleOnFail('*', 'staff', 'lock')}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    req?.onFail === 'lock'
                                      ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                                      : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  Lock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOnFail('*', 'staff', 'hide')}
                                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                                    req?.onFail === 'hide'
                                      ? 'bg-red-500/20 border-red-500 text-red-200'
                                      : 'bg-slate-600/50 border-slate-500 text-slate-400 hover:bg-slate-600'
                                  }`}
                                >
                                  Hide
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(() => {
            const hasAnyData = (flagsData || []).length > 0 || (upgradesData || []).length > 0 ||
                              (staffRoles || []).length > 0 || (marketingCampaigns || []).length > 0 ||
                              (conditionsList || []).length > 0;
            const hasFilteredResults = filteredFlags.length > 0 || filteredUpgrades.length > 0 ||
                                      filteredMetrics.length > 0 || filteredStaffRoles.length > 0 ||
                                      filteredMarketingCampaigns.length > 0 || filteredConditions.length > 0;

            if (!hasAnyData) {
              return (
                <div className="text-sm text-slate-400 py-4 text-center">
                  No requirements available. Create flags, upgrades, or staff roles first!
                </div>
              );
            }

            if (!hasFilteredResults && search) {
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

