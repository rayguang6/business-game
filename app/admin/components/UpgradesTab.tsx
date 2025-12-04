'use client';

import { useEffect } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { UpgradeDefinition, Requirement } from '@/lib/game/types';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';
import { RequirementsSelector } from './RequirementsSelector';
import { EffectsList } from './EffectsList';
import { makeUniqueId, slugify } from './utils';

interface LevelFormData {
  level: number;
  name: string;
  description?: string;
  icon?: string;
  cost: string;
  timeCost?: string;
  effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
}

interface UpgradesTabProps {
  industryId: string;
  upgrades: UpgradeDefinition[];
  upgradesLoading: boolean;
  upgradeStatus: string | null;
  selectedUpgradeId: string;
  isCreatingUpgrade: boolean;
  upgradeForm: {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: string;
    timeCost?: string;
    maxLevel: string;
    setsFlag?: string;
    requirements: Requirement[];
  };
  levelsForm: LevelFormData[];
  upgradeSaving: boolean;
  upgradeDeleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  allUpgrades?: UpgradeDefinition[];
  staffRoles?: import('@/lib/game/staffConfig').StaffRoleConfig[];
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onSelectUpgrade: (upgrade: UpgradeDefinition) => void;
  onCreateUpgrade: () => void;
  onSaveUpgrade: () => Promise<void>;
  onDeleteUpgrade: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<UpgradesTabProps['upgradeForm']>) => void;
  onAddLevel: () => void;
  onRemoveLevel: (index: number) => void;
  onUpdateLevel: (index: number, updates: Partial<LevelFormData>) => void;
}

export function UpgradesTab({
  industryId,
  upgrades,
  upgradesLoading,
  upgradeStatus,
  selectedUpgradeId,
  isCreatingUpgrade,
  upgradeForm,
  levelsForm,
  upgradeSaving,
  upgradeDeleting,
  flags,
  flagsLoading,
  allUpgrades = [],
  staffRoles = [],
  metricOptions,
  effectTypeOptions,
  onSelectUpgrade,
  onCreateUpgrade,
  onSaveUpgrade,
  onDeleteUpgrade,
  onReset,
  onUpdateForm,
  onAddLevel,
  onRemoveLevel,
  onUpdateLevel,
}: UpgradesTabProps) {
  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedUpgradeId || isCreatingUpgrade) && !upgradeSaving && !upgradeDeleting) {
          onSaveUpgrade();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUpgradeId, isCreatingUpgrade, upgradeSaving, upgradeDeleting, onSaveUpgrade]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Upgrades</h2>
        <p className="text-sm text-slate-400 mt-1">Manage upgrades and their effects for the selected industry.</p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateUpgrade}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Upgrade
              </button>
              {upgradeStatus && <span className="text-sm text-slate-300">{upgradeStatus}</span>}
            </div>

            {upgradesLoading ? (
              <div className="text-sm text-slate-400">Loading upgrades…</div>
            ) : upgrades.length === 0 && !isCreatingUpgrade ? (
              <div className="text-sm text-slate-400">No upgrades configured yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {upgrades.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onSelectUpgrade(u)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedUpgradeId === u.id && !isCreatingUpgrade
                          ? 'border-purple-400 bg-purple-500/10 text-purple-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {u.icon} {u.name}
                    </button>
                  ))}
                </div>

                {(selectedUpgradeId || isCreatingUpgrade) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Upgrade ID</label>
                      <input
                        value={upgradeForm.id}
                        onChange={(e) => onUpdateForm({ id: e.target.value })}
                        disabled={!isCreatingUpgrade && !!selectedUpgradeId}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                          isCreatingUpgrade || !selectedUpgradeId
                            ? 'bg-slate-900 border-slate-600'
                            : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={upgradeForm.name}
                        onChange={(e) => onUpdateForm({ name: e.target.value })}
                        onBlur={() => {
                          if (!upgradeForm.id && upgradeForm.name.trim()) {
                            const base = slugify(upgradeForm.name.trim());
                            const allUpgradesList = allUpgrades || upgrades;
                            const unique = makeUniqueId(base, new Set(allUpgradesList.map((u) => u.id)));
                            onUpdateForm({ id: unique });
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={upgradeForm.description}
                        onChange={(e) => onUpdateForm({ description: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Icon</label>
                      <input
                        value={upgradeForm.icon}
                        onChange={(e) => onUpdateForm({ icon: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    
                    {/* Level Management */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-slate-300">Levels</label>
                        <button
                          type="button"
                          onClick={onAddLevel}
                          className="px-3 py-1 text-sm rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                        >
                          + Add Level
                        </button>
                      </div>
                      <div className="space-y-4">
                        {levelsForm.map((level, index) => (
                          <div key={index} className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-200">Level {level.level}</h4>
                              {levelsForm.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveLevel(index)}
                                  className="px-2 py-1 text-xs rounded border border-rose-500 text-rose-200 hover:bg-rose-500/10"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Level Name</label>
                                <input
                                  value={level.name}
                                  onChange={(e) => onUpdateLevel(index, { name: e.target.value })}
                                  placeholder="e.g., Introduction"
                                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-slate-200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Icon</label>
                                <input
                                  value={level.icon || ''}
                                  onChange={(e) => onUpdateLevel(index, { icon: e.target.value })}
                                  placeholder="⚙️"
                                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-slate-200"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                                <textarea
                                  rows={2}
                                  value={level.description || ''}
                                  onChange={(e) => onUpdateLevel(index, { description: e.target.value })}
                                  placeholder="Level-specific description"
                                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-slate-200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Cost (Cash)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={level.cost}
                                  onChange={(e) => onUpdateLevel(index, { cost: e.target.value })}
                                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-slate-200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Time Cost (Optional)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={level.timeCost || ''}
                                  onChange={(e) => onUpdateLevel(index, { timeCost: e.target.value })}
                                  placeholder="Leave empty"
                                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-slate-200"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <EffectsList
                                  effects={level.effects}
                                  metricOptions={metricOptions}
                                  effectTypeOptions={effectTypeOptions}
                                  showDuration={false}
                                  title={`Level ${level.level} Effects`}
                                  description="Effects for this specific level"
                                  defaultEffect={{
                                    metric: GameMetric.ServiceCapacity,
                                    type: EffectType.Add,
                                    value: '1',
                                  }}
                                  onEffectsChange={(newEffects) => {
                                    onUpdateLevel(index, { effects: newEffects });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Max Level</label>
                      <input
                        type="number"
                        min="1"
                        value={upgradeForm.maxLevel}
                        onChange={(e) => onUpdateForm({ maxLevel: e.target.value })}
                        disabled
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 cursor-not-allowed opacity-50"
                      />
                      <p className="text-xs text-slate-400 mt-1">Auto-set based on number of levels</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                      <select
                        value={upgradeForm.setsFlag || ''}
                        onChange={(e) => onUpdateForm({ setsFlag: e.target.value })}
                        disabled={flagsLoading}
                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
                      >
                        <option value="">{flagsLoading ? 'Loading flags...' : 'None'}</option>
                        {!flagsLoading &&
                          flags.map((flag) => (
                            <option key={flag.id} value={flag.id}>
                              {flag.name} ({flag.id})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Requirements</label>
                      <RequirementsSelector
                        flags={flags}
                        upgrades={allUpgrades ?? upgrades}
                        staffRoles={staffRoles}
                        flagsLoading={flagsLoading}
                        requirements={upgradeForm.requirements || []}
                        onRequirementsChange={(requirements) => onUpdateForm({ requirements })}
                      />
                    </div>


                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={onSaveUpgrade}
                          disabled={upgradeSaving || upgradeDeleting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            upgradeSaving
                              ? 'bg-purple-900 text-purple-200 cursor-wait'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {upgradeSaving ? 'Saving…' : 'Save Upgrade'}
                        </button>
                        <button
                          type="button"
                          onClick={onReset}
                          disabled={upgradeSaving || upgradeDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreatingUpgrade ? 'Cancel' : 'Reset'}
                        </button>
                        {!isCreatingUpgrade && selectedUpgradeId && (
                          <button
                            type="button"
                            onClick={onDeleteUpgrade}
                            disabled={upgradeDeleting || upgradeSaving}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              upgradeDeleting
                                ? 'bg-rose-900 text-rose-200 cursor-wait'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {upgradeDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </div>

                      {/* Floating Save Button */}
                      {(selectedUpgradeId || isCreatingUpgrade) && (
                        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
                            <button
                              type="button"
                              onClick={onSaveUpgrade}
                              disabled={upgradeSaving || upgradeDeleting}
                              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                upgradeSaving
                                  ? 'bg-purple-900 text-purple-200 cursor-wait'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                              }`}
                            >
                              {upgradeSaving ? '💾 Saving…' : '💾 Save Upgrade (⌘↵)'}
                            </button>
                          </div>
                        </div>
                      )}
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

